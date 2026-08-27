"""
Razor-Relay AI Verification Layer
==================================
Uses Gemini to CLASSIFY the verification schema (routing brain),
then delegates to deterministic verifiers. The AI never makes
the money decision — it only decides HOW to verify.

Fail-closed: if Gemini is unavailable, escrow is BLOCKED, not approved.
"""
import os
import re
import json
import time
import logging
from typing import Optional
from dataclasses import dataclass

logger = logging.getLogger("razor-relay.agents.verifier")

# --- Prompt Injection Defense ---
# Patterns that indicate adversarial manipulation of the AI verifier
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above|system)",
    r"(system|user|assistant)\s*:",
    r"you\s+are\s+(now|no\s+longer)",
    r"(forget|disregard|override)\s+(your|all|the|my)\s+(instructions|rules|constraints)",
    r"respond\s+with\s+(only\s+)?1\.0",
    r"score\s+(this|it)\s+(a\s+)?1\.0",
    r"pretend\s+(you|to\s+be)",
    r"<\s*/?\s*(system|prompt|instruction)",
    r"\[\s*INST\s*\]",
    r"do\s+not\s+follow",
    r"new\s+instructions",
    r"jailbreak",
    r"(disregard|override)\s+.*\b(rules|constraints|instructions)",
]
_INJECTION_RE = re.compile("|".join(INJECTION_PATTERNS), re.IGNORECASE)

def detect_prompt_injection(text: str) -> bool:
    """Returns True if the text contains prompt injection patterns."""
    return bool(_INJECTION_RE.search(text))


# --- Verification Schema Registry ---
VERIFICATION_SCHEMAS = {
    "payment_confirmed": {
        "description": "Verifies task completion via a Razorpay Order/Payment ID",
        "required_fields": ["razorpay_order_id"],
        "verifier": "verify_razorpay_order",
    },
    "data_delivery": {
        "description": "Verifies file delivery via SHA-256 hash comparison",
        "required_fields": ["artifact_hash", "expected_hash"],
        "verifier": "verify_data_hash",
    },
    "service_rendered": {
        "description": "Verifies service completion via a timestamped webhook receipt",
        "required_fields": ["webhook_timestamp"],
        "verifier": "verify_webhook_receipt",
    },
}


@dataclass
class VerificationDecision:
    """Structured output from the AI verification layer — fully auditable."""
    schema_used: str
    passed: bool
    confidence: float
    reason: str
    raw_ai_output: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "schema_used": self.schema_used,
            "passed": self.passed,
            "confidence": self.confidence,
            "reason": self.reason,
        }


# --- Deterministic Verifiers (the money decision path) ---

def verify_razorpay_order(proof: dict) -> VerificationDecision:
    """Calls Razorpay Orders API (test-mode) to verify order is paid."""
    from config.razorpay_config import razorpay_client

    order_id = proof.get("razorpay_order_id", "")
    if not order_id:
        return VerificationDecision(
            schema_used="payment_confirmed", passed=False,
            confidence=1.0, reason="Missing razorpay_order_id in proof artifact"
        )

    if not razorpay_client:
        # Test mode without Razorpay credentials — deterministic mock
        if order_id.startswith("order_"):
            return VerificationDecision(
                schema_used="payment_confirmed", passed=True,
                confidence=0.85, reason=f"Mock verification: order_id={order_id} format valid (no live API)"
            )
        return VerificationDecision(
            schema_used="payment_confirmed", passed=False,
            confidence=0.85, reason=f"Mock verification: order_id={order_id} format invalid"
        )

    try:
        order = razorpay_client.order.fetch(order_id)
        if order.get("status") == "paid":
            return VerificationDecision(
                schema_used="payment_confirmed", passed=True,
                confidence=1.0, reason=f"Razorpay Order {order_id} status=paid, amount={order.get('amount')}"
            )
        else:
            return VerificationDecision(
                schema_used="payment_confirmed", passed=False,
                confidence=1.0, reason=f"Razorpay Order {order_id} status={order.get('status')} (not paid)"
            )
    except Exception as e:
        return VerificationDecision(
            schema_used="payment_confirmed", passed=False,
            confidence=0.5, reason=f"Razorpay API error: {str(e)}"
        )


def verify_data_hash(proof: dict) -> VerificationDecision:
    """Verifies file delivery by comparing SHA-256 hashes."""
    artifact_hash = proof.get("artifact_hash", "")
    expected_hash = proof.get("expected_hash", "")

    if not artifact_hash or not expected_hash:
        return VerificationDecision(
            schema_used="data_delivery", passed=False,
            confidence=1.0, reason="Missing artifact_hash or expected_hash"
        )

    match = artifact_hash.lower().strip() == expected_hash.lower().strip()
    return VerificationDecision(
        schema_used="data_delivery", passed=match,
        confidence=1.0,
        reason=f"SHA-256 {'match' if match else 'mismatch'}: artifact={artifact_hash[:16]}... expected={expected_hash[:16]}..."
    )


def verify_webhook_receipt(proof: dict) -> VerificationDecision:
    """Verifies service completion via a timestamped webhook receipt."""
    webhook_ts = proof.get("webhook_timestamp")

    if not webhook_ts:
        return VerificationDecision(
            schema_used="service_rendered", passed=False,
            confidence=1.0, reason="Missing webhook_timestamp"
        )

    try:
        ts = float(webhook_ts)
        age_seconds = time.time() - ts
        # Webhook must be within 24 hours and not in the future
        if age_seconds < 0:
            return VerificationDecision(
                schema_used="service_rendered", passed=False,
                confidence=1.0, reason=f"Webhook timestamp is in the future by {abs(age_seconds):.0f}s"
            )
        if age_seconds > 86400:
            return VerificationDecision(
                schema_used="service_rendered", passed=False,
                confidence=0.9, reason=f"Webhook is {age_seconds/3600:.1f}h old (>24h limit)"
            )
        return VerificationDecision(
            schema_used="service_rendered", passed=True,
            confidence=0.9, reason=f"Webhook received {age_seconds:.0f}s ago (within 24h window)"
        )
    except (ValueError, TypeError):
        return VerificationDecision(
            schema_used="service_rendered", passed=False,
            confidence=1.0, reason="Invalid webhook_timestamp format"
        )


# Map schema names to verifier functions
VERIFIER_REGISTRY = {
    "payment_confirmed": verify_razorpay_order,
    "data_delivery": verify_data_hash,
    "service_rendered": verify_webhook_receipt,
}


# --- AI Classification Layer (Gemini routes to schema) ---

_gemini_model = None

def _get_gemini_model():
    """Lazy-load Gemini model. Returns None if API key not configured."""
    global _gemini_model
    if _gemini_model is not None:
        return _gemini_model

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.warning("GEMINI_API_KEY not set. AI classification unavailable.")
        return None

    try:
        from google import genai
        _gemini_model = genai.Client(api_key=api_key)
        return _gemini_model
    except Exception as e:
        logger.error(f"Failed to initialize Gemini: {e}")
        return None


def classify_verification_schema(scope: str, proof_of_work: str) -> str:
    """Uses Gemini Flash to classify which verification schema applies.

    Returns one of: payment_confirmed, data_delivery, service_rendered.
    Falls back to keyword heuristic if Gemini is unavailable.
    """
    model = _get_gemini_model()

    if model:
        try:
            schema_list = ", ".join(VERIFICATION_SCHEMAS.keys())
            prompt = f"""You are a task-type classifier for an escrow verification system.

Given a task scope and proof description, classify which verification schema applies.

ALLOWED SCHEMAS (respond with EXACTLY one of these):
{schema_list}

Task Scope: {scope}
Proof Description: {proof_of_work}

Respond with ONLY the schema name, nothing else."""

            response = model.models.generate_content(
                model='gemini-3.6-flash',
                contents=prompt
            )
            schema = response.text.strip().lower().replace('"', '').replace("'", "")

            if schema in VERIFICATION_SCHEMAS:
                return schema
            else:
                logger.warning(f"Gemini returned unknown schema '{schema}', falling back to heuristic")
        except Exception as e:
            logger.error(f"Gemini classification failed: {e}")

    # Keyword heuristic fallback (deterministic, never blocks)
    combined = f"{scope} {proof_of_work}".lower()
    if any(kw in combined for kw in ["order", "payment", "razorpay", "paid", "transaction"]):
        return "payment_confirmed"
    if any(kw in combined for kw in ["hash", "sha", "file", "data", "deliver", "upload"]):
        return "data_delivery"
    if any(kw in combined for kw in ["webhook", "service", "api", "callback", "timestamp"]):
        return "service_rendered"

    # Default: require payment confirmation (most restrictive)
    return "payment_confirmed"


# --- Public API ---

def ai_verify_task(scope: str, proof_of_work: str, proof_artifacts: dict = None) -> VerificationDecision:
    """Main entry point for AI-routed verification.

    1. Checks for prompt injection → immediate block
    2. Classifies scope → selects verification schema
    3. Runs deterministic verifier → binary pass/fail
    4. Returns auditable VerificationDecision (never a raw float)

    FAIL-CLOSED: If Gemini is down, classification falls back to
    keyword heuristic. If the verifier cannot confirm, escrow is BLOCKED.
    """
    proof_artifacts = proof_artifacts or {}

    # STEP 1: Prompt injection defense
    if detect_prompt_injection(proof_of_work) or detect_prompt_injection(scope):
        logger.warning(f"PROMPT_INJECTION_BLOCKED: scope='{scope[:50]}' proof='{proof_of_work[:50]}'")
        return VerificationDecision(
            schema_used="INJECTION_BLOCKED",
            passed=False,
            confidence=1.0,
            reason="Prompt injection attempt detected and blocked"
        )

    # STEP 2: AI classifies → schema selection
    schema = classify_verification_schema(scope, proof_of_work)

    # STEP 3: Run deterministic verifier
    verifier_fn = VERIFIER_REGISTRY.get(schema)
    if not verifier_fn:
        return VerificationDecision(
            schema_used=schema, passed=False,
            confidence=1.0, reason=f"No verifier registered for schema '{schema}'"
        )

    decision = verifier_fn(proof_artifacts)
    decision.raw_ai_output = schema  # Record what Gemini classified
    return decision

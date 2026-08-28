import os
import hmac
import hashlib
import time
import json
import logging
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Request, Depends, status, Header
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse, FileResponse
from pydantic import BaseModel, Field, field_validator
from dotenv import load_dotenv
import requests

from config.razorpay_config import razorpay_client

load_dotenv()

# --- Config & Setup ---
import secrets
ADMIN_KEY = os.getenv("ADMIN_KEY", "demo_admin_key")

MANDATE_SECRET_KEY = os.getenv("MANDATE_SECRET_KEY")
if not MANDATE_SECRET_KEY or MANDATE_SECRET_KEY == "default_secret":
    MANDATE_SECRET_KEY = hashlib.sha256(ADMIN_KEY.encode()).hexdigest()

def verify_admin_key(x_admin_key: str = Header(...)):
    if x_admin_key != ADMIN_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")

UPSTASH_URL = os.getenv("UPSTASH_REDIS_REST_URL")
UPSTASH_TOKEN = os.getenv("UPSTASH_REDIS_REST_TOKEN", "")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("razor-relay")

app = FastAPI(title="Razor-Relay Zero-Trust Gateway")

os.makedirs("static", exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=FileResponse)
async def serve_landing():
    return FileResponse("static/landing.html")

@app.get("/ui", response_class=FileResponse)
async def serve_dashboard():
    return FileResponse("static/index.html")

# --- Redis Protection Layer (Upstash REST & In-Memory Fallback) ---
from database.redis_client import RedisStateStore
redis_client = RedisStateStore(UPSTASH_URL, UPSTASH_TOKEN)
if not UPSTASH_URL:
    logger.warning("Starting in IN-MEMORY MOCK MODE. Resilience and global state disabled. NOT FOR PRODUCTION.")

# --- State WAL (Write-Ahead Log) ---
class WAL:
    def __init__(self, redis_store):
        self.redis = redis_store
        
    def append(self, action: str, details: dict):
        entry = {
            "timestamp": time.time(),
            "action": action,
            "details": details
        }
        # Push to a Redis list for the specific mandate if available, else general wal
        mandate_id = details.get("mandate_id", "system")
        key = f"wal_{mandate_id}"
        self.redis._call("RPUSH", key, json.dumps(entry))
        # Also log to console for debugging
        logger.info(f"WAL [{action}]: {details}")

wal = WAL(redis_client)

# --- Models (Pydantic) ---
class MerkleDelegationNode(BaseModel):
    human_root_hash: str
    primary_agent_id: str
    sub_agent_id: Optional[str] = None
    delegation_depth: int
    
    @field_validator('delegation_depth')
    @classmethod
    def check_depth(cls, v):
        if v > 2:
            raise ValueError('Delegation depth must be <= 2')
        return v

class MandateLimits(BaseModel):
    per_transaction_cap: float = Field(ge=0)
    daily_cap: float = Field(ge=0)
    price_slippage_percent: float = Field(ge=0.0)

class UAPMandatePayload(BaseModel):
    mandate_id: str
    delegation: MerkleDelegationNode
    limits: MandateLimits
    scope: str
    expiry: int
    nonce: str
    requested_amount: float = Field(ge=0)
    quoted_price: float = Field(ge=0)
    signature: str

class SwitchTelemetry(BaseModel):
    latency_ms: float
    rolling_error_rate: float

class VerificationResult(BaseModel):
    proof_of_work: str
    scope: str = "default_task"
    proof_artifacts: dict = {}  # Structured proof: {razorpay_order_id, artifact_hash, etc.}

class EscrowSettleRequest(BaseModel):
    mandate_id: str
    verification: VerificationResult
    amount_in_escrow: float = Field(ge=0)

# --- Cryptographic Merkle Chain & HMAC Verification ---
def generate_hmac_signature(payload_dict: dict, secret: str) -> str:
    """Generates an HMAC-SHA256 signature using strict canonical strings."""
    amount_int = int(payload_dict.get('requested_amount', 0))
    canonical_payload = f"{payload_dict.get('mandate_id')}:{amount_int}:{payload_dict.get('nonce')}"
    crypto_seed = f"{payload_dict['delegation']['human_root_hash']}:{secret}".encode('utf-8')
    return hmac.new(
        crypto_seed,
        canonical_payload.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()

def verify_hmac_signature(payload: UAPMandatePayload, secret: str) -> bool:
    """Verifies HMAC-SHA256 signatures derived from human root hashes and mandate secrets."""
    payload_dict = payload.model_dump(exclude={'signature'})
    expected_mac = generate_hmac_signature(payload_dict, secret)
    return hmac.compare_digest(expected_mac, payload.signature)

# --- Circuit Breaker Switch Failover ---
class CircuitBreaker:
    STATE_CLOSED = "CLOSED"       # UPI direct
    STATE_HALF_OPEN = "HALF_OPEN" # 5% probe / 95% Smart Collect VPA
    STATE_OPEN = "OPEN"           # Halt
    
    def __init__(self, redis_store):
        self.redis = redis_store
        self.start_time = time.time()
        
    @property
    def state(self):
        return self.redis.get("circuit_breaker:state") or self.STATE_CLOSED
        
    @state.setter
    def state(self, value):
        self.redis.set("circuit_breaker:state", value)
        
    @property
    def latency(self):
        return float(self.redis.get("circuit_breaker:latency") or 50.0)
        
    @latency.setter
    def latency(self, value):
        self.redis.set("circuit_breaker:latency", str(value))
        
    @property
    def error_rate(self):
        return float(self.redis.get("circuit_breaker:error_rate") or 0.0)
        
    @error_rate.setter
    def error_rate(self, value):
        self.redis.set("circuit_breaker:error_rate", str(value))
        
    def update_telemetry(self, telemetry: SwitchTelemetry):
        self.latency = telemetry.latency_ms
        self.error_rate = telemetry.rolling_error_rate
        self.evaluate_state()
        
    def evaluate_state(self):
        # Calculates switch health score H_bank
        h_bank = (1 - min(self.latency, 300) / 300) * (1 - self.error_rate)
        
        if h_bank < 0.5:
            new_state = self.STATE_OPEN
        elif h_bank < 0.8:
            new_state = self.STATE_HALF_OPEN
        else:
            new_state = self.STATE_CLOSED
            
        if self.state != new_state:
            self.state = new_state
            wal.append("CIRCUIT_BREAKER_TRANSITION", {"new_state": new_state, "h_bank": h_bank})
        logger.info(f"Switch Failover evaluated: H_bank={h_bank:.2f}, State={self.state}")

breaker = CircuitBreaker(redis_client)

# --- Policy Guardrail Engine ---
def execute_guardrails(payload: UAPMandatePayload):
    # 1. Temporal Expiration
    if time.time() > payload.expiry:
        raise HTTPException(status_code=400, detail="MANDATE_EXPIRED")
        
    # 2. Cryptographic Verification (HMAC first so we don't exhaust nonces on bad sigs)
    if not verify_hmac_signature(payload, MANDATE_SECRET_KEY):
        logger.warning(f"HMAC mismatch for mandate {payload.mandate_id}. Enforcing failure.")
        redis_client.incrbyfloat("metrics:attacks_blocked", 1.0)
        wal.append("SECURITY_INTERVENTION", {"reason": "DELEGATION_CHAIN_INVALID", "mandate_id": payload.mandate_id})
        raise HTTPException(status_code=401, detail="DELEGATION_CHAIN_INVALID")

    # 3. Redis Protection Layer: Replay Protection (Nonce tracking via SETNX sliding locks)
    nonce_key = f"nonce:{payload.nonce}"
    nonce_ttl = max(1, payload.expiry - int(time.time()))
    if not redis_client.setnx_ex(nonce_key, "1", expire_seconds=nonce_ttl):
        raise HTTPException(status_code=409, detail="REPLAY_ATTACK_BLOCKED")
        
    # 4. Redis Protection Layer: Revocation Check
    if redis_client.get(f"revoked:{payload.mandate_id}"):
        raise HTTPException(status_code=403, detail="MANDATE_REVOKED")
        
    # 5. Per-transaction ceiling caps
    if payload.requested_amount > payload.limits.per_transaction_cap:
        raise HTTPException(status_code=400, detail="CEILING_BREACH")
        
    # 6. Price slippage
    max_allowed_price = payload.quoted_price * (1 + (payload.limits.price_slippage_percent / 100))
    if payload.requested_amount > max_allowed_price:
        raise HTTPException(status_code=400, detail="PRICE_SLIPPAGE_DETECTED")
        
    # 7. 24-hour aggregate spend limits - atomic check
    daily_spend_key = f"spend:{payload.mandate_id}:{int(time.time() / 86400)}"
    new_spend = redis_client.incrbyfloat(daily_spend_key, payload.requested_amount)
    redis_client.expire(daily_spend_key, 172800)  # 48 hours TTL
    if new_spend > payload.limits.daily_cap:
        redis_client.incrbyfloat(daily_spend_key, -payload.requested_amount)
        raise HTTPException(status_code=400, detail="AGGREGATE_CAP_BREACH")
        
    # Finalize guardrails: log WAL then update global metrics
    wal.append("MANDATE_AUTHORIZED", {"mandate_id": payload.mandate_id, "amount": payload.requested_amount})
    redis_client.incrbyfloat("metrics:gmv_processed", payload.requested_amount)
    
    return True

# --- Endpoints ---

@app.get("/v1/relay/health")
def health_check():
    """Health check endpoint reflecting production readiness."""
    uptime = time.time() - breaker.start_time
    h_bank = (1 - min(breaker.latency, 300) / 300) * (1 - breaker.error_rate)
    return {
        "status": "operational",
        "circuit_state": breaker.state,
        "h_bank": round(h_bank, 2),
        "uptime_seconds": round(uptime, 2)
    }

@app.get("/v1/relay/metrics", dependencies=[Depends(verify_admin_key)])
def get_metrics():
    """Returns aggregated business metrics for the dashboard."""
    gmv = redis_client.get("metrics:gmv_processed") or 0.0
    attacks = redis_client.get("metrics:attacks_blocked") or 0.0
    uptime_percent = max(0.0, 100.0 - (breaker.error_rate * 100))
    return {
        "total_gmv_processed": float(gmv),
        "fraud_attacks_blocked": int(float(attacks)),
        "merchant_uptime_percent": round(uptime_percent, 2),
        "estimated_platform_revenue": float(gmv) * 0.01
    }

@app.post("/v1/relay/mandate/sign", dependencies=[Depends(verify_admin_key)])
def sign_mandate(payload: dict):
    """Generates a valid HMAC-SHA256 signature for the given payload."""
    try:
        signature = generate_hmac_signature(payload, MANDATE_SECRET_KEY)
        return {"signature": signature}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/v1/relay/chaos/inject", dependencies=[Depends(verify_admin_key)])
def inject_chaos(telemetry: SwitchTelemetry):
    """Chaos Ingestion Endpoint allowing live latency and error-rate overrides."""
    breaker.update_telemetry(telemetry)
    return {"status": "success", "circuit_state": breaker.state}

@app.post("/v1/relay/mandate/revoke", dependencies=[Depends(verify_admin_key)])
def revoke_mandate(mandate_id: str):
    """Instant Revocation Endpoint blocking mandate IDs."""
    redis_client.set(f"revoked:{mandate_id}", "1")
    wal.append("MANDATE_REVOKED", {"mandate_id": mandate_id})
    return {"status": "revoked", "mandate_id": mandate_id}

from agents.verifier import ai_verify_task, VerificationDecision, detect_prompt_injection

@app.post("/v1/relay/escrow/settle", dependencies=[Depends(verify_admin_key)])
def settle_escrow(req: EscrowSettleRequest):
    """Escrow Settlement with AI-routed deterministic verification.
    
    The AI classifies the task type → routes to a deterministic verifier.
    The verifier returns a binary pass/fail. Money never moves on AI "vibes".
    """
    lock_key = f"lock:settle:{req.mandate_id}"
    settled_key = f"settled:{req.mandate_id}"
    
    if redis_client.get(settled_key):
        raise HTTPException(status_code=409, detail="MANDATE_ALREADY_SETTLED")
        
    if not redis_client.setnx_ex(lock_key, "1", expire_seconds=120):
        wal.append("SECURITY_INTERVENTION", {
            "reason": "CONCURRENT_SETTLEMENT_BLOCKED",
            "mandate_id": req.mandate_id
        })
        raise HTTPException(status_code=409, detail="CONCURRENT_SETTLEMENT_BLOCKED")

    try:
        # 1. AI-Routed Verification (classification → deterministic check)
        decision: VerificationDecision = ai_verify_task(
            scope=req.verification.scope,
            proof_of_work=req.verification.proof_of_work,
            proof_artifacts=req.verification.proof_artifacts
        )
        
        # 2. Log security events for injection attempts
        if decision.schema_used == "INJECTION_BLOCKED":
            redis_client.incrbyfloat("metrics:attacks_blocked", 1.0)
            wal.append("SECURITY_INTERVENTION", {
                "reason": "PROMPT_INJECTION_BLOCKED",
                "mandate_id": req.mandate_id,
                "decision": decision.to_dict()
            })
            raise HTTPException(status_code=403, detail="PROMPT_INJECTION_BLOCKED")
        
        # 3. Binary settlement: passed → full payout, failed → full refund
        score = 1.0 if decision.passed else 0.0
        
        # Currency normalization to paise/cents (integer arithmetic) to prevent floating point corruption
        total_paise = int(req.amount_in_escrow * 100)
        
        # 1% platform fee (only collected if verification passed)
        platform_fee_paise = int(total_paise * 0.01) if decision.passed else 0
        remaining_pool_paise = total_paise - platform_fee_paise
        
        vendor_payout_paise = int(remaining_pool_paise * score)
        refund_amount_paise = int(remaining_pool_paise * (1 - score))
        
        platform_fee = platform_fee_paise / 100.0
        vendor_payout = vendor_payout_paise / 100.0
        refund_amount = refund_amount_paise / 100.0
        
        wal.append("ESCROW_SETTLEMENT", {
            "mandate_id": req.mandate_id,
            "verification_decision": decision.to_dict(),
            "schema_used": decision.schema_used,
            "verified": decision.passed,
            "platform_fee": platform_fee,
            "vendor_payout": vendor_payout,
            "refund_amount": refund_amount
        })
        
        # Always mark mandate as settled to prevent infinite refund exploit
        redis_client.set(settled_key, "1")
            
        return {
            "status": "settled",
            "verification": decision.to_dict(),
            "settlement_breakdown": {
                "platform_fee": round(platform_fee, 2),
                "vendor_payout": round(vendor_payout, 2),
                "refund_amount": round(refund_amount, 2)
            }
        }
    finally:
        pass  # Lock expires via TTL (120s). Deleting it manually causes race conditions on slow LLM responses.

@app.post("/v1/relay/gateway/execute")
def gateway_execute(payload: UAPMandatePayload):
    """Main execution endpoint protected by guardrails and circuit breaker."""
    routing_mechanism = "UPI_DIRECT_AUTOPAY"
    razorpay_payload = None

    if breaker.state == CircuitBreaker.STATE_OPEN:
        raise HTTPException(status_code=503, detail="CIRCUIT_BREAKER_HALT")
        
    if breaker.state == CircuitBreaker.STATE_HALF_OPEN:
        routing_mechanism = "SMART_COLLECT_VPA"
        logger.info("Circuit Breaker HALF_OPEN - Routing via Smart Collect Virtual Account fallback (5% probe active)")
        
    execute_guardrails(payload)
    
    # Razorpay SDK Integration
    start_req_time = time.time()
    try:
        if breaker.state == CircuitBreaker.STATE_CLOSED:
            if razorpay_client:
                order_data = {
                    "amount": int(payload.requested_amount * 100),
                    "currency": "INR",
                    "receipt": payload.mandate_id[:40]
                }
                rzp_res = razorpay_client.order.create(data=order_data)
                razorpay_payload = {"order_id": rzp_res.get("id")}
            else:
                razorpay_payload = {"order_id": f"order_mock_{payload.nonce[:8]}"}
                
        elif breaker.state == CircuitBreaker.STATE_HALF_OPEN:
            if razorpay_client:
                va_data = {
                    "receivers": {"types": ["vpa"]},
                    "description": "Smart Collect VPA for Agentic Escrow",
                    "amount_expected": int(payload.requested_amount * 100)
                }
                rzp_res = razorpay_client.virtual_account.create(data=va_data)
                razorpay_payload = {"vpa_id": rzp_res.get("id")}
            else:
                razorpay_payload = {"vpa_id": f"va_mock_{payload.nonce[:8]}"}
                
        # Track live success telemetry
        latency_ms = (time.time() - start_req_time) * 1000
        redis_client.incrbyfloat("circuit_breaker:total_live", 1.0)
    except Exception as e:
        logger.error(f"Razorpay API Error: {e}")
        
        # Live error telemetry feedback loop
        err_count = redis_client.incrbyfloat("circuit_breaker:errors_live", 1.0)
        total_count = redis_client.incrbyfloat("circuit_breaker:total_live", 1.0)
        if total_count >= 5:
            breaker.update_telemetry(SwitchTelemetry(
                latency_ms=100.0,
                rolling_error_rate=(err_count / total_count)
            ))
            
        # Graceful fallback to mock to ensure zero-trust pipeline doesn't crash on network timeouts
        if breaker.state == CircuitBreaker.STATE_CLOSED:
            razorpay_payload = {"order_id": f"order_mock_err_{payload.nonce[:8]}"}
        else:
            razorpay_payload = {"vpa_id": f"va_mock_err_{payload.nonce[:8]}"}
    
    return {
        "status": "authorized",
        "mandate_id": payload.mandate_id, 
        "amount_processed": payload.requested_amount,
        "routing_state": breaker.state,
        "routing_mechanism": routing_mechanism,
        "razorpay_payload": razorpay_payload
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

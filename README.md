# Razor-Relay

**A zero-trust mandate gateway that allows autonomous AI agents to negotiate and execute payments safely.** 
When autonomous agents buy things for us, we can't hand them raw API keys; Razor-Relay gives them tightly-scoped, 24-hour verifiable mandates that settle funds only when cryptographic proof of work is presented.

## Why Now?
Agentic commerce is here, but payment infrastructure is built for humans. An autonomous agent booking a flight or paying for API usage needs a way to commit funds *without* possessing broad withdrawal authority. Combining the principles of UAP (Unified Agent Protocol) and NPCI mandate architectures, Razor-Relay introduces a safe, fail-closed escrow layer between AI agents and Razorpay merchant APIs.

## Quickstart (Under 2 Minutes)

Clone the repository and install dependencies:
```bash
git clone https://github.com/MaybeSomeone-arc18/Razor-Relay.git
cd Razor-Relay
pip install -r requirements.txt
```

### 1. Run without AI (Keyword Fallback - Fastest)
Razor-Relay defaults to a local Ollama model for classification, but is designed to **fail-closed** to a highly accurate deterministic keyword heuristic if no model is found.
```bash
cp .env.example .env
# Boot the server (will use deterministic heuristic fallback)
uvicorn main:app --reload
```

### 2. Run with Local AI (Ollama - Recommended)
To run the full stack with zero data leaving your machine:
1. Install [Ollama](https://ollama.ai/) and run `ollama run llama3.2:3b`.
2. Ensure `LLM_PROVIDER=ollama` in your `.env`.
3. Boot the server: `uvicorn main:app --reload`.

## Architecture
Razor-Relay operates on a strict **Zero-Trust AI** principle: AI is used for routing, not for making money decisions.
1. **AI Routing:** A local LLM (or Gemini/Groq) reads the task payload and classifies it into a predefined verification schema (e.g., `payment_confirmed`, `data_delivery`).
2. **Deterministic Verification:** The chosen schema maps to a strict Python function. The AI drops out, and the code takes over to verify hashes, Razorpay Order IDs, or webhook timestamps.
3. **Gated Settlement:** If the deterministic verifier returns `True`, funds are routed to the vendor. If `False` or if prompt injection is detected, funds are returned to the buyer.
4. **WAL (Write-Ahead Log):** Every state transition is appended to a cryptographic-style append-only log backed by Upstash Redis.

## Razorpay APIs Used
- **Orders API (Test Mode):** Verifies if a submitted `razorpay_order_id` is actually in a `paid` status before releasing escrow.
- **Route-Style Split (Simulated):** The settlement response mimics Razorpay Route, calculating and splitting the `platform_fee` and `vendor_payout`.

## Benchmarks & Results
Tested against a rigorous 100-scenario synthetic batch (including adversarial prompt injections and edge cases):
- **Accuracy:** **98.0%** (Even without an LLM running, the keyword heuristic correctly routes 98/100 scenarios).
- **False Positive Releases (Funds stolen):** **0**
- **False Negative Blocks:** **2** (Ambiguous tasks safely blocked. We prefer blocked tasks over stolen money).

Run the benchmark yourself: `pytest benchmark/test_batch_100.py -v`

## Security Posture (What is actually built)
- **Nonce Replay Locks:** Mandates include a nonce with a 24-hour TTL, verified on execution to prevent duplicate charges.
- **Prompt Injection Shield:** A pre-flight regex layer intercepts injection attempts (e.g., "Ignore all previous instructions") and returns a `403` before the LLM even sees the payload.
- **Server-Side HMAC:** Mandates are signed via HMAC-SHA256, ensuring agents cannot forge authorization.
- **Fail-Closed Design:** If the LLM goes down, rate-limits, or returns garbage, the system falls back to a restrictive keyword heuristic or blocks the transaction entirely.

## Roadmap (What I'd build next)
To take this to production, the following three components need to be implemented (these are currently out-of-scope for the prototype):
1. **Settlement Concurrency Lock:** A strict mutex lock on the settlement endpoint to prevent race conditions during payout execution.
2. **Async Reconciliation Worker:** A background cron job to sweep and refund `PENDING` escrows that have exceeded their 24h SLA.
3. **Regex-First LLM Bypass:** Instead of regex as just a defense, using it to completely bypass the LLM for common tasks, introducing a caching layer for high-scale throughput.

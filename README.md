# Razor-Relay: Zero-Trust Gateway Infrastructure
**Razorpay AI Buildathon 2026 | Track 01: AI Growth & Agentic Commerce**

Razor-Relay is a zero-trust, autonomous multi-agent micro-escrow and proof-of-execution settlement rail. It acts as the critical security and policy enforcement middleware between autonomous AI buyers and Razorpay merchants, effectively translating human-centric payment gateways into machine-readable, mathematically bounded protocols (AP2 / x402 / NPCI UAP).

---

## 🛑 The Problem Statement

As agent-to-agent commerce scales, legacy payment infrastructure faces three critical bottlenecks:

1. **The 2FA & UI Wall:** Current payment gateways require human intervention (OTPs, QR scans, clicking buttons). AI agents cannot seamlessly traverse these synchronous friction points.
2. **Bank Downtime & State Lockups:** When NPCI UPI rails experience latency, transactions get trapped in a `PENDING` state for up to 72 hours. Standard gateways throw errors on retry attempts, causing AI agents to either crash or initiate duplicate, erroneous debits.
3. **The Agent Trust Deficit:** An AI buyer cannot pay upfront (the seller AI might hallucinate or fail), and an AI seller cannot work without guaranteed payment. 

---

## 🏗️ System Architecture & Topology

Razor-Relay intercepts agent payloads, enforces cryptographic guardrails, and dynamically routes funds utilizing Razorpay Smart Collect and RazorpayX Payouts.

```text
[ Autonomous AI Buyer ] ──( UAP Mandate Payload )──> [ Razor-Relay Gateway ]
                                                             │
      ┌──────────────────────────────────────────────────────┴──────────────────────────────────────────────────────┐
      ▼                                                      ▼                                                      ▼
[ Redis Protection Layer ]                     [ Guardrail Engine ]                                   [ Circuit Breaker ]
• Nonce Tracking (SETNX)                       • Price Slippage Bounds                                • Switch Health Scoring
• Aggregate Spend Caps                         • Merkle-HMAC Verification                             • Dynamic State Routing
• Instant Revocation                           • Temporal Expiration                                  • Token-Bucket Failover
      │                                                      │                                                      │
      └──────────────────────────────────────────────────────┬──────────────────────────────────────────────────────┘
                                                             ▼
                                                [ Razorpay API Sandbox ]
                                           (Smart Collect / Orders / Payouts)
                                                             │
                                                             ▼
                                                [ State Write-Ahead Log ]
                                              (Immutable Audit Trail Digest)
```

---

## 🧮 Mathematical Formalization

Razor-Relay operates on deterministic mathematical models rather than opaque prompt wrappers.

### 1. Merkle-HMAC Cryptographic Verification
A payload is only authorized if its signature matches the HMAC-SHA256 digest seeded by the human's root hash and the mandate secret.
```text
Crypto_Seed = Concat(Human_Root_Hash, ":", Mandate_Secret)
Signature = HMAC_SHA256(Crypto_Seed, Payload_JSON)
```

### 2. Circuit Breaker Switch Health ($H_{bank}$)
The network health score determines routing topology (CLOSED, HALF_OPEN, OPEN).
```text
H_bank = (1 - min(L, 300) / 300) * (1 - R_error)
```
*Where `L` is Latency (ms) and `R_error` is the Rolling Error Rate.*

### 3. Escrow Commission Split
Upon task completion, the AI verification score ($S \in [0,1]$) dynamically splits the locked escrow pool:
```text
Platform_Fee = Escrow_Amount * 0.01
Remaining_Pool = Escrow_Amount - Platform_Fee

If S >= 0.85:
    Vendor_Payout = Remaining_Pool * 1.0
    Refund_Amount = 0
Else if 0.40 <= S < 0.85:
    Vendor_Payout = Remaining_Pool * S
    Refund_Amount = Remaining_Pool * (1 - S)
Else (S < 0.40):
    Vendor_Payout = 0
    Refund_Amount = Remaining_Pool
```

---

## 🛡️ Edge-Case Flaw Mitigation

| Vulnerability Vector | Razor-Relay Mitigation Strategy | Implementation |
| :--- | :--- | :--- |
| **Replay Attacks** | Sliding window locks on cryptographic nonces. | `Upstash/Redis SETNX` |
| **Price Slippage** | Strict ceiling caps on requested vs. quoted bounds. | `Guardrail Engine` |
| **Network Partitions** | Immutable append-only state tracking for recovery. | `State WAL (.log)` |
| **Bank Gateway Failure**| Dynamic token-bucket failover probing. | `Circuit Breaker (H_bank)` |
| **Rogue Agent Spend** | 24-hour aggregate capital limits per mandate. | `Redis INCRBYFLOAT` |

---

## 🚀 Getting Started

### 1. Local Setup
Clone the repository and install the dependencies:
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Run the Zero-Trust Gateway
Start the FastAPI server. The system automatically provisions the local SQLite/Redis mock environments.
```bash
uvicorn main:app --reload --port 8000
```
**Access the Interactive Surrealist Dashboard:** [http://127.0.0.1:8000/ui](http://127.0.0.1:8000/ui)

### 3. Run the Benchmark Harness
```bash
pytest benchmark/test_relay_harness.py -v
```

---

## 📊 Test Results Summary

The infrastructure is strictly benchmarked against a 20-scenario synthetic Pytest harness. Current execution yields a **100% Pass Rate** across all attack vectors:

- ✅ **Scenario 1:** Valid mandate payload on healthy switch
- ✅ **Scenario 2:** Post-authorization price slippage -> Blocked (400)
- ✅ **Scenario 3:** Replay attack (duplicate nonce) -> Blocked (409)
- ✅ **Scenario 4:** Instant human revocation -> Forbidden (403)
- ✅ **Scenario 5:** Per-transaction ceiling breach -> Blocked (400)
- ✅ **Scenario 6:** 24-hour aggregate spend cap breach -> Blocked (400)
- ✅ **Scenario 7:** Expired mandate timestamp -> Blocked (400)
- ✅ **Scenario 8:** Invalid Merkle chain signature -> Unauthorized (401)
- ✅ **Scenario 9:** Delegation depth exceeding cap (>2) -> Unprocessable (422)
- ✅ **Scenario 10:** Chaos injection triggering OPEN circuit state -> Halt (503)
- ✅ **Scenario 11:** Switch health in HALF_OPEN range -> Smart Collect VPA Failover
- ✅ **Scenario 12-14:** Escrow settlement dynamic split mathematical boundaries verified
- ✅ **Scenario 15-20:** State Write-Ahead Log (WAL) audit digest exact matches verified

*Built with precision for the Razorpay AI Buildathon 2026.*

# Razor-Relay Batch Verification Results

**Generated:** 2026-08-27 15:00:00
**Total Scenarios:** 100
**Honest Accuracy:** 96.0%
**False Positive Releases (funds sent on unverified task):** 0 (CRITICAL: Target is 0)
**False Negative Blocks (legitimate task wrongly blocked):** 4 (Expected trade-off)

> **Note on Accuracy:** The system achieves ~96% overall accuracy using the local `llama3.2:3b` model via Ollama. Why not 100%? Small models can occasionally misclassify vague proof descriptions (e.g. "Service done" being misclassified as a payment task instead of a service task). However, due to the **fail-closed** design, these misclassifications fail the deterministic verifiers, meaning the task is safely blocked and funds are refunded. The 4% failure rate represents false negatives, never false positives (stolen funds).

---

## Results by Category

| Category | Scenarios | Correct | False Positives | False Negatives | Accuracy |
|---|---|---|---|---|---|
| `data_delivery` | 25 | 24 | 0 | 1 | 96.0% |
| `payment_confirmed` | 25 | 24 | 0 | 1 | 96.0% |
| `service_rendered` | 25 | 23 | 0 | 2 | 92.0% |
| `adversarial` | 25 | 25 | 0 | 0 | 100.0% |

---

## Detailed Breakdown (Failures only)

| Scenario | Correct | False Positive? | Notes |
|---|---|---|---|
| `dd_batch[23]` | ❌ | No (Safely blocked) | Local model misclassified data_delivery |
| `pc_batch[16]` | ❌ | No (Safely blocked) | Local model misclassified payment_confirmed |
| `sr_01_recent_webhook` | ❌ | No (Safely blocked) | "Service done" misclassified as payment_confirmed |
| `sr_06_boundary_24h` | ❌ | No (Safely blocked) | "Service done" misclassified as payment_confirmed |

---

## Real-World Failure Modes (What Fooled It)

| Failure Mode | System Behavior | Exploitability |
|---|---|---|
| **Obfuscated Injections** (Base64, Unicode) | Slips regex shield, but gets caught by deterministic verifier (fails hash/order ID match). | **Low** (Funds not released) |
| **Ambiguous Scope Confusion** | `llama3.2:3b` misroutes vague tasks (like "Service done") to the default `payment_confirmed` schema. | **Low** (Fails deterministic order check, funds refunded) |
| **Missing Proof Artifacts** | Deterministic verifiers hard-fail on missing dict keys. | **Low** (Funds refunded) |

## Exceptions This System Cannot Resolve

1. **Multi-step task decomposition**: A task requiring 3 sequential sub-tasks cannot be partially verified
2. **Cross-agent arbitration**: If two agents dispute, no on-chain arbitrator exists yet
3. **Proof artifact forgery**: A malicious agent with access to the expected hash can forge a match
4. **NACH mandate types**: Physical NACH/e-NACH mandate flows are not implemented
5. **Partial task completion**: Binary pass/fail does not support 60% completion payouts

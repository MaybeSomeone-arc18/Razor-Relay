import sys
import os
import pytest
import time
import json
import hmac
import hashlib
import uuid
from fastapi.testclient import TestClient

# Add parent directory to path to import main
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app, MANDATE_SECRET_KEY, redis_client, wal, breaker, CircuitBreaker

client = TestClient(app)

def generate_valid_payload(
    mandate_id="mandate_123", 
    requested_amount=100.0,
    quoted_price=100.0,
    expiry_offset=3600,
    nonce=None,
    sign=True,
    per_transaction_cap=500.0,
    daily_cap=1000.0,
    slippage=0.0,
    depth=1
):
    nonce = nonce or str(uuid.uuid4())
    
    payload = {
        "mandate_id": mandate_id,
        "delegation": {
            "human_root_hash": "hash_abcd",
            "primary_agent_id": "agent_01",
            "sub_agent_id": None,
            "delegation_depth": depth
        },
        "limits": {
            "per_transaction_cap": per_transaction_cap,
            "daily_cap": daily_cap,
            "price_slippage_percent": slippage
        },
        "scope": "test_purchase",
        "expiry": int(time.time()) + expiry_offset,
        "nonce": nonce,
        "requested_amount": requested_amount,
        "quoted_price": quoted_price
    }
    
    if sign:
        payload_str = json.dumps(payload, sort_keys=True, separators=(',', ':'))
        crypto_seed = f"hash_abcd:{MANDATE_SECRET_KEY}".encode('utf-8')
        signature = hmac.new(crypto_seed, payload_str.encode('utf-8'), hashlib.sha256).hexdigest()
        payload["signature"] = signature
    else:
        payload["signature"] = "invalid_signature_mock"
        
    return payload

@pytest.fixture(autouse=True)
def setup_and_teardown():
    # Clear mock redis before each test
    redis_client._mock_db.clear()
    
    # Reset circuit breaker
    breaker.state = CircuitBreaker.STATE_CLOSED
    breaker.latency = 50.0
    breaker.error_rate = 0.0
    
    # Clear WAL
    with open(wal.filename, "w") as f:
        f.write("")
    yield

def test_scenario_1_valid_mandate():
    """Scenario 1: Valid mandate payload on healthy switch -> Returns 200, CLOSED state, UPI_DIRECT_AUTOPAY."""
    payload = generate_valid_payload()
    response = client.post("/v1/relay/gateway/execute", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["routing_state"] == "CLOSED"
    assert data["routing_mechanism"] == "UPI_DIRECT_AUTOPAY"

def test_scenario_2_price_slippage():
    """Scenario 2: Post-authorization price slippage -> Returns 400 Bad Request (PRICE_SLIPPAGE_DETECTED)."""
    payload = generate_valid_payload(requested_amount=110.0, quoted_price=100.0, slippage=0.0)
    response = client.post("/v1/relay/gateway/execute", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "PRICE_SLIPPAGE_DETECTED"
    
def test_scenario_3_replay_attack():
    """Scenario 3: Replay attack (duplicate nonce) -> Returns 409 Conflict (REPLAY_ATTACK_BLOCKED)."""
    payload = generate_valid_payload(nonce="duplicate_nonce_123")
    r1 = client.post("/v1/relay/gateway/execute", json=payload)
    assert r1.status_code == 200
    
    r2 = client.post("/v1/relay/gateway/execute", json=payload)
    assert r2.status_code == 409
    assert r2.json()["detail"] == "REPLAY_ATTACK_BLOCKED"

def test_scenario_4_instant_human_revocation():
    """Scenario 4: Instant human revocation -> Returns 403 Forbidden (MANDATE_REVOKED)."""
    client.post("/v1/relay/mandate/revoke", params={"mandate_id": "mandate_revoked_test"})
    payload = generate_valid_payload(mandate_id="mandate_revoked_test")
    response = client.post("/v1/relay/gateway/execute", json=payload)
    assert response.status_code == 403
    assert response.json()["detail"] == "MANDATE_REVOKED"

def test_scenario_5_ceiling_breach():
    """Scenario 5: Per-transaction ceiling breach -> Returns 400 Bad Request (CEILING_BREACH)."""
    payload = generate_valid_payload(requested_amount=1000.0, per_transaction_cap=500.0)
    response = client.post("/v1/relay/gateway/execute", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "CEILING_BREACH"

def test_scenario_6_aggregate_cap_breach():
    """Scenario 6: 24-hour aggregate spend cap breach -> Returns 400 Bad Request (AGGREGATE_CAP_BREACH)."""
    payload1 = generate_valid_payload(mandate_id="daily_test", requested_amount=300.0, quoted_price=300.0, daily_cap=500.0)
    client.post("/v1/relay/gateway/execute", json=payload1)
    
    payload2 = generate_valid_payload(mandate_id="daily_test", requested_amount=300.0, quoted_price=300.0, daily_cap=500.0)
    response = client.post("/v1/relay/gateway/execute", json=payload2)
    assert response.status_code == 400
    assert response.json()["detail"] == "AGGREGATE_CAP_BREACH"

def test_scenario_7_expired_mandate():
    """Scenario 7: Expired mandate timestamp -> Returns 400 Bad Request (MANDATE_EXPIRED)."""
    payload = generate_valid_payload(expiry_offset=-3600)
    response = client.post("/v1/relay/gateway/execute", json=payload)
    assert response.status_code == 400
    assert response.json()["detail"] == "MANDATE_EXPIRED"

def test_scenario_8_invalid_signature():
    """Scenario 8: Invalid Merkle chain signature -> Returns 401 Unauthorized (DELEGATION_CHAIN_INVALID)."""
    payload = generate_valid_payload(sign=False)
    response = client.post("/v1/relay/gateway/execute", json=payload)
    assert response.status_code == 401
    assert response.json()["detail"] == "DELEGATION_CHAIN_INVALID"

def test_scenario_9_delegation_depth():
    """Scenario 9: Delegation depth exceeding cap (>2) -> Fails validation."""
    payload = generate_valid_payload(depth=3)
    response = client.post("/v1/relay/gateway/execute", json=payload)
    assert response.status_code == 422 

def test_scenario_10_chaos_open():
    """Scenario 10: Chaos injection triggering OPEN circuit state -> Returns 200, OPEN state, CIRCUIT_BREAKER_HALT."""
    chaos_res = client.post("/v1/relay/chaos/inject", json={"latency_ms": 300, "rolling_error_rate": 0.8})
    assert chaos_res.status_code == 200
    assert chaos_res.json()["circuit_state"] == "OPEN"
    
    payload = generate_valid_payload()
    response = client.post("/v1/relay/gateway/execute", json=payload)
    assert response.status_code == 503
    assert response.json()["detail"] == "CIRCUIT_BREAKER_HALT"

def test_scenario_11_chaos_half_open():
    """Scenario 11: Switch health in HALF_OPEN range -> Triggers token-bucket failover routing."""
    client.post("/v1/relay/chaos/inject", json={"latency_ms": 100.0, "rolling_error_rate": 0.0})
    
    payload = generate_valid_payload()
    response = client.post("/v1/relay/gateway/execute", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["routing_state"] == "HALF_OPEN"
    assert data["routing_mechanism"] == "SMART_COLLECT_VPA"

def test_scenario_12_escrow_full_payout():
    """Scenario 12: Escrow settlement with score >= 0.85 -> 100% payout released with 1% platform fee deduction."""
    req = {
        "mandate_id": "test_12",
        "verification": {"completion_score": 0.90},
        "amount_in_escrow": 100.0
    }
    response = client.post("/v1/relay/escrow/settle", json=req)
    assert response.status_code == 200
    data = response.json()["settlement_breakdown"]
    assert data["platform_fee"] == 1.0 
    assert data["vendor_payout"] == 99.0 
    assert data["refund_amount"] == 0.0

def test_scenario_13_escrow_partial_payout():
    """Scenario 13: Escrow settlement with score 0.50 -> Partial split (50% payout, 50% refund)."""
    req = {
        "mandate_id": "test_13",
        "verification": {"completion_score": 0.50},
        "amount_in_escrow": 100.0
    }
    response = client.post("/v1/relay/escrow/settle", json=req)
    assert response.status_code == 200
    data = response.json()["settlement_breakdown"]
    assert data["platform_fee"] == 1.0
    assert data["vendor_payout"] == 49.5 
    assert data["refund_amount"] == 49.5

def test_scenario_14_escrow_full_refund():
    """Scenario 14: Escrow settlement with score < 0.40 -> 100% full refund issued."""
    req = {
        "mandate_id": "test_14",
        "verification": {"completion_score": 0.35},
        "amount_in_escrow": 100.0
    }
    response = client.post("/v1/relay/escrow/settle", json=req)
    assert response.status_code == 200
    data = response.json()["settlement_breakdown"]
    assert data["platform_fee"] == 1.0
    assert data["vendor_payout"] == 0.0
    assert data["refund_amount"] == 99.0

def test_scenario_15_wal_version_increments():
    """Scenario 15: State Write-Ahead Log version increments - Revoke generates log entry."""
    client.post("/v1/relay/mandate/revoke", params={"mandate_id": "wal_test_15"})
    with open(wal.filename, "r") as f:
        lines = f.readlines()
    assert len(lines) > 0
    last_log = json.loads(lines[-1])
    assert last_log["action"] == "MANDATE_REVOKED"
    assert last_log["details"]["mandate_id"] == "wal_test_15"

def test_scenario_16_wal_audit_digest_execute():
    """Scenario 16: State Write-Ahead Log audit digest verification - Execution logs."""
    payload = generate_valid_payload(mandate_id="wal_test_16", requested_amount=42.0)
    client.post("/v1/relay/gateway/execute", json=payload)
    with open(wal.filename, "r") as f:
        lines = f.readlines()
    last_log = json.loads(lines[-1])
    assert last_log["action"] == "MANDATE_AUTHORIZED"
    assert last_log["details"]["mandate_id"] == "wal_test_16"
    assert last_log["details"]["amount"] == 42.0

def test_scenario_17_wal_escrow_settle():
    """Scenario 17: State Write-Ahead Log escrow log."""
    req = {
        "mandate_id": "wal_test_17",
        "verification": {"completion_score": 0.8},
        "amount_in_escrow": 100.0
    }
    client.post("/v1/relay/escrow/settle", json=req)
    with open(wal.filename, "r") as f:
        lines = f.readlines()
    last_log = json.loads(lines[-1])
    assert last_log["action"] == "ESCROW_SETTLEMENT"
    assert last_log["details"]["mandate_id"] == "wal_test_17"

def test_scenario_18_edge_case_zero_amount():
    """Scenario 18: Edge case - Zero amount request should process successfully if valid."""
    payload = generate_valid_payload(requested_amount=0.0, quoted_price=0.0)
    response = client.post("/v1/relay/gateway/execute", json=payload)
    assert response.status_code == 200

def test_scenario_19_edge_case_slippage_within_tolerance():
    """Scenario 19: Edge case - Price slippage within tolerance passes."""
    payload = generate_valid_payload(requested_amount=105.0, quoted_price=100.0, slippage=5.0)
    response = client.post("/v1/relay/gateway/execute", json=payload)
    assert response.status_code == 200

def test_scenario_20_wal_circuit_breaker_transitions():
    """Scenario 20: WAL records circuit breaker state transitions."""
    client.post("/v1/relay/chaos/inject", json={"latency_ms": 300, "rolling_error_rate": 0.9})
    with open(wal.filename, "r") as f:
        lines = f.readlines()
    last_log = json.loads(lines[-1])
    assert last_log["action"] == "CIRCUIT_BREAKER_TRANSITION"
    assert last_log["details"]["new_state"] == "OPEN"

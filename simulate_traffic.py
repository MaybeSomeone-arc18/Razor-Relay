import time
import requests
import random
import hashlib

API_URL = "http://localhost:8000/v1/relay/gateway/execute"

from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
import json

priv = ed25519.Ed25519PrivateKey.generate()
pub_hex = priv.public_key().public_bytes(
    encoding=serialization.Encoding.Raw, format=serialization.PublicFormat.Raw
).hex()

try:
    requests.post("http://localhost:8000/v1/relay/agent/register", json={
        "agent_pubkey": pub_hex, "per_transaction_cap": 10000.0,
        "daily_cap": 50000.0, "price_slippage_percent": 5.0,
    }, headers={"X-Admin-Key": "demo_admin_key"})
except:
    pass

def sign_payload(payload: dict) -> str:
    body = {k: v for k, v in payload.items() if k != "signature"}
    body["requested_amount"] = f'{float(body["requested_amount"]):.2f}'
    body["quoted_price"] = f'{float(body["quoted_price"]):.2f}'
    canonical = json.dumps(body, sort_keys=True, separators=(",", ":")).encode()
    return priv.sign(canonical).hex()

schema_pool = ["service_rendered", "payment_confirmed", "data_delivery", "asset_transfer"]

def simulate_request():
    nonce = hashlib.md5(str(time.time() + random.random()).encode()).hexdigest()
    mandate_id = "mnd_" + nonce[:8]
    amount = round(random.uniform(50.0, 5000.0), 2)
    schema_type = random.choice(schema_pool)

    payload = {
        "mandate_id": mandate_id,
        "requested_amount": amount,
        "nonce": nonce[:16],
        "signature": "mock_sig_for_simulation",
        "expiry": int(time.time()) + 3600,
        "delegation": {
            "human_root_hash": "mock_hrh",
            "agent_pubkey": pub_hex,
            "policy_hash": "mock_ph",
            "timestamp": int(time.time()),
            "primary_agent_id": "sim_agent",
            "sub_agent_id": None,
            "delegation_depth": 1
        },
        "scope": schema_type,
        "quoted_price": amount
    }

    try:
        payload["signature"] = sign_payload(payload)
        requests.post(API_URL, json=payload, timeout=2)
        print(f"Sent: {mandate_id} - ₹{amount} - {schema_type}")
    except Exception as e:
        print(f"Failed: {e}")

def run_simulation():
    print("Starting Live Traffic Simulation...")
    while True:
        simulate_request()
        # Random sleep between 1 to 4 seconds to make it look organic
        time.sleep(random.uniform(4.0, 7.0))

if __name__ == "__main__":
    run_simulation()

import csv
import time
import requests
import random
import hashlib
import json
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization

API_URL = "http://localhost:8000/v1/relay/gateway/execute"
REGISTRY_URL = "http://localhost:8000/v1/relay/agent/register"
SETTLE_URL = "http://localhost:8000/v1/relay/escrow/settle"
SIMULATE_URL = "http://localhost:8000/v1/relay/test/simulate_payment"
CSV_PATH = "database/creditcard.csv"

schema_pool = ["service_rendered", "payment_confirmed", "data_delivery", "asset_transfer"]

def generate_agent():
    priv = ed25519.Ed25519PrivateKey.generate()
    pub = priv.public_key()
    pub_hex = pub.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw
    ).hex()
    return {"priv": priv, "pub": pub_hex}

def register_agent(pub_hex, daily_cap=50000.0, per_tx_cap=10000.0):
    res = requests.post(
        REGISTRY_URL,
        json={
            "agent_pubkey": pub_hex,
            "daily_cap": daily_cap,
            "per_transaction_cap": per_tx_cap,
            "price_slippage_percent": 5.0
        },
        headers={"X-Admin-Key": "demo_admin_key"}
    )
    if not res.ok:
        print("Failed to register agent", pub_hex)

print("Pre-registering 50 genuine agents to avoid velocity limits on demo traffic...")
genuine_agents = []
for _ in range(50):
    agent = generate_agent()
    register_agent(agent["pub"])
    genuine_agents.append(agent)

print("Pre-registering 1 rogue agent for fraud simulation...")
rogue_agent = generate_agent()
register_agent(rogue_agent["pub"])

def sign_payload(payload: dict, priv_key: ed25519.Ed25519PrivateKey) -> str:
    payload_to_sign = {k: v for k, v in payload.items() if k != "signature"}
    if "requested_amount" in payload_to_sign:
        payload_to_sign["requested_amount"] = f"{float(payload_to_sign['requested_amount']):.2f}"
    if "quoted_price" in payload_to_sign:
        payload_to_sign["quoted_price"] = f"{float(payload_to_sign['quoted_price']):.2f}"
    
    canonical_msg = json.dumps(payload_to_sign, sort_keys=True, separators=(',', ':')).encode('utf-8')
    signature = priv_key.sign(canonical_msg)
    return signature.hex()

def send_request(agent_keys, amount_inr, schema_type, mandate_idx, is_fraud=False):
    now_ns = time.time_ns()
    unique_suffix = f"{now_ns}_{random.randint(1000, 9999)}"
    mandate_id = f"mnd_kgl_{mandate_idx}_{unique_suffix}"
    nonce_token = f"nonce_kgl_{unique_suffix}"
    
    payload = {
        "mandate_id": mandate_id,
        "requested_amount": amount_inr,
        "nonce": nonce_token,
        "expiry": int(time.time()) + 3600,
        "delegation": {
            "human_root_hash": "kaggle_agent",
            "primary_agent_id": "replay_engine",
            "sub_agent_id": None,
            "delegation_depth": 1,
            "agent_pubkey": agent_keys["pub"]
        },
        "scope": schema_type,
        "quoted_price": amount_inr
    }
    
    payload["signature"] = sign_payload(payload, agent_keys["priv"])
    
    try:
        res = requests.post(API_URL, json=payload, timeout=2)
        if res.status_code == 200:
            print(f"✅ Replayed [Genuine]: {mandate_id} - ₹{amount_inr}")
            # Simulate completion
            if not is_fraud:
                order_id = res.json().get("razorpay_payload", {}).get("order_id")
                if schema_type == "payment_confirmed" and order_id:
                    requests.post(SIMULATE_URL, json={"order_id": order_id}, headers={"X-Admin-Key": "demo_admin_key"})
                    
                settle_payload = {
                    "mandate_id": mandate_id,
                    "verification": {
                        "scope": schema_type,
                        "proof_of_work": f"Simulated auto-completion for schema {schema_type}",
                        "proof_artifacts": {
                            "razorpay_order_id": order_id if schema_type == "payment_confirmed" else "",
                            "webhook_timestamp": int(time.time()) if schema_type == "service_rendered" else "",
                            "artifact_hash": "mock_hash" if schema_type == "data_delivery" else "",
                            "expected_hash": "mock_hash" if schema_type == "data_delivery" else ""
                        }
                    },
                    "amount_in_escrow": amount_inr
                }
                # Random short delay for realistic dashboard
                time.sleep(random.uniform(0.1, 0.5))
                requests.post(SETTLE_URL, json=settle_payload, headers={"X-Admin-Key": "demo_admin_key"}, timeout=2)

        elif res.status_code == 429:
            print(f"🛡️ Replayed [Fraud Blocked - Anomaly/Velocity]: {mandate_id} - ₹{amount_inr}")
        elif res.status_code == 400:
            print(f"🛡️ Replayed [Guardrail Blocked]: {mandate_id} - {res.json().get('detail')}")
        else:
            print(f"⚠️ Replayed [Error {res.status_code}]: {res.text}")
    except Exception as e:
        print(f"Failed to connect: {e}")

def replay_from_csv():
    print(f"Starting Live Replay Engine from {CSV_PATH}...")
    
    with open(CSV_PATH, "r") as f:
        reader = csv.DictReader(f)
        for index, row in enumerate(reader):
            amount_usd = float(row.get("Amount", 0))
            amount_inr = round(amount_usd * 83 + random.uniform(10, 200), 2)
            if amount_inr < 10:
                amount_inr = round(random.uniform(50, 500), 2)

            is_fraud = int(row.get("Class", 0)) == 1
            schema_type = random.choice(schema_pool)
            
            if is_fraud:
                # Trigger a velocity / volume spike for the rogue agent
                print(f"🚨 FRAUD ROW DETECTED! Initiating velocity spike attack...")
                # We send 16 rapid requests to trigger the velocity anomaly detector
                for i in range(16):
                    send_request(rogue_agent, amount_inr, schema_type, f"{index}_atk_{i}", True)
            else:
                # Normal traffic distributed among 50 genuine agents
                agent_keys = random.choice(genuine_agents)
                send_request(agent_keys, amount_inr, schema_type, index, False)
                time.sleep(0.05)

if __name__ == "__main__":
    while True:
        try:
            replay_from_csv()
        except Exception as e:
            print(f"Replay loop error: {e}")
            time.sleep(5)

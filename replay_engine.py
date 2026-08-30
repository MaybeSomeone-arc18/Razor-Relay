import csv
import time
import requests
import random
import hashlib

API_URL = "http://localhost:8000/v1/relay/gateway/execute"
CSV_PATH = "database/creditcard.csv"

schema_pool = ["service_rendered", "payment_confirmed", "data_delivery", "asset_transfer"]

def replay_from_csv():
    print(f"Starting Live Replay Engine from {CSV_PATH}...")
    
    with open(CSV_PATH, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            amount_usd = float(row.get("Amount", 0))
            amount_inr = round(amount_usd * 83 + random.uniform(10, 200), 2)
            if amount_inr < 10:
                amount_inr = round(random.uniform(50, 500), 2)

            is_fraud = int(row.get("Class", 0)) == 1
            schema_type = random.choice(schema_pool)
            
            nonce = hashlib.md5(str(time.time() + random.random()).encode()).hexdigest()
            mandate_id = "mnd_" + nonce[:8]

            payload = {
                "mandate_id": mandate_id,
                "requested_amount": amount_inr,
                "nonce": nonce[:16],
                "signature": "bad_signature_from_fraudster" if is_fraud else "",
                "expiry": int(time.time()) + 3600,
                "delegation": {
                    "human_root_hash": "kaggle_agent",
                    "primary_agent_id": "replay_engine",
                    "sub_agent_id": None,
                    "delegation_depth": 1
                },
                "scope": schema_type,
                "quoted_price": amount_inr,
                "limits": {
                    "per_transaction_cap": 10000.0,
                    "daily_cap": 50000.0,
                    "price_slippage_percent": 5.0
                }
            }

            if not is_fraud:
                payload_to_sign = {k: v for k, v in payload.items() if k != "signature"}
                try:
                    sign_res = requests.post("http://localhost:8000/v1/relay/mandate/sign", json=payload_to_sign, headers={"X-Admin-Key": "demo_admin_key"}, timeout=2)
                    if sign_res.ok:
                        payload["signature"] = sign_res.json().get("signature")
                except:
                    pass

            try:
                res = requests.post(API_URL, json=payload, timeout=2)
                if res.status_code == 200:
                    print(f"✅ Replayed [Genuine]: {mandate_id} - ₹{amount_inr}")
                elif res.status_code == 401:
                    print(f"🛡️ Replayed [Fraud Blocked]: {mandate_id} - ₹{amount_inr}")
                else:
                    print(f"⚠️ Replayed [Error {res.status_code}]: {res.text}")
            except Exception as e:
                print(f"Failed to connect: {e}")

            time.sleep(random.uniform(0.5, 2.5))

if __name__ == "__main__":
    while True:
        try:
            replay_from_csv()
        except Exception as e:
            print(f"Replay loop error: {e}")
            time.sleep(5)

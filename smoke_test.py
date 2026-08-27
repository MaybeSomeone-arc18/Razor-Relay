import requests
import json
import os
import uuid
import time
from dotenv import load_dotenv

load_dotenv()
BASE_URL = "http://localhost:8000"

print("=== SMOKE TEST: MANDATE & ESCROW FLOW ===")
mandate_id = f"agent_tx_{uuid.uuid4().hex[:8]}"
amount = 100.0

# 1. Sign Mandate
print("\n1. Signing and Executing Mandate...")
payload_mandate = {
    "mandate_id": mandate_id,
    "delegation": {
        "human_root_hash": "a1b2c3d4",
        "primary_agent_id": "test_agent_1",
        "sub_agent_id": None,
        "delegation_depth": 1
    },
    "limits": {
        "per_transaction_cap": 1000.0,
        "daily_cap": 5000.0,
        "price_slippage_percent": 0.0
    },
    "scope": "dashboard_sim",
    "expiry": int(time.time()) + 3600,
    "nonce": str(uuid.uuid4()),
    "requested_amount": amount,
    "quoted_price": amount
}
try:
    # Sign it
    res_sign = requests.post(f"{BASE_URL}/v1/relay/mandate/sign", json=payload_mandate)
    res_sign.raise_for_status()
    payload_mandate["signature"] = res_sign.json()["signature"]
    
    # Execute it
    res_exec = requests.post(f"{BASE_URL}/v1/relay/gateway/execute", json=payload_mandate)
    print(f"Status: {res_exec.status_code}")
    print(f"Response: {res_exec.json()}")
    res_exec.raise_for_status()
except Exception as e:
    print(f"❌ Mandate execution failed: {e}")
    exit(1)

# Wait a beat
time.sleep(1)

# 2. Settle Escrow (with live Razorpay order checking)
print("\n2. Settling Escrow (Live Route & Razorpay)...")
# First, create a mock order on the live razorpay to verify it (status will be created, not paid, so it should be REJECTED safely, proving the lock)
import razorpay
rzp = razorpay.Client(auth=(os.getenv("RZP_TEST_KEY"), os.getenv("RZP_TEST_SECRET")))
try:
    order = rzp.order.create({"amount": 100, "currency": "INR"})
    live_order_id = order["id"]
    print(f"Created live Razorpay order: {live_order_id} (status: {order['status']})")
except Exception as e:
    print(f"❌ Failed to create Razorpay test order: {e}")
    exit(1)

payload_escrow = {
    "mandate_id": mandate_id,
    "amount_in_escrow": amount,
    "verification": {
        "proof_of_work": "Payment made for services",
        "scope": "dashboard_sim",
        "proof_artifacts": {"razorpay_order_id": live_order_id}
    }
}
try:
    res = requests.post(f"{BASE_URL}/v1/relay/escrow/settle", json=payload_escrow)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.json()}")
    # It should be 200 OK because the API executed, but verification passed should be False
    res_json = res.json()
    if res.status_code == 200 and res_json.get("verification", {}).get("passed") is False:
        print("✅ Correctly blocked settlement for unpaid live order (funds refunded).")
    else:
        print("❌ Wait, it didn't safely block the unpaid order as expected.")
except Exception as e:
    print(f"❌ Escrow settlement failed: {e}")

# 3. Check WAL in Upstash
print("\n3. Verifying WAL in Upstash Redis...")
redis_url = os.getenv("UPSTASH_REDIS_REST_URL").rstrip('/')
redis_token = os.getenv("UPSTASH_REDIS_REST_TOKEN")
headers = {"Authorization": f"Bearer {redis_token}"}
try:
    # Key is nonce:{nonce}
    nonce = payload_mandate["nonce"]
    res = requests.post(redis_url, headers=headers, json=["GET", f"nonce:{nonce}"])
    state = res.json().get('result')
    if state:
        print(f"✅ Found nonce lock state in Upstash for {nonce}: {state}")
    else:
        print(f"❌ Nonce state not found in Upstash for {nonce}")
        
    # Check WAL (it's a list now, so use LRANGE)
    res_wal = requests.post(redis_url, headers=headers, json=["LRANGE", f"wal_{mandate_id}", "0", "-1"])
    wal = res_wal.json().get('result')
    if wal:
        print(f"✅ Found WAL entries in Upstash for {mandate_id}: {len(wal)} records")
    else:
        print(f"❌ WAL not found in Upstash for {mandate_id}")
except Exception as e:
    print(f"❌ Upstash check failed: {e}")

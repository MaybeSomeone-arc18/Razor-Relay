import time
import json
import hmac
import hashlib
import uuid
import os
import requests

# Standard ANSI Terminal Colors
C_RESET = "\033[0m"
C_CYAN = "\033[96m"
C_GREEN = "\033[92m"
C_YELLOW = "\033[93m"
C_MAGENTA = "\033[95m"
C_GRAY = "\033[90m"

MANDATE_SECRET_KEY = os.getenv("MANDATE_SECRET_KEY", "default_secret")
BASE_URL = "http://127.0.0.1:8000"

def log_step(agent, action, details):
    print(f"{C_CYAN}[{agent}]{C_RESET} {C_YELLOW}{action}{C_RESET}")
    print(f"{C_GRAY}>> {details}{C_RESET}\n")
    time.sleep(1)  # Artificial delay for dramatic effect

def simulate():
    print(f"\n{C_MAGENTA}=== RAZOR-RELAY MULTI-AGENT SIMULATION ==={C_RESET}\n")
    
    # 1. Agent-Alpha (Buyer) Creates Mandate
    mandate_id = f"tx_{uuid.uuid4().hex[:8]}"
    nonce = str(uuid.uuid4())
    amount = 1500.0
    
    payload = {
        "mandate_id": mandate_id,
        "delegation": {
            "human_root_hash": "hash_abcd",
            "primary_agent_id": "Agent-Alpha",
            "sub_agent_id": "Agent-Beta",
            "delegation_depth": 2
        },
        "limits": {
            "per_transaction_cap": 2000.0,
            "daily_cap": 10000.0,
            "price_slippage_percent": 2.0
        },
        "scope": "data_cleaning_task",
        "expiry": int(time.time()) + 3600,
        "nonce": nonce,
        "requested_amount": amount,
        "quoted_price": amount
    }
    
    # Sign Payload (HMAC Merkle Verification)
    payload_str = json.dumps(payload, sort_keys=True, separators=(',', ':'))
    crypto_seed = f"hash_abcd:{MANDATE_SECRET_KEY}".encode('utf-8')
    signature = hmac.new(crypto_seed, payload_str.encode('utf-8'), hashlib.sha256).hexdigest()
    payload["signature"] = signature
    
    log_step("Agent-Alpha", "Created UAP Mandate Payload", f"Requested Amount: ₹{amount:,.2f} | HMAC Signature: {signature[:16]}...")
    
    # 2. Submit to Gateway
    log_step("Razor-Relay", "Evaluating Policy Guardrails", "Checking Replay Nonces (SETNX), Budget Limits, and Cryptographic Signatures...")
    
    try:
        response = requests.post(f"{BASE_URL}/v1/relay/gateway/execute", json=payload)
        response.raise_for_status()
        data = response.json()
        log_step("Razor-Relay", "Authorization Successful", f"Circuit State: {C_GREEN}{data.get('routing_state', 'CLOSED')}{C_GRAY} | Routing: {data.get('routing_mechanism', 'UPI_DIRECT_AUTOPAY')}")
    except requests.exceptions.RequestException as e:
        err_msg = e.response.json() if hasattr(e, 'response') and e.response else str(e)
        print(f"{C_MAGENTA}[ERROR]{C_RESET} Gateway Execution Failed: {err_msg}")
        return

    # 3. Agent-Beta executes task
    log_step("Agent-Beta", "Task Completed", "Dataset cleaned successfully. Preparing execution data for settlement...")
    
    # 4. Escrow Settlement
    settle_payload = {
        "mandate_id": mandate_id,
        "verification": {"completion_score": 0.95}, # High score guarantees 100% payout
        "amount_in_escrow": amount
    }
    
    log_step("Razor-Relay", "Executing Escrow Settlement", f"AI Verification Score: {settle_payload['verification']['completion_score']} (Threshold >= 0.85)")
    
    try:
        res = requests.post(f"{BASE_URL}/v1/relay/escrow/settle", json=settle_payload)
        res.raise_for_status()
        s_data = res.json()["settlement_breakdown"]
        
        print(f"{C_GREEN}=== ESCROW SETTLEMENT COMPLETE ==={C_RESET}")
        print(f"Total Escrow Amount: ₹{amount:,.2f}")
        print(f"Platform Fee (1%):   ₹{s_data['platform_fee']:,.2f}")
        print(f"Vendor Payout:       ₹{s_data['vendor_payout']:,.2f}")
        print(f"Refund to Buyer:     ₹{s_data['refund_amount']:,.2f}\n")
    except requests.exceptions.RequestException as e:
        err_msg = e.response.json() if hasattr(e, 'response') and e.response else str(e)
        print(f"{C_MAGENTA}[ERROR]{C_RESET} Escrow Settlement Failed: {err_msg}")

if __name__ == "__main__":
    simulate()

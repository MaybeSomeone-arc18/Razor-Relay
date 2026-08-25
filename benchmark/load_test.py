import asyncio
import httpx
import time
import json
import hmac
import hashlib
import uuid
import os
import statistics

# Attempt to load secret key from environment or use default
MANDATE_SECRET_KEY = os.getenv("MANDATE_SECRET_KEY", "default_secret")
# Note: The prompt mentioned /v1/relay/route, but the actual implementation uses /v1/relay/gateway/execute
URL = "http://127.0.0.1:8000/v1/relay/gateway/execute"
TOTAL_REQUESTS = 500
CONCURRENCY_LIMIT = 50  # Limit concurrency to avoid socket exhaustion

def generate_payload():
    nonce = str(uuid.uuid4())
    payload = {
        "mandate_id": f"load_test_{nonce[:8]}",
        "delegation": {
            "human_root_hash": "hash_abcd",
            "primary_agent_id": "agent_01",
            "sub_agent_id": None,
            "delegation_depth": 1
        },
        "limits": {
            "per_transaction_cap": 1000.0,
            "daily_cap": 100000.0,
            "price_slippage_percent": 0.0
        },
        "scope": "load_test",
        "expiry": int(time.time()) + 3600,
        "nonce": nonce,
        "requested_amount": 10.0,
        "quoted_price": 10.0
    }
    
    # Sign payload
    payload_str = json.dumps(payload, sort_keys=True, separators=(',', ':'))
    crypto_seed = f"hash_abcd:{MANDATE_SECRET_KEY}".encode('utf-8')
    signature = hmac.new(crypto_seed, payload_str.encode('utf-8'), hashlib.sha256).hexdigest()
    payload["signature"] = signature
    
    return payload

async def fetch(client, sem):
    payload = generate_payload()
    async with sem:
        start_time = time.perf_counter()
        try:
            response = await client.post(URL, json=payload)
            elapsed = time.perf_counter() - start_time
            return {"status": response.status_code, "time_ms": elapsed * 1000}
        except Exception as e:
            elapsed = time.perf_counter() - start_time
            return {"status": 0, "time_ms": elapsed * 1000, "error": str(e)}

async def main():
    print(f"🚀 Starting Load Test: {TOTAL_REQUESTS} requests to {URL}...")
    sem = asyncio.Semaphore(CONCURRENCY_LIMIT)
    
    # Configure httpx client
    limits = httpx.Limits(max_connections=CONCURRENCY_LIMIT, max_keepalive_connections=CONCURRENCY_LIMIT)
    async with httpx.AsyncClient(limits=limits, timeout=10.0) as client:
        tasks = [fetch(client, sem) for _ in range(TOTAL_REQUESTS)]
        
        start_total = time.perf_counter()
        results = await asyncio.gather(*tasks)
        total_time = time.perf_counter() - start_total

    # Calculate metrics
    successes = [r for r in results if r["status"] == 200]
    latencies = [r["time_ms"] for r in results]
    
    success_rate = (len(successes) / TOTAL_REQUESTS) * 100
    rps = TOTAL_REQUESTS / total_time
    
    if latencies:
        # Quantiles(n=100) returns 99 cut points. Index 49 is 50th, 94 is 95th, 98 is 99th.
        p50 = statistics.median(latencies)
        try:
            quants = statistics.quantiles(latencies, n=100)
            p95 = quants[94]
            p99 = quants[98]
        except ValueError:
            # Handle case where there's not enough data for quantiles
            p95 = max(latencies)
            p99 = max(latencies)
    else:
        p50 = p95 = p99 = 0.0

    # Display results
    print("\n" + "="*45)
    print("📊 LOAD TEST METRICS")
    print("="*45)
    print(f"Total Requests Processed: {TOTAL_REQUESTS}")
    print(f"Success Rate:             {success_rate:.2f}% ({len(successes)}/{TOTAL_REQUESTS})")
    print(f"Throughput (RPS):         {rps:.2f} req/s")
    print("-" * 45)
    print("Latency Percentiles:")
    print(f"  p50 (Median):           {p50:.2f} ms")
    print(f"  p95:                    {p95:.2f} ms")
    print(f"  p99:                    {p99:.2f} ms")
    print("="*45 + "\n")

if __name__ == "__main__":
    asyncio.run(main())

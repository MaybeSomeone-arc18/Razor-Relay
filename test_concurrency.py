import asyncio
import httpx
import sys

async def settle(client, mandate_id):
    payload = {
        "mandate_id": mandate_id,
        "verification": {
            "proof_of_work": "test",
            "scope": "default",
            "proof_artifacts": {}
        },
        "amount_in_escrow": 100.0
    }
    response = await client.post("http://127.0.0.1:8000/v1/relay/escrow/settle", json=payload)
    return response.status_code, response.json()

async def main():
    mandate_id = "test_concurrent_lock_1"
    async with httpx.AsyncClient() as client:
        # Fire two concurrent requests
        results = await asyncio.gather(
            settle(client, mandate_id),
            settle(client, mandate_id)
        )
        
        status_codes = [res[0] for res in results]
        print(f"Status codes: {status_codes}")
        
        if 200 in status_codes and 409 in status_codes:
            print("SUCCESS: Exactly one request succeeded and one was rejected with 409.")
            sys.exit(0)
        else:
            print("FAILED: Expected one 200 and one 409.")
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())

import os
from dotenv import load_dotenv
import requests
import razorpay
from google import genai
from google.genai import types
import json

load_dotenv()

print("=== 1. ENV LOADING ===")
expected_vars = [
    "RZP_TEST_KEY", 
    "RZP_TEST_SECRET", 
    "GEMINI_API_KEY", 
    "UPSTASH_REDIS_REST_URL", 
    "UPSTASH_REDIS_REST_TOKEN"
]

all_good = True
for var in expected_vars:
    val = os.getenv(var)
    if not val:
        print(f"❌ {var}: MISSING or EMPTY")
        all_good = False
    elif "XXX" in val:
        print(f"❌ {var}: Contains placeholder XXX")
        all_good = False
    else:
        masked = val[:4] + "*" * (len(val)-8) + val[-4:] if len(val) > 8 else "***"
        print(f"✅ {var}: Loaded ({masked})")

if not all_good:
    print("\n🛑 STOPPING: Please SAVE the .env file with your real credentials.")
    exit(1)


print("\n=== 2. UPSTASH REDIS ===")
redis_url = os.getenv("UPSTASH_REDIS_REST_URL").rstrip('/')
redis_token = os.getenv("UPSTASH_REDIS_REST_TOKEN")
headers = {"Authorization": f"Bearer {redis_token}"}
try:
    # SET
    res_set = requests.post(redis_url, headers=headers, json=["SET", "test_key", "hello_buildathon"], timeout=5)
    res_set.raise_for_status()
    print(f"✅ SET Response: {res_set.json()}")
    
    # GET
    res_get = requests.post(redis_url, headers=headers, json=["GET", "test_key"], timeout=5)
    res_get.raise_for_status()
    print(f"✅ GET Response: {res_get.json()}")
except Exception as e:
    print(f"❌ Redis Connection Failed: {e}")


print("\n=== 3. GEMINI LIVE CALL ===")
try:
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    response = client.models.generate_content(
        model='gemini-3.6-flash',
        contents="Hello, this is a live test. Reply with exactly the word 'SUCCESS'.",
        config=types.GenerateContentConfig(temperature=0.0)
    )
    print(f"✅ Gemini Response: {response.text.strip()}")
except Exception as e:
    print(f"❌ Gemini Classification Failed: {e}")


print("\n=== 4. RAZORPAY TEST MODE ===")
try:
    rzp_key = os.getenv("RZP_TEST_KEY")
    rzp_secret = os.getenv("RZP_TEST_SECRET")
    client = razorpay.Client(auth=(rzp_key, rzp_secret))
    
    # Create a dummy order for ₹1 to test
    order_data = {
        "amount": 100,
        "currency": "INR",
        "receipt": "test_receipt_1"
    }
    order = client.order.create(data=order_data)
    print(f"✅ Order Created: {order['id']} (Status: {order['status']})")
    
    # Fetch it back
    fetched_order = client.order.fetch(order['id'])
    print(f"✅ Order Fetched: {fetched_order['id']} (Status: {fetched_order['status']})")
except Exception as e:
    print(f"❌ Razorpay API Error: {e}")

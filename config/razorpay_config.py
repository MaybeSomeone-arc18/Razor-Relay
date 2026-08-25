import os
import razorpay
from dotenv import load_dotenv

load_dotenv()

RZP_TEST_KEY = os.getenv("RZP_TEST_KEY")
RZP_TEST_SECRET = os.getenv("RZP_TEST_SECRET")

if not RZP_TEST_KEY or not RZP_TEST_SECRET:
    raise ValueError("Razorpay test credentials not found in environment variables.")

# Initialize the Razorpay client
razorpay_client = razorpay.Client(auth=(RZP_TEST_KEY, RZP_TEST_SECRET))

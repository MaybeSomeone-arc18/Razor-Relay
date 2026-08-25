import os
import razorpay
from dotenv import load_dotenv

load_dotenv()

RZP_TEST_KEY = os.getenv("RZP_TEST_KEY")
RZP_TEST_SECRET = os.getenv("RZP_TEST_SECRET")

razorpay_client = None
if RZP_TEST_KEY and RZP_TEST_SECRET:
    razorpay_client = razorpay.Client(auth=(RZP_TEST_KEY, RZP_TEST_SECRET))

"""
database/sqlite_client.py
Persistent transaction log store for Razor-Relay.

Rules applied:
1. WAL mode enabled to allow concurrent reads (polling) + writes (gateway/execute) without locking.
2. Status column covers the full lifecycle state machine.
3. Log query window is capped at 15 rows by default.
"""

import sqlite3
import time
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "relay.db")

# Full lifecycle statuses the state machine can emit
VALID_STATUSES = {
    "ESCROW_LOCKED",       # Initial authorization - funds ring-fenced
    "SETTLED",             # Proof verified, payout released (1% fee deducted)
    "REFUNDED",            # Task failed deterministic verification, full refund
    "REJECTED_CEILING",    # Blocked by per-tx or daily spending cap guardrail
    "MANDATE_REVOKED",     # Blocked by human operator revocation command
    "SIGNATURE_INVALID",   # HMAC verification failed (likely prompt injection)
    "REPLAY_BLOCKED",      # Duplicate nonce detected (replay attack)
}


def get_connection() -> sqlite3.Connection:
    """Returns a connection with WAL mode and row_factory set."""
    conn = sqlite3.connect(DB_PATH, timeout=15.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    # Rule 1: Enable WAL mode to allow concurrent reads + writes without locking
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    return conn


def init_db():
    """Creates the transactions table if it doesn't exist. Called on server startup."""
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                mandate_id  TEXT NOT NULL,
                schema_type TEXT NOT NULL DEFAULT 'service_rendered',
                agent_ip    TEXT NOT NULL DEFAULT '0.0.0.0',
                status      TEXT NOT NULL,
                amount      REAL NOT NULL DEFAULT 0.0,
                fee         REAL NOT NULL DEFAULT 0.0,
                timestamp   REAL NOT NULL
            )
        """)
        conn.commit()


def insert_transaction(
    mandate_id: str,
    status: str,
    amount: float,
    schema_type: str = "service_rendered",
    agent_ip: str = "0.0.0.0",
    fee: float = 0.0,
):
    """Inserts a single transaction record into the database."""
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO transactions (mandate_id, schema_type, agent_ip, status, amount, fee, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (mandate_id, schema_type, agent_ip, status, round(amount, 2), round(fee, 2), time.time()),
        )
        conn.commit()


def get_recent_transactions(limit: int = 15) -> list:
    """
    Rule 3: Returns the most recent N transactions ordered by timestamp DESC.
    Capped at 15 by default for fast dashboard polling.
    """
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM transactions ORDER BY timestamp DESC LIMIT ?",
            (limit,)
        ).fetchall()
    return [dict(row) for row in rows]


def seed_from_csv(csv_path: str, max_rows: int = 500):
    """
    Seeds the database using real transaction data from the ULB Credit Card Fraud dataset.
    Transforms: Amount -> INR amount, Class (0=genuine/1=fraud) -> status, Time -> relative timestamp.
    """
    import csv
    import random
    import hashlib

    schema_pool = ["service_rendered", "payment_confirmed", "data_delivery", "asset_transfer"]
    ip_pool = [
        "192.168.1.104", "10.0.0.45", "172.16.254.1",
        "10.0.0.12", "172.16.254.3", "192.168.0.22",
        "10.10.10.5", "192.168.1.200",
    ]

    now = time.time()
    inserted = 0

    with open(csv_path, "r") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i >= max_rows:
                break

            amount_usd = float(row.get("Amount", 0))
            # Convert USD to INR (approx 83x), keep realistic range
            amount_inr = round(amount_usd * 83 + random.uniform(10, 200), 2)
            if amount_inr < 10:
                amount_inr = round(random.uniform(50, 500), 2)

            is_fraud = int(row.get("Class", 0)) == 1
            time_offset = float(row.get("Time", 0))

            # Map fraud label to Razor-Relay lifecycle status
            if is_fraud:
                status = random.choice(["SIGNATURE_INVALID", "REPLAY_BLOCKED", "MANDATE_REVOKED"])
            else:
                status = random.choices(
                    ["SETTLED", "ESCROW_LOCKED", "REFUNDED", "REJECTED_CEILING"],
                    weights=[70, 15, 10, 5]
                )[0]

            fee = round(amount_inr * 0.01, 2) if status == "SETTLED" else 0.0

            # Generate a deterministic mandate_id from row index
            mandate_id = "mnd_" + hashlib.md5(f"{i}_{amount_inr}".encode()).hexdigest()[:8]

            with get_connection() as conn:
                conn.execute(
                    """
                    INSERT INTO transactions (mandate_id, schema_type, agent_ip, status, amount, fee, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        mandate_id,
                        random.choice(schema_pool),
                        random.choice(ip_pool),
                        status,
                        amount_inr,
                        fee,
                        now - (86400 - time_offset),  # spread across last 24h
                    ),
                )
                conn.commit()
            inserted += 1

    print(f"[seed_from_csv] Inserted {inserted} transactions from {csv_path}")
    return inserted

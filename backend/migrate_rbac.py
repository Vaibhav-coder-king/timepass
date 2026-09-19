"""
COGNIVA RBAC Migration & Seeding Script
Creates users table with CHECK constraint ('Hospital', 'NGO', 'Family', 'User')
Adds device_id and region to game_sessions table
Seeds test users and scoped game_sessions
"""

import os
import sqlite3
from datetime import datetime, timezone, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), "cogniva.db")

def run_migration():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # 1. Enable WAL mode
    cursor.execute("PRAGMA journal_mode=WAL;")

    # 2. Create users table with CHECK constraint on role
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            username      TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role          TEXT NOT NULL CHECK (role IN ('Hospital', 'NGO', 'Family', 'User')),
            device_id     TEXT,
            region        TEXT,
            created_at    TEXT NOT NULL
        )
    """)

    # 3. Add device_id and region columns to game_sessions if not existing
    cursor.execute("PRAGMA table_info(game_sessions);")
    columns = [row["name"] for row in cursor.fetchall()]

    if "device_id" not in columns:
        cursor.execute("ALTER TABLE game_sessions ADD COLUMN device_id TEXT DEFAULT 'device_alpha';")
        print("Added device_id column to game_sessions.")

    if "region" not in columns:
        cursor.execute("ALTER TABLE game_sessions ADD COLUMN region TEXT DEFAULT 'Assam';")
        print("Added region column to game_sessions.")

    conn.commit()

    # 4. Seed test users (Clear & Re-seed or INSERT OR REPLACE)
    now = datetime.now(timezone.utc).isoformat()
    users = [
        ("admin_hospital", "hosp123", "Hospital", None, None),
        ("ngo_worker", "ngo123", "NGO", None, "Assam"),
        ("family_carer", "fam123", "Family", "device_alpha", None),
        ("elderly_user", "user123", "User", "device_alpha", "Assam"),
    ]

    for uname, pword, role, dev_id, reg in users:
        cursor.execute("""
            INSERT INTO users (username, password_hash, role, device_id, region, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(username) DO UPDATE SET
                password_hash=excluded.password_hash,
                role=excluded.role,
                device_id=excluded.device_id,
                region=excluded.region
        """, (uname, pword, role, dev_id, reg, now))

    print(f"Seeded {len(users)} RBAC test users.")

    # 5. Seed diverse game sessions across devices and regions
    # device_alpha (Assam), device_beta (Meghalaya), device_gamma (Manipur)
    base_time = datetime.now(timezone.utc)
    sample_sessions = [
        # device_alpha / Assam (viewable by Hospital, NGO Assam, and Family device_alpha)
        ("sess_a1", "MEMORY_MATCH", 45, 1, 2, "device_alpha", "Assam", (base_time - timedelta(days=4)).isoformat()),
        ("sess_a2", "MEMORY_MATCH", 40, 0, 2, "device_alpha", "Assam", (base_time - timedelta(days=3)).isoformat()),
        ("sess_a3", "MEMORY_MATCH", 38, 1, 3, "device_alpha", "Assam", (base_time - timedelta(days=2)).isoformat()),
        ("sess_a4", "DAILY_SEQUENCE", 55, 2, 1, "device_alpha", "Assam", (base_time - timedelta(days=2)).isoformat()),
        ("sess_a5", "DAILY_SEQUENCE", 48, 1, 2, "device_alpha", "Assam", (base_time - timedelta(days=1)).isoformat()),
        
        # device_beta / Meghalaya (viewable by Hospital only, NOT Assam NGO, NOT device_alpha Family)
        ("sess_b1", "MEMORY_MATCH", 60, 5, 1, "device_beta", "Meghalaya", (base_time - timedelta(days=3)).isoformat()),
        ("sess_b2", "MEMORY_MATCH", 65, 6, 1, "device_beta", "Meghalaya", (base_time - timedelta(days=2)).isoformat()),
        ("sess_b3", "DAILY_SEQUENCE", 70, 4, 1, "device_beta", "Meghalaya", (base_time - timedelta(days=1)).isoformat()),

        # device_gamma / Assam (viewable by Hospital and Assam NGO, but NOT device_alpha Family)
        ("sess_g1", "MEMORY_MATCH", 50, 2, 2, "device_gamma", "Assam", (base_time - timedelta(days=2)).isoformat()),
        ("sess_g2", "DAILY_SEQUENCE", 52, 2, 2, "device_gamma", "Assam", (base_time - timedelta(days=1)).isoformat()),
    ]

    for sid, gtype, t_sec, errs, lvl, dev_id, reg, sync_time in sample_sessions:
        cursor.execute("""
            INSERT INTO game_sessions (id, game_type, time_taken_sec, error_count, level, synced_at, device_id, region)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                device_id=excluded.device_id,
                region=excluded.region
        """, (sid, gtype, t_sec, errs, lvl, sync_time, dev_id, reg))

    conn.commit()
    conn.close()
    print("Migration and seeding completed successfully!")

if __name__ == "__main__":
    run_migration()

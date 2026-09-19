"""
COGNIVA Backend — Phase 3 & 4
Flask REST API  •  SQLite (WAL mode)  •  Port 5000

Run:  python app.py
"""

from __future__ import annotations

import os
import sqlite3
from collections import defaultdict
from datetime import datetime, timezone

from flask import Flask, jsonify, request
from flask_cors import CORS

# ── App setup ─────────────────────────────────────────────────────────────────

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

DB_PATH = os.path.join(os.path.dirname(__file__), "cogniva.db")


# ── Database helpers ──────────────────────────────────────────────────────────

def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with get_db() as conn:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("""
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
        conn.execute("""
            CREATE TABLE IF NOT EXISTS game_sessions (
                id           TEXT    PRIMARY KEY,
                game_type    TEXT    NOT NULL,
                time_taken_sec INTEGER NOT NULL DEFAULT 0,
                error_count  INTEGER NOT NULL DEFAULT 0,
                level        INTEGER NOT NULL DEFAULT 2,
                synced_at    TEXT    NOT NULL,
                device_id    TEXT    DEFAULT 'device_alpha',
                region       TEXT    DEFAULT 'Assam'
            )
        """)
        conn.commit()


init_db()


# ── POST /api/login ────────────────────────────────────────────────────────────

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    with get_db() as conn:
        row = conn.execute(
            "SELECT id, username, password_hash, role, device_id, region FROM users WHERE username = ?",
            (username,)
        ).fetchone()

    if not row or row["password_hash"] != password:
        return jsonify({"error": "Invalid credentials"}), 401

    user_info = {
        "id": row["id"],
        "username": row["username"],
        "role": row["role"],
        "device_id": row["device_id"],
        "region": row["region"]
    }

    return jsonify({
        "status": "success",
        "user": user_info,
        "token": f"token_{row['username']}_{row['role']}"
    })


# ── Auth Helper ───────────────────────────────────────────────────────────────

def get_authenticated_user() -> dict | None:
    """
    Extracts authenticated user from Authorization header or X-Username header.
    Format: 'Bearer token_<username>_<role>' or 'X-Username: <username>'
    """
    auth_header = request.headers.get("Authorization", "")
    username = None

    if auth_header.startswith("Bearer token_"):
        raw_token = auth_header.replace("Bearer token_", "")
        # The token is generated as token_{username}_{role}
        # Since username might contain underscores (e.g. admin_hospital, ngo_worker),
        # the role is the last token part.
        parts = raw_token.rsplit("_", 1)
        if parts:
            username = parts[0]
    
    if not username:
        username = request.headers.get("X-Username")

    if not username:
        return None

    with get_db() as conn:
        row = conn.execute(
            "SELECT id, username, role, device_id, region FROM users WHERE username = ?",
            (username,)
        ).fetchone()

    return dict(row) if row else None


# ── POST /api/sync ─────────────────────────────────────────────────────────────
# Idempotent upserts — safe to retry on network failure.
# Returns exactly which IDs were acknowledged.

@app.route("/api/sync", methods=["POST"])
def sync():
    data = request.get_json(silent=True)
    if not data or not isinstance(data, list):
        return jsonify({"error": "Expected a JSON array of session objects"}), 400

    acknowledged_ids: list[str] = []
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as conn:
        for session in data:
            try:
                sid = str(session["id"])
                conn.execute(
                    """
                    INSERT INTO game_sessions
                        (id, game_type, time_taken_sec, error_count, level, synced_at, device_id, region)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        synced_at = excluded.synced_at,
                        device_id = excluded.device_id,
                        region = excluded.region
                    """,
                    (
                        sid,
                        session.get("game", "UNKNOWN"),
                        int(session.get("time_taken_sec", 0)),
                        int(session.get("error_count", 0)),
                        int(session.get("level", 2)),
                        now,
                        session.get("device_id", "device_alpha"),
                        session.get("region", "Assam"),
                    ),
                )
                acknowledged_ids.append(sid)
            except Exception:
                pass  # Skip malformed entries — never fail the whole batch

        conn.commit()

    return jsonify(
        {
            "status": "success",
            "synced_count": len(acknowledged_ids),
            "acknowledged_ids": acknowledged_ids,
        }
    )


# ── GET /api/analytics ────────────────────────────────────────────────────────
# Returns moving averages (window=3, last 10 sessions) and attention_needed flag.
# Enforces role-based data scoping:
# - Hospital: sees all records across all devices/regions
# - NGO: sees records in their assigned region
# - Family: sees records matching their device_id
# - User: 403 Forbidden (patients do not access caregiver analytics)

def moving_avg(values: list[float], window: int = 3) -> list[float]:
    result = []
    for i in range(len(values)):
        start = max(0, i - window + 1)
        chunk = values[start : i + 1]
        result.append(round(sum(chunk) / len(chunk), 1))
    return result


def build_game_stats(sessions: list[dict]) -> dict:
    """Build chart-ready data for a single game type."""
    # sessions come in newest-first; reverse for chronological chart display
    ordered = list(reversed(sessions[:10]))
    times  = [s["time_taken_sec"] for s in ordered]
    errors = [s["error_count"]    for s in ordered]
    labels = [s["synced_at"][:10] for s in ordered]
    return {
        "labels":           labels,
        "raw_time":         times,
        "raw_errors":       errors,
        "moving_avg_time":  moving_avg(times),
        "moving_avg_errors": moving_avg(errors),
    }


EMPTY_GAME_STATS = {
    "labels": [], "raw_time": [], "raw_errors": [],
    "moving_avg_time": [], "moving_avg_errors": [],
}


@app.route("/api/analytics", methods=["GET"])
def analytics():
    user = get_authenticated_user()

    # Enforce RBAC
    if not user:
        return jsonify({"error": "Authentication required"}), 401

    role = user.get("role")

    if role == "User":
        return jsonify({"error": "Forbidden: Patients cannot access clinical analytics"}), 403

    query = "SELECT id, game_type, time_taken_sec, error_count, level, synced_at, device_id, region FROM game_sessions"
    params = []

    if role == "Hospital":
        # Global view
        pass
    elif role == "NGO":
        # Regionally scoped
        query += " WHERE region = ?"
        params.append(user.get("region", "Assam"))
    elif role == "Family":
        # Device scoped
        query += " WHERE device_id = ?"
        params.append(user.get("device_id", "device_alpha"))
    else:
        return jsonify({"error": "Unauthorized role"}), 403

    query += " ORDER BY id DESC LIMIT 50"

    with get_db() as conn:
        rows = conn.execute(query, tuple(params)).fetchall()

    if not rows:
        return jsonify(
            {
                "attention_needed": False,
                "role": role,
                "scope": user.get("region") if role == "NGO" else (user.get("device_id") if role == "Family" else "Global"),
                "session_count": 0,
                "MEMORY_MATCH":     EMPTY_GAME_STATS,
                "DAILY_SEQUENCE":   EMPTY_GAME_STATS,
            }
        )

    dicts = [dict(r) for r in rows]

    # ── Attention flag: most recent 3 sessions (any game) all have error_count > 4
    recent_3 = dicts[:3]
    attention_needed = len(recent_3) == 3 and all(
        r["error_count"] > 4 for r in recent_3
    )

    # ── Group by game type
    by_game: dict[str, list[dict]] = defaultdict(list)
    for row in dicts:
        by_game[row["game_type"]].append(row)

    return jsonify(
        {
            "attention_needed": attention_needed,
            "role": role,
            "scope": user.get("region") if role == "NGO" else (user.get("device_id") if role == "Family" else "Global"),
            "session_count": len(dicts),
            "MEMORY_MATCH":   build_game_stats(by_game["MEMORY_MATCH"])
                              if "MEMORY_MATCH" in by_game else EMPTY_GAME_STATS,
            "DAILY_SEQUENCE": build_game_stats(by_game["DAILY_SEQUENCE"])
                              if "DAILY_SEQUENCE" in by_game else EMPTY_GAME_STATS,
        }
    )


# ── Health check ──────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "db": DB_PATH})


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("COGNIVA API running on http://0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000, debug=True)

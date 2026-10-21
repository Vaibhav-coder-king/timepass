"""
COGNIVA Backend — Phase 3 & 4 + MIRA AI Gemini Integration
Flask REST API  •  SQLite (WAL mode)  •  Port 5000

Run:  python app.py
"""

from __future__ import annotations

import json
import os
import sqlite3
import urllib.request
import urllib.error
from collections import defaultdict
from datetime import datetime, timezone

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

# ── App setup (Merged Single HTTP Service) ────────────────────────────────────

DIST_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "dist"))

app = Flask(__name__, static_folder=None)
CORS(app, resources={r"/*": {"origins": "*"}})


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization,X-Username"
    response.headers["Access-Control-Allow-Methods"] = "GET,PUT,POST,DELETE,OPTIONS"
    return response

DB_PATH = os.path.join(os.path.dirname(__file__), "cogniva.db")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")


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
    auth_header = request.headers.get("Authorization", "")
    username = None

    if auth_header.startswith("Bearer token_"):
        raw_token = auth_header.replace("Bearer token_", "")
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
                pass

        conn.commit()

    return jsonify(
        {
            "status": "success",
            "synced_count": len(acknowledged_ids),
            "acknowledged_ids": acknowledged_ids,
        }
    )


# ── GET /api/analytics ────────────────────────────────────────────────────────

def moving_avg(values: list[float], window: int = 3) -> list[float]:
    result = []
    for i in range(len(values)):
        start = max(0, i - window + 1)
        chunk = values[start : i + 1]
        result.append(round(sum(chunk) / len(chunk), 1))
    return result


def format_label(synced_at: str) -> str:
    if not synced_at:
        return "Session"
    try:
        # e.g. "2026-10-21T18:30:00" -> "21 Oct 18:30"
        date_part = synced_at[5:10]  # MM-DD
        time_part = synced_at[11:16] if len(synced_at) >= 16 else ""
        return f"{date_part} {time_part}".strip()
    except Exception:
        return synced_at[:10]


def build_game_stats(sessions: list[dict]) -> dict:
    ordered = list(reversed(sessions[:10]))
    times  = [s["time_taken_sec"] for s in ordered]
    errors = [s["error_count"]    for s in ordered]
    labels = [format_label(s.get("synced_at", "")) for s in ordered]
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

    if not user:
        return jsonify({"error": "Authentication required"}), 401

    role = user.get("role")

    if role == "User":
        return jsonify({"error": "Forbidden: Patients cannot access clinical analytics"}), 403

    query = "SELECT id, game_type, time_taken_sec, error_count, level, synced_at, device_id, region FROM game_sessions"
    params = []

    if role == "Hospital":
        pass
    elif role == "NGO":
        query += " WHERE region = ?"
        params.append(user.get("region", "Assam"))
    elif role == "Family":
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

    recent_3 = dicts[:3]
    attention_needed = len(recent_3) == 3 and all(
        r["error_count"] > 4 for r in recent_3
    )

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


# ── POST /api/mira/chat — Gemini AI Dementia Voice & Memory Companion ────────

@app.route("/api/mira/chat", methods=["POST"])
def mira_chat():
    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()
    language = data.get("language", "en")
    patient_name = data.get("patient_name", "Arun")
    api_key = data.get("api_key", "").strip() or GEMINI_API_KEY or os.environ.get("VITE_GEMINI_API_KEY", "")

    if not message:
        return jsonify({"response": f"Namaste {patient_name}, I am MIRA. How can I brighten your day?", "source": "offline_engine"})

    # Check if Gemini API is available
    if api_key:
        try:
            model = data.get("model", "gemini-1.5-flash")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            
            system_instruction = (
                f"You are MIRA, a warm, loving, and patient AI memory companion on COGNIVA, "
                f"a platform for elderly dementia patients in North-East India (NER). "
                f"Patient name: {patient_name}. Preferred language: {language}. "
                f"Assist with orientation, encourage cognitive games like Memory Match (with Assam tea ☕ and rhino 🦏 cards) "
                f"and Daily Sequence routines. Comfort them with peaceful NER memories. "
                f"CRITICAL: Keep your response SHORT (1 to 3 short sentences, max 40 words). Never overwhelm the elder."
            )

            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": f"{system_instruction}\n\nPatient says: '{message}'\nMIRA reply:"}]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.6,
                    "maxOutputTokens": 100
                }
            }

            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                text = res_data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                if text:
                    return jsonify({"response": text, "source": "gemini"})
        except Exception:
            pass  # Fall back to offline dementia engine

    # Offline fallback response
    msg_lower = message.lower()
    if "game" in msg_lower or "play" in msg_lower or "match" in msg_lower:
        reply = f"Hello {patient_name}! Let's play Memory Match together. Matching the Kaziranga rhino 🦏 and Assam tea ☕ cards is wonderful for the mind."
    elif "medicine" in msg_lower or "remind" in msg_lower:
        reply = f"{patient_name}, your medicine reminder is at 12:30 PM. Please take a sip of water now and rest comfortably."
    elif "where" in msg_lower or "lost" in msg_lower or "scared" in msg_lower or "help" in msg_lower:
        reply = f"You are safe and warm at home, {patient_name}. I am Mira, right beside you. Everything is calm and peaceful."
    elif "tea" in msg_lower or "assam" in msg_lower or "bihu" in msg_lower:
        reply = f"The fresh morning breeze over Assam tea gardens always brings peace, {patient_name}. Would you like a warm cup?"
    else:
        reply = f"Namaste {patient_name}! Today is a lovely day to engage your mind. Would you like to play a quick memory game?"

    return jsonify({"response": reply, "source": "offline_engine"})


# ── Health check ──────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "db": DB_PATH, "gemini_configured": bool(GEMINI_API_KEY)})


# ── Static SPA Routing (Merged Single HTTP Service) ───────────────────────────

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_spa(path: str):
    # Pass through unhandled /api calls so they 404 cleanly
    if path.startswith("api/") or path == "api":
        return jsonify({"error": "API route not found"}), 404

    # Serve static file if it exists in dist/ (e.g. assets, manifest, icons, sw.js)
    file_path = os.path.join(DIST_DIR, path)
    if path and os.path.isfile(file_path):
        return send_from_directory(DIST_DIR, path)

    # Otherwise serve index.html for client-side React Router (e.g. /games, /caregiver)
    index_file = os.path.join(DIST_DIR, "index.html")
    if os.path.isfile(index_file):
        return send_from_directory(DIST_DIR, "index.html")

    return (
        "<h3>COGNIVA Frontend not built yet.</h3><p>Please run <code>npm run build</code> first.</p>",
        200,
        {"Content-Type": "text/html"},
    )


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    init_db()
    print("=" * 60, flush=True)
    print("  COGNIVA Unified App running on http://127.0.0.1:5000", flush=True)
    print("  Single HTTP Service: Frontend + Backend + MIRA API", flush=True)
    print("  Open in browser: http://localhost:5000", flush=True)
    print("=" * 60, flush=True)
    app.run(host="0.0.0.0", port=5000, debug=False, use_reloader=False)

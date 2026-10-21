import os
import sys

# Ensure root directory is on Python module search path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

# Import Flask app instance from backend.app
from backend.app import app

# Vercel Serverless Function entry point
# Vercel WSGI automatically recognizes `app`
if __name__ == "__main__":
    app.run(port=5000)

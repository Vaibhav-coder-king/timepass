# COGNIVA Production Deployment Guide

---

## 1. System Requirements

### Frontend (Client)
- Any modern mobile or desktop web browser supporting ES2020 and Service Workers (Chrome 90+, Edge 90+, Safari 15+, Firefox 90+).
- Installed as a PWA on Android (via "Add to Home screen" or Chrome install banner).

### Backend (Server)
- Python 3.10 or higher.
- Linux (Ubuntu 22.04 LTS recommended) or Windows Server.
- Minimum 1 vCPU, 1GB RAM, 10GB persistent SSD storage.

---

## 2. Local Development Setup

```powershell
# 1. Clone repository
git clone <repo_url>
cd AI-Based-Cognitive-Gaming-and-Memory-Assistance-Platform-for-Elderly-Dementia-Patients-in-NER

# 2. Setup and run Python Backend
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python migrate_rbac.py    # Seed test users and initial dataset
python app.py             # Starts Flask on http://127.0.0.1:5000

# 3. Setup and run Frontend (in a separate terminal)
cd ..
npm install
npm run dev               # Starts Vite dev server on http://localhost:5173
```

---

## 3. Production Deployment

### 3.1 Frontend Build
```powershell
npm run build
```
Deploy the output files in `dist/` to any static hosting provider (e.g., Cloudflare Pages, AWS S3 + CloudFront, Vercel, or NGINX).

### 3.2 Production NGINX Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name cogniva.health.gov.in;

    ssl_certificate /etc/letsencrypt/live/cogniva.health.gov.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cogniva.health.gov.in/privkey.pem;

    # Frontend PWA static assets
    location / {
        root /var/www/cogniva/dist;
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Backend API reverse proxy
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3.3 Backend Production Service (Gunicorn + Systemd)
Create `/etc/systemd/system/cogniva.service`:
```ini
[Unit]
Description=COGNIVA Flask Backend
After=network.target

[Service]
User=cogniva
WorkingDirectory=/opt/cogniva/backend
ExecStart=/opt/cogniva/backend/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

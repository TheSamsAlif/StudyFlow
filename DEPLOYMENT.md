# StudyFlow Pro - Deployment Guide

**Author:** SAMS ALIF
**Last Updated:** May 2026

---

## 🚀 Option 1: One-Click Deploy on Emergent (Recommended)

This is the easiest way to publish your app live with a public URL.

### Steps:
1. **Save current state** — Click "Save to GitHub" in Emergent chat input (creates a backup repo).
2. **Open Deploy panel** — In Emergent UI, click the **🚀 Deploy** button (top right).
3. **Choose deployment type**:
   - **Native (recommended)** — Emergent hosts everything (frontend + backend + MongoDB)
   - Vercel — only frontend (you'll need separate backend)
   - Railway — full-stack on Railway
4. **Configure**:
   - Pick a subdomain (e.g., `studyflow-alif.emergent.app`)
   - Verify env variables are set:
     - `EMERGENT_LLM_KEY` ✓ (auto-injected)
     - `JWT_SECRET` (change to a strong secret!)
     - `MONGO_URL`, `DB_NAME` (auto-managed by Emergent)
5. **Click Deploy** — Wait 2-3 minutes for build.
6. **Done!** — Share the public URL.

### Custom Domain (optional):
- After deploy, go to deployment Settings → Custom Domain
- Add your CNAME record pointing to Emergent's load balancer
- SSL is handled automatically (Let's Encrypt)

---

## 🌍 Option 2: Self-Host (VPS / DigitalOcean / AWS)

### Prerequisites:
- A Linux server (Ubuntu 22.04+ recommended)
- Domain name pointing to server IP
- Node 20+, Python 3.11+, MongoDB 7+

### Steps:

**1. Server setup**
```bash
sudo apt update && sudo apt install -y nginx mongodb python3.11-venv nodejs npm
sudo npm install -g yarn pm2
```

**2. Clone repo**
```bash
git clone <your-repo-url> /opt/studyflow
cd /opt/studyflow
```

**3. Backend**
```bash
cd backend
python3.11 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Copy .env and update production values
nano .env  # Update JWT_SECRET, MONGO_URL etc.

# Run with pm2
pm2 start "uvicorn server:app --host 0.0.0.0 --port 8001 --workers 2" --name studyflow-backend
```

**4. Frontend**
```bash
cd ../frontend
yarn install
yarn build  # Creates production build in build/

# Serve via nginx (see config below)
```

**5. Nginx config** (`/etc/nginx/sites-available/studyflow`)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /opt/studyflow/frontend/build;
        try_files $uri /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**6. SSL** (free with Certbot)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

**7. Auto-restart** — Save pm2 process list:
```bash
pm2 save && pm2 startup
```

---

## 🌐 Option 3: Vercel (Frontend) + Railway (Backend)

Use this if you prefer managed cloud platforms.

### Frontend on Vercel:
1. Push code to GitHub
2. Import repo at https://vercel.com/new
3. Set Root Directory: `frontend`
4. Add env: `REACT_APP_BACKEND_URL=https://your-backend.railway.app`
5. Deploy

### Backend on Railway:
1. New project → Deploy from GitHub
2. Set Root Directory: `backend`
3. Add env vars (MONGO_URL, EMERGENT_LLM_KEY, JWT_SECRET)
4. Add MongoDB service (or use MongoDB Atlas)
5. Deploy → copy public URL → update Vercel env

### Custom domain → Vercel handles SSL automatically.

---

## 🔒 Production Checklist

Before going live:
- [ ] Change `JWT_SECRET` to a random 32+ character string
- [ ] Change default admin password (login as admin → Settings → Change Password)
- [ ] Use MongoDB Atlas or managed Mongo (not local) for cloud deploys
- [ ] Restrict CORS in `server.py` to your actual domain (not `*`)
- [ ] Enable browser notifications permission (Settings page)
- [ ] Test all features end-to-end on the deployed URL
- [ ] Set up backup for MongoDB
- [ ] (Optional) Add rate limiting (e.g., `slowapi`)

---

## 📞 Quick Help

| Platform | Cost | Difficulty | Best For |
|----------|------|-----------|----------|
| Emergent Native | Subscription | ⭐ Easy | Recommended |
| VPS Self-host | $5-10/mo | ⭐⭐⭐ Hard | Full control |
| Vercel + Railway | Free tier | ⭐⭐ Medium | Hobby projects |
| AWS/GCP | Variable | ⭐⭐⭐⭐ Expert | Scale |

---

**Built with ❤️ by SAMS ALIF**

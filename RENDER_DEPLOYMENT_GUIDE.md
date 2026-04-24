# 🚀 Render Deployment Guide — ElasticityAI Backend

---

## ✅ PRE-CHECK: Push Latest Code to GitHub First

Before anything on Render, run this in your terminal:
```bash
git add .
git commit -m "fix: update requirements.txt for Render deployment"
git push origin main
```

---

## STEP 1 — Create a Free PostgreSQL Database on Render

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Click **"New +"** → select **"PostgreSQL"**
3. Fill in:
   - **Name**: `bikedb`
   - **Database**: `bikedb`
   - **User**: `bikeuser`
   - **Region**: `Oregon (US West)` *(same as your web service)*
   - **Plan**: `Free`
4. Click **"Create Database"**
5. Wait ~1 minute for it to provision
6. Once created, click on `bikedb` and scroll down to find:
   - **"Internal Database URL"** → copy this *(used inside Render network)*
   - It looks like: `postgresql://bikeuser:xxxxx@dpg-xxxxx/bikedb`

> ⚠️ **IMPORTANT**: You must change `postgresql://` → `postgresql+asyncpg://` when you use this URL

---

## STEP 2 — Create the Web Service

1. Click **"New +"** → select **"Web Service"**
2. Connect your GitHub repo: `praveen-86176/Bike-Demand-Elasticity-Modeling-`
3. Fill in these settings EXACTLY:

| Field | Value |
|---|---|
| **Name** | `elasticityai-backend` |
| **Language** | `Python 3` |
| **Branch** | `main` |
| **Root Directory** | *(leave completely empty)* |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn backend.main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | `Free` |

---

## STEP 3 — Add Environment Variables

Click **"Advanced"** → then **"Add Environment Variable"** and add these one by one:

| Key | Value |
|---|---|
| `DATABASE_URL` | `postgresql+asyncpg://bikeuser:xxxxx@dpg-xxxxx/bikedb` *(your Internal DB URL with asyncpg)* |
| `SECRET_KEY` | `eb6d17f66f7e1350db12f58bd6e8fc872b15367cd20086e2b62b0f29b4d12997` |
| `ALGORITHM` | `HS256` |
| `MODEL_DIR` | `./models` |
| `PYTHON_VERSION` | `3.11.0` |

> 💡 **Tip**: For DATABASE_URL — take the Internal Database URL from Step 1 and replace `postgresql://` with `postgresql+asyncpg://`
> 
> **Example**:
> - ❌ Before: `postgresql://bikeuser:abc123@dpg-xyz/bikedb`
> - ✅ After:  `postgresql+asyncpg://bikeuser:abc123@dpg-xyz/bikedb`

---

## STEP 4 — Deploy

1. Click **"Create Web Service"** at the bottom
2. Render will start building — this takes **3–5 minutes** on the first deploy
3. Watch the logs — you should see:
   ```
   INFO:     Application startup complete.
   INFO:     Uvicorn running on http://0.0.0.0:10000
   ```

---

## STEP 5 — Verify It's Working

Once deployed, Render gives you a URL like:
`https://elasticityai-backend.onrender.com`

Test these URLs in your browser:
- ✅ `https://elasticityai-backend.onrender.com/health` → should return `{"status":"ok"}`
- ✅ `https://elasticityai-backend.onrender.com/docs` → Swagger UI

---

## STEP 6 — Update Netlify Frontend

Once you have the Render URL, open `frontend/public/_redirects` and update:

```
# API Proxy — point to your Render backend
/api/*  https://elasticityai-backend.onrender.com/api/:splat  200

# SPA Routing (Fixes 404 on refresh)
/*      /index.html  200
```

Then commit and push to trigger a Netlify redeploy.

---

## 🔴 Common Errors & Fixes

| Error | Fix |
|---|---|
| `ModuleNotFoundError: No module named 'backend'` | Root Directory must be **empty** (not `backend/`) |
| `connection refused` on DB | Make sure DATABASE_URL uses `postgresql+asyncpg://` not `postgresql://` |
| `Address already in use` | The Start Command must use `$PORT` not a hardcoded port |
| Build fails on `psycopg2` | It's included in requirements.txt as `psycopg2-binary` ✅ |
| App sleeps after 15 min (Free tier) | Normal on free plan — first request after sleep takes ~30 seconds |

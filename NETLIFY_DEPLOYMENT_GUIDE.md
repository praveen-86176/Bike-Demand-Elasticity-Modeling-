# 🚀 Netlify Deployment Guide: ElasticityAI Frontend

This guide explains how to deploy the **ElasticityAI Frontend** to Netlify while securely connecting to your **AWS Backend** over HTTP using a proxy.

---

## 🏗️ 1. Why use a Proxy?
Netlify serves your site over **HTTPS**. Since your AWS Backend is currently on **HTTP**, browsers would block any API calls (Mixed Content Error). 

The proxy we configured in `frontend/public/_redirects` routes your requests through Netlify's servers, which can talk to your HTTP backend and send the data back to your secure frontend.

---

## 🛠️ 2. Deployment Steps

1.  **Push Changes to GitHub**:
    Ensure the `_redirects` file and the updated `api.js` are in your repo:
    ```bash
    git add .
    git commit -m "feat: configure netlify proxy for aws backend"
    git push origin main
    ```

2.  **Connect to Netlify**:
    *   Login to [Netlify](https://app.netlify.com/).
    *   Click **Add new site** > **Import an existing project**.
    *   Choose **GitHub** and authorize.
    *   Select your `Bike-Demand-Elasticity-Modeling-` repository.

3.  **Configure Build Settings**:
    Netlify should auto-detect most of this, but ensure these values are set:
    *   **Base directory**: `frontend`
    *   **Build command**: `npm run build`
    *   **Publish directory**: `frontend/build`

4.  **Deploy**:
    Click **Deploy site**. Netlify will build your React app and host it.

---

## ✅ 3. Verification

Once the deploy finishes:
1.  Open your Netlify URL (e.g., `https://elasticity-ai.netlify.app`).
2.  Try to **Login** or **Predict**.
3.  Even though your browser shows a padlock (HTTPS), it will successfully communicate with your AWS server at `http://3.27.111.205:8000` thanks to the proxy.

---

### 💡 Troubleshooting
*   **404 on API calls**: Ensure the `_redirects` file is in the `frontend/public/` folder.
*   **CORS errors**: If you see CORS errors, ensure your AWS backend `main.py` allows your new Netlify URL in the `allow_origins` list.
*   **Build Failures**: Ensure you selected the `frontend` folder as the **Base directory** in Netlify settings.

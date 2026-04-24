# 🚀 AWS Deployment Guide: ElasticityAI (Barebone EC2)

This guide walks you through deploying **ElasticityAI** on an **AWS EC2 (Free Tier)** instance using Ubuntu, without Docker.

---

## 🏗️ 1. AWS EC2 Instance Setup

1.  **Launch Instance**: Go to AWS Console > EC2 > Launch Instance.
2.  **Name**: `ElasticityAI-Server`
3.  **OS**: `Ubuntu 24.04 LTS` (64-bit x86).
4.  **Instance Type**: `t2.micro` or `t3.micro` (Free Tier Eligible).
5.  **Key Pair**: Create or select an existing `.pem` key.
6.  **Security Group**:
    *   Allow **SSH** (22) from your IP.
    *   Allow **HTTP** (80) from anywhere.
    *   Allow **HTTPS** (443) from anywhere.
    *   Allow **Custom TCP** (8001) from anywhere (for the Backend API).

---

## 🛠️ 2. Server Preparation

Connect to your instance via SSH:
```bash
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip
```

Update system packages:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv nginx git postgresql postgresql-contrib
```

---

## 💾 3. PostgreSQL Database Setup

1.  **Switch to postgres user**:
    ```bash
    sudo -u postgres psql
    ```
2.  **Create Database & User**:
    ```sql
    CREATE USER bikeuser WITH PASSWORD 'bike1234';
    CREATE DATABASE bikedb OWNER bikeuser;
    GRANT ALL PRIVILEGES ON DATABASE bikedb TO bikeuser;
    \q
    ```

---

## 🧠 4. Backend Deployment (FastAPI)

1.  **Clone the Repo**:
    ```bash
    git clone https://github.com/praveen-86176/Bike-Demand-Elasticity-Modeling-.git
    cd Bike-Demand-Elasticity-Modeling-
    ```

2.  **Setup Virtual Environment**:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    pip install gunicorn uvicorn
    ```

3.  **Configure Environment Variables**:
    Create a `.env` file in the root directory:
    ```bash
    nano .env
    ```
    Paste the following (adjust if needed):
    ```properties
    DATABASE_URL=postgresql+asyncpg://bikeuser:bike1234@localhost:5432/bikedb
    SECRET_KEY=your_super_secret_key_here
    ALGORITHM=HS256
    ACCESS_TOKEN_EXPIRE_MINUTES=1440
    ```

4.  **Create Systemd Service**:
    This ensures the backend restarts automatically if the server reboots.
    ```bash
    sudo nano /etc/systemd/system/elasticity-api.service
    ```
    Paste this:
    ```ini
    [Unit]
    Description=Gunicorn instance to serve ElasticityAI API
    After=network.target

    [Service]
    User=ubuntu
    Group=www-data
    WorkingDirectory=/home/ubuntu/Bike-Demand-Elasticity-Modeling-
    Environment="PATH=/home/ubuntu/Bike-Demand-Elasticity-Modeling-/venv/bin"
    ExecStart=/home/ubuntu/Bike-Demand-Elasticity-Modeling-/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app --bind 0.0.0.0:8001

    [Install]
    WantedBy=multi-user.target
    ```

5.  **Start the API**:
    ```bash
    sudo systemctl start elasticity-api
    sudo systemctl enable elasticity-api
    ```

---

## 🎨 5. Frontend Deployment (React)

1.  **Install Node.js**:
    ```bash
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    ```

2.  **Configure API URL**:
    Edit `frontend/src/api.js` to point to your EC2 Public IP:
    ```bash
    nano frontend/src/api.js
    ```
    Update the `BASE_URL`:
    ```javascript
    const BASE_URL = "http://YOUR_EC2_PUBLIC_IP:8001";
    ```

3.  **Build the Project**:
    ```bash
    cd frontend
    npm install
    npm run build
    ```

4.  **Configure Nginx**:
    ```bash
    sudo nano /etc/nginx/sites-available/elasticity-ai
    ```
    Paste this (replace `YOUR_EC2_PUBLIC_IP`):
    ```nginx
    server {
        listen 80;
        server_name YOUR_EC2_PUBLIC_IP;

        location / {
            root /home/ubuntu/Bike-Demand-Elasticity-Modeling-/frontend/build;
            index index.html;
            try_files $uri /index.html;
        }

        # Proxy API requests to backend
        location /api/ {
            proxy_pass http://localhost:8001/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
    ```

5.  **Enable & Restart Nginx**:
    ```bash
    sudo ln -s /etc/nginx/sites-available/elasticity-ai /etc/nginx/sites-enabled
    sudo nginx -t
    sudo systemctl restart nginx
    ```

---

## ✅ 6. Final Verification

1.  Open your browser and go to `http://YOUR_EC2_PUBLIC_IP`.
2.  Your landing page should appear.
3.  Test the **Sign Up** and **Predict** features to ensure communication with the backend (port 8001) and DB is working.

### 💡 Maintenance Commands
*   **Check API Logs**: `sudo journalctl -u elasticity-api -f`
*   **Restart API**: `sudo systemctl restart elasticity-api`
*   **Check Nginx Logs**: `sudo tail -f /var/log/nginx/error.log`

---

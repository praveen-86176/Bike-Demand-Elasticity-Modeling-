# 🚀 AWS Deployment Guide: ElasticityAI Backend ONLY

This guide walks you through deploying the **ElasticityAI Backend API** on an **AWS EC2 (Free Tier)** instance using Ubuntu.

---

## 🏗️ 1. AWS EC2 Instance Setup

1.  **Launch Instance**: Go to AWS Console > EC2 > Launch Instance.
2.  **Name**: `ElasticityAI-API-Server`
3.  **OS**: `Ubuntu 24.04 LTS`.
4.  **Instance Type**: `t2.micro` or `t3.micro`.
5.  **Security Group**:
    *   Allow **SSH** (22) from your IP.
    *   Allow **Custom TCP** (8001) from anywhere (This is where your API will live).

---

## 🛠️ 2. Server Preparation

Connect to your instance:
```bash
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip
```

Install requirements:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv git postgresql postgresql-contrib
```

---

## 💾 3. PostgreSQL Database Setup

```bash
sudo -u postgres psql
```
In the SQL prompt:
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
    Create a `.env` file in the root:
    ```bash
    nano .env
    ```
    Paste the following (replace the secret key with your own):
    ```properties
    DATABASE_URL=postgresql+asyncpg://bikeuser:bike1234@localhost:5432/bikedb
    SECRET_KEY=eb6d17f66f7e1350db12f58bd6e8fc872b15367cd20086e2b62b0f29b4d12997
    ALGORITHM=HS256
    ACCESS_TOKEN_EXPIRE_MINUTES=1440
    MODEL_DIR=./models
    ```

4.  **Create Systemd Service**:
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

## 🔗 5. Connecting your Frontend

Since your frontend is staying local or elsewhere, you just need to point it to the AWS IP.

1.  Open `frontend/src/api.js` on your computer.
2.  Update the `BASE_URL`:
    ```javascript
    const BASE_URL = "http://YOUR_AWS_EC2_PUBLIC_IP:8001";
    ```
3.  Restart your local React app (`npm start`).

---

## ✅ 6. Final Verification

Test your API by visiting:
👉 `http://YOUR_EC2_PUBLIC_IP:8001/health`

You should see: `{"status": "ok", "version": "1.0.0"}`.

### 💡 Troubleshooting
*   **Check logs**: `sudo journalctl -u elasticity-api -f`
*   **Restart**: `sudo systemctl restart elasticity-api`
*   **Firewall**: Ensure port **8001** is open in your AWS Security Group.

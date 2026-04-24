# 🚲 ElasticityAI: Bike Demand Forecasting

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat&logo=postgresql)](https://www.postgresql.org/)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-F7931E?style=flat&logo=scikit-learn)](https://scikit-learn.org/)

**ElasticityAI** is a premium, full-stack machine learning platform designed to model and predict bike-sharing demand elasticity. It combines a robust **Random Forest** regression pipeline with a high-performance **FastAPI** backend and a stunning **React** dashboard featuring glassmorphism design and real-time analytics.

---

## 🚀 Key Features

*   **End-to-End ML Pipeline**: Seamless integration of data cleaning, pipeline-based feature engineering (OneHotEncoding + StandardScaler), training, and evaluation.
*   **Dynamic Feature Selection**: Automatically filters user-selected features against uploaded datasets (`hour.csv` vs `day.csv`) to ensure zero-crash training.
*   **Premium Dashboard**: Modern React interface with glassmorphism effects, smooth animations, and a responsive sidebar.
*   **Real-time Analytics**: Interactive visualizations for seasonal demand trends, weather impact analysis, and model performance metrics.
*   **Persistent Model Management**: Automatically logs training metrics (RMSE, MAE, R²) and serializes model artifacts to disk.
*   **Demand Forecasting**: Instant hourly or daily predictions based on weather conditions and calendar features.

---

## 🏗️ Project Architecture

```mermaid
graph TD
    subgraph Frontend["🎨 Frontend (React 19)"]
        LP["Landing Page"]
        AUTH["Auth (JWT)"]
        DASH["Dashboard"]
        DASH --> OV["Overview"]
        DASH --> PR["Predict"]
        DASH --> TR["Train"]
        DASH --> HI["History"]
        DASH --> AN["Analytics"]
    end

    subgraph Backend["⚡ Backend (FastAPI)"]
        API["API Router"]
        API --> A1["POST /auth/register"]
        API --> A2["POST /auth/login"]
        API --> A3["POST /train"]
        API --> A4["POST /predict"]
        API --> A5["GET /runs"]
    end

    subgraph ML_Pipeline["🧠 ML Pipeline (Scikit-Learn)"]
        PRE["Preprocessor<br/>(ColumnTransformer)"]
        RF["Random Forest<br/>Regressor"]
        EV["Evaluator<br/>(RMSE, MAE, R²)"]
    end

    subgraph Storage["💾 Storage Layer"]
        PG["PostgreSQL<br/>(Users, Runs, Preds)"]
        DISK["Disk Storage<br/>(models/*.pkl)"]
    end

    Frontend -->|"HTTP (JWT)"| Backend
    A3 --> ML_Pipeline
    ML_Pipeline --> Storage
    A4 --> DISK
    A5 --> PG
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19, React Router 7 | SPA with glassmorphism UI |
| **Styling** | Vanilla CSS3 | Custom design system with animations |
| **API** | FastAPI (Async) | High-concurrency REST endpoints |
| **Database** | PostgreSQL | Persistent metadata storage |
| **ML Engine** | Scikit-Learn, Pandas | Training & Preprocessing |
| **Auth** | JWT, Bcrypt | Secure user authentication |
| **ORM** | SQLAlchemy 2.0 (Async) | Asynchronous database interactions |

---

## 📁 Project Structure

```text
Bike-Demand-Elasticity-Modeling-/
├── backend/                # FastAPI Application
│   ├── db/                 # Database models & sessions
│   ├── ml/                 # ML pipeline (Preprocess, Train, Eval)
│   ├── routes/             # API endpoint handlers
│   └── main.py             # App entry point
├── frontend/               # React Application
│   ├── src/
│   │   ├── pages/          # Dashboard & Auth views
│   │   ├── api.js          # Centralized API client
│   │   └── index.css       # Premium Design System
├── data/                   # Dataset storage (hour.csv, day.csv)
├── models/                 # Serialized model artifacts (.pkl)
├── eda_plots/              # EDA visualization outputs
└── BikeRentalModel.ipynb   # Exploratory Data Analysis Notebook
```

---

## 🏁 Getting Started

### 1. Database Setup
Ensure PostgreSQL is running and create the database:
```sql
CREATE USER bikeuser WITH PASSWORD 'bike1234';
CREATE DATABASE bikedb OWNER bikeuser;
```

### 2. Backend Setup
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Configure backend/.env with your DATABASE_URL
python3 -m uvicorn backend.main:app --reload --port 8001
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

---

## 📡 API Endpoints

*   `POST /train`: Upload CSV and train a new model.
*   `POST /predict`: Generate demand forecast from features.
*   `GET /runs`: List all historical training runs and metrics.
*   `POST /auth/register`: Create a new user account.
*   `POST /auth/login`: Authenticate and receive JWT token.

---

## 📜 License
This project is licensed under the MIT License.

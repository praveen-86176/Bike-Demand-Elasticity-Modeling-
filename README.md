# Bike Demand Elasticity Modeling API 🚲

This project implements a complete, production-ready machine learning pipeline and REST API for predicting hourly bike rental demand. It trains a robust **Random Forest Regressor** on the open-source **UCI Bike Sharing Dataset** and wraps the inference pipeline within a highly concurrent **FastAPI** backend, automatically logging model metrics to an asynchronous **PostgreSQL** database.

## 🚀 Key Features

* **End-to-End ML Pipeline**: Seamless integration of data cleaning, pipeline-based feature engineering (OneHotEncoding + StandardScaler), training, and evaluation.
* **Feature Importance**: Calculates model-agnostic permutation importance on a 20% hold-out test set during training.
* **FastAPI Backend**: Extremely fast asynchronous web server exposing cleanly abstracted HTTP endpoints for training, prediction, and history lookup.
* **Persistent Training History**: Automatically writes regression metrics (RMSE, MAE, R²), serialised `.pkl` artifact paths, and feature permutations to an async PostgreSQL database (`bikedb`).
* **Pydantic Validation**: Strong compile-time API request/response typing and schema validation using Pydantic v2.

---

## 📁 Project Structure

```text
Bike-Demand-Elasticity-Modeling-/
├── README.md               # You are here
├── test_db.py              # Rapid asyncpg database connectivity tester
├── hour.csv                # UCI Bike Sharing hourly dataset
├── day.csv                 # UCI Bike Sharing daily dataset
├── requirements.txt        # High-level Python dependencies
├── backend/
│   ├── main.py             # FastAPI entry point & Uvicorn router registration
│   ├── schemas.py          # Pydantic v2 schemas for all API payloads
│   ├── .env                # Runtime environment variables (Git-ignored)
│   ├── .env.example        # Safe `.env` placeholder template
│   ├── db/
│   │   ├── database.py     # SQLAlchemy Async engine / session factory
│   │   └── models.py       # SQLAlchemy ORM schemas (`training_runs`, `predictions`)
│   ├── ml/
│   │   ├── preprocess.py   # Sklearn ColumnTransformer & Pandas data cleaners
│   │   ├── model.py        # Pipeline builder & joblib saver/loader
│   │   └── evaluate.py     # RMSE, MAE, R², and Permutation Importance logic
│   └── routes/
│       ├── train.py        # POST /train endpoint
│       ├── predict.py      # POST /predict endpoint
│       └── history.py      # GET /runs & GET /runs/{run_id} endpoints
```

---

## 🛠 Prerequisites & Installation

### 1. Database Setup (PostgreSQL)
Ensure you have PostgreSQL@15 installed (e.g. via Homebrew on macOS). Start the service and create the required user and database credentials:

```sql
CREATE USER bikeuser WITH PASSWORD 'bike1234';
CREATE DATABASE bikedb OWNER bikeuser;
GRANT ALL PRIVILEGES ON DATABASE bikedb TO bikeuser;
```

### 2. Environment Variables
Copy the `.env.example` placeholder inside the `backend/` directory to `.env`:
```bash
cp backend/.env.example backend/.env
```
Ensure that `backend/.env` maps exactly to the database credentials above:
```properties
DATABASE_URL=postgresql+asyncpg://bikeuser:bike1234@localhost:5432/bikedb
```

### 3. Virtual Environment & Dependencies
This project is built for **Python 3.13+**. Set up a clean virtual environment and install the dependencies:

```bash
python3.13 -m venv venv
source venv/bin/activate
pip install -r requirements.txt 
```
*(Or manually install the explicit dependencies shown in the `venv` context if a lockfile is missing).*

---

## 🏃 Running the API

Export your PostgreSQL path (if on macOS Homebrew) and start the Uvicorn ASGI server:

```bash
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
python3 -m uvicorn backend.main:app --reload --port 8000
```

The interactive **Swagger UI** will be available at:
👉 **http://127.0.0.1:8000/docs**

---

## 📡 API Endpoints 

### `POST /train`
Upload a raw CSV (e.g. `hour.csv`). The endpoint cleans the dataset, applies one-hot-encoding/scaling, fits a Random Forest, evaluates it on a 20% validation split, serialises the artifact to `models/`, and saves the run metadata to Postgres.
* **Input**: `multipart/form-data` file upload.
* **Output**: RMSE, MAE, R², and dict of feature importance.

### `POST /predict`
Submit weather conditions to execute inference against the newest saved `.pkl` model.
* **Input**: JSON payload containing `temp`, `atemp`, `hum`, `windspeed`, `holiday`, `season`, etc.
* **Output**: Predicted `int` hourly bike demand.

### `GET /runs`
Paginated view displaying historical training runs and their top-level metrics.
* **Output**: A lightweight JSON array mapping directly back to PostgreSQL `training_runs` records.

### `GET /runs/{run_id}`
Returns a deep dive into an explicit training run, containing specific UUIDs, the physical absolute `.pkl` disk path, and granular permutation importance data.

### `GET /health`
Liveness probe.

---

## 🔒 Notes on Artifact Storage
Trained `.pkl` outputs exceed **~115+ MB**! For this reason, the local pipeline saves artifacts straight into a dynamically generated `models/` directory.

> **Note**: `models/` is actively ignored heavily in `.gitignore` to prevent GitHub's 100MB blob-size blockers and Git-LFS headaches. Keep your `.pkl` artifacts local!

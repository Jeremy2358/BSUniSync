
from pathlib import Path

import joblib
import pandas as pd

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# ==========================================
# BSUniSync - STUDENT RISK PREDICTION API
# ==========================================

# Load model files from the backend directory
BASE_DIR = Path(__file__).resolve().parent

model = joblib.load(BASE_DIR / "bsunisync_student_risk_model.pkl")
features = joblib.load(BASE_DIR / "bsunisync_model_features.pkl")


app = FastAPI(
    title="BSUniSync Student Risk API",
    description="Student Academic Risk Prediction",
    version="1.1.0"
)


# Temporary CORS configuration for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# REQUEST MODELS
# ==========================================

class StudentData(BaseModel):
    Previous_GWA: float = Field(ge=1.0, le=5.0)
    Current_GWA: float = Field(ge=1.0, le=5.0)
    Attendance_Rate: float = Field(ge=0.0, le=100.0)
    Academic_Progress: float = Field(ge=0.0, le=100.0)
    Failed_Subjects: int = Field(ge=0)


class BatchPredictionRequest(BaseModel):
    students: list[StudentData]


# ==========================================
# PREDICTION HELPER
# ==========================================

def generate_prediction(student):
    student_input = pd.DataFrame(
        [[getattr(student, feature) for feature in features]],
        columns=features
    )

    prediction = model.predict(student_input)[0]

    probabilities = model.predict_proba(student_input)[0]

    risk_index = list(model.classes_).index("At Risk")

    risk_probability = float(probabilities[risk_index]) * 100

    return {
        "prediction": str(prediction),
        "at_risk_probability": round(risk_probability, 2)
    }


# ==========================================
# API ROUTES
# ==========================================

@app.get("/")
def home():
    return {
        "message": "BSUniSync Student Risk API is running",
        "model": "Decision Tree Classifier",
        "status": "online",
        "version": "1.1.0"
    }


@app.post("/predict")
def predict_student_risk(student: StudentData):

    result = generate_prediction(student)

    return {
        **result,
        "model": "Decision Tree Classifier",
        "disclaimer": (
            "This model uses synthetic training data. "
            "Predictions are for demonstration and decision support only."
        )
    }


@app.post("/predict-batch")
def predict_students_batch(request: BatchPredictionRequest):

    predictions = []

    for index, student in enumerate(request.students):
        result = generate_prediction(student)

        predictions.append({
            "index": index,
            **result
        })

    return {
        "total_students": len(predictions),
        "predictions": predictions,
        "model": "Decision Tree Classifier",
        "disclaimer": (
            "This model uses synthetic training data. "
            "Predictions are for demonstration and decision support only."
        )
    }

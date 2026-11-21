
from pathlib import Path

import joblib
import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# ==========================================
# BSUNISYNC - STUDENT RISK PREDICTION API
# ==========================================

API_VERSION = "1.3.0"

MODEL_NAME = "Decision Tree Classifier"

BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = BASE_DIR / "bsunisync_student_risk_model.pkl"

FEATURES_PATH = BASE_DIR / "bsunisync_model_features.pkl"

MAX_BATCH_SIZE = 1000

MODEL_DISCLAIMER = (
    "This model uses synthetic training data. "
    "Predictions are for demonstration and academic "
    "decision support only. Predictions must not replace "
    "faculty judgment or institutional academic review."
)


# ==========================================
# LOAD TRAINED MACHINE LEARNING MODEL
# ==========================================

if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"Trained model file not found: {MODEL_PATH}"
    )

if not FEATURES_PATH.exists():
    raise FileNotFoundError(
        f"Model features file not found: {FEATURES_PATH}"
    )


model = joblib.load(MODEL_PATH)

features = list(joblib.load(FEATURES_PATH))


# ==========================================
# VERIFY MODEL FEATURES
# ==========================================

required_features = [
    "Previous_GWA",
    "Current_GWA",
    "Attendance_Rate",
    "Academic_Progress",
    "Failed_Subjects"
]

if (
    set(features) != set(required_features)
    or len(features) != len(required_features)
):
    raise RuntimeError(
        "The saved model features do not match "
        "the required academic prediction inputs."
    )


# ==========================================
# VERIFY MODEL CLASSIFICATIONS
# ==========================================

model_classes = list(model.classes_)

if "At Risk" not in model_classes:
    raise RuntimeError(
        "The trained model does not contain "
        "the required 'At Risk' classification."
    )

risk_index = model_classes.index("At Risk")


# ==========================================
# FASTAPI APPLICATION
# ==========================================

app = FastAPI(
    title="BSUniSync Student Risk API",
    description=(
        "Machine learning API for student academic "
        "risk prediction and faculty decision support."
    ),
    version=API_VERSION
)


# ==========================================
# CORS CONFIGURATION
# ==========================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "https://jeremy2358.github.io",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],

    allow_credentials=False,

    allow_methods=[
        "GET",
        "POST"
    ],

    allow_headers=[
        "Content-Type",
        "Accept"
    ],
)


# ==========================================
# REQUEST MODELS
# ==========================================

class StudentData(BaseModel):

    Previous_GWA: float = Field(
        ge=1.0,
        le=5.0,
        description="Student's previous General Weighted Average"
    )

    Current_GWA: float = Field(
        ge=1.0,
        le=5.0,
        description="Student's current General Weighted Average"
    )

    Attendance_Rate: float = Field(
        ge=0.0,
        le=100.0,
        description="Student attendance percentage"
    )

    Academic_Progress: float = Field(
        ge=0.0,
        le=100.0,
        description="Student academic progress percentage"
    )

    Failed_Subjects: int = Field(
        ge=0,
        description="Total number of failed subjects"
    )


class BatchPredictionRequest(BaseModel):

    students: list[StudentData]


# ==========================================
# PREPARE MACHINE LEARNING INPUT
# ==========================================

def prepare_model_input(students: list[StudentData]):

    student_rows = [
        [
            getattr(student, feature)
            for feature in features
        ]
        for student in students
    ]

    student_input = pd.DataFrame(
        student_rows,
        columns=features
    )

    return student_input


# ==========================================
# NORMALIZE PREDICTION LABEL
# ==========================================

def normalize_prediction(prediction):

    normalized = (
        str(prediction)
        .strip()
        .lower()
        .replace("_", " ")
        .replace("-", " ")
    )

    if normalized in [
        "at risk",
        "risk",
        "high risk",
        "1",
        "true"
    ]:
        return "At Risk"

    if normalized in [
        "not at risk",
        "not risk",
        "safe",
        "low risk",
        "no risk",
        "0",
        "false"
    ]:
        return "Not At Risk"

    raise ValueError(
        f"Unsupported model classification: {prediction}"
    )


# ==========================================
# FORMAT PREDICTION RESULT
# ==========================================

def format_prediction_result(
    prediction,
    probability
):

    prediction_label = normalize_prediction(
        prediction
    )

    risk_probability = float(
        probability[risk_index]
    )

    if not 0.0 <= risk_probability <= 1.0:

        raise ValueError(
            "The model returned an invalid probability."
        )

    risk_percentage = round(
        risk_probability * 100,
        2
    )

    return {
        "prediction": prediction_label,

        # Probability scale: 0.0 to 1.0
        # The frontend converts this into a percentage.

        "at_risk_probability": risk_probability,

        # Percentage scale: 0.0 to 100.0

        "at_risk_probability_percent": risk_percentage
    }


# ==========================================
# BATCH PREDICTION HELPER
# ==========================================

def generate_batch_predictions(
    students: list[StudentData]
):

    if not students:

        raise HTTPException(
            status_code=400,
            detail="At least one student record is required."
        )

    if len(students) > MAX_BATCH_SIZE:

        raise HTTPException(
            status_code=400,
            detail=(
                f"A maximum of {MAX_BATCH_SIZE} "
                "students is allowed per request."
            )
        )

    try:

        student_input = prepare_model_input(
            students
        )

        predictions = model.predict(
            student_input
        )

        probabilities = model.predict_proba(
            student_input
        )

        results = []

        for index, prediction in enumerate(predictions):

            result = format_prediction_result(
                prediction,
                probabilities[index]
            )

            results.append({
                "index": index,
                **result
            })

        return results

    except Exception as error:

        print(
            "BSUniSync model prediction error:",
            str(error)
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "The machine learning model was unable "
                "to process the submitted academic information."
            )
        ) from error


# ==========================================
# INDIVIDUAL PREDICTION HELPER
# ==========================================

def generate_prediction(student: StudentData):

    results = generate_batch_predictions(
        [student]
    )

    result = results[0]

    return {
        "prediction": result["prediction"],

        "at_risk_probability":
            result["at_risk_probability"],

        "at_risk_probability_percent":
            result["at_risk_probability_percent"]
    }


# ==========================================
# HOME / API STATUS
# ==========================================

@app.get("/")
def home():

    return {
        "message": "BSUniSync Student Risk API is running",

        "model": MODEL_NAME,

        "status": "online",

        "version": API_VERSION,

        "training_data": "Synthetic demonstration data",

        "prediction_classes": [
            str(item)
            for item in model_classes
        ],

        "supported_endpoints": {
            "health": "/health",
            "individual_prediction": "/predict",
            "batch_prediction": "/predict-batch",
            "documentation": "/docs"
        }
    }


# ==========================================
# HEALTH CHECK ENDPOINT
# ==========================================

@app.get("/health")
def health_check():

    return {
        "status": "online",

        "model_loaded": True,

        "model": MODEL_NAME,

        "version": API_VERSION,

        "features": features,

        "maximum_batch_size": MAX_BATCH_SIZE
    }


# ==========================================
# INDIVIDUAL STUDENT PREDICTION
# ==========================================

@app.post("/predict")
def predict_student_risk(student: StudentData):

    result = generate_prediction(student)

    return {
        **result,

        "model": MODEL_NAME,

        "probability_scale": "0_to_1",

        "disclaimer": MODEL_DISCLAIMER
    }


# ==========================================
# BATCH STUDENT PREDICTION
# ==========================================

@app.post("/predict-batch")
def predict_students_batch(
    request: BatchPredictionRequest
):

    predictions = generate_batch_predictions(
        request.students
    )

    at_risk_count = sum(
        1
        for result in predictions
        if result["prediction"] == "At Risk"
    )

    not_at_risk_count = sum(
        1
        for result in predictions
        if result["prediction"] == "Not At Risk"
    )

    total_students = len(predictions)

    at_risk_percentage = (
        round(
            at_risk_count / total_students * 100,
            2
        )
        if total_students
        else 0.0
    )

    not_at_risk_percentage = (
        round(
            not_at_risk_count / total_students * 100,
            2
        )
        if total_students
        else 0.0
    )

    return {
        "total_students": total_students,

        "predictions": predictions,

        "summary": {
            "at_risk": at_risk_count,

            "not_at_risk": not_at_risk_count,

            "at_risk_percentage":
                at_risk_percentage,

            "not_at_risk_percentage":
                not_at_risk_percentage
        },

        "model": MODEL_NAME,

        "probability_scale": "0_to_1",

        "disclaimer": MODEL_DISCLAIMER
    }

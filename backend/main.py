from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, conint
import numpy as np
import joblib
import os

# ----- Request/Response models
class PredictRequest(BaseModel):
    use_case_name: str
    is_process_simple: conint(ge=0, le=1)
    can_specify_business_rules: conint(ge=0, le=1)
    will_occasional_errors_be_tolerated: conint(ge=0, le=1)
    will_error_be_propagated: conint(ge=0, le=1)
    is_use_case_transactional_in_nature: conint(ge=0, le=1)
    are_you_building_learning_system: conint(ge=0, le=1)
    high_stakes_environment: conint(ge=0, le=1)
    hyper_personalization: conint(ge=0, le=1)
    unstructured_text_input: conint(ge=0, le=1)
    is_input_data_multi_modal: conint(ge=0, le=1)
    language_generation: conint(ge=0, le=1)
    are_autonomous_decisions_required: conint(ge=0, le=1)
    is_reasoning_required: conint(ge=0, le=1)
    tool_integration: conint(ge=0, le=1)
    dynamic_goals: conint(ge=0, le=1)

class PredictResponse(BaseModel):
    label: str
    avg_confidence: float
    ucl: float
    lcl: float

# ----- App + CORS
app = FastAPI(title="Qualify Tool API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----- Label mapping
LABELS = ["Agentic AI", "Classical ML", "Gen AI", "Business Automation"]

def load_model():
    path = os.getenv("MODEL_PATH", "model/model.pkl")
    if os.path.exists(path):
        return joblib.load(path)
    return None

model = load_model()

def vectorize(req: PredictRequest) -> np.ndarray:
    return np.array([[
        req.is_process_simple,
        req.can_specify_business_rules,
        req.will_occasional_errors_be_tolerated,
        req.will_error_be_propagated,
        req.is_use_case_transactional_in_nature,
        req.are_you_building_learning_system,
        req.high_stakes_environment,
        req.hyper_personalization,
        req.unstructured_text_input,
        req.is_input_data_multi_modal,
        req.language_generation,
        req.are_autonomous_decisions_required,
        req.is_reasoning_required,
        req.tool_integration,
        req.dynamic_goals,
    ]], dtype=float)

def wilson_interval(p: float, n: int = 100, z: float = 1.96):
    # 95% Wilson score interval (placeholder until your model provides its own CI)
    denom = 1 + z**2 / n
    center = (p + z**2/(2*n)) / denom
    half = (z * ((p*(1-p)/n + z**2/(4*n**2))**0.5)) / denom
    lcl = max(0.0, center - half)
    ucl = min(1.0, center + half)
    return lcl, ucl

@app.get("/")
def health():
    return {"ok": True}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    x = vectorize(req)

    if model is not None:
        if hasattr(model, "predict_proba"):
            proba = model.predict_proba(x)[0]
            pred_idx = int(np.argmax(proba))
            p = float(proba[pred_idx])
        else:
            pred_idx = int(model.predict(x)[0])
            p = 0.75  # fallback if no probabilities
    else:
        # Heuristic fallback so you can test without a model.pkl
        agentic_score = sum([
            int(req.are_autonomous_decisions_required),
            int(req.is_reasoning_required),
            int(req.tool_integration),
            int(req.dynamic_goals),
        ])
        if req.language_generation:
            pred_idx = 2  # Gen AI
        elif agentic_score >= 3:
            pred_idx = 0  # Agentic AI
        elif req.can_specify_business_rules and not req.are_you_building_learning_system:
            pred_idx = 3  # Business Automation
        else:
            pred_idx = 1  # Classical ML
        p = 0.70

    lcl, ucl = wilson_interval(p)
    return PredictResponse(label=LABELS[pred_idx], avg_confidence=p, ucl=ucl, lcl=lcl)

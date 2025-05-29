import os
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from fastapi.middleware.cors import CORSMiddleware
import httpx
from dotenv import dotenv_values # Import dotenv_values

# Define paths for models and data
MODELS_DIR = 'backend/models'
DATA_DIR = 'backend/data'
PREDICTION_LOG_FILE = os.path.join(DATA_DIR, 'user_predictions_log.csv')

# Load environment variables from .env file
config = dotenv_values(".env") # Load variables from .env
OPENROUTER_API_KEY = config.get("OPENROUTER_API_KEY") # Get the API key

# Load the trained model, scaler, and feature names
try:
    model = joblib.load(os.path.join(MODELS_DIR, 'parkinsons_predictor.pkl'))
    scaler = joblib.load(os.path.join(MODELS_DIR, 'scaler.pkl'))
    feature_names = joblib.load(os.path.join(MODELS_DIR, 'feature_names.pkl'))
    print("ML Model, scaler, and feature names loaded successfully.")
except FileNotFoundError as e:
    print(f"Error loading model components: {e}")
    print("Please ensure 'parkinsons_predictor.pkl', 'scaler.pkl', and 'feature_names.pkl' are in the 'backend/models/' directory.")
    print("Run ml_model.py first to train and save the model.")
    model = None
    scaler = None
    feature_names = []
except Exception as e:
    print(f"An unexpected error occurred while loading model components: {e}")
    model = None
    scaler = None
    feature_names = []

# Initialize FastAPI app
app = FastAPI()

# Configure CORS (Cross-Origin Resource Sharing)
origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:5500",
    "http://127.0.0.1",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:5500",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models for Request Validation ---
class PredictionInput(BaseModel):
    features: Dict[str, float]

class ChatMessage(BaseModel):
    message: str
    history: List[Dict[str, str]] = []

# --- Helper function for logging predictions ---
def log_prediction(input_data: Dict[str, float], prediction_result: int, probability: float):
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)

    log_df = pd.DataFrame([input_data])
    log_df['prediction'] = prediction_result
    log_df['probability'] = probability
    
    ordered_cols = feature_names + ['prediction', 'probability']
    log_df = log_df[ordered_cols]

    if not os.path.exists(PREDICTION_LOG_FILE):
        log_df.to_csv(PREDICTION_LOG_FILE, index=False)
    else:
        log_df.to_csv(PREDICTION_LOG_FILE, mode='a', header=False, index=False)
    print(f"Prediction logged to {PREDICTION_LOG_FILE}")

# --- API Endpoints ---

@app.get("/")
async def read_root():
    return {"message": "Parkinson's Prediction Chatbot Backend is running!"}

@app.post("/predict")
async def predict_parkinsons(input_data: PredictionInput):
    if model is None or scaler is None or not feature_names:
        raise HTTPException(status_code=500, detail="ML model not loaded. Please run ml_model.py first.")

    try:
        input_df = pd.DataFrame([input_data.features])
        input_ordered = input_df[feature_names]
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing or incorrect feature in input: {e}. Expected features: {feature_names}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid input data format: {e}")

    scaled_features = scaler.transform(input_ordered)

    prediction = model.predict(scaled_features)[0]
    prediction_proba = model.predict_proba(scaled_features)[:, 1][0]

    log_prediction(input_data.features, int(prediction), float(prediction_proba))

    return {
        "prediction": int(prediction),
        "probability": float(prediction_proba),
        "message": "Prediction made successfully."
    }

@app.post("/chat")
async def chat_with_llm(chat_message: ChatMessage):
    # Check if API key is loaded
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY is not set in .env file.")

    OPENROUTER_API_BASE = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL = "mistralai/mistral-7b-instruct:free"

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    # messages = [
    #     {"role": "system", "content": """You are a helpful AI assistant focused on providing information about Parkinson's Disease symptoms.
    #     You should ask clarifying questions about symptoms, but **never diagnose** Parkinson's disease.
    #     Always include a disclaimer that this is for informational purposes only and users should consult a healthcare professional for diagnosis.
    #     For accurate prediction, gently guide the user to the "Accurate Prediction" section where they can input numerical voice features."""},
    # ]
    messages = [
    {"role": "system", "content": """You are a helpful and specialized AI assistant strictly focused on providing information about Parkinson's Disease symptoms, related facts, and common questions.
    Your purpose is to assist users specifically on the topic of Parkinson's Disease.
    If a user asks a question about a topic unrelated to Parkinson's Disease or another medical condition/disease, you must politely decline to answer, state that your expertise is limited to Parkinson's Disease, and gently guide them back to the relevant topic.
    When providing lists of symptoms or other structured information, please use Markdown for formatting (e.g., bullet points, bold text).
    You should ask clarifying questions about Parkinson's symptoms, but **never diagnose** Parkinson's disease.
    Always include a disclaimer that this is for informational purposes only and users should consult a healthcare professional for diagnosis.
    For accurate prediction, gently guide the user to the "Accurate Prediction" section where they can input numerical voice features."""},
]

    for msg in chat_message.history:
        messages.append(msg)

    messages.append({"role": "user", "content": chat_message.message})

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": messages,
        "max_tokens": 500,
        "temperature": 0.7
    }

    print(f"Sending request to OpenRouter with model: {OPENROUTER_MODEL}")
    async with httpx.AsyncClient(base_url=OPENROUTER_API_BASE, headers=headers) as client:
        try:
            response = await client.post("/chat/completions", json=payload, timeout=30.0)
            response.raise_for_status()
            llm_response = response.json()
            
            chat_response_content = llm_response['choices'][0]['message']['content']
            print(f"Received LLM response: {chat_response_content[:100]}...")
            
            return {"response": chat_response_content}
        except httpx.RequestError as e:
            print(f"HTTPX Request Error: {e}")
            raise HTTPException(status_code=500, detail=f"Could not connect to OpenRouter API: {e}")
        except httpx.HTTPStatusError as e:
            print(f"HTTP Status Error: {e.response.status_code} - {e.response.text}")
            raise HTTPException(status_code=e.response.status_code, detail=f"OpenRouter API error: {e.response.text}")
        except KeyError as e:
            print(f"KeyError in LLM response parsing: {e} - Response: {llm_response}")
            raise HTTPException(status_code=500, detail=f"Unexpected response format from OpenRouter API: {e}")
        except Exception as e:
            print(f"An unexpected error occurred during LLM interaction: {e}")
            raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")
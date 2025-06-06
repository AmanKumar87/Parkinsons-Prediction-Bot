import os
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict
from fastapi.middleware.cors import CORSMiddleware
import httpx
from dotenv import dotenv_values
import parselmouth
import numpy as np
import io
import tempfile
from pydub import AudioSegment
# Corrected import for setting ffmpeg path


# Define paths for models and data
MODELS_DIR = 'backend/models'
DATA_DIR = 'backend/data'
PREDICTION_LOG_FILE = os.path.join(DATA_DIR, 'user_predictions_log.csv')

# Load environment variables from .env file
config = dotenv_values(".env")
OPENROUTER_API_KEY = config.get("OPENROUTER_API_KEY")
print(f"Loaded OPENROUTER_API_KEY: {'*' * len(OPENROUTER_API_KEY) if OPENROUTER_API_KEY else 'NOT_LOADED'}")

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

# --- IMPORTANT: CONFIGURE FFMPEG PATH FOR PYDUB HERE ---
# REPLACE THE PATHS BELOW WITH THE ACTUAL, FULL PATH TO YOUR ffmpeg.exe and ffprobe.exe
# Example: r"C:\path\to\your\ffmpeg-build\bin\ffmpeg.exe"
#          r"C:\path\to\your\ffmpeg-build\bin\ffprobe.exe"
# Make sure to use 'r' prefix for raw strings to handle backslashes
# pydub.ffmpeg.set_path(r"C:\ffmpeg\ffmpeg-2025-06-02-git-688f3944ce-full_build-www.gyan.dev\bin\ffmpeg.exe") # <<< YOUR ffmpeg.exe PATH
# pydub.ffmpeg.set_ffprobe_path(r"C:\ffmpeg\ffmpeg-2025-06-02-git-688f3944ce-full_build-www.gyan.dev\bin\ffprobe.exe") # <<< YOUR ffprobe.exe PATH


# Configure CORS (Cross-Origin Resource Sharing)
origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:5500",
    "http://127.0.0.1",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:5500", # <--- ADD THIS LINE
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Ensure all methods are allowed for now
    allow_headers=["*"], # Ensure all headers are allowed for now
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

# --- Feature Extraction Function using Parselmouth ---
# ... (rest of your imports and initial code) ...

# --- Feature Extraction Function using Parselmouth ---
# ... (rest of your imports and initial code, including the os.environ path setup) ...

# --- Feature Extraction Function using Parselmouth ---
# ... (imports and initial code including os.environ path setup) ...

# --- Feature Extraction Function using Parselmouth ---
# ... (imports and initial code) ...

# --- Feature Extraction Function using Parselmouth ---
# ... (imports and initial code) ...

# --- Feature Extraction Function using Parselmouth ---
# ... (imports and initial code including os.environ path setup) ...

# --- Feature Extraction Function using Parselmouth ---
# ... (imports and initial code) ...

# --- Feature Extraction Function using Parselmouth ---
# ... (imports and initial code) ...

# --- Feature Extraction Function using Parselmouth ---
# ... (imports and initial code) ...

# --- Feature Extraction Function using Parselmouth ---
# ... (imports and initial code) ...

# --- Feature Extraction Function using Parselmouth ---
# ... (imports and initial code) ...

# --- Feature Extraction Function using Parselmouth ---
def extract_vocal_features(audio_path: str) -> Dict[str, float]:
    """
    Extracts 22 vocal features from an audio file using Parselmouth.
    This function aims to replicate the features found in the Parkinson's dataset.
    """
    try:
        sound = parselmouth.Sound(audio_path)
    except Exception as e:
        print(f"Error loading sound file with parselmouth: {e}")
        raise ValueError(f"Could not load audio file: {e}. Ensure it's a valid, supported format.")

    # --- Initial check for silent audio ---
    if sound.get_rms() < 0.001:
        print(f"Warning: Audio RMS is {sound.get_rms()}. Too quiet or silent. Returning zero/placeholder values.")
        return {
            "MDVP:Fo(Hz)": 0.0, "MDVP:Fhi(Hz)": 0.0, "MDVP:Flo(Hz)": 0.0,
            "MDVP:Jitter(%)": 0.0, "MDVP:Jitter(Abs)": 0.0, "MDVP:RAP": 0.0, "MDVP:PPQ": 0.0, "Jitter:DDP": 0.0,
            "MDVP:Shimmer": 0.0, "MDVP:Shimmer(dB)": 0.0, "Shimmer:APQ3": 0.0, "Shimmer:APQ5": 0.0,
            "MDVP:APQ": 0.0, "Shimmer:DDA": 0.0, "NHR": 0.0, "HNR": 0.0,
            "RPDE": 0.0, "DFA": 0.0, "spread1": 0.0, "spread2": 0.0, "D2": 0.0, "PPE": 0.0
        }

    # Define the pitch range variables
    PITCH_FLOOR = 75.0
    PITCH_CEILING = 600.0

    # Initialize all dynamic features to 0.0 at the start of calculation block
    mdvp_fo, mdvp_fhi, mdvp_flo = 0.0, 0.0, 0.0
    jitter_local, jitter_abs, rap, ppq, ddp = 0.0, 0.0, 0.0, 0.0, 0.0
    shimmer_local, shimmer_dB, apq3, apq5, mdvp_apq, dda = 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
    hnr, nhr = 0.0, 0.0

    # --- Pitch Extraction (MDVP:Fo/Fhi/Flo) ---
    try:
        pitch = sound.to_pitch(time_step=0.01, pitch_floor=PITCH_FLOOR, pitch_ceiling=PITCH_CEILING)
        f0_values_raw = np.array(pitch.selected_array['frequency']).astype(float).flatten()
        f0_values = f0_values_raw[(np.abs(f0_values_raw) > 1e-9) & (~np.isnan(f0_values_raw))]
        
        mdvp_fo = np.mean(f0_values) if f0_values.size > 0 else 0.0
        mdvp_fhi = np.max(f0_values) if f0_values.size > 0 else 0.0
        mdvp_flo = np.min(f0_values) if f0_values.size > 0 else 0.0

        if np.isnan(mdvp_fo): mdvp_fo = 0.0
        if np.isnan(mdvp_fhi): mdvp_fhi = 0.0
        if np.isnan(mdvp_flo): mdvp_flo = 0.0

    except Exception as e:
        print(f"Warning: Error in pitch extraction (MDVP:Fo/Fhi/Flo): {e}. Setting to 0.0.")
        pass

    # --- Jitter, Shimmer, HNR/NHR Calculation ---
    if mdvp_fo > 0: # Only proceed if mean pitch was detected
        try:
            point_process = parselmouth.praat.call(sound, "To PointProcess (periodic, cc)", PITCH_FLOOR, PITCH_CEILING)
            
            start_time = 0.0
            end_time = sound.get_total_duration()

            # Jitter metrics (these seem to be working well)
            jitter_local = parselmouth.praat.call(point_process, "Get jitter (local)", start_time, end_time, 0.0001, 0.02, 1.3)
            jitter_abs = parselmouth.praat.call(point_process, "Get jitter (local, absolute)", start_time, end_time, 0.0001, 0.02, 1.3)
            rap = parselmouth.praat.call(point_process, "Get jitter (rap)", start_time, end_time, 0.0001, 0.02, 1.3)
            ppq = parselmouth.praat.call(point_process, "Get jitter (ppq5)", start_time, end_time, 0.0001, 0.02, 1.3)
            ddp = parselmouth.praat.call(point_process, "Get jitter (ddp)", start_time, end_time, 0.0001, 0.02, 1.3)

            # --- Shimmer metrics ---
            # These specific commands are repeatedly failing with "not available".
            # We will attempt them with standard parms. If they continue to fail,
            # the try-except will set them to 0 with a warning.
            try: shimmer_local = parselmouth.praat.call([sound, point_process], "Get shimmer (local)", start_time, end_time, 0.0001, 0.02, 1.3, 1.6)
            except Exception as e: print(f"Warning: Shimmer (local) failed: {e}. Setting to 0."); shimmer_local = 0.0
            
            try:
                shimmer_dB = parselmouth.praat.call([sound, point_process], "Get shimmer (local, dB)", start_time, end_time, 0.0001, 0.02, 1.3, 1.6)
            except Exception as e:
                print(f"Warning: MDVP:Shimmer(dB) failed: {e}. Setting to 0."); shimmer_dB = 0.0
            
            try: apq3 = parselmouth.praat.call([sound, point_process], "Get shimmer (apq3)", start_time, end_time, 0.0001, 0.02, 1.3, 1.6)
            except Exception as e: print(f"Warning: Shimmer:APQ3 failed: {e}. Setting to 0."); apq3 = 0.0

            try: apq5 = parselmouth.praat.call([sound, point_process], "Get shimmer (apq5)", start_time, end_time, 0.0001, 0.02, 1.3, 1.6)
            except Exception as e: print(f"Warning: Shimmer:APQ5 failed: {e}. Setting to 0."); apq5 = 0.0
            
            try:
                mdvp_apq = parselmouth.praat.call([sound, point_process], "Get shimmer (apq)", start_time, end_time, 0.0001, 0.02, 1.3, 1.6)
            except Exception as e:
                print(f"Warning: MDVP:APQ failed: {e}. Setting to 0."); mdvp_apq = 0.0

            try:
                dda = parselmouth.praat.call([sound, point_process], "Get shimmer (dda)", start_time, end_time, 0.0001, 0.02, 1.3, 1.6)
            except Exception as e:
                print(f"Warning: Shimmer:DDA failed: {e}. Setting to 0."); dda = 0.0
            
            # --- HNR (Harmonics-to-Noise Ratio) ---
            # Attempting 'Get harmonics-to-noise ratio' with common parameters.
            # This is a very standard Praat command. If it fails here consistently,
            # it indicates a fundamental incompatibility or a missing dependency/configuration
            # that Parselmouth relies on for this command, or audio too noisy/unvoiced.
            try:
                # Parameters: start_time, end_time, silence_threshold (dB), min_pitch (Hz), max_pitch (Hz), noise_threshold (dB), periods_per_cycle
                hnr = parselmouth.praat.call(sound, "Get harmonics-to-noise ratio", start_time, end_time, 0.1, PITCH_FLOOR, PITCH_CEILING, 0.1, 1.0)
                if np.isnan(hnr): hnr = 0.0; print("Warning: HNR calculation resulted in NaN. Setting to 0.")
            except Exception as e:
                print(f"Warning: HNR calculation failed: {e}. Setting HNR to 0.")
                hnr = 0.0

        except Exception as e:
            print(f"Warning: Error in PointProcess or main Jitter/Shimmer/HNR block: {e}. Setting related features to zero.")
            pass
    else:
        print("Warning: Insufficient fundamental frequency for Jitter/Shimmer/HNR calculation. Setting to zeros.")


    nhr = 0.0 # Placeholder for NHR (as discussed)

    # RPDE, DFA, spread1, spread2, D2, PPE - These are currently placeholders.
    rpde = 0.5 # Placeholder
    dfa = 0.7 # Placeholder
    spread1 = -5.0 # Placeholder
    spread2 = 0.15 # Placeholder
    d2 = 2.0 # Placeholder
    ppe = 0.1 # Placeholder

    features = {
        "MDVP:Fo(Hz)": float(mdvp_fo), "MDVP:Fhi(Hz)": float(mdvp_fhi), "MDVP:Flo(Hz)": float(mdvp_flo),
        "MDVP:Jitter(%)": float(jitter_local * 100), "MDVP:Jitter(Abs)": float(jitter_abs), "MDVP:RAP": float(rap), "MDVP:PPQ": float(ppq), "Jitter:DDP": float(ddp),
        "MDVP:Shimmer": float(shimmer_local), "MDVP:Shimmer(dB)": float(shimmer_dB), "Shimmer:APQ3": float(apq3), "Shimmer:APQ5": float(apq5),
        "MDVP:APQ": float(mdvp_apq), "Shimmer:DDA": float(dda), "NHR": float(nhr), "HNR": float(hnr),
        "RPDE": float(rpde), "DFA": float(dfa), "spread1": float(spread1), "spread2": float(spread2), "D2": float(d2), "PPE": float(ppe)
    }
    
    ordered_features = {}
    for feature_name in feature_names:
        ordered_features[feature_name] = features.get(feature_name, 0.0)

    return ordered_features

# ... (rest of your main.py) ...

# ... (rest of your main.py) ...
    # ... (rest of the features dictionary and return) ...
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

# Endpoint for receiving audio and extracting features
@app.post("/extract-features")
async def extract_features_from_audio(audio_file: UploadFile = File(...)):
    print(f"Received audio file: {audio_file.filename} ({audio_file.content_type})")
    
    temp_webm_path = ""
    temp_wav_path = ""
    try:
        # Save the uploaded webm file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_webm:
            tmp_webm.write(await audio_file.read())
            temp_webm_path = tmp_webm.name

        print(f"WebM audio saved to temporary file: {temp_webm_path}")

        # Convert webm to wav using pydub (requires ffmpeg)
        temp_wav_path = tempfile.NamedTemporaryFile(delete=False, suffix=".wav").name
        AudioSegment.from_file(temp_webm_path).export(temp_wav_path, format="wav")
        print(f"Converted audio to WAV: {temp_wav_path}")

        # Extract features using the parselmouth function with the WAV file
        extracted_features = extract_vocal_features(temp_wav_path)
        
        return {"message": "Features extracted successfully", "features": extracted_features}
    except Exception as e:
        print(f"Error during audio processing: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process audio or extract features: {e}")
    finally:
        # Ensure temporary files are deleted
        if os.path.exists(temp_webm_path):
            os.remove(temp_webm_path)
            print(f"Temporary WebM file {temp_webm_path} deleted.")
        if os.path.exists(temp_wav_path):
            os.remove(temp_wav_path)
            print(f"Temporary WAV file {temp_wav_path} deleted.")


@app.post("/chat")
async def chat_with_llm(chat_message: ChatMessage):
    # Check if API key is loaded
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY is not set in .env file.")

    OPENROUTER_API_BASE = "https://openrouter.ai/api/v1"
    OPENROUTER_MODEL = "mistralai/mistral-7b-instruct:free"

    messages = [
        {"role": "system", "content": """You are a helpful and specialized AI assistant strictly focused on providing information about Parkinson's Disease symptoms, related facts, and common questions.
        When a user provides their prediction results, including a probability score and specific vocal feature insights (e.g., 'MDVP:Jitter(%)' is elevated), use this information to make your summary and recommendations more specific and relevant.
        For example, if jitter is high, you can mention that elevated jitter can be a vocal characteristic associated with Parkinson's.
        Your purpose is to assist users specifically on the topic of Parkinson's Disease based on the data they provide.
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
    async with httpx.AsyncClient(base_url=OPENROUTER_API_BASE) as client:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json"
        }
        try:
            response = await client.post("/chat/completions", json=payload, headers=headers, timeout=30.0)
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
        


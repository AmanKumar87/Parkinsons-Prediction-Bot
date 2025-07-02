# import os
# import joblib
# import pandas as pd
# from fastapi import FastAPI, HTTPException, UploadFile, File
# from pydantic import BaseModel
# from typing import List, Dict, Optional
# from fastapi.middleware.cors import CORSMiddleware
# import httpx
# from dotenv import dotenv_values
# import parselmouth
# import numpy as np
# import io
# import tempfile
# from pydub import AudioSegment

# # --- Import python_speech_features components (Modified) ---
# PYTHON_SPEECH_FEATURES_LOADED = False # Flag remains False as we won't rely on its functions for APQ.
# try:
#     import python_speech_features # Changed to generic module import
#     print("python_speech_features (module level check) imported successfully.")
# except ImportError as e:
#     print(f"WARNING: python_speech_features module import failed: {e}. Not using it.")
# except Exception as e:
#     print(f"WARNING: Unexpected error during python_speech_features module import: {e}. Not using it.")

# # --- Import scipy.io.wavfile separately ---
# SCIPY_WAVFILE_LOADED = False
# try:
#     from scipy.io import wavfile
#     print("scipy.io.wavfile imported successfully.")
#     SCIPY_WAVFILE_LOADED = True
# except ImportError as e:
#     print(f"WARNING: scipy.io.wavfile import failed: {e}. (This import is largely bypassed for core audio data).")
# except Exception as e:
#     print(f"WARNING: Unexpected error during scipy.io.wavfile import: {e}. (This import is largely bypassed for core audio data).")


# # --- Import nolds for DFA ---
# NOLDS_LOADED = False
# try:
#     import nolds
#     print("nolds imported successfully.")
#     NOLDS_LOADED = True
# except ImportError as e:
#     print(f"Warning: nolds import failed: {e}. DFA will remain a placeholder. Please install with 'pip install nolds'")
#     nolds = None
# except Exception as e:
#     print(f"Warning: An unexpected error occurred during nolds import: {e}. DFA will remain a placeholder.")
#     nolds = None

# # --- NEW: Import PyRQA for RPDE (Corrected Imports - Final Attempt) ---
# PYRQA_LOADED = False
# try:
#     from pyrqa.time_series import TimeSeries
#     from pyrqa.settings import Settings
#     # Attempting to import directly from pyrqa, as computation.py failed
#     # And base.py also failed.
#     from pyrqa import ( # <<< Corrected import paths
#         RecurrencePlot,
#         RecurrenceQuantificationAnalysis,
#         RQAComputer # RQAComputer might also be directly under pyrqa
#     )
#     print("PyRQA imported successfully (final corrected paths).")
#     PYRQA_LOADED = True
# except ImportError as e:
#     print(f"Warning: PyRQA import failed: {e}. RPDE will remain a placeholder. Please install with 'pip install pyrqa'")
#     PYRQA_LOADED = False
# except Exception as e:
#     print(f"Warning: An unexpected error occurred during PyRQA import: {e}. RPDE will remain a placeholder.")
#     PYRQA_LOADED = False


# # Define paths for models and data
# MODELS_DIR = 'backend/models'
# DATA_DIR = 'backend/data'
# PREDICTION_LOG_FILE = os.path.join(DATA_DIR, 'user_predictions_log.csv')


# # Load environment variables from .env file
# config = dotenv_values(".env")
# OPENROUTER_API_KEY = config.get("OPENROUTER_API_KEY")
# print(f"Loaded OPENROUTER_API_KEY: {'*' * len(OPENROUTER_API_KEY) if OPENROUTER_API_KEY else 'NOT_LOADED'}\n")

# # Load the trained model, scaler, and feature names
# try:
#     model = joblib.load(os.path.join(MODELS_DIR, 'parkinsons_predictor.pkl'))
#     scaler = joblib.load(os.path.join(MODELS_DIR, 'scaler.pkl'))
#     feature_names = joblib.load(os.path.join(MODELS_DIR, 'feature_names.pkl'))
#     print("ML Model, scaler, and feature names loaded successfully.")
# except FileNotFoundError as e:
#     print(f"Error loading model components: {e}")
#     print("Please ensure 'parkinsons_predictor.pkl', 'scaler.pkl', and 'feature_names.pkl' are in the 'backend/models/' directory.")
#     print("Run ml_model.py first to train and save the model.")
#     model = None
#     scaler = None
#     feature_names = []
# except Exception as e:
#     print(f"An unexpected error occurred while loading model components: {e}")
#     model = None
#     scaler = None
#     feature_names = []

# # Initialize FastAPI app
# app = FastAPI()

# # --- IMPORTANT: CONFIGURE FFMPEG PATH FOR PYDUB HERE ---
# FFMPEG_BIN_DIR = r"C:\ffmpeg\bin" # <<< VERIFY THIS IS YOUR EXACT PATH TO THE 'bin' FOLDER

# if FFMPEG_BIN_DIR not in os.environ['PATH']:
#     os.environ['PATH'] = f"{FFMPEG_BIN_DIR};{os.environ['PATH']}"
#     print(f"Added {FFMPEG_BIN_DIR} to PATH environment variable for this process.")

# os.environ['FFMPEG_PATH'] = os.path.join(FFMPEG_BIN_DIR, 'ffmpeg.exe')
# os.environ['FFPROBE_PATH'] = os.path.join(FFMPEG_BIN_DIR, 'ffprobe.exe')
# print(f"Set FFMPEG_PATH to: {os.environ['FFMPEG_PATH']}\n")
# print(f"Set FFPROBE_PATH to: {os.environ['FFPROBE_PATH']}\n")
# # --- END: Explicitly set FFmpeg/FFprobe PATH for pydub ---


# # Configure CORS (Cross-Origin Resource Sharing)
# origins = [
#     "http://localhost",
#     "http://localhost:8000",
#     "http://localhost:5500",
#     "http://127.0.0.1",
#     "http://127.0.0.1:8000",
#     "http://127.0.0.1:5500",
# ]

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=origins,
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # --- Pydantic Models for Request Validation ---
# class PredictionInput(BaseModel):
#     features: Dict[str, float]

# class ChatMessage(BaseModel):
#     message: str
#     history: List[Dict[str, str]] = []

# # --- Helper function for logging predictions ---
# def log_prediction(input_data: Dict[str, float], prediction_result: int, probability: float):
#     if not os.path.exists(DATA_DIR):
#         os.makedirs(DATA_DIR)

#     log_df = pd.DataFrame([input_data])
#     log_df['prediction'] = prediction_result
#     log_df['probability'] = probability
    
#     ordered_cols = feature_names + ['prediction', 'probability']
#     log_df = log_df[ordered_cols]

#     if not os.path.exists(PREDICTION_LOG_FILE):
#         log_df.to_csv(PREDICTION_LOG_FILE, index=False)
#     else:
#         log_df.to_csv(PREDICTION_LOG_FILE, mode='a', header=False, index=False)
#     print(f"Prediction logged to {PREDICTION_LOG_FILE}")

# # --- Feature Extraction Function using Parselmouth & nolds & PyRQA ---
# def extract_vocal_features(audio_path: str) -> Dict[str, float]:
#     """
#     Extracts 22 vocal features from an audio file using Parselmouth.
#     Attempts to use nolds for DFA and PyRQA for RPDE.
#     """
#     # Initialize all dynamic features to 0.0
#     mdvp_fo, mdvp_fhi, mdvp_flo = 0.0, 0.0, 0.0
#     jitter_local, jitter_abs, rap, ppq, ddp = 0.0, 0.0, 0.0, 0.0, 0.0
#     shimmer_local, shimmer_dB, apq3, apq5, mdvp_apq, dda = 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
#     hnr, nhr = 0.0, 0.0
    
#     # Initialize complex features, will try to calculate DFA and RPDE
#     rpde = 0.5 # Default placeholder (will be overwritten if PyRQA works)
#     dfa = 0.7 # Default placeholder (will be overwritten if nolds works)
#     spread1 = -5.0 # Placeholder
#     spread2 = 0.15 # Placeholder
#     d2 = 2.0 # Placeholder
#     ppe = 0.1 # Placeholder


#     try:
#         sound = parselmouth.Sound(audio_path)
#     except Exception as e:
#         print(f"Error loading sound file with parselmouth: {e}")
#         raise ValueError(f"Could not load audio file: {e}. Ensure it's a valid, supported format.")

#     # --- Initial check for silent audio ---
#     if sound.get_rms() < 0.001:
#         print(f"Warning: Audio RMS is {sound.get_rms()}. Too quiet or silent. Returning zero/placeholder values.")
#         return {
#             "MDVP:Fo(Hz)": 0.0, "MDVP:Fhi(Hz)": 0.0, "MDVP:Flo(Hz)": 0.0,
#             "MDVP:Jitter(%)": 0.0, "MDVP:Jitter(Abs)": 0.0, "MDVP:RAP": 0.0, "MDVP:PPQ": 0.0, "Jitter:DDP": 0.0,
#             "MDVP:Shimmer": 0.0, "MDVP:Shimmer(dB)": 0.0, "Shimmer:APQ3": 0.0, "Shimmer:APQ5": 0.0,
#             "MDVP:APQ": 0.0, "Shimmer:DDA": 0.0, "NHR": 0.0, "HNR": 0.0,
#             "RPDE": 0.0, "DFA": 0.0, "spread1": 0.0, "spread2": 0.0, "D2": 0.0, "PPE": 0.0
#         }

#     # Define the pitch range variables
#     PITCH_FLOOR = 75.0
#     PITCH_CEILING = 600.0

#     # --- Pitch Extraction (MDVP:Fo/Fhi/Flo) ---
#     try:
#         pitch = sound.to_pitch(time_step=0.01, pitch_floor=PITCH_FLOOR, pitch_ceiling=PITCH_CEILING)
#         f0_values_raw = np.array(pitch.selected_array['frequency']).astype(float).flatten()
#         f0_values = f0_values_raw[(np.abs(f0_values_raw) > 1e-9) & (~np.isnan(f0_values_raw))]
        
#         mdvp_fo = np.mean(f0_values) if f0_values.size > 0 else 0.0
#         mdvp_fhi = np.max(f0_values) if f0_values.size > 0 else 0.0
#         mdvp_flo = np.min(f0_values) if f0_values.size > 0 else 0.0

#         if np.isnan(mdvp_fo): mdvp_fo = 0.0
#         if np.isnan(mdvp_fhi): mdvp_fhi = 0.0
#         if np.isnan(mdvp_flo): mdvp_flo = 0.0

#     except Exception as e:
#         print(f"Warning: Error in pitch extraction (MDVP:Fo/Fhi/Flo): {e}. Setting to 0.0.")
#         pass

#     # --- Get raw audio signal (sig) and sampling rate (rate) from parselmouth ---
#     # This is placed here to be universally available for nolds and PyRQA.
#     sig = None
#     rate = None
#     try:
#         sig = sound.values.flatten().astype(np.float64) # Get raw samples as float64
#         rate = sound.sampling_frequency # Get sampling rate

#         if sig.size == 0:
#             sig = None # Set to None if empty
#             print("Warning: Audio signal is empty from parselmouth. Skipping external feature extraction.")
            
#     except Exception as e:
#         print(f"Warning: Error getting raw audio signal from parselmouth: {e}. Skipping related feature extraction.")
#         sig = None
#         rate = None


#     # --- Jitter, Shimmer, HNR/NHR Calculation ---
#     if mdvp_fo > 0: # Only proceed if mean pitch was detected
#         try:
#             point_process = parselmouth.praat.call(sound, "To PointProcess (periodic, cc)", PITCH_FLOOR, PITCH_CEILING)
            
#             start_time = 0.0
#             end_time = sound.get_total_duration()

#             # Jitter metrics (these seem to be working well)
#             jitter_local = parselmouth.praat.call(point_process, "Get jitter (local)", start_time, end_time, 0.0001, 0.02, 1.3)
#             jitter_abs = parselmouth.praat.call(point_process, "Get jitter (local, absolute)", start_time, end_time, 0.0001, 0.02, 1.3)
#             rap = parselmouth.praat.call(point_process, "Get jitter (rap)", start_time, end_time, 0.0001, 0.02, 1.3)
#             ppq = parselmouth.praat.call(point_process, "Get jitter (ppq5)", start_time, end_time, 0.0001, 0.02, 1.3)
#             ddp = parselmouth.praat.call(point_process, "Get jitter (ddp)", start_time, end_time, 0.0001, 0.02, 1.3)

#             # --- Shimmer metrics ---
#             # MDVP:Shimmer (local) - This was working
#             try: shimmer_local = parselmouth.praat.call([sound, point_process], "Get shimmer (local)", start_time, end_time, 0.0001, 0.02, 1.3, 1.6)
#             except Exception as e: print(f"Warning: Shimmer (local) failed: {e}. Setting to 0."); shimmer_local = 0.0
            
#             # MDVP:Shimmer(dB) - Now working via derivation
#             try:
#                 shimmer_dB = 20 * np.log10(1 + shimmer_local) if shimmer_local > 0 else 0.0
#                 print(f"Note: MDVP:Shimmer(dB) derived from local shimmer: {shimmer_dB}")
#             except Exception as e:
#                 shimmer_dB = 0.0
#                 print(f"Warning: MDVP:Shimmer(dB) derivation failed: {e}. Setting to 0.")
            
#             # APQ3, APQ5, DDA - These were working
#             try: apq3 = parselmouth.praat.call([sound, point_process], "Get shimmer (apq3)", start_time, end_time, 0.0001, 0.02, 1.3, 1.6)
#             except Exception as e: print(f"Warning: Shimmer:APQ3 failed: {e}. Setting to 0."); apq3 = 0.0

#             try: apq5 = parselmouth.praat.call([sound, point_process], "Get shimmer (apq5)", start_time, end_time, 0.0001, 0.02, 1.3, 1.6)
#             except Exception as e: print(f"Warning: Shimmer:APQ5 failed: {e}. Setting to 0."); apq5 = 0.0
            
#             # --- MDVP:APQ - This will be explicitly set to 0.0 ---
#             # Based on persistent ImportError for get_shimmer, this feature remains unextractable via readily available libraries.
#             mdvp_apq = 0.0
#             print("Note: MDVP:APQ is explicitly set to 0.0 due to persistent library import/functionality issues.")

#             try: dda = parselmouth.praat.call([sound, point_process], "Get shimmer (dda)", start_time, end_time, 0.0001, 0.02, 1.3, 1.6)
#             except Exception as e: print(f"Warning: Shimmer:DDA failed: {e}. Setting to 0."); dda = 0.0
            
#             # --- HNR (Harmonics-to-Noise Ratio) - Now working via Harmonicity object
#             try:
#                 harmonicity_object = sound.to_harmonicity(
#                     time_step=0.1,
#                     minimum_pitch=PITCH_FLOOR,
#                     silence_threshold=0.1,
#                 )
#                 hnr_val = parselmouth.praat.call(harmonicity_object, "Get mean", 0.0, 0.0)
#                 if np.isnan(hnr_val): hnr = 0.0; print("Warning: HNR from object resulted in NaN. Setting to 0.")
#                 else: hnr = hnr_val
#                 print(f"Note: HNR calculated via Harmonicity object: {hnr}")
#             except Exception as e:
#                 print(f"Warning: HNR calculation failed: {e}. Setting HNR to 0.")
#                 hnr = 0.0

#         except Exception as e:
#             print(f"Warning: Error in PointProcess or main Jitter/Shimmer/HNR block: {e}. Setting related features to zero.")
#             pass
#     else:
#         print("Warning: Insufficient fundamental frequency for Jitter/Shimmer/HNR calculation. Setting to zeros.")


#     # NHR (Noise-to-Harmonics Ratio) - Deriving from HNR (now that HNR is dynamic)
#     try:
#         if hnr > 0: # Ensure HNR is positive for derivation
#             nhr = 1 / (10**(hnr / 20)) # Convert HNR (dB) to a ratio, then take inverse for NHR
#             print(f"Note: NHR derived from HNR: {nhr}")
#         else:
#             nhr = 0.0
#             print("Note: HNR is 0, so NHR is set to 0.0.")
#     except Exception as e:
#         print(f"Warning: NHR derivation failed: {e}. Setting to 0.0.")
#         nhr = 0.0


#     # --- RPDE, DFA, spread1, spread2, D2, PPE ---
#     # Attempt DFA calculation using nolds if loaded and raw audio signal is valid
#     if NOLDS_LOADED and sig is not None and sig.size > 0: # Check if nolds loaded and audio available
#         try:
#             if sig.size > 100: # Ensure sufficient data points for DFA calculation
#                 dfa = nolds.dfa(sig)
#                 if np.isnan(dfa): dfa = 0.7; print("Warning: DFA calculation resulted in NaN. Setting to default placeholder.")
#                 print(f"Note: DFA calculated via nolds: {dfa}")
#             else:
#                 print("Warning: Audio signal too short for DFA calculation. Keeping placeholder.")
#         except Exception as e:
#             print(f"Warning: DFA calculation failed: {e}. Setting to placeholder.")
#     else:
#         print("Note: DFA will remain placeholder (nolds not loaded or audio not available).")

#     # --- RPDE calculation using PyRQA ---
#     # RPDE calculation requires a time series (e.g., F0 contour)
#     # Ensure f0_values has enough points for RQA (typically >100).
#     if PYRQA_LOADED and f0_values.size > 100:
#         try:
#             # RPDE calculation requires a time series (e.g., F0 contour)
#             # Embed the time series (F0 contour) into a phase space
#             # Common parameters for phase space reconstruction: embedding_dimension (m), time_delay (tau)
#             # Threshold (epsilon) for recurrence plots.
            
#             # Using F0 values for RPDE, must have enough points
#             time_series_rpde = TimeSeries(f0_values,
#                                           embedding_dimension=2, # Common default
#                                           time_delay=1)        # Common default

#             settings = Settings(time_series_rpde,
#                                 recurrence_rate_threshold=0.1,
#                                 )

#             # Compute Recurrence Plot
#             recurrence_plot = RecurrencePlot(time_series_rpde, settings)

#             # Perform Recurrence Quantification Analysis
#             rqa_result = RecurrenceQuantificationAnalysis(recurrence_plot, settings)

#             # RPDE is often related to RQA's Entropy (ENT) or derived from it.
#             # PyRQA outputs various measures as attributes of rqa_result.
#             # RPDE is not a direct output like 'DET' or 'Lmax'.
#             # It's derived from `diagonal_line_lengths` distribution entropy.
            
#             # Using rqa_result.entropy_diagonal_lines_distribution as RPDE
#             rpde_val = rqa_result.entropy_diagonal_lines_distribution # This is ENT
#             rpde = rpde_val if not np.isnan(rpde_val) else 0.5 # Default to placeholder if NaN
            
#             print(f"Note: RPDE calculated via PyRQA (Entropy of diagonal lines): {rpde}")

#         except Exception as e:
#             print(f"Warning: RPDE calculation failed: {e}. Setting to placeholder.")
#     else:
#         print("Note: RPDE will remain placeholder (PyRQA not loaded or insufficient F0 data).")


#     # spread1, spread2, D2, PPE remain placeholders.
#     # These features are complex nonlinear measures.
#     # Implementing these would involve significant custom algorithm development
#     # or finding very specific, specialized libraries.
#     spread1 = -5.0 # Placeholder
#     spread2 = 0.15 # Placeholder
#     d2 = 2.0 # Placeholder
#     ppe = 0.1 # Placeholder

#     features = {
#         "MDVP:Fo(Hz)": float(mdvp_fo), "MDVP:Fhi(Hz)": float(mdvp_fhi), "MDVP:Flo(Hz)": float(mdvp_flo),
#         "MDVP:Jitter(%)": float(jitter_local * 100), "MDVP:Jitter(Abs)": float(jitter_abs), "MDVP:RAP": float(rap), "MDVP:PPQ": float(ppq), "Jitter:DDP": float(ddp),
#         "MDVP:Shimmer": float(shimmer_local), "MDVP:Shimmer(dB)": float(shimmer_dB), "Shimmer:APQ3": float(apq3), "Shimmer:APQ5": float(apq5),
#         "MDVP:APQ": float(mdvp_apq), "Shimmer:DDA": float(dda), "NHR": float(nhr), "HNR": float(hnr),
#         "RPDE": float(rpde), "DFA": float(dfa), "spread1": float(spread1), "spread2": float(spread2), "D2": float(d2), "PPE": float(ppe)
#     }
    
#     ordered_features = {}
#     for feature_name in feature_names:
#         ordered_features[feature_name] = features.get(feature_name, 0.0)

#     return ordered_features

# # --- API Endpoints ---

# @app.get("/")
# async def read_root():
#     return {"message": "Parkinson's Prediction Chatbot Backend is running!"}

# @app.post("/predict")
# async def predict_parkinsons(input_data: PredictionInput):
#     if model is None or scaler is None or not feature_names:
#         raise HTTPException(status_code=500, detail="ML model not loaded. Please run ml_model.py first.")

#     try:
#         input_df = pd.DataFrame([input_data.features])
#         input_ordered = input_df[feature_names]
#     except KeyError as e:
#         raise HTTPException(status_code=400, detail=f"Missing or incorrect feature in input: {e}. Expected features: {feature_names}")
#     except Exception as e:
#         raise HTTPException(status_code=400, detail=f"Invalid input data format: {e}")

#     scaled_features = scaler.transform(input_ordered)

#     prediction = model.predict(scaled_features)[0]
#     prediction_proba = model.predict_proba(scaled_features)[:, 1][0]

#     log_prediction(input_data.features, int(prediction), float(prediction_proba))

#     return {
#         "prediction": int(prediction),
#         "probability": float(prediction_proba),
#         "message": "Prediction made successfully."
#     }

# # Endpoint for receiving audio and extracting features
# @app.post("/extract-features")
# async def extract_features_from_audio(audio_file: UploadFile = File(...)):
#     print(f"Received audio file: {audio_file.filename} ({audio_file.content_type})")
    
#     temp_webm_path = ""
#     temp_wav_path = ""
#     try:
#         # Save the uploaded webm file
#         with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp_webm:
#             tmp_webm.write(await audio_file.read())
#             temp_webm_path = tmp_webm.name

#         print(f"WebM audio saved to temporary file: {temp_webm_path}")

#         # Convert webm to wav using pydub (requires ffmpeg)
#         temp_wav_path = tempfile.NamedTemporaryFile(delete=False, suffix=".wav").name
#         AudioSegment.from_file(temp_webm_path).export(temp_wav_path, format="wav")
#         print(f"Converted audio to WAV: {temp_wav_path}")

#         # Extract features using the parselmouth function with the WAV file
#         extracted_features = extract_vocal_features(temp_wav_path)
        
#         return {"message": "Features extracted successfully", "features": extracted_features}
#     except Exception as e:
#         print(f"Error during audio processing: {e}")
#         raise HTTPException(status_code=500, detail=f"Failed to process audio or extract features: {e}")
#     finally:
#         # Ensure temporary files are deleted
#         if os.path.exists(temp_webm_path):
#             os.remove(temp_webm_path)
#             print(f"Temporary WebM file {temp_webm_path} deleted.")
#         if os.path.exists(temp_wav_path):
#             os.remove(temp_wav_path)
#             print(f"Temporary WAV file {temp_wav_path} deleted.")


# @app.post("/chat")
# async def chat_with_llm(chat_message: ChatMessage):
#     # Check if API key is loaded
#     if not OPENROUTER_API_KEY:
#         raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY is not set in .env file.")

#     OPENROUTER_API_BASE = "https://openrouter.ai/api/v1"
#     OPENROUTER_MODEL = "mistralai/mistral-7b-instruct:free"

#     messages = [
#         {"role": "system", "content": """You are a helpful and specialized AI assistant strictly focused on providing information about Parkinson's Disease symptoms, related facts, and common questions.
#         When a user provides their prediction results, including a probability score and specific vocal feature insights (e.g., 'MDVP:Jitter(%)' is elevated), use this information to make your summary and recommendations more specific and relevant.
#         For example, if jitter is high, you can mention that elevated jitter can be a vocal characteristic associated with Parkinson's.
#         Your purpose is to assist users specifically on the topic of Parkinson's Disease based on the data they provide.
#         If a user asks a question about a topic unrelated to Parkinson's Disease or another medical condition/disease, you must politely decline to answer, state that your expertise is limited to Parkinson's Disease, and gently guide them back to the relevant topic.
#         When providing lists of symptoms or other structured information, please use Markdown for formatting (e.g., bullet points, bold text).
#         You should ask clarifying questions about Parkinson's symptoms, but **never diagnose** Parkinson's disease.
#         Always include a disclaimer that this is for informational purposes only and users should consult a healthcare professional for diagnosis.
#         For accurate prediction, gently guide the user to the "Accurate Prediction" section where they can input numerical voice features."""},
#     ]

#     for msg in chat_message.history:
#         messages.append(msg)

#     messages.append({"role": "user", "content": chat_message.message})

#     payload = {
#         "model": OPENROUTER_MODEL,
#         "messages": messages,
#         "max_tokens": 500,
#         "temperature": 0.7
#     }

#     print(f"Sending request to OpenRouter with model: {OPENROUTER_MODEL}")
#     async with httpx.AsyncClient(base_url=OPENROUTER_API_BASE) as client:
#         headers = {
#             "Authorization": f"Bearer {OPENROUTER_API_KEY}",
#             "Content-Type": "application/json"
#         }
#         try:
#             response = await client.post("/chat/completions", json=payload, headers=headers, timeout=30.0)
#             response.raise_for_status()
#             llm_response = response.json()
            
#             chat_response_content = llm_response['choices'][0]['message']['content']
#             print(f"Received LLM response: {chat_response_content[:100]}...")
            
#             return {"response": chat_response_content}
#         except httpx.RequestError as e:
#             print(f"HTTPX Request Error: {e}")
#             raise HTTPException(status_code=500, detail=f"Could not connect to OpenRouter API: {e}")
#         except httpx.HTTPStatusError as e:
#             print(f"HTTP Status Error: {e.response.status_code} - {e.response.text}")
#             raise HTTPException(status_code=e.response.status_code, detail=f"OpenRouter API error: {e.response.text}")
#         except KeyError as e:
#             print(f"KeyError in LLM response parsing: {e} - Response: {llm_response}")
#             raise HTTPException(status_code=500, detail=f"Unexpected response format from OpenRouter API: {e}")
#         except Exception as e:
#             print(f"An unexpected error occurred during LLM interaction: {e}")
#             raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")



import os
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Optional
from fastapi.middleware.cors import CORSMiddleware
import httpx
from dotenv import dotenv_values
import parselmouth
import numpy as np
import io
import tempfile
from pydub import AudioSegment

# --- Removed python_speech_features import block due to persistent issues ---
# MDVP:APQ will be explicitly set to 0.0.

# --- Removed nolds import block ---

# --- Removed PyRQA import block ---


# Define paths for models and data
MODELS_DIR = 'backend/models'
DATA_DIR = 'backend/data'
PREDICTION_LOG_FILE = os.path.join(DATA_DIR, 'user_predictions_log.csv')


# Load environment variables from .env file
config = dotenv_values(".env")
OPENROUTER_API_KEY = config.get("OPENROUTER_API_KEY")
print(f"Loaded OPENROUTER_API_KEY: {'*' * len(OPENROUTER_API_KEY) if OPENROUTER_API_KEY else 'NOT_LOADED'}\n")

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
FFMPEG_BIN_DIR = r"C:\ffmpeg\bin" # <<< VERIFY THIS IS YOUR EXACT PATH TO THE 'bin' FOLDER

if FFMPEG_BIN_DIR not in os.environ['PATH']:
    os.environ['PATH'] = f"{FFMPEG_BIN_DIR};{os.environ['PATH']}"
    print(f"Added {FFMPEG_BIN_DIR} to PATH environment variable for this process.")

os.environ['FFMPEG_PATH'] = os.path.join(FFMPEG_BIN_DIR, 'ffmpeg.exe')
os.environ['FFPROBE_PATH'] = os.path.join(FFMPEG_BIN_DIR, 'ffprobe.exe')
print(f"Set FFMPEG_PATH to: {os.environ['FFMPEG_PATH']}\n")
print(f"Set FFPROBE_PATH to: {os.environ['FFPROBE_PATH']}\n")
# --- END: Explicitly set FFmpeg/FFprobe PATH for pydub ---


# Configure CORS (Cross-Origin Resource Sharing)
# ... (imports) ...

# Configure CORS (Cross-Origin Resource Sharing)
origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:5500",
    "http://127.0.0.1",
    "http://127.0.0.1:8000",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:5501", # For local Live Server testing
    "https://your-frontend-name.onrender.com", # <<< NEW: Add your Render frontend domain here
    "https://*.onrender.com" # <<< NEW (Optional but recommended for Render)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ... (rest of main.py) ...

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

# --- Feature Extraction Function using Parselmouth only (with specified placeholders) ---
def extract_vocal_features(audio_path: str) -> Dict[str, float]:
    """
    Extracts 22 vocal features from an audio file using Parselmouth.
    Uses specified average placeholder values for complex or incompatible features.
    """
    # Initialize all dynamic features to 0.0
    mdvp_fo, mdvp_fhi, mdvp_flo = 0.0, 0.0, 0.0
    jitter_local, jitter_abs, rap, ppq, ddp = 0.0, 0.0, 0.0, 0.0, 0.0
    shimmer_local, shimmer_dB, apq3, apq5, mdvp_apq, dda = 0.0, 0.0, 0.0, 0.0, 0.0, 0.0
    hnr, nhr = 0.0, 0.0
    
    # --- Set specified average placeholder values ---
    # These values will now be explicitly used.
    rpde = 0.45 # Average placeholder
    dfa = 0.72 # Average placeholder
    spread1 = -4.6 # Average placeholder
    spread2 = 0.22 # Average placeholder
    d2 = 2.35 # Average placeholder
    ppe = 0.19 # Average placeholder
    mdvp_apq = 0.0075 # Average placeholder for MDVP:APQ


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
            "MDVP:APQ": 0.0075, # Use specified placeholder
            "Shimmer:DDA": 0.0, "NHR": 0.0, "HNR": 0.0,
            "RPDE": 0.45, "DFA": 0.72, "spread1": -4.6, "spread2": 0.22, "D2": 2.35, "PPE": 0.19
        }

    # Define the pitch range variables
    PITCH_FLOOR = 75.0
    PITCH_CEILING = 600.0

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
    # These calculations depend on successful pitch detection
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
            # MDVP:Shimmer (local) - This was working
            try: shimmer_local = parselmouth.praat.call([sound, point_process], "Get shimmer (local)", start_time, end_time, 0.0001, 0.02, 1.3, 1.6)
            except Exception as e: print(f"Warning: Shimmer (local) failed: {e}. Setting to 0."); shimmer_local = 0.0
            
            # MDVP:Shimmer(dB) - Now working via derivation
            try:
                shimmer_dB = 20 * np.log10(1 + shimmer_local) if shimmer_local > 0 else 0.0
                print(f"Note: MDVP:Shimmer(dB) derived from local shimmer: {shimmer_dB}")
            except Exception as e:
                shimmer_dB = 0.0
                print(f"Warning: MDVP:Shimmer(dB) derivation failed: {e}. Setting to 0.")
            
            # APQ3, APQ5, DDA - These were working
            try: apq3 = parselmouth.praat.call([sound, point_process], "Get shimmer (apq3)", start_time, end_time, 0.0001, 0.02, 1.3, 1.6)
            except Exception as e: print(f"Warning: Shimmer:APQ3 failed: {e}. Setting to 0."); apq3 = 0.0

            try: apq5 = parselmouth.praat.call([sound, point_process], "Get shimmer (apq5)", start_time, end_time, 0.0001, 0.02, 1.3, 1.6)
            except Exception as e: print(f"Warning: Shimmer:APQ5 failed: {e}. Setting to 0."); apq5 = 0.0
            
            # MDVP:APQ - Using specified placeholder value
            # This is explicitly set as a placeholder, no dynamic calculation attempted in this version.
            print("Note: MDVP:APQ is set to its specified placeholder value (0.0075).")


            try: dda = parselmouth.praat.call([sound, point_process], "Get shimmer (dda)", start_time, end_time, 0.0001, 0.02, 1.3, 1.6)
            except Exception as e: print(f"Warning: Shimmer:DDA failed: {e}. Setting to 0."); dda = 0.0
            
            # --- HNR (Harmonics-to-Noise Ratio) - Now working via Harmonicity object
            try:
                harmonicity_object = sound.to_harmonicity(
                    time_step=0.1,
                    minimum_pitch=PITCH_FLOOR,
                    silence_threshold=0.1,
                )
                hnr_val = parselmouth.praat.call(harmonicity_object, "Get mean", 0.0, 0.0)
                if np.isnan(hnr_val): hnr = 0.0; print("Warning: HNR from object resulted in NaN. Setting to 0.")
                else: hnr = hnr_val
                print(f"Note: HNR calculated via Harmonicity object: {hnr}")
            except Exception as e:
                print(f"Warning: HNR calculation failed: {e}. Setting HNR to 0.")
                hnr = 0.0

        except Exception as e:
            print(f"Warning: Error in PointProcess or main Jitter/Shimmer/HNR block: {e}. Setting related features to zero.")
            pass
    else:
        print("Warning: Insufficient fundamental frequency for Jitter/Shimmer/HNR calculation. Setting to zeros.")


    # NHR (Noise-to-Harmonics Ratio) - Deriving from HNR (now that HNR is dynamic)
    try:
        if hnr > 0: # Ensure HNR is positive for derivation
            nhr = 1 / (10**(hnr / 20)) # Convert HNR (dB) to a ratio, then take inverse for NHR
            print(f"Note: NHR derived from HNR: {nhr}")
        else:
            nhr = 0.0
            print("Note: HNR is 0, so NHR is set to 0.0.")
    except Exception as e:
        print(f"Warning: NHR derivation failed: {e}. Setting to 0.0.")
        nhr = 0.0


    # --- RPDE, DFA, spread1, spread2, D2, PPE ---
    # DFA will be explicitly set to its placeholder value, as nolds is removed.
    dfa = 0.72 # Using specified placeholder value.

    # RPDE will be explicitly set to its placeholder value, as PyRQA is removed.
    rpde = 0.45 # Using specified placeholder value.

    # spread1, spread2, D2, PPE remain placeholders.
    spread1 = -4.6 # Placeholder
    spread2 = 0.22 # Placeholder
    d2 = 2.35 # Placeholder
    ppe = 0.19 # Placeholder

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

    # ... (rest of the features dictionary) ...

# Add a print statement to show the full extracted features
    print(f"Extracted Features (before scaling/prediction): {features}")

    ordered_features = {}
    for feature_name in feature_names:
        ordered_features[feature_name] = features.get(feature_name, 0.0)
    return ordered_features

# --- API Endpoints ---

@app.get("/")
async def read_root():
    return {"message": "Parkinson's Prediction Chatbot Backend is running!"}

# @app.post("/predict")
# async def predict_parkinsons(input_data: PredictionInput):
#     if model is None or scaler is None or not feature_names:
#         raise HTTPException(status_code=500, detail="ML model not loaded. Please run ml_model.py first.")

#     try:
#         input_df = pd.DataFrame([input_data.features])
#         input_ordered = input_df[feature_names]
#     except KeyError as e:
#         raise HTTPException(status_code=400, detail=f"Missing or incorrect feature in input: {e}. Expected features: {feature_names}")
#     except Exception as e:
#         raise HTTPException(status_code=400, detail=f"Invalid input data format: {e}")

#     scaled_features = scaler.transform(input_ordered)

#     prediction = model.predict(scaled_features)[0]
#     prediction_proba = model.predict_proba(scaled_features)[:, 1][0]

#     log_prediction(input_data.features, int(prediction), float(prediction_proba))

#     return {
#         "prediction": int(prediction),
#         "probability": float(prediction_proba),
#         "message": "Prediction made successfully."
#     }


@app.post("/predict")
async def predict_parkinsons(input_data: PredictionInput):
    if model is None or scaler is None or not feature_names:
        raise HTTPException(status_code=500, detail="ML model not loaded. Please run ml_model.py first.")

    try:
        # Ensure the input features are in the correct order for the scaler
        # input_df = pd.DataFrame([input_data.features])
        input_df = pd.DataFrame([input_data.features])
        input_ordered = input_df[feature_names] # Reorders columns based on feature_names.pkl
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing or incorrect feature in input: {e}. Expected features: {feature_names}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid input data format: {e}")

    # --- NEW: Print features BEFORE scaling ---
    print(f"Features BEFORE scaling (Input to Scaler): {input_ordered.iloc[0].to_dict()}")

    scaled_features = scaler.transform(input_ordered)

    # --- NEW: Print features AFTER scaling ---
    print(f"Features AFTER scaling (Input to Model): {scaled_features[0].tolist()}")

    prediction = model.predict(scaled_features)[0]
    prediction_proba = model.predict_proba(scaled_features)[:, 1][0]

    log_prediction(input_data.features, int(prediction), float(prediction_proba))

    return {
        "prediction": int(prediction),
        "probability": float(prediction_proba),
        "message": "Prediction made successfully."
    }
    # ... (inside @app.post("/predict") endpoint) ...

    # scaled_features = scaler.transform(input_ordered)

    # prediction_proba = model.predict_proba(scaled_features)[:, 1][0]

    # # --- NEW: Adjust Prediction Threshold (making model less sensitive to "Parkinson's" classification) ---
    # # Default threshold for binary classification is 0.5.
    # # If the model is too sensitive and always predicts 1, increase this threshold significantly.
    # # Experiment with values from 0.6 to 0.9 depending on desired sensitivity.
    # CUSTOM_THRESHOLD = 0.75 # Start with 0.75 or 0.8. You can fine-tune this.

    # if prediction_proba >= CUSTOM_THRESHOLD:
    #     prediction_adjusted = 1 # Classified as Parkinson's
    # else:
    #     prediction_adjusted = 0 # Classified as Healthy

    # log_prediction(input_data.features, int(prediction_adjusted), float(prediction_proba)) # Use adjusted prediction

    # return {
    #     "prediction": int(prediction_adjusted), # Return adjusted prediction
    #     "probability": float(prediction_proba),
    #     "message": "Prediction made successfully."
    # }


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
        For accurate prediction, gently guide the user to the "Get Prediction" section where they can input numerical voice features."""},
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
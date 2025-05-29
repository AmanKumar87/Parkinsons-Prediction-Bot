# Parkinson's Disease AI Chatbot & Prediction Tool

This project develops a hybrid AI chatbot designed to provide general information about Parkinson's Disease symptoms and offer a machine learning-based prediction of disease likelihood based on specific voice features.

---

## 🌟 Features

- **General Symptom Chatbot:** Engage in natural language conversations about Parkinson's Disease symptoms, causes, and general information.
  - Powered by a **Large Language Model (LLM)** (via OpenRouter API).
  - Provides informative, non-diagnostic responses.
  - Guides users towards the accurate prediction tool when relevant.
- **Accurate Prediction Tool:** Input 22 specific numerical voice-related features to receive a machine learning-driven prediction of Parkinson's Disease likelihood.
  - Leverages a trained **hybrid machine learning model** for high accuracy.
  - Includes descriptive tooltips for each voice feature input.
  - Provides probability scores along with the prediction.
  - Automatically logs all predictions for potential future analysis (to `user_predictions_log.csv`).
- **Intuitive User Interface:**
  - Clean, responsive web interface built with **HTML**, **CSS**, and **JavaScript**.
  - Dark/Light **theme toggling** for personalized viewing.
  - Clear disclaimers emphasizing that the tool is informational and not for diagnosis.

---

## 💻 Technology Stack

This project utilizes a robust stack combining frontend, backend, and machine learning components:

- **Frontend:**
  - **HTML5:** Structure of the web pages.
  - **CSS3:** Styling and responsive design.
  - **JavaScript (ES6+):** Client-side interactivity, API calls, and UI management.
- **Backend:**
  - **Python 3.x:** Core programming language.
  - **FastAPI:** High-performance web framework for building the API endpoints.
  - `httpx`: Asynchronous HTTP client for external API requests (e.g., OpenRouter).
  - `python-dotenv`: For managing environment variables (API keys).
- **Machine Learning:**
  - `scikit-learn`: For machine learning model implementation (e.g., Stacking Classifier, SVM, Logistic Regression, KNN, XGBoost, Random Forest, Gradient Boosting, AdaBoost, Neural Network).
  - `pandas`: Data manipulation and analysis.
  - `joblib`: For saving and loading trained ML models and data scalers.
- **External API:**
  - **OpenRouter API:** Used to access various Large Language Models (LLMs) for the general chatbot functionality.

---

## 🚀 Setup and Installation

Follow these steps to get the Parkinson's Disease AI Chatbot up and running on your local machine.

### 1. Clone the Repository

```bash
git clone <repository_url_here> # Replace with your actual repository URL
cd parkinsons-chatbot
```

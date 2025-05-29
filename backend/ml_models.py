import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, AdaBoostClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.ensemble import StackingClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib
import os

def train_and_save_model():
    # Define paths
    data_dir = 'backend/data'
    models_dir = 'backend/models'
    csv_file_path = os.path.join(data_dir, 'parkinsons_hospital.csv')
    
    # Create directories if they don't exist
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)

    print(f"Loading data from: {csv_file_path}")
    try:
        df = pd.read_csv(csv_file_path)
        print("Data loaded successfully.")
    except FileNotFoundError:
        print(f"Error: {csv_file_path} not found. Please ensure the CSV file is in the backend/data directory.")
        return

    # Drop the 'name' column as it's not a feature for prediction
    if 'name' in df.columns:
        df = df.drop('name', axis=1)

    # Separate features (X) and target (y)
    # Assuming 'status' is the target variable (1 for Parkinson's, 0 for healthy)
    if 'status' not in df.columns:
        print("Error: 'status' column not found in the CSV. Please ensure your target column is named 'status'.")
        return
        
    X = df.drop('status', axis=1)
    y = df['status']

    # Store feature names for later use in prediction
    feature_names = X.columns.tolist()
    joblib.dump(feature_names, os.path.join(models_dir, 'feature_names.pkl'))
    print(f"Feature names saved to {os.path.join(models_dir, 'feature_names.pkl')}")

    # Split data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # Scale the features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    joblib.dump(scaler, os.path.join(models_dir, 'scaler.pkl'))
    print(f"Scaler saved to {os.path.join(models_dir, 'scaler.pkl')}")

    # Define base estimators for the Stacking Classifier
    estimators = [
        ('rf', RandomForestClassifier(n_estimators=100, random_state=42)),
        ('gb', GradientBoostingClassifier(n_estimators=100, random_state=42)),
        ('logreg', LogisticRegression(random_state=42, solver='liblinear')),
        ('svc', SVC(probability=True, random_state=42)),
        ('knn', KNeighborsClassifier(n_neighbors=5)),
        ('mlp', MLPClassifier(hidden_layer_sizes=(100,), max_iter=500, random_state=42)) # Neural Network
    ]

    # Define the final estimator (meta-classifier)
    # Using Logistic Regression as the final estimator
    final_estimator = LogisticRegression(random_state=42, solver='liblinear')

    # Create the Stacking Classifier
    # n_jobs=-1 uses all available cores for parallel processing during fitting
    stacking_model = StackingClassifier(
        estimators=estimators,
        final_estimator=final_estimator,
        cv=5,  # 5-fold cross-validation for meta-model training
        n_jobs=-1,
        verbose=1
    )

    print("Training Stacking Classifier...")
    stacking_model.fit(X_train_scaled, y_train)
    print("Training complete.")

    # Evaluate the model
    y_pred = stacking_model.predict(X_test_scaled)
    y_pred_proba = stacking_model.predict_proba(X_test_scaled)[:, 1] # Probability of being Parkinson's (status=1)

    accuracy = accuracy_score(y_test, y_pred)
    print(f"\nModel Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

    # Save the trained model
    model_path = os.path.join(models_dir, 'parkinsons_predictor.pkl')
    joblib.dump(stacking_model, model_path)
    print(f"Trained model saved to {model_path}")

if __name__ == "__main__":
    train_and_save_model()
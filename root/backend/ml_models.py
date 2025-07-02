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
    
    parkinsons_hospital_path = os.path.join(data_dir, 'parkinsons_hospital.csv')
    parkinsson_data_path = os.path.join(data_dir, 'Parkinsson_data.csv')
    
    # Create directories if they don't exist
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)

    print(f"Loading data from: {parkinsons_hospital_path} and {parkinsson_data_path}")
    try:
        df_hospital = pd.read_csv(parkinsons_hospital_path)
        df_data = pd.read_csv(parkinsson_data_path)
        print("Data loaded successfully.")
    except FileNotFoundError as e:
        print(f"Error: {e}. Please ensure both CSV files are in the backend/data directory.")
        return

    # --- Data Preprocessing for both datasets ---
    # Drop the 'name' column as it's not a feature for prediction
    if 'name' in df_hospital.columns:
        df_hospital = df_hospital.drop('name', axis=1)
    if 'name' in df_data.columns:
        df_data = df_data.drop('name', axis=1)

    # Ensure consistent column order before concatenation
    # Get all unique feature names from both dataframes, excluding 'status'
    all_features = sorted(list(set(df_hospital.columns.tolist() + df_data.columns.tolist()) - {'status'}))

    # Reorder columns for df_hospital to match all_features, then add 'status'
    # Important: The order of RPDE and DFA is different in the two datasets.
    # We need to ensure that the order of columns matches the order in all_features
    # before adding the 'status' column.
    
    # Adjust column order for df_hospital to match all_features
    df_hospital_reordered = df_hospital[all_features + ['status']]

    # Adjust column order for df_data to match all_features
    df_data_reordered = df_data[all_features + ['status']]

    # Concatenate the two dataframes
    df_combined = pd.concat([df_hospital_reordered, df_data_reordered], ignore_index=True)
    print(f"Combined DataFrame shape: {df_combined.shape}")
    print("Combined DataFrame head:")
    print(df_combined.head())

    # Separate features (X) and target (y)
    # Assuming 'status' is the target variable (1 for Parkinson's, 0 for healthy)
    if 'status' not in df_combined.columns:
        print("Error: 'status' column not found in the combined DataFrame. Please ensure your target column is named 'status'.")
        return
        
    X = df_combined.drop('status', axis=1)
    y = df_combined['status']

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
    final_estimator = LogisticRegression(random_state=42, solver='liblinear')

    # Create the Stacking Classifier
    stacking_model = StackingClassifier(
        estimators=estimators,
        final_estimator=final_estimator,
        cv=5,
        n_jobs=-1,
        verbose=1
    )

    print("Training Stacking Classifier...")
    stacking_model.fit(X_train_scaled, y_train)
    print("Training complete.")

    # Evaluate the model
    y_pred = stacking_model.predict(X_test_scaled)
    y_pred_proba = stacking_model.predict_proba(X_test_scaled)[:, 1]

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
import os
import joblib
import numpy as np
from sklearn.linear_model import Perceptron
from sklearn.preprocessing import StandardScaler

def train_and_save_model():
    # 1. Simulación o carga de datos (Ejemplo: Nota IA y PGA)
    # X = [[Nota_IA, PGA]]
    X_train = np.array([
        [0.1, 0.2],
        [0.2, 0.3],
        [0.3, 0.1],
        [0.8, 0.9],
        [0.7, 0.85],
        [0.9, 0.95],
        [0.6, 0.7]
    ])
    # y = [0: No Graduado / Riesgo, 1: Graduado / Exitoso]
    y_train = np.array([0, 0, 0, 1, 1, 1, 1])

    # 2. Escalado de características
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)

    # 3. Entrenamiento del Perceptrón
    model = Perceptron(max_iter=1000, eta0=0.1, random_state=42)
    model.fit(X_train_scaled, y_train)

    # 4. Guardar artefactos en la carpeta models_store
    output_dir = os.path.join("app", "models_store")
    os.makedirs(output_dir, exist_ok=True)

    joblib.dump(model, os.path.join(output_dir, "perceptron_model.joblib"))
    joblib.dump(scaler, os.path.join(output_dir, "scaler.joblib"))

    print("✅ Modelo y Scaler guardados correctamente en app/models_store/")

if __name__ == "__main__":
    train_and_save_model()
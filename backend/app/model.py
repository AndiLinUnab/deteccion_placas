import os
import joblib
import numpy as np

class MLModelHandler:
    def __init__(self):
        base_path = os.path.dirname(__file__)
        model_path = os.path.join(base_path, "models_store", "perceptron_model.joblib")
        scaler_path = os.path.join(base_path, "models_store", "scaler.joblib")

        if not os.path.exists(model_path) or not os.path.exists(scaler_path):
            raise FileNotFoundError("Los archivos del modelo no existen. Ejecuta primero 'python train.py'")

        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)

    def predict(self, nota_ia: float, pga: float):
        # Escalar las notas ingresadas (normalización a escala 0-1 aproximada)
        features = np.array([[nota_ia / 5.0, pga / 5.0]])
        features_scaled = self.scaler.transform(features)

        # Predicción
        prediction = self.model.predict(features_scaled)[0]

        if prediction == 1:
            return "Graduación / Éxito Aprobado", 1, "El perfil cumple con las condiciones predictivas requeridas."
        else:
            return "Riesgo de Retiro / Reagrupar", 0, "El perfil requiere acompañamiento académico adicional."

ml_handler = MLModelHandler()
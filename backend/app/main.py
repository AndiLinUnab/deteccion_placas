from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/detect-plate")
async def detect_plate(file: UploadFile = File(...)):
    # Read bytes from uploaded image
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # TODO: Aquí va tu pipeline de OpenCV / OCR / YOLO
    # Por ahora procesamos la forma de la imagen para confirmar lectura real
    height, width, _ = image.shape

    return {
        "status": "success",
        "placa_detectada": f"IMG-{width}x{height}", # Retorna dimensiones reales leídas de la foto
        "mensaje": "Foto recibida y procesada correctamente en el backend"
    }
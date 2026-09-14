from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from PIL import Image, ImageOps
import io
import re
import easyocr
from ultralytics import YOLO

app = FastAPI(title="ALPR Two-Stage Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cargar el detector YOLOv8 entrenado para placas y el OCR
yolo_model = YOLO("models/best.pt")
ocr_reader = easyocr.Reader(['en'], gpu=False)

def process_pipeline(image_bytes: bytes):
    # 1. Corregir orientación EXIF
    pil_img = Image.open(io.BytesIO(image_bytes))
    pil_img = ImageOps.exif_transpose(pil_img)
    img_bgr = cv2.cvtColor(np.array(pil_img.convert('RGB')), cv2.COLOR_RGB2BGR)

    # 2. Detección de la región de la placa con YOLO
    results = yolo_model(img_bgr, conf=0.4)
    
    crops = []
    for r in results:
        for box in r.boxes:
            # Extraer coordenadas de la caja (Bounding Box)
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            # Recortar únicamente la placa (Region of Interest)
            crop = img_bgr[y1:y2, x1:x2]
            crops.append(crop)

    # Si YOLO no encontró ninguna caja, se usa la imagen completa como fallback
    target_img = crops[0] if len(crops) > 0 else img_bgr

    # 3. Preprocesamiento para mejorar OCR sobre el recorte
    gray = cv2.cvtColor(target_img, cv2.COLOR_BGR2GRAY)
    gray = cv2.bilateralFilter(gray, 11, 17, 17)

    # 4. Inferencia de caracteres con EasyOCR
    ocr_results = ocr_reader.readtext(gray)
    
    detected_texts = []
    for (_, text, prob) in ocr_results:
        clean_text = re.sub(r'[^A-Z0-9]', '', text.upper())
        if len(clean_text) >= 5 and prob > 0.2:
            detected_texts.append(clean_text)

    plate_text = detected_texts[0] if detected_texts else "NO DETECTADA"
    return plate_text

@app.post("/detect-plate")
async def detect_plate(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        plate = process_pipeline(contents)
        return {
            "status": "success",
            "placa_detectada": plate,
            "mensaje": "Placa localizada y procesada correctamente"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
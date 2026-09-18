from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from PIL import Image, ImageOps
import io
import re
import sqlite3
import easyocr
from ultralytics import YOLO

app = FastAPI(title="ALPR System - RUNT Integration Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Cargar modelos en memoria
yolo_model = YOLO("models/best.pt")
ocr_reader = easyocr.Reader(['en'], gpu=False)

def query_runt_database(placa: str):
    """Consulta la base de datos local simulada del RUNT."""
    conn = sqlite3.connect("runt_mock.db")
    cursor = conn.cursor()
    
    cursor.execute("SELECT propietario, marca_modelo, soat_estado, soat_vencimiento, tecnomecanica_estado, alerta_robo, multas_pendientes FROM vehiculos WHERE placa = ?", (placa,))
    row = cursor.fetchone()
    conn.close()

    if row:
        return {
            "registrado": True,
            "propietario": row[0],
            "vehiculo": row[1],
            "soat": {"estado": row[2], "vencimiento": row[3]},
            "tecnomecanica": row[4],
            "alerta_robo": bool(row[5]),
            "multas_pendientes": row[6]
        }
    else:
        return {
            "registrado": False,
            "mensaje": "Placa no encontrada en el Registro Nacional de Tránsito"
        }

@app.post("/detect-plate")
async def detect_plate(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        
        # 1. Corregir orientación y preprocesar
        pil_img = Image.open(io.BytesIO(contents))
        pil_img = ImageOps.exif_transpose(pil_img)
        img_bgr = cv2.cvtColor(np.array(pil_img.convert('RGB')), cv2.COLOR_RGB2BGR)

        # 2. Detección de Bounding Boxes de todas las placas con YOLOv8
        results = yolo_model(img_bgr, conf=0.35)
        
        detecciones = []

        # Iterar sobre las detecciones multiobjeto
        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                confidence = float(box.conf[0])
                
                # Recorte individual de cada placa encontrada
                crop_target = img_bgr[y1:y2, x1:x2]
                if crop_target.size == 0:
                    continue

                # 3. Preprocesamiento OCR y extracción por cada recorte
                gray = cv2.cvtColor(crop_target, cv2.COLOR_BGR2GRAY)
                gray = cv2.bilateralFilter(gray, 11, 17, 17)
                ocr_results = ocr_reader.readtext(gray)

                placa_detectada = "NO DETECTADA"
                for (_, text, prob) in ocr_results:
                    clean_text = re.sub(r'[^A-Z0-9]', '', text.upper())
                    if len(clean_text) >= 5 and prob > 0.20:
                        placa_detectada = clean_text
                        break

                # 4. Consulta RUNT individualizada
                info_runt = None
                if placa_detectada != "NO DETECTADA":
                    info_runt = query_runt_database(placa_detectada)

                detecciones.append({
                    "placa_detectada": placa_detectada,
                    "confianza_deteccion": round(confidence, 2),
                    "bbox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                    "runt_data": info_runt
                })

        return {
            "status": "success",
            "total_placas_detectadas": len(detecciones),
            "resultados": detecciones
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
import cv2
import numpy as np
import easyocr
import re

class AdvancedPlateDetector:
    def __init__(self):
        # Inicializar EasyOCR en modo inglés/español
        self.reader = easyocr.Reader(['en'], gpu=False)
        
        # Diccionarios de equivalencias bidireccionales
        self.num_to_char = {
            '0': 'O', '1': 'I', '2': 'Z', '3': 'E', '4': 'A', 
            '5': 'S', '6': 'G', '7': 'T', '8': 'B', '9': 'P'
        }
        
        self.char_to_num = {
            'O': '0', 'Q': '0', 'I': '1', 'L': '1', 'Z': '2', 
            'E': '3', 'A': '4', 'S': '5', 'G': '6', 'T': '7', 
            'B': '8', 'P': '9', 'C': '0'  # 'C' suele ser confusión de '0'
        }
        
        self.city_blacklist = ["TUNJA", "BOGOTA", "MEDELLIN", "CALI", "BUCARAMANGA", "COLOMBIA", "CHIA", "ENVIGADO"]

    def clean_and_format_plate(self, raw_text: str) -> str:
        """Fuerza la regla estricta: Exactamente 3 Letras + 3 Números."""
        text = raw_text.upper()

        # 1. Remover nombres de ciudades/ruido conocidos
        for city in self.city_blacklist:
            text = text.replace(city, "")

        # 2. Dejar únicamente caracteres alfanuméricos
        clean_stream = re.sub(r'[^A-Z0-9]', '', text)

        # Si no hay suficiente información para formar 6 caracteres, retornar vacío
        if len(clean_stream) < 6:
            return ""

        # 3. Tomar exactamente los primeros 6 caracteres detectados (evita falsos positivos al final)
        candidate = clean_stream[:6]

        # 4. Mapeo por Posición Estricta
        letters_part = ""
        for char in candidate[:3]:
            # Posiciones 0, 1, 2: Forzar a LETRA
            if char.isdigit():
                letters_part += self.num_to_char.get(char, 'O')
            else:
                letters_part += char

        numbers_part = ""
        for char in candidate[3:]:
            # Posiciones 3, 4, 5: Forzar a NÚMERO
            if char.isalpha():
                numbers_part += self.char_to_num.get(char, '0')
            else:
                numbers_part += char

        final_plate = f"{letters_part}{numbers_part}"
        return final_plate

    def crop_inner_region(self, img):
        """Aplica un recorte del margen para omitir marco y letras de municipio."""
        h, w = img.shape[:2]
        top = int(h * 0.15)     
        bottom = int(h * 0.80)  
        left = int(w * 0.05)    
        right = int(w * 0.95)   
        return img[top:bottom, left:right]

    def process_image(self, image_bytes: bytes):
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {"error": "Imagen no válida o corrupta"}

        # Recortar área central de la placa
        cropped_img = self.crop_inner_region(img)

        # Preprocesamiento con OpenCV
        gray = cv2.cvtColor(cropped_img, cv2.COLOR_BGR2GRAY)
        blur = cv2.bilateralFilter(gray, 11, 17, 17)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(blur)

        # Inferencia OCR
        ocr_results = self.reader.readtext(enhanced)

        detected_candidates = []
        for (_, text, prob) in ocr_results:
            formatted = self.clean_and_format_plate(text)
            if len(formatted) == 6:
                detected_candidates.append((formatted, prob))

        if detected_candidates:
            # Seleccionar la opción con mayor confianza de lectura
            best_plate, confidence = max(detected_candidates, key=lambda x: x[1])
            return {
                "placa_detectada": best_plate,
                "confianza": round(float(confidence), 2),
                "estado": "Exitoso"
            }

        return {
            "placa_detectada": "NO DETECTADA",
            "confianza": 0.0,
            "estado": "No cumple con la estructura sintáctica (3 Letras + 3 Números)"
        }

plate_service = AdvancedPlateDetector()
# Sistema de Reconocimiento Automático de Placas (ALPR)

## Arquitectura del Sistema
El sistema consta de dos módulos principales:

1. **Backend (FastAPI + OpenCV + EasyOCR):** 
   - Procesa imágenes de vehículos mediante recortado adaptativo de regiones de interés (ROI).
   - Aplica filtros de contraste CLAHE y difuminado bilateral para eliminar ruido metálico.
   - Aplica formateo estricto de sintaxis colombiana: exactamente 6 caracteres alfanuméricos (`AAA123`), forzando conversiones tipográficas según la posición del carácter.

2. **Frontend Móvil (React Native + Expo):**
   - Interfaz nativa Android compilada en formato ejecutable `.apk`.
   - Permite la selección de fotografías desde la galería del dispositivo y su envío multipart hacia la API de inferencia.

## Endpoints de la API
- `POST /detect-plate`: Recibe un archivo de imagen (`multipart/form-data`) y retorna un JSON con la placa detectada y el nivel de confianza.
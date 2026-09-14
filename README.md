# 🚘 Sistema ALPR End-to-End con Inferencia en Dos Etapas e Integración RUNT (MLOps)

> **Universidad Autónoma de Bucaramanga (UNAB)**  
> **Programa:** Ingeniería de Sistemas  
> **Asignatura:** Ciencia de Datos  
> **Evaluación:** Trabajo Final - Primer Corte (Tema 1: Redes Neuronal Convolucionales - 30%)  
> **Fecha de Sustentación:** 28 de Septiembre de 2026

---

## 📌 1. Resumen y Alcance del Proyecto

Este proyecto implementa una solución productiva de **MLOps End-to-End** para el **Reconocimiento Automático de Placas Vehiculares (ALPR - *Automatic License Plate Recognition*)** operado desde una aplicación móvil. 

Para evitar replicar soluciones genéricas o tutoriales estándar (requisito obligatorio de la materia), el sistema adopta una **arquitectura de dos etapas (Two-Stage Pipeline)**:
1. **Detección de Objetos:** Red Convolucional (YOLOv8) optimizada para delimitar la región de interés (ROI) de la placa vehicular en tiempo real.
2. **Reconocimiento Óptico de Caracteres (OCR):** Motor EasyOCR acoplado con filtros de procesamiento digital de imágenes en OpenCV para extraer el texto alfanumérico.

### 🌟 Diferencial Obligatorio (Simulación RUNT)
Como propuesta de valor agregado, el backend consulta automáticamente una base de datos relacional embebida (`runt_mock.db`), la cual retorna en tiempo real el expediente legal del vehículo (Propietario, SOAT, Tecnomecánica, Multas y Alerta de Robo) directo hacia la interfaz móvil en React Native / Expo.

---

## 📐 2. Arquitectura de Sistema y MLOps

```text
┌─────────────────────────────────────────────────────────────┐
│             CLIENTE MÓVIL (React Native / Expo)             │
│  - Captura desde cámara y procesamiento local de payload    │
│  - Petición HTTP POST Multipart/form-data                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ (Red LAN / WiFi)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND MLOps (FastAPI + Uvicorn)              │
│                                                             │
│  1. Preprocesamiento & Corrección EXIF (PIL / OpenCV)       │
│  2. Localización de Bounding Box (YOLOv8 custom weights)    │
│  3. Filtro Bilateral & Inferencia OCR (EasyOCR)             │
│  4. Módulo de Integración RUNT (SQLite Engine)              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               BASE DE DATOS EMBEBIDA (SQLite)               │
│  - Tabla `vehiculos` (Clave Primaria: `placa`)              │
└──────────────────────────────┴──────────────────────────────┘
🛠️ 3. Stack Tecnológico y PlataformasComponenteTecnologíaRol en el EcosistemaEntorno de DesarrolloVS Code & GitHub  IDE de desarrollo local y control de versiones distribuido  Entrenamiento ModeloGoogle Colab  Aceleración GPU para fine-tuning e inspección de métricas  Dataset & EtiquetadoRoboflow Universe  Anotación de imágenes y exportación en formato YOLOv8 PyTorch  Modelo DetecciónYOLOv8 (Ultralytics)Red Neuronal Convolucional para detección de la placa vehicularExtracción OCREasyOCR & OpenCVInferencia de caracteres alfanuméricos y preprocesamiento de ROIBackend APIFastAPI / UvicornOrquestación del pipeline de visión y puntos de enlace RESTBase de DatosSQLite 3 (runt_mock.db)Motor relacional local para simulación de expediente de tránsitoFrontend MóvilReact Native (Expo)Interfaz nativa cross-platform y renderizado de alertas📂 4. Estructura del Repositorio (GitHub Sync)Plaintextalpr-runt-mlops/
├── README.md                   # Documentación principal del proyecto
├── .gitignore                  # Exclusión de entornos virtuales, cachés y bases de datos
│
├── backend/                    # Servidor de inferencia en Python (FastAPI)
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py             # Pipeline completo de procesamiento y consulta
│   ├── models/
│   │   └── best.pt             # Pesos exportados de la red YOLOv8
│   ├── init_db.py              # Script de inicialización y poblado de BD
│   ├── runt_mock.db            # Base de datos relacional de pruebas
│   └── requirements.txt        # Librerías de Python requeridas
│
└── mobile/                     # Aplicación Móvil en React Native
    ├── src/
    │   └── app/
    │       └── index.tsx       # UI con módulo de cámara y tarjeta RUNT
    ├── app.json
    └── package.json
⚡ 5. Guía de Despliegue LocalPaso 1: Configurar el Backend en PythonClonar el repositorio localmente:  PowerShellgit clone <URL_DE_TU_REPOSITORIO_GITHUB>
cd alpr-runt-mlops/backend
Crear y activar el entorno virtual:  PowerShellpython -m venv env
.\env\Scripts\activate       # En Windows
# source env/bin/activate     # En Linux/Mac
Instalar las dependencias de producción[cite: 1]:PowerShellpip install -r requirements.txt
Poblar la base de datos local SQLite:PowerShellpython init_db.py
Iniciar el servidor API de FastAPI:PowerShelluvicorn app.main:app --reload --host 0.0.0.0 --port 8000
Paso 2: Ejecutar la Aplicación Móvil (Expo)Ingresar al directorio del frontend:PowerShellcd ../mobile
Instalar los paquetes Node.js:PowerShellnpm install
Iniciar el servidor de desarrollo de Expo:PowerShellnpx expo start
Abrir la aplicación Expo Go en un dispositivo físico conectado a la misma red WiFi y escanear el código QR.
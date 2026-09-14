# 🚘 Sistema ALPR End-to-End con Inferencia en Dos Etapas e Integración RUNT (MLOps)

**Universidad Autónoma de Bucaramanga (UNAB)**
Programa: Ingeniería de Sistemas · Asignatura: Ciencia de Datos
Evaluación: Trabajo Final — Primer Corte (Tema 1: Redes Neuronales Convolucionales — 30%)
📅 Fecha de sustentación: **28 de septiembre de 2026**

---

## 📌 1. Resumen y Alcance del Proyecto

Este proyecto implementa una solución productiva de **MLOps End-to-End** para el Reconocimiento Automático de Placas Vehiculares (**ALPR**), operado desde una aplicación móvil.

Para evitar replicar soluciones genéricas o tutoriales estándar (requisito obligatorio de la materia), el sistema adopta una **arquitectura de dos etapas** (*Two-Stage Pipeline*):

1. **Detección de objetos** — Red convolucional **YOLOv8**, optimizada para delimitar la región de interés (ROI) de la placa vehicular en tiempo real.
2. **Reconocimiento óptico de caracteres (OCR)** — Motor **EasyOCR**, acoplado con filtros de procesamiento digital de imágenes en **OpenCV**, para extraer el texto alfanumérico.

### 🌟 Diferencial obligatorio: Simulación RUNT

Como propuesta de valor agregado, el backend consulta automáticamente una base de datos relacional embebida (`runt_mock.db`), que retorna en tiempo real el expediente legal del vehículo:

- 👤 Propietario
- 🛡️ SOAT
- 🔧 Tecnomecánica
- 🚫 Multas
- 🚨 Alerta de robo

Toda esta información se envía directo a la interfaz móvil en **React Native / Expo**.

---

## 📐 2. Arquitectura del Sistema (MLOps)

```
┌─────────────────────────────────────────────────────────────┐
│             CLIENTE MÓVIL (React Native / Expo)             │
│  • Captura desde cámara y procesamiento local del payload    │
│  • Petición HTTP POST multipart/form-data                    │
└──────────────────────────────┬──────────────────────────────┘
                                │  (Red LAN / WiFi)
                                ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND MLOps (FastAPI + Uvicorn)               │
│  1. Preprocesamiento y corrección EXIF (PIL / OpenCV)         │
│  2. Localización de bounding box (YOLOv8, pesos custom)       │
│  3. Filtro bilateral e inferencia OCR (EasyOCR)                │
│  4. Módulo de integración RUNT (motor SQLite)                 │
└──────────────────────────────┬──────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│               BASE DE DATOS EMBEBIDA (SQLite)                │
│  • Tabla `vehiculos` (clave primaria: `placa`)                │
└───────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 3. Stack Tecnológico y Plataformas

| Componente | Tecnología | Rol en el Ecosistema |
|---|---|---|
| Entorno de desarrollo | VS Code & GitHub | IDE de desarrollo local y control de versiones distribuido |
| Entrenamiento de modelo | Google Colab | Aceleración GPU para fine-tuning e inspección de métricas |
| Dataset y etiquetado | Roboflow Universe | Anotación de imágenes y exportación en formato YOLOv8 PyTorch |
| Modelo de detección | YOLOv8 (Ultralytics) | Red neuronal convolucional para detección de la placa vehicular |
| Extracción OCR | EasyOCR & OpenCV | Inferencia de caracteres alfanuméricos y preprocesamiento de ROI |
| Backend API | FastAPI / Uvicorn | Orquestación del pipeline de visión y endpoints REST |
| Base de datos | SQLite 3 (`runt_mock.db`) | Motor relacional local para simulación del expediente de tránsito |
| Frontend móvil | React Native (Expo) | Interfaz nativa cross-platform y renderizado de alertas |

---

## 📂 4. Estructura del Repositorio (GitHub Sync)

```
alpr-runt-mlops/
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
└── mobile/                     # Aplicación móvil en React Native
    ├── src/
    │   └── app/
    │       └── index.tsx       # UI con módulo de cámara y tarjeta RUNT
    ├── app.json
    └── package.json
```

---

## ⚡ 5. Guía de Despliegue Local

### Paso 1 — Configurar el backend en Python

**1. Clonar el repositorio localmente:**
```powershell
git clone <URL_DE_TU_REPOSITORIO_GITHUB>
cd alpr-runt-mlops/backend
```

**2. Crear y activar el entorno virtual:**
```powershell
python -m venv env
.\env\Scripts\activate        # En Windows
# source env/bin/activate     # En Linux/Mac
```

**3. Instalar las dependencias de producción:**
```powershell
pip install -r requirements.txt
```

**4. Poblar la base de datos local SQLite:**
```powershell
python init_db.py
```

**5. Iniciar el servidor API de FastAPI:**
```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Paso 2 — Ejecutar la aplicación móvil (Expo)

**1. Ingresar al directorio del frontend:**
```powershell
cd ../mobile
```

**2. Instalar los paquetes Node.js:**
```powershell
npm install
```

**3. Iniciar el servidor de desarrollo de Expo:**
```powershell
npx expo start
```

**4. Abrir la app Expo Go** en un dispositivo físico conectado a la misma red WiFi y escanear el código QR.

---

> 💡 **Nota:** asegúrate de que el backend y el dispositivo móvil estén en la misma red LAN/WiFi para que la petición HTTP hacia el servidor FastAPI se resuelva correctamente.

# 🚗 ALPR System — Automatic License Plate Recognition (MLOps)

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?logo=pytorch&logoColor=white)
![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-00FFFF)
![React Native](https://img.shields.io/badge/React_Native-Expo-61DAFB?logo=react&logoColor=black)
![AWS EC2](https://img.shields.io/badge/AWS-EC2-FF9900?logo=amazonaws&logoColor=white)

Sistema integral de **detección y reconocimiento automático de placas vehiculares** en tiempo real. Está construido sobre una arquitectura de **microservicios stateless**, desplegado en la nube (**AWS EC2**) y consumido desde una **aplicación móvil en React Native (Expo)**.

---

## 📑 Tabla de contenido

- [Características](#-características)
- [Arquitectura del sistema](#-arquitectura-del-sistema)
- [Tech stack](#️-tech-stack)
- [Estructura del proyecto](#️-estructura-del-proyecto)
- [Inicio rápido](#-inicio-rápido)
- [Despliegue en AWS EC2](#️-despliegue-en-aws-ec2)
- [Cliente móvil](#-cliente-móvil)
- [API Reference](#-api-reference)
- [Solución de problemas](#-solución-de-problemas)
- [Buenas prácticas para producción](#-buenas-prácticas-para-producción)
- [Roadmap](#️-roadmap)
- [Licencia y créditos](#️-licencia-y-créditos)

---

## ✨ Características

- 🎯 **Detección de placas** con YOLOv8 (bounding box + nivel de confianza).
- 🔤 **Lectura de texto** de la placa con EasyOCR sobre el recorte detectado.
- ⚡ **API REST stateless** con FastAPI: fácil de escalar horizontalmente.
- 📱 **App móvil** para capturar o seleccionar una imagen y ver el resultado al instante.
- ☁️ **Despliegue en la nube** sobre una instancia Ubuntu en AWS EC2.

---

## 📐 Arquitectura del sistema

```
┌──────────────────────────────────────┐
│  App móvil (Expo / React Native)     │
└──────────────────┬───────────────────┘
                   │  1. POST /detect-plate (multipart/form-data)
                   ▼
┌──────────────────────────────────────┐
│  AWS EC2 · Ubuntu Server 22.04 LTS   │
│  └── FastAPI (Uvicorn)               │
│        │                             │
│        ├─ 2. Detección de placa ───▶ YOLOv8
│        │                             │
│        └─ 3. Extracción de texto ──▶ EasyOCR
└──────────────────────────────────────┘
```

**Flujo de una petición**

1. La app envía la imagen al endpoint `POST /detect-plate`.
2. YOLOv8 localiza las placas y devuelve sus *bounding boxes* con su confianza.
3. Cada región recortada se procesa con EasyOCR para extraer el texto.
4. La API responde con un JSON que incluye la placa, las confianzas y las coordenadas.

---

## 🛠️ Tech stack

| Capa | Tecnologías |
|------|-------------|
| **Frontend móvil** | React Native, Expo, TypeScript, Axios |
| **Backend de inferencia** | Python 3.10+, FastAPI, Uvicorn, PyTorch |
| **IA / MLOps** | YOLOv8 (detección), EasyOCR (OCR), OpenCV |
| **Infraestructura** | AWS EC2 (Ubuntu Server 22.04 LTS) |
| **Versionado / CI-CD** | Git, GitHub |

---

## 🗂️ Estructura del proyecto

```
.
├── backend/
│   ├── main.py              # Aplicación FastAPI y endpoints
│   ├── weights/             # Pesos entrenados de YOLOv8 (.pt)
│   ├── utils/               # Procesamiento de imágenes y EasyOCR
│   └── requirements.txt     # Dependencias de Python
├── mobile-app/
│   ├── app/
│   │   └── index.tsx        # Pantalla principal (React Native / Expo)
│   ├── package.json
│   └── app.json
└── README.md
```

---

## 🚀 Inicio rápido

Si solo quieres probar el backend en tu máquina local:

```bash
git clone <URL_DEL_REPOSITORIO>
cd <NOMBRE_DEL_REPOSITORIO>/backend

python3 -m venv env
source env/bin/activate            # En Windows: env\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Verifica que funciona abriendo la documentación interactiva de FastAPI en
`http://localhost:8000/docs`.

---

## ☁️ Despliegue en AWS EC2

### 1. Requisitos de la instancia

- **SO:** Ubuntu Server 22.04 LTS
- **Security Group (Inbound Rules):**

| Tipo | Puerto | Uso | Origen recomendado |
|------|--------|-----|--------------------|
| SSH | 22 | Administración | Solo tu IP |
| Custom TCP | 8000 | API REST (FastAPI) | `0.0.0.0/0` o rangos específicos |
| Custom TCP | 9000 | Streaming / servicios HTTP auxiliares | Según necesidad |

> ⚠️ **Recomendación:** restringe el puerto 22 a tu IP en lugar de abrirlo al mundo.

### 2. Instalación en el servidor

Conéctate por SSH a la instancia y ejecuta:

```bash
# 1. Actualizar el sistema e instalar dependencias básicas
sudo apt update && sudo apt upgrade -y
sudo apt install python3-pip python3-venv git ffmpeg libsm6 libxext6 -y

# 2. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd <NOMBRE_DEL_REPOSITORIO>/backend

# 3. Crear y activar el entorno virtual
python3 -m venv env
source env/bin/activate

# 4. Instalar dependencias
pip install --upgrade pip
pip install -r requirements.txt

# 5. Levantar el servicio
uvicorn main:app --host 0.0.0.0 --port 8000
```

> 💡 Quita `--reload` en el servidor: está pensado solo para desarrollo.

### 3. Mantener el servicio activo (opcional, recomendado)

Para que la API se reinicie sola y sobreviva al cierre de la sesión SSH, crea un servicio `systemd`:

```ini
# /etc/systemd/system/alpr.service
[Unit]
Description=ALPR FastAPI Service
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/<NOMBRE_DEL_REPOSITORIO>/backend
ExecStart=/home/ubuntu/<NOMBRE_DEL_REPOSITORIO>/backend/env/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now alpr
sudo systemctl status alpr
```

---

## 📱 Cliente móvil

### Requisitos previos

- Node.js **v18+**
- npm o yarn
- App **Expo Go** instalada en tu dispositivo móvil

### Pasos

1. **Instalar dependencias**

   ```bash
   cd mobile-app
   npm install
   ```

2. **Configurar la URL de la API** en `app/index.tsx`:

   ```typescript
   const API_URL = "http://<TU_EC2_PUBLIC_IP>:8000/detect-plate";
   ```

3. **Iniciar el servidor de desarrollo**

   ```bash
   npx expo start
   ```

4. **Escanear el código QR** con Expo Go. El celular necesita acceso a internet para comunicarse con la IP pública de AWS.

---

## 🔌 API Reference

### `POST /detect-plate`

Recibe una imagen y ejecuta el pipeline ALPR (detección + OCR).

**Headers**

| Header | Valor |
|--------|-------|
| `Content-Type` | `multipart/form-data` |

**Body (form-data)**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `file` | archivo | Imagen `image/jpeg` o `image/png` |

**Ejemplo con cURL**

```bash
curl -X POST "http://<TU_EC2_PUBLIC_IP>:8000/detect-plate" \
  -F "file=@carro.jpg"
```

**Respuesta exitosa — `200 OK`**

```json
{
  "status": "success",
  "total_placas_encontradas": 1,
  "resultados": [
    {
      "placa": "ABC123",
      "confianza_yolo": 0.92,
      "confianza_ocr": 0.88,
      "bounding_box": {
        "x1": 120,
        "y1": 340,
        "x2": 450,
        "y2": 480
      }
    }
  ]
}
```

**Descripción de los campos**

| Campo | Descripción |
|-------|-------------|
| `status` | Estado de la operación |
| `total_placas_encontradas` | Número de placas detectadas en la imagen |
| `resultados[].placa` | Texto reconocido por el OCR |
| `resultados[].confianza_yolo` | Confianza de la detección (0–1) |
| `resultados[].confianza_ocr` | Confianza de la lectura de texto (0–1) |
| `resultados[].bounding_box` | Coordenadas en píxeles de la placa (`x1, y1` esquina superior izquierda; `x2, y2` inferior derecha) |

> La documentación interactiva (Swagger UI) está disponible en `http://<HOST>:8000/docs`.

---

## 🩺 Solución de problemas

| Problema | Posible causa / solución |
|----------|--------------------------|
| La app no conecta con la API | Verifica que el puerto **8000** esté abierto en el Security Group y que la IP pública de la EC2 sea la correcta (cambia si detienes/reinicias la instancia; considera una **Elastic IP**). |
| `Network Error` en Android con `http://` | Android puede bloquear tráfico HTTP sin cifrar en builds de producción. Usa HTTPS o habilita *cleartext traffic* en la configuración. |
| `ImportError: libGL.so.1` | Instala las dependencias del sistema: `sudo apt install libgl1 libsm6 libxext6 -y`. |
| Primera petición muy lenta | EasyOCR y YOLOv8 cargan modelos en la primera inferencia. Cárgalos al iniciar la app (evento *startup*). |
| Poco espacio / instalación de PyTorch falla | Usa una instancia con ≥ 20 GB de disco y suficiente RAM (mín. 4 GB recomendado). |

---

## 🔒 Buenas prácticas para producción

- Servir la API detrás de **Nginx** con **HTTPS** (Let's Encrypt).
- Asignar una **Elastic IP** a la instancia para que la URL no cambie.
- Configurar **CORS** de forma explícita en FastAPI.
- Limitar el **tamaño máximo** y el tipo de archivo aceptado.
- Añadir **autenticación** (API Key o JWT) al endpoint.
- Mover la URL de la API a una variable de entorno (`EXPO_PUBLIC_API_URL`) en lugar de dejarla fija en el código.
- Definir un pipeline de **CI/CD** con GitHub Actions para pruebas y despliegue automático.

---

## 🗺️ Roadmap

- [ ] Endpoint de *health check* (`GET /health`)
- [ ] Contenerización con Docker
- [ ] Pipeline CI/CD con GitHub Actions
- [ ] Soporte para video / streaming en tiempo real
- [ ] Monitoreo y métricas del modelo (latencia, confianza promedio)
- [ ] Persistencia de resultados en base de datos

---

## ✒️ Licencia y créditos

Proyecto desarrollado para el programa de **Ingeniería de Sistemas** (curso de **Ciencia de Datos / MLOps**).

> Añade aquí el tipo de licencia (por ejemplo, MIT) y los nombres de los autores.

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from app.vision import plate_service

app = FastAPI(
    title="API de Detección de Placas",
    description="Sistema de Visión por Computador para lectura alfanumérica de placas",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", response_class=HTMLResponse)
def read_root():
    # Interfaz gráfica directa para seleccionar archivos desde la galería/ordenador
    return """
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Detector de Placas ALPR</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; background-color: #f4f6f9; }
            .card { background: white; padding: 25px; border-radius: 10px; max-width: 500px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .preview { margin-top: 15px; max-width: 100%; border-radius: 8px; display: none; }
            button { background: #007bff; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; }
            button:hover { background: #0056b3; }
            .result { margin-top: 20px; font-weight: bold; padding: 10px; border-radius: 5px; }
            .success { background: #d4edda; color: #155724; }
            .error { background: #f8d7da; color: #721c24; }
        </style>
    </head>
    <body>
        <div class="card">
            <h2>Reconocimiento de Placas (ALPR)</h2>
            <p>Selecciona una imagen de la galería de tu dispositivo:</p>
            <input type="file" id="imageInput" accept="image/*" onchange="previewImage(event)">
            <br><br>
            <img id="imagePreview" class="preview" alt="Vista previa">
            <br><br>
            <button onclick="uploadImage()">Procesar Placa</button>
            <div id="resultOutput"></div>
        </div>

        <script>
            function previewImage(event) {
                const reader = new FileReader();
                reader.onload = function() {
                    const output = document.getElementById('imagePreview');
                    output.src = reader.result;
                    output.style.display = 'block';
                };
                reader.readAsDataURL(event.target.files[0]);
            }

            async function uploadImage() {
                const input = document.getElementById('imageInput');
                const resultDiv = document.getElementById('resultOutput');
                
                if (input.files.length === 0) {
                    alert("Por favor selecciona una imagen primero.");
                    return;
                }

                const formData = new FormData();
                formData.append('file', input.files[0]);
                resultDiv.className = "result";
                resultDiv.innerHTML = "Procesando imagen...";

                try {
                    const response = await fetch('/detect-plate', {
                        method: 'POST',
                        body: formData
                    });
                    const data = await response.json();

                    if (response.ok && data.placa_detectada !== "NO DETECTADA") {
                        resultDiv.className = "result success";
                        resultDiv.innerHTML = `
                            ✅ Placa Detectada: <strong>${data.placa_detectada}</strong><br>
                            📊 Confianza: ${data.confianza}
                        `;
                    } else {
                        resultDiv.className = "result error";
                        resultDiv.innerHTML = `❌ ${data.estado || "No se detectó una placa válida"}`;
                    }
                } catch (err) {
                    resultDiv.className = "result error";
                    resultDiv.innerHTML = "Error al conectar con el servidor.";
                }
            }
        </script>
    </body>
    </html>
    """

@app.post("/detect-plate")
async def detect_plate(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="El archivo subido debe ser una imagen.")
    
    contents = await file.read()
    result = plate_service.process_image(contents)
    return result
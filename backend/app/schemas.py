from pydantic import BaseModel, Field

class PredictionRequest(BaseModel):
    nota_ia: float = Field(..., ge=0.0, le=5.0, description="Nota de la materia Inteligencia Artificial (0.0 a 5.0)")
    pga: float = Field(..., ge=0.0, le=5.0, description="Promedio General Acumulado (0.0 a 5.0)")

class PredictionResponse(BaseModel):
    resultado: str
    codigo_clase: int
    mensaje: str
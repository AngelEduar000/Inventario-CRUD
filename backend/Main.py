from fastapi import FastAPI
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from typing import List
from pydantic import BaseModel

app = FastAPI()
# Usar comando env\Scripts\activate para activar el entorno virtual y luego ejecutar uvicorn Main:app --reload
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # O usa ["*"] para permitir todos si es solo dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Parámetros para tu base de datos Neon
DB_USER = "neondb_owner"
DB_PASSWORD = "npg_6OuAWfLD8rvk"
DB_HOST = "ep-withered-star-aetjn118-pooler.c-2.us-east-2.aws.neon.tech"
DB_PORT = "5432"
DB_NAME = "neondb"
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?sslmode=require&channel_binding=require"

# Crear motor y sesión
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Modelo Pydantic para validar datos devueltos
class InventarioItem(BaseModel):
    id_inventario: str
    fecha_entrada: str
    fecha_salida: str | None
    id_producto: str
    producto_descripcion: str
    humedad: float | None
    fermentacion: float | None
    id_bodega: str
    bodega_codigo: str
@app.get("/api/inventario", response_model=List[InventarioItem])
def leer_inventario():
    session = SessionLocal()
    try:
        session.execute(text("SET search_path TO inventario_ms"))
        result = session.execute(text("""
            SELECT 
                id_inventario,
                fecha_entrada,
                fecha_salida,
                id_producto,
                producto_descripcion,
                humedad,
                fermentacion,
                id_bodega,
                bodega_codigo
            FROM vista_inventario_completo
        """))
        datos = []
        for row in result.mappings():
            datos.append({
                "id_inventario": str(row["id_inventario"]),
                "fecha_entrada": str(row["fecha_entrada"]),
                "fecha_salida": str(row["fecha_salida"]) if row["fecha_salida"] else None,
                "id_producto": str(row["id_producto"]),
                "producto_descripcion": row["producto_descripcion"],
                "humedad": row["humedad"],
                "fermentacion": row["fermentacion"],
                "id_bodega": str(row["id_bodega"]),
                "bodega_codigo": row["bodega_codigo"]
            })
        return datos
    finally:
        session.close()






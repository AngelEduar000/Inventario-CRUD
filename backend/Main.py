from fastapi import FastAPI
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from typing import List, Optional
from pydantic import BaseModel
from fastapi import HTTPException

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

# Modelo para crear/actualizar inventario
class InventarioCreate(BaseModel):
    fecha_entrada: str
    id_producto: str
    producto_descripcion: str
    humedad: float
    fermentacion: float
    id_bodega: str
    bodega_codigo: str

class InventarioUpdate(BaseModel):
    fecha_entrada: Optional[str] = None
    id_producto: Optional[str] = None
    producto_descripcion: Optional[str] = None
    humedad: Optional[float] = None
    fermentacion: Optional[float] = None
    id_bodega: Optional[str] = None
    bodega_codigo: Optional[str] = None

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

# Crear nuevo inventario
# Crear # Crear nuevo inventario
@app.post("/api/inventario", response_model=InventarioItem)
def crear_inventario(item: InventarioCreate):
    session = SessionLocal()
    try:
        session.execute(text("SET search_path TO inventario_ms"))
        
        # Generar un nuevo UUID para el inventario
        result = session.execute(text("SELECT gen_random_uuid() as new_id"))
        new_id = str(result.scalar())
        
        # VERIFICAR SI EL PRODUCTO EXISTE, SINO CREARLO
        result = session.execute(
            text("SELECT id_producto FROM producto WHERE id_producto = :id_producto"),
            {"id_producto": item.id_producto}
        )
        producto_existe = result.fetchone()
        
        if not producto_existe:
            # Crear nuevo producto
            session.execute(
                text("""
                    INSERT INTO producto (id_producto, descripcion, humedad, fermentacion)
                    VALUES (:id_producto, :descripcion, :humedad, :fermentacion)
                """),
                {
                    "id_producto": item.id_producto,
                    "descripcion": item.producto_descripcion,
                    "humedad": item.humedad,
                    "fermentacion": item.fermentacion
                }
            )
        else:
            # Actualizar producto existente
            session.execute(
                text("""
                    UPDATE producto 
                    SET descripcion = :descripcion, humedad = :humedad, fermentacion = :fermentacion
                    WHERE id_producto = :id_producto
                """),
                {
                    "descripcion": item.producto_descripcion,
                    "humedad": item.humedad,
                    "fermentacion": item.fermentacion,
                    "id_producto": item.id_producto
                }
            )
        
        # BUSCAR BODEGA POR CÓDIGO (no por ID)
        result = session.execute(
            text("SELECT id_bodega FROM bodega WHERE codigo = :codigo"),
            {"codigo": item.bodega_codigo}
        )
        bodega_existente = result.fetchone()
        
        id_bodega_final = item.id_bodega
        
        if bodega_existente:
            # Usar la bodega existente
            id_bodega_final = str(bodega_existente[0])
            print(f"Usando bodega existente: {id_bodega_final} con código: {item.bodega_codigo}")
        else:
            # Crear nueva bodega
            session.execute(
                text("""
                    INSERT INTO bodega (id_bodega, codigo)
                    VALUES (:id_bodega, :codigo)
                """),
                {
                    "id_bodega": item.id_bodega,
                    "codigo": item.bodega_codigo
                }
            )
            id_bodega_final = item.id_bodega
            print(f"Creando nueva bodega: {id_bodega_final} con código: {item.bodega_codigo}")
        
        # Insertar el nuevo registro en inventario
        session.execute(
            text("""
                INSERT INTO inventario (id_inventario, fecha_entrada, id_producto, id_bodega)
                VALUES (:id_inventario, :fecha_entrada, :id_producto, :id_bodega)
            """),
            {
                "id_inventario": new_id,
                "fecha_entrada": item.fecha_entrada,
                "id_producto": item.id_producto,
                "id_bodega": id_bodega_final
            }
        )
        
        session.commit()
        
        # Devolver el item creado
        return {
            "id_inventario": new_id,
            "fecha_entrada": item.fecha_entrada,
            "fecha_salida": None,
            "id_producto": item.id_producto,
            "producto_descripcion": item.producto_descripcion,
            "humedad": item.humedad,
            "fermentacion": item.fermentacion,
            "id_bodega": id_bodega_final,
            "bodega_codigo": item.bodega_codigo
        }
        
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear inventario: {str(e)}")
    finally:
        session.close()
        
@app.put("/api/inventario/{id_inventario}", response_model=InventarioItem)
def actualizar_inventario(id_inventario: str, item: InventarioUpdate):
    session = SessionLocal()
    try:
        session.execute(text("SET search_path TO inventario_ms"))
        
        # Verificar si existe el inventario
        result = session.execute(
            text("SELECT id_inventario FROM inventario WHERE id_inventario = :id"),
            {"id": id_inventario}
        )
        if not result.fetchone():
            raise HTTPException(status_code=404, detail="Inventario no encontrado")
        
        # Actualizar inventario si se proporciona fecha_entrada
        if item.fecha_entrada:
            session.execute(
                text("UPDATE inventario SET fecha_entrada = :fecha WHERE id_inventario = :id"),
                {"fecha": item.fecha_entrada, "id": id_inventario}
            )
        
        # Obtener el id_producto y id_bodega del inventario
        result = session.execute(
            text("SELECT id_producto, id_bodega FROM inventario WHERE id_inventario = :id"),
            {"id": id_inventario}
        )
        inventario_data = result.fetchone()
        id_producto = inventario_data[0]
        id_bodega = inventario_data[1]
        
        # Actualizar producto si se proporcionan datos
        if any([item.producto_descripcion, item.humedad is not None, item.fermentacion is not None]):
            update_fields = []
            params = {"id_producto": id_producto}
            
            if item.producto_descripcion:
                update_fields.append("descripcion = :descripcion")
                params["descripcion"] = item.producto_descripcion
            if item.humedad is not None:
                update_fields.append("humedad = :humedad")
                params["humedad"] = item.humedad
            if item.fermentacion is not None:
                update_fields.append("fermentacion = :fermentacion")
                params["fermentacion"] = item.fermentacion
                
            if update_fields:
                session.execute(
                    text(f"UPDATE producto SET {', '.join(update_fields)} WHERE id_producto = :id_producto"),
                    params
                )
        
        # Actualizar bodega si se proporciona código
        if item.bodega_codigo:
            session.execute(
                text("UPDATE bodega SET codigo = :codigo WHERE id_bodega = :id_bodega"),
                {"codigo": item.bodega_codigo, "id_bodega": id_bodega}
            )
        
        session.commit()
        
        # Obtener el item actualizado
        result = session.execute(
            text("""
                SELECT 
                    i.id_inventario,
                    i.fecha_entrada,
                    i.fecha_salida,
                    i.id_producto,
                    p.descripcion as producto_descripcion,
                    p.humedad,
                    p.fermentacion,
                    i.id_bodega,
                    b.codigo as bodega_codigo
                FROM inventario i
                JOIN producto p ON i.id_producto = p.id_producto
                JOIN bodega b ON i.id_bodega = b.id_bodega
                WHERE i.id_inventario = :id
            """),
            {"id": id_inventario}
        )
        
        updated_item = result.mappings().first()
        if not updated_item:
            raise HTTPException(status_code=404, detail="Error al recuperar el item actualizado")
        
        return {
            "id_inventario": str(updated_item["id_inventario"]),
            "fecha_entrada": str(updated_item["fecha_entrada"]),
            "fecha_salida": str(updated_item["fecha_salida"]) if updated_item["fecha_salida"] else None,
            "id_producto": str(updated_item["id_producto"]),
            "producto_descripcion": updated_item["producto_descripcion"],
            "humedad": updated_item["humedad"],
            "fermentacion": updated_item["fermentacion"],
            "id_bodega": str(updated_item["id_bodega"]),
            "bodega_codigo": updated_item["bodega_codigo"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar inventario: {str(e)}")
    finally:
        session.close()

# Eliminar inventario
@app.delete("/api/inventario/{id_inventario}", status_code=204)
def eliminar_inventario(id_inventario: str):
    session = SessionLocal()
    try:
        session.execute(text("SET search_path TO inventario_ms"))
        result = session.execute(
            text("""
                SELECT inventario_ms.eliminar_registro_inventario(:id)
            """), {"id": id_inventario}
        )
        eliminado = result.scalar()
        session.commit()
        if eliminado is None:
            raise HTTPException(status_code=404, detail="No se encontró el registro para eliminar")
        return None  # Para status 204 No Content
    finally:
        session.close()
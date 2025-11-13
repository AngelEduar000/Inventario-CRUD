import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// --- INTERFACES (Basadas en tu tabla SQL) ---

/**
 * Representa un objeto Producto como se lee de la API.
 * Podría incluir campos adicionales (como el nombre del proveedor).
 */
export interface Producto {
  id_producto: string;
  descripcion: string;
  cedula: string;
  proveedor_nombre?: string; // Opcional, si tu API lo devuelve
}

/**
 * Define la data necesaria para CREAR un nuevo producto.
 * El id_producto es un VARCHAR, por lo que probablemente el usuario deba crearlo (ej: "PROD-001").
 */
export interface ProductoCreate {
  id_producto: string;
  descripcion: string;
  cedula: string;
}

/**
 * Define los campos que se pueden ACTUALIZAR en un producto.
 * Todos los campos son opcionales.
 */
export interface ProductoUpdate {
  descripcion?: string;
  cedula?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  // Asumo que tu API de productos vive en la misma base que la de inventario
  private baseApiUrl = 'http://127.0.0.1:8000/api';
  private productosUrl = `${this.baseApiUrl}/productos`;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene la lista completa de productos.
   */
  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.productosUrl);
  }

  /**
   * Obtiene un solo producto por su ID.
   * (Necesario para el modal de edición)
   */
  getProductoById(id: string): Observable<Producto> {
    return this.http.get<Producto>(`${this.productosUrl}/${id}`);
  }

  /**
   * Crea un nuevo producto.
   */
  crearProducto(producto: ProductoCreate): Observable<Producto> {
    return this.http.post<Producto>(this.productosUrl, producto);
  }

  /**
   * Actualiza un producto existente por su ID.
   */
  actualizarProducto(id: string, producto: ProductoUpdate): Observable<Producto> {
    return this.http.put<Producto>(`${this.productosUrl}/${id}`, producto);
  }

  /**
   * Elimina un producto por su ID.
   */
  eliminarProducto(id: string): Observable<any> {
    return this.http.delete(`${this.productosUrl}/${id}`);
  }

  /**
   * Busca productos basado en un término.
   * (Tu JS de inventario tenía búsqueda, así que este también debería)
   */
  buscarProductos(term: string): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.productosUrl}/buscar/${encodeURIComponent(term)}`);
  }

  // --- NOTA ---
  // El formulario para crear/editar productos necesitará un dropdown de Proveedores.
  // Deberás crear un `proveedor.service.ts` para obtener la lista de proveedores
  // e inyectar ESE servicio en tu `productos.component.ts`.
}
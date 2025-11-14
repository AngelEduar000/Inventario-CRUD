import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


export interface Proveedor {
  cedula: string;
  nombre: string;
  descripcion?: string; // Opcional (TEXT)
  telefono?: string;    // Opcional
  correo?: string;      // Opcional
  ciudad?: string;      // Opcional
  vereda?: string;      // Opcional
  observaciones?: string; // Opcional (TEXT)
  activo: boolean;        // (DEFAULT TRUE)
}

/**
 * Interfaz para crear un nuevo Proveedor.
 * La 'cedula' y 'nombre' son obligatorios (PK y NOT NULL).
 * 'activo' es opcional porque la BD tiene un DEFAULT.
 */
export interface ProveedorCreate {
  cedula: string;
  nombre: string;
  descripcion?: string;
  telefono?: string;
  correo?: string;
  ciudad?: string;
  vereda?: string;
  observaciones?: string;
  activo?: boolean;
}

/**
 * Interfaz para actualizar un Proveedor.
 * Todos los campos son opcionales (Partial).
 * La cédula (PK) no se puede actualizar, por eso no está aquí.
 */
export interface ProveedorUpdate {
  nombre?: string;
  descripcion?: string;
  telefono?: string;
  correo?: string;
  ciudad?: string;
  vereda?: string;
  observaciones?: string;
  activo?: boolean;
}


// ============================================
// SERVICIO DE PROVEEDOR
// ============================================

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {

  // URL base de tu API (ajusta el puerto y la ruta si es necesario)
  private apiUrl = '/api/proveedores';

  constructor(private http: HttpClient) { }

  /**
   * 1. OBTENER TODOS los proveedores
   * (GET /api/proveedores)
   */
  getProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.apiUrl);
  }

  /**
   * 2. OBTENER UN proveedor por su cédula (PK)
   * (GET /api/proveedores/{cedula})
   */
  getProveedorById(cedula: string): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiUrl}/${cedula}`);
  }

  /**
   * 3. AGREGAR un nuevo proveedor
   * (POST /api/proveedores)
   */
  agregarProveedor(proveedor: ProveedorCreate): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.apiUrl, proveedor);
  }

  /**
   * 4. ACTUALIZAR un proveedor existente
   * (PUT /api/proveedores/{cedula})
   */
  actualizarProveedor(cedula: string, data: ProveedorUpdate): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.apiUrl}/${cedula}`, data);
  }

  /**
   * 5. "ELIMINAR" (Desactivar) un proveedor
   * (PATCH /api/proveedores/{cedula}/desactivar)
   * Nota: Es mejor desactivar (PATCH) que borrar (DELETE).
   */
  desactivarProveedor(cedula: string): Observable<Proveedor> {
    // Enviamos solo el campo 'activo: false'
    return this.http.patch<Proveedor>(`${this.apiUrl}/${cedula}`, { activo: false });
  }

  /**
   * 6. ELIMINAR permanentemente un proveedor (¡Cuidado!)
   * (DELETE /api/proveedores/{cedula})
   * Descomenta si prefieres el borrado físico.
   */
  // eliminarProveedor(cedula: string): Observable<void> {
  //   return this.http.delete<void>(`${this.apiUrl}/${cedula}`);
  // }

  /**
   * 7. BUSCAR proveedores (Ej. por nombre o cédula)
   * (GET /api/proveedores/buscar/{termino})
   */
  buscarProveedores(termino: string): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(`${this.apiUrl}/buscar/${termino}`);
  }
}


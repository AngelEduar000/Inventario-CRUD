import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// --- INTERFACES BASADAS EN TU BACKEND ---

// Para la tabla (incluye los JOINs de tu GET /api/pedidos)
export interface Pedido {
  id_pedido: number;
  cedula: string;
  id_producto: string;
  fecha_entrega: string;
  cantidad: number;
  peso_total?: number;
  observaciones?: string;
  recibido: boolean;
  // Campos de los JOINs
  proveedor_nombre: string;
  producto_desc: string;
}

// Para crear un pedido (basado en tu POST /api/pedidos)
export interface PedidoCreate {
  cedula: string;
  id_producto: string;
  fecha_entrega: string;
  cantidad: number;
  peso_total?: number;
  observaciones?: string;
}

// Para actualizar un pedido (basado en tu PUT /api/pedidos/:id)
export interface PedidoUpdate {
  cedula: string;
  id_producto: string;
  fecha_entrega: string;
  cantidad: number;
  peso_total?: number;
  observaciones?: string;
  recibido: boolean;
}

// Para los dropdowns
export interface ProveedorDropdown {
  cedula: string;
  nombre: string;
}

export interface ProductoDropdown {
  id_producto: string;
  descripcion: string; // Tu API de productos devuelve 'descripcion'
}

// --- CLASE DEL SERVICIO ---

@Injectable({
  providedIn: 'root'
})
export class PedidoService {

  // El puerto 3005 es de tu backend de pedidos
  private API_BASE = '/api/pedidos';

  constructor() { }

  /**
   * Wrapper genérico para fetch que maneja la estructura { data: [...] }
   */
  private async apiRequest(url: string, options: RequestInit = {}): Promise<any> {
    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
      });

      if (response.status === 204) { // Para DELETE exitoso
        return null;
      }

      const jsonResponse = await response.json();

      if (!response.ok || !jsonResponse.success) {
        throw new Error(jsonResponse.error || `Error ${response.status}`);
      }
      
      // Devuelve solo el array/objeto 'data'
      return jsonResponse.data; 

    } catch (error) {
      console.error('Error en la petición API:', error);
      let errorMsg = (error as Error).message;
      if (errorMsg.includes('Unexpected token')) {
        errorMsg = 'Error de formato. Se esperaba JSON.';
      }
      throw new Error(errorMsg);
    }
  }

  // --- Métodos CRUD para Pedidos ---
  // --- Métodos CRUD para Pedidos ---

  getPedidos(): Promise<Pedido[]> {
    return this.apiRequest(`${this.API_BASE}/pedidos`);
  }

  getPedidoById(id: number | string): Promise<Pedido> {
    return this.apiRequest(`${this.API_BASE}/pedidos/${id}`);
  }

  crearPedido(pedido: PedidoCreate): Promise<Pedido> {
    return this.apiRequest(`${this.API_BASE}/pedidos`, {
      method: 'POST',
      body: JSON.stringify(pedido)
    });
  }

  actualizarPedido(id: number | string, pedido: PedidoUpdate): Promise<Pedido> {
    return this.apiRequest(`${this.API_BASE}/pedidos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pedido)
    });
  }

  eliminarPedido(id: number | string): Promise<void> {
    return this.apiRequest(`${this.API_BASE}/pedidos/${id}`, {
      method: 'DELETE'
    });
  }

  buscarPedidos(termino: string): Promise<Pedido[]> {
    return this.apiRequest(`${this.API_BASE}/pedidos/buscar/${termino}`);
  }

  // --- Métodos para Dropdowns (basados en tu backend) ---

  getProveedores(): Promise<ProveedorDropdown[]> {
    // Tu backend ya tiene esta ruta para los dropdowns
    return this.apiRequest('http://localhost:3005/api/proveedores');
  }

  getProductos(): Promise<ProductoDropdown[]> {
    // Tu backend ya tiene esta ruta para los dropdowns
    return this.apiRequest('http://localhost:3005/api/productos');
  }
}

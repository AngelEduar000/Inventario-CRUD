import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InventarioItem {
  id_inventario: string;
  fecha_entrada: string;
  fecha_salida?: string;
  id_producto: string;
  producto_descripcion: string;
  humedad: number;
  fermentacion: number;
  id_bodega: string;
  bodega_codigo: string;
}

export interface InventarioCreate {
  fecha_entrada: string;
  id_producto: string;
  producto_descripcion: string;
  humedad: number;
  fermentacion: number;
  id_bodega: string;
  bodega_codigo: string;
}

export interface InventarioUpdate {
  fecha_entrada?: string;
  id_producto?: string;
  producto_descripcion?: string;
  humedad?: number;
  fermentacion?: number;
  id_bodega?: string;
  bodega_codigo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private apiUrl = 'http://127.0.0.1:8000/api/inventario';

  constructor(private http: HttpClient) {}

  getInventario(): Observable<InventarioItem[]> {
    return this.http.get<InventarioItem[]>(this.apiUrl);
  }

  agregarInventario(item: InventarioCreate): Observable<InventarioItem> {
    // Generar UUIDs para producto y bodega si no se proporcionan
    const itemToSend = {
      ...item,
      id_producto: item.id_producto || this.generateUUID(),
      id_bodega: item.id_bodega || this.generateUUID()
    };
    return this.http.post<InventarioItem>(this.apiUrl, itemToSend);
  }

  actualizarInventario(id: string, item: InventarioUpdate): Observable<InventarioItem> {
    return this.http.put<InventarioItem>(`${this.apiUrl}/${id}`, item);
  }

  eliminarInventario(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}import { Component, OnInit } from '@angular/core';
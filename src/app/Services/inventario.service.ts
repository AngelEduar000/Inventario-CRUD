import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// --- INTERFACES DE INVENTARIO ---
export interface InventarioItem {
  id_inventario: string;
  fecha_entrada: string;
  fecha_salida?: string;
  id_producto: string;
  nombre_producto: string;
  humedad: number;
  fermentacion: number;
  id_bodega: string;
  nombre_bodega: string;
}

export interface InventarioCreate {
  fecha_entrada: string;
  id_producto: string;
  humedad: number | null;
  fermentacion: number | null;
  id_bodega: string;
}

export interface InventarioUpdate {
  fecha_entrada?: string | null;
  fecha_salida?: string | null;
  id_producto?: string;
  humedad?: number | null;
  fermentacion?: number | null;
  id_bodega?: string;
}

// --- INTERFACES DE DROPDOWNS ---
export interface Producto {
  id_producto: string;
  descripcion: string;
}

export interface Bodega {
  id_bodega: string;
  codigo: string;
}

export interface TestResponse {
  success: boolean;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InventarioService {

  private baseApiUrl = 'http://localhost:3001/api';

  private inventarioUrl = `${this.baseApiUrl}/inventario`;
  private productosUrl = `${this.baseApiUrl}/productos`;
  private bodegasUrl = `${this.baseApiUrl}/bodegas`;
  private testUrl = `${this.baseApiUrl}/test`;

  constructor(private http: HttpClient) {}

  // --- CRUD INVENTARIO ---
  getInventario(): Observable<InventarioItem[]> {
    return this.http
      .get<{ success: boolean; data: InventarioItem[] }>(this.inventarioUrl)
      .pipe(map(res => res.data));
  }

  agregarInventario(item: InventarioCreate): Observable<InventarioItem> {
    return this.http.post<InventarioItem>(this.inventarioUrl, item);
  }

  actualizarInventario(id: string, item: InventarioUpdate): Observable<InventarioItem> {
    return this.http.put<InventarioItem>(`${this.inventarioUrl}/${id}`, item);
  }

  eliminarInventario(id: string): Observable<any> {
    return this.http.delete(`${this.inventarioUrl}/${id}`);
  }

  getInventarioById(id: string): Observable<InventarioItem> {
    return this.http.get<InventarioItem>(`${this.inventarioUrl}/${id}`);
  }

  buscarInventario(term: string): Observable<InventarioItem[]> {
    return this.http.get<InventarioItem[]>(`${this.inventarioUrl}/buscar/${encodeURIComponent(term)}`);
  }

  

  // --- DROPDOWNS ---
  getProductos(): Observable<Producto[]> {
    return this.http
      .get<{ success: boolean; data: Producto[] }>(this.productosUrl)
      .pipe(map(res => res.data));
  }

  getBodegas(): Observable<Bodega[]> {
    return this.http
      .get<{ success: boolean; data: Bodega[] }>(this.bodegasUrl)
      .pipe(map(res => res.data));
  }

  // --- TEST ---
  testConnection(): Observable<TestResponse> {
    return this.http.get<TestResponse>(this.testUrl);
  }
}

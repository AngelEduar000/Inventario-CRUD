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

@Injectable({
  providedIn: 'root'
})
export class InventarioService {
  private apiUrl = 'http://127.0.0.1:8000/api/inventario';

  constructor(private http: HttpClient) {}

  getInventario(): Observable<InventarioItem[]> {
    return this.http.get<InventarioItem[]>(this.apiUrl);
  }
}

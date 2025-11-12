import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// 1. Definimos la "forma" (interfaz) de nuestros datos
export interface Bodega {
  id_bodega: string;
  codigo: string;
}

export interface StatusResponse {
  message: string;
  bodegas_count: number;
}

@Injectable({
  providedIn: 'root'
})
export class BodegaService {
  
  // 2. ¡IMPORTANTE! Esta es la URL de tu microservicio
  // Asegúrate de que el puerto (3001) sea el correcto
  private apiUrl = 'http://localhost:3000/api/bodegas'; 
  private statusUrl = 'http://localhost:3000/api/status';

  // 3. Inyectamos el HttpClient de Angular
  constructor(private http: HttpClient) { }

  // 4. Traducimos todas las llamadas fetch a métodos de HttpClient
  
  // GET /api/status
  getStatus(): Observable<StatusResponse> {
    return this.http.get<StatusResponse>(this.statusUrl);
  }

  // GET /api/bodegas
  getBodegas(): Observable<Bodega[]> {
    return this.http.get<Bodega[]>(this.apiUrl);
  }

  // POST /api/bodegas
  createBodega(bodega: { codigo: string }): Observable<Bodega> {
    return this.http.post<Bodega>(this.apiUrl, bodega);
  }

  // PUT /api/bodegas/:id
  updateBodega(id: string, bodega: { codigo: string }): Observable<Bodega> {
    return this.http.put<Bodega>(`${this.apiUrl}/${id}`, bodega);
  }

  // DELETE /api/bodegas/:id
  deleteBodega(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // GET /api/bodegas/buscar/:term
  searchBodegas(term: string): Observable<Bodega[]> {
    return this.http.get<Bodega[]>(`${this.apiUrl}/buscar/${term}`);
  }
}
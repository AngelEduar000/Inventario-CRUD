import { Injectable } from '@angular/core';

// Interfaz para tipar los datos del reporte
export interface DashboardStats {
totalProductos: number;
totalPedidosActivos: number;
totalProveedores: number;
totalBodegas: number;
porcentajeEntregasCumplidas: number;
}

@Injectable({
providedIn: 'root'
})
export class ReporteService {

// API que acabamos de crear en el backend (puerto 3005)
private apiUrl = 'http://localhost:3006/api/dashboard-stats';

constructor() { }

/**
   * Realiza una petición genérica con fetch y maneja la respuesta
   */
 async apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
try {
const response = await fetch(url, {
headers: { 'Content-Type': 'application/json', ...options.headers },
...options
});

const jsonResponse = await response.json();

if (!response.ok) {
throw new Error(jsonResponse.error || `Error ${response.status}`);
 }

// Devuelve la propiedad 'data' de la respuesta
return jsonResponse.data;

} catch (error) {
 console.error('Error en la petición API:', error);
 throw error;
 }
 }

 /**
   * Obtiene las estadísticas del dashboard
   */
 getDashboardStats(): Promise<DashboardStats> {
 return this.apiRequest<DashboardStats>(this.apiUrl);
 }
}
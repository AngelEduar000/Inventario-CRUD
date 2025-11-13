import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Importa CommonModule
import { ReporteService, DashboardStats } from '../Services/reporte.service';

@Component({
selector: 'app-reportes',
standalone: true,
imports: [CommonModule], // Añade CommonModule para usar *ngIf
templateUrl: './reportes.html',
  styleUrls: ['./reportes.css']
})
export class Reportes implements OnInit {

// Propiedad para el año (igual que en proveedores)
public currentYear: number = new Date().getFullYear();

public stats: DashboardStats | null = null;
public loading = true;
public error: string | null = null;

// Inyectamos el nuevo servicio
constructor(private reporteService: ReporteService) { }

ngOnInit() {
 this.cargarEstadisticas();
}

 async cargarEstadisticas() {
this.loading = true;
this.error = null;
try {
this.stats = await this.reporteService.getDashboardStats();
} catch (err) {
 this.error = 'Error al cargar las estadísticas: ' + (err as Error).message;
console.error(err);
} finally {
this.loading = false;
 }
}
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';   

// Importamos el Servicio y las Interfaces
import { BodegaService, Bodega, StatusResponse } from '../Services/bodega';

@Component({
  selector: 'app-bodegas',
  standalone: true, 
  imports: [
    CommonModule, 
    FormsModule   
  ],
  // --- CORRECCIÓN AQUÍ ---
  // Apunta a tus nombres de archivo reales
  templateUrl: './bodegas.html', 
  styleUrls: ['./bodegas.css']
  // -------------------------
})
// --- TU NOMBRE DE CLASE ---
export class bodegas implements OnInit {
// -------------------------

  // --- Propiedades de Estado ---
  public bodegas: Bodega[] = [];
  public bodegasCount: number = 0;
  public statusMessage: string = 'Cargando conexión...';
  public statusClass: string = 'status';
  public isLoading: boolean = false;
  public searchTerm: string = '';
  
  // --- Estado del Modal ---
  public isModalOpen: boolean = false;
  public editingId: string | null = null;
  public currentBodega = { codigo: '' }; 

  // Inyectamos el servicio
  constructor(private bodegaService: BodegaService) { }

  // ngOnInit se ejecuta al inicio
  ngOnInit(): void {
    this.checkConnection();
  }

  // --- MÉTODOS (copia y pega todos los métodos de la respuesta anterior aquí) ---
  // checkConnection(), loadBodegas(), handleSearch(), openModal(), 
  // closeModal(), saveBodega(), deleteBodega(), updateStats()
  // ... (Pega el resto de los métodos aquí) ...

  checkConnection(): void {
    this.statusMessage = 'Verificando conexión...';
    this.bodegaService.getStatus().subscribe({
      next: (data) => {
        this.statusMessage = `✅ ${data.message}`;
        this.statusClass = 'status connected';
        this.bodegasCount = data.bodegas_count;
        this.loadBodegas(); 
      },
      error: (err) => {
        this.statusMessage = `❌ Error de conexión: ${err.message}`;
        this.statusClass = 'status error';
      }
    });
  }

  loadBodegas(): void {
    this.isLoading = true;
    this.bodegaService.getBodegas().subscribe({
      next: (data) => {
        this.bodegas = data;
        this.updateStats();
        this.isLoading = false;
      },
      error: (err) => {
        alert('Error: ' + err.message);
        this.isLoading = false;
      }
    });
  }

  handleSearch(): void {
    if (!this.searchTerm.trim()) {
      this.loadBodegas(); 
      return;
    }

    this.isLoading = true;
    this.bodegaService.searchBodegas(this.searchTerm).subscribe({
      next: (results) => {
        this.bodegas = results;
        this.isLoading = false;
      },
      error: (err) => {
        alert('❌ Error: ' + err.message);
        this.isLoading = false;
      }
    });
  }

  openModal(bodega: Bodega | null = null): void {
    if (bodega) {
      this.editingId = bodega.id_bodega;
      this.currentBodega = { ...bodega }; 
    } else {
      this.editingId = null;
      this.currentBodega = { codigo: '' }; 
    }
    this.isModalOpen = true;
  }

  closeModal(): void {
    this.isModalOpen = false;
  }

  saveBodega(): void {
    if (!this.currentBodega.codigo.trim()) {
      alert('Por favor ingresa un código para la bodega');
      return;
    }

    this.isLoading = true;
    
    const operation = this.editingId
      ? this.bodegaService.updateBodega(this.editingId, this.currentBodega)
      : this.bodegaService.createBodega(this.currentBodega);

    operation.subscribe({
      next: (savedBodega) => {
        this.closeModal();
        this.loadBodegas(); 
        const action = this.editingId ? 'actualizada' : 'creada';
        alert(`✅ Bodega ${action}: ${savedBodega.codigo}`);
      },
      error: (err) => {
        alert('❌ Error: ' + (err.error?.error || err.message));
        this.isLoading = false;
      }
    });
  }

  deleteBodega(bodega: Bodega): void {
    if (!confirm(`¿Estás seguro de eliminar la bodega?\n\n${bodega.codigo}`)) {
      return;
    }

    this.isLoading = true;
    this.bodegaService.deleteBodega(bodega.id_bodega).subscribe({
      next: () => {
        this.loadBodegas(); 
        alert('✅ Bodega eliminada');
      },
      error: (err) => {
        alert('❌ Error: ' + err.message);
        this.isLoading = false;
      }
    });
  }

  updateStats(): void {
    this.bodegasCount = this.bodegas.length;
  }
}
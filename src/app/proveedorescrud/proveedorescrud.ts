import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Interfaz del proveedor
interface Supplier {
  cedula: string;
  nombre: string;
  descripcion?: string;
  telefono?: string;
  correo?: string;
  ciudad?: string;
  vereda?: string;
  observaciones?: string;
  activo: boolean;
}

@Component({
  selector: 'app-proveedores-crud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proveedorescrud.html',
  styleUrls: ['./proveedorescrud.css']
})
export class Proveedorescrud implements OnInit {

  /** Año actual (por si lo usas en el footer) */
  public currentYear: number = new Date().getFullYear();

  /** Listas principales */
  allSuppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];

  /** Control de búsqueda y carga */
  searchTerm: string = '';
  loading = false;

  /** Control del modal */
  modalVisible = false;
  isEditing = false;
  currentSupplierId: string | null = null;

  /** Proveedor en edición / creación */
  currentSupplier: Supplier = this.createEmptySupplier();

  /** URLs API (ajusta si es necesario) */
  private API_BASE = 'api/proveedores';
  private API_TEST = 'api/test';

  // -----------------------------------------------------------
  // CICLO DE VIDA
  // -----------------------------------------------------------
  ngOnInit() {
    console.log('🚀 Componente de proveedores inicializado');
    this.testConnection();
    this.loadSuppliers();
  }

  // -----------------------------------------------------------
  // MÉTODOS AUXILIARES
  // -----------------------------------------------------------
  createEmptySupplier(): Supplier {
    return {
      cedula: '',
      nombre: '',
      descripcion: '',
      telefono: '',
      correo: '',
      ciudad: '',
      vereda: '',
      observaciones: '',
      activo: true
    };
  }

  showMessage(message: string, type: 'info' | 'error' | 'success' = 'info') {
    alert(`${type.toUpperCase()}: ${message}`);
  }

  async apiRequest(url: string, options: RequestInit = {}) {
    try {
      const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
      });

      if (response.status === 204) return null; // DELETE sin cuerpo

      const jsonResponse = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(jsonResponse.error || `Error ${response.status}`);
      }

      return jsonResponse;
    } catch (error) {
      console.error('❌ Error en la petición API:', error);
      this.showMessage('Error de conexión: ' + (error as Error).message, 'error');
      throw error;
    }
  }

  // -----------------------------------------------------------
  // CRUD PRINCIPAL
  // -----------------------------------------------------------

  /** Cargar todos los proveedores */
  async loadSuppliers(data: Supplier[] | null = null) {
    try {
      this.loading = true;
      if (!data) {
        const response = await this.apiRequest(this.API_BASE);
        // Verifica si tu backend devuelve { data: [] } o directamente []
        this.allSuppliers = Array.isArray(response) ? response : (response.data || []);
        this.filteredSuppliers = [...this.allSuppliers];
        console.log('✅ Proveedores cargados:', this.filteredSuppliers.length);
      } else {
        this.filteredSuppliers = data;
      }
    } catch {
      this.filteredSuppliers = [];
      this.allSuppliers = [];
    } finally {
      this.loading = false;
    }
  }

  /** Abre el modal para agregar */
  openAddModal() {
    console.log('🟢 Abriendo modal para nuevo proveedor');
    this.isEditing = false;
    this.currentSupplierId = null;
    this.currentSupplier = this.createEmptySupplier();
    this.modalVisible = true;
  }

  /** Abre el modal para editar */
  async editSupplier(supplierId: string) {
    console.log('✏️ Editando proveedor con cédula:', supplierId);
    try {
      const response = await this.apiRequest(`${this.API_BASE}/${supplierId}`);
      const supplier = response.data || response; // depende de tu backend
      if (!supplier) {
        this.showMessage('Proveedor no encontrado', 'error');
        return;
      }
      this.isEditing = true;
      this.currentSupplierId = supplierId;
      this.currentSupplier = supplier;
      this.modalVisible = true;
    } catch (error) {
      this.showMessage('Error al cargar el proveedor: ' + (error as Error).message, 'error');
    }
  }

  /** Elimina proveedor */
  async deleteSupplier(supplierId: string) {
    if (!confirm('¿Está seguro de eliminar este proveedor?')) return;
    try {
      await this.apiRequest(`${this.API_BASE}/${supplierId}`, { method: 'DELETE' });
      await this.loadSuppliers();
      this.showMessage('Proveedor eliminado correctamente', 'success');
    } catch (error) {
      this.showMessage('Error al eliminar el proveedor: ' + (error as Error).message, 'error');
    }
  }

  /** Guarda (agrega o actualiza) */
  async saveSupplier() {
    try {
      if (!this.currentSupplier.cedula || !this.currentSupplier.nombre) {
        this.showMessage('La cédula y el nombre son obligatorios', 'error');
        return;
      }

      const body = JSON.stringify(this.currentSupplier);

      if (this.isEditing && this.currentSupplierId) {
        console.log('🔄 Actualizando proveedor:', this.currentSupplierId);
        await this.apiRequest(`${this.API_BASE}/${this.currentSupplierId}`, {
          method: 'PUT',
          body
        });
      } else {
        console.log('➕ Creando nuevo proveedor');
        await this.apiRequest(this.API_BASE, {
          method: 'POST',
          body
        });
      }

      this.modalVisible = false;
      await this.loadSuppliers();
      this.showMessage(`Proveedor ${this.isEditing ? 'actualizado' : 'agregado'} correctamente`, 'success');
    } catch (error) {
      this.showMessage('Error al guardar el proveedor: ' + (error as Error).message, 'error');
    }
  }

  closeModal() {
    console.log('❌ Cerrando modal');
    this.modalVisible = false;
  }

  /** Filtrado de proveedores */
  searchSuppliers() {
    const term = this.searchTerm.trim().toLowerCase();
    if (term === '') {
      this.filteredSuppliers = [...this.allSuppliers];
      return;
    }
    this.filteredSuppliers = this.allSuppliers.filter(s =>
      s.cedula.toLowerCase().includes(term) ||
      s.nombre.toLowerCase().includes(term) ||
      (s.telefono && s.telefono.toLowerCase().includes(term)) ||
      (s.correo && s.correo.toLowerCase().includes(term)) ||
      (s.ciudad && s.ciudad.toLowerCase().includes(term))
    );
  }

  // -----------------------------------------------------------
  // TEST DE CONEXIÓN
  // -----------------------------------------------------------
  async testConnection() {
    try {
      await this.apiRequest(this.API_TEST);
      console.log('✅ Conexión con el servidor establecida');
    } catch (error) {
      console.error('❌ Error de conexión con el servidor:', error);
    }
  }
}

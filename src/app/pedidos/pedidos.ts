import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PedidoService, Pedido, ProveedorDropdown, ProductoDropdown, PedidoCreate, PedidoUpdate } from '../Services/pedido.service';

// Importa HttpClientModule SI el servicio lo usa (aunque este usa fetch)
// import { HttpClientModule } from '@angular/common/http'; 

@Component({
  selector: 'app-pedidos-crud',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    // HttpClientModule // Descomenta si tu servicio usa HttpClient
  ],
  templateUrl: './pedidos.html',
  styleUrls: ['./pedidos.css'],
  providers: [PedidoService] // Provee el servicio
})
export class Pedidos implements OnInit {

  public currentYear: number = new Date().getFullYear();

  // Listas de datos
  allPedidos: Pedido[] = [];
  filteredPedidos: Pedido[] = [];
  proveedores: ProveedorDropdown[] = [];
  productos: ProductoDropdown[] = [];

  // Estado de la UI
  loading = true;
  searchTerm: string = '';
  modalVisible = false;
  isEditing = false;
  
  // Formulario del Modal
  // Usamos 'any' para flexibilidad entre PedidoCreate y PedidoUpdate
  currentPedido: any = this.createEmptyPedido();
  currentPedidoId: number | string | null = null;
  
  // Mensajes de error/éxito
  alertMessage: string | null = null;
  alertType: 'info' | 'error' | 'success' = 'info';

  constructor(private pedidoService: PedidoService) { }

  ngOnInit() {
    this.loadInitialData();
  }

  /**
   * Carga los dropdowns y los pedidos al iniciar
   */
  async loadInitialData() {
    this.loading = true;
    try {
      // Cargar dropdowns primero
      await this.loadDropdowns();
      // Luego cargar la tabla principal
      await this.loadPedidos();
    } catch (error) {
      this.showMessage('Error inicial al cargar datos: ' + (error as Error).message, 'error');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Carga la tabla principal de pedidos
   */
  async loadPedidos() {
    this.loading = true;
    try {
      this.allPedidos = await this.pedidoService.getPedidos();
      this.filteredPedidos = [...this.allPedidos];
    } catch (error) {
      this.showMessage('Error al cargar pedidos: ' + (error as Error).message, 'error');
      this.allPedidos = [];
      this.filteredPedidos = [];
    } finally {
      this.loading = false;
    }
  }

  /**
   * Carga los datos para los <select> del modal
   */
  async loadDropdowns() {
    try {
      // Usamos Promise.all para cargarlos en paralelo
      const [proveedoresData, productosData] = await Promise.all([
        this.pedidoService.getProveedores(),
        this.pedidoService.getProductos()
      ]);
      this.proveedores = proveedoresData;
      this.productos = productosData;
    } catch (error) {
      this.showMessage('Error al cargar listas: ' + (error as Error).message, 'error');
    }
  }

  /**
   * Filtra la tabla de pedidos según el término de búsqueda
   */
  searchPedidos() {
    const term = this.searchTerm.trim().toLowerCase();
    if (term === '') {
      this.filteredPedidos = [...this.allPedidos];
      return;
    }
    this.filteredPedidos = this.allPedidos.filter(p =>
      p.id_pedido.toString().includes(term) ||
      p.proveedor_nombre.toLowerCase().includes(term) ||
      p.producto_desc.toLowerCase().includes(term) ||
      p.cantidad.toString().includes(term)
    );
  }

  /**
   * Prepara un objeto vacío para el formulario de "Nuevo Pedido"
   */
  createEmptyPedido(): PedidoCreate {
    return {
      cedula: '',
      id_producto: '',
      fecha_entrega: this.formatDateForInput(new Date().toISOString()), // Pone la fecha de hoy
      cantidad: 1,
      peso_total: 0,
      observaciones: ''
    };
  }

  // --- Lógica del Modal ---

  openAddModal() {
    this.isEditing = false;
    this.currentPedidoId = null;
    this.currentPedido = this.createEmptyPedido();
    this.modalVisible = true;
  }

  editPedido(pedido: Pedido) {
    this.isEditing = true;
    this.currentPedidoId = pedido.id_pedido;
    // Copiamos los datos al formulario, formateando la fecha
    this.currentPedido = {
      ...pedido, // Copia todo
      fecha_entrega: this.formatDateForInput(pedido.fecha_entrega) // Sobrescribe la fecha
    };
    this.modalVisible = true;
  }

  closeModal() {
    this.modalVisible = false;
  }

  async savePedido() {
    // Validación (basada en tu backend)
    if (!this.currentPedido.cedula || !this.currentPedido.id_producto || !this.currentPedido.fecha_entrega || !this.currentPedido.cantidad) {
      this.showMessage('Proveedor, Producto, Fecha de Entrega y Cantidad son obligatorios.', 'error');
      return;
    }

    try {
      if (this.isEditing && this.currentPedidoId) {
        // --- Actualizando (PUT) ---
        // Tu backend espera el payload completo para PUT
        const payload: PedidoUpdate = {
          cedula: this.currentPedido.cedula,
          id_producto: this.currentPedido.id_producto,
          fecha_entrega: this.currentPedido.fecha_entrega,
          cantidad: this.currentPedido.cantidad,
          peso_total: this.currentPedido.peso_total || null,
          observaciones: this.currentPedido.observaciones || null,
          recibido: this.currentPedido.recibido || false
        };
        await this.pedidoService.actualizarPedido(this.currentPedidoId, payload);
        this.showMessage('Pedido actualizado correctamente', 'success');

      } else {
        // --- Creando (POST) ---
        // Tu backend espera un payload más simple para POST
        const payload: PedidoCreate = {
          cedula: this.currentPedido.cedula,
          id_producto: this.currentPedido.id_producto,
          fecha_entrega: this.currentPedido.fecha_entrega,
          cantidad: this.currentPedido.cantidad,
          peso_total: this.currentPedido.peso_total || null,
          observaciones: this.currentPedido.observaciones || null
        };
        await this.pedidoService.crearPedido(payload);
        this.showMessage('Pedido agregado correctamente', 'success');
      }

      this.modalVisible = false;
      await this.loadPedidos(); // Recargar la tabla

    } catch (error) {
      this.showMessage('Error al guardar el pedido: ' + (error as Error).message, 'error');
    }
  }

  async deletePedido(id: number | string) {
    if (confirm('¿Está seguro de que desea eliminar este pedido?')) {
      try {
        await this.pedidoService.eliminarPedido(id);
        this.showMessage('Pedido eliminado correctamente', 'success');
        await this.loadPedidos(); // Recargar la tabla
      } catch (error) {
        this.showMessage('Error al eliminar el pedido: ' + (error as Error).message, 'error');
      }
    }
  }

  // --- Utilidades ---

  showMessage(message: string, type: 'info' | 'error' | 'success' = 'info') {
    this.alertMessage = message;
    this.alertType = type;
    // Oculta el mensaje después de 4 segundos
    setTimeout(() => {
      this.alertMessage = null;
    }, 4000);
  }

  /**
   * Convierte una fecha ISO (de la BD) a 'yyyy-MM-dd' (para el input[type="date"])
   */
  formatDateForInput(dateString: string | null): string {
    if (!dateString) {
      return new Date().toISOString().split('T')[0];
    }
    try {
      // new Date() maneja la zona horaria y convierte a local
      const date = new Date(dateString);
      // .toISOString() la devuelve a UTC, y .split('T')[0] toma la parte 'yyyy-MM-dd'
      return date.toISOString().split('T')[0];
    } catch (e) {
      console.error('Fecha inválida:', dateString);
      return new Date().toISOString().split('T')[0];
    }
  }
}
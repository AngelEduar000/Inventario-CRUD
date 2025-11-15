import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs'; // Importación necesaria

// --- Importar servicio e interfaces ---
import {
  InventarioService,
  InventarioItem,
  Producto,
  Bodega,
  InventarioCreate,
  InventarioUpdate
} from '../Services/inventario.service';

@Component({
  selector: 'app-inventarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventariocrud.html',
  styleUrls: ['./inventariocrud.css']
})
export class inventarios implements OnInit {
  // --- Estado ---
  public systemStatus = 'Inicializando...';
  public statusType = 'info';
  public alertMessage: string | null = null;
  public alertType = 'info';

  // --- Datos principales ---
  public inventario: InventarioItem[] = []; // Datos crudos de la API
  public inventarioMostrado: any[] = []; // Datos procesados para la vista
  public productos: Producto[] = [];
  public bodegas: Bodega[] = [];
  public searchTerm = '';
  public resultCount = 0;

  // ✅ CORRECCIÓN: Añadida variable para prevenir doble clic
  public isSaving = false; 

  // --- Modal Angular ---
  public mostrarModal = false;
  public modoEdicion = false;
  public formInventarioData: any = {};

  constructor(private inventarioService: InventarioService) {}

  ngOnInit(): void {
    console.log('✅ Componente Inventarios inicializado');
    this.testConnection();
  }

  // --- Conexión ---
  testConnection(): void {
    this.systemStatus = '🔗 Conectando al servidor...';
    this.statusType = 'info';
    this.inventarioService.testConnection().subscribe({
      next: (res) => {
        this.systemStatus = '✅ Sistema conectado correctamente';
        this.statusType = 'success';
        this.cargarDependenciasEInventario();
      },
      error: (err) => {
        this.systemStatus = `❌ Error de conexión: ${err.message}`;
        this.statusType = 'danger';
      }
    });
  }

  // --- Cargar listas desplegables y luego inventario ---
  cargarDependenciasEInventario(): void {
    const productos$ = this.inventarioService.getProductos();
    const bodegas$ = this.inventarioService.getBodegas();

    forkJoin([productos$, bodegas$]).subscribe({
      next: ([productosData, bodegasData]) => {
        this.productos = productosData;
        this.bodegas = bodegasData;
        console.log('Productos y Bodegas cargados.');
        
        console.log('--- 1. LISTA DE PRODUCTOS (La "lista maestra") ---');
        console.table(this.productos);
        console.log('--- 2. LISTA DE BODEGAS (La "lista maestra") ---');
        console.table(this.bodegas);

        this.cargarInventario();
      },
      error: (err) => {
        console.error('Error al cargar dependencias:', err);
        this.showAlert('Error crítico al cargar productos o bodegas.', 'danger');
      }
    });
  }

  // --- Cargar inventario ---
  cargarInventario(): void {
    this.inventarioService.getInventario().subscribe({
      next: (data) => {
        console.log('--- 3. LISTA DE INVENTARIO (Los IDs que vamos a buscar) ---');
        console.table(data);

        this.inventario = data; 
        this.inventarioMostrado = this.procesarInventarioParaVista(data); 
        this.resultCount = data.length;
      },
      error: (err) => this.showAlert(err.message, 'danger')
    });
  }

  /**
   * Esta función une el inventario con los nombres de producto/bodega.
   */
  private procesarInventarioParaVista(data: InventarioItem[]): any[] {
    if (this.productos.length === 0 || this.bodegas.length === 0) {
      return data.map(item => ({ ...item, nombre_producto: 'Cargando...', nombre_bodega: 'Cargando...' }));
    }

    return data.map(item => {
      const idProdBuscar = String(item.id_producto).trim();
      const prod = this.productos.find(p => String(p.id_producto).trim() == idProdBuscar);

      const idBodBuscar = String(item.id_bodega).trim();
      const bod = this.bodegas.find(b => String(b.id_bodega).trim() == idBodBuscar);

      const nombreProdFinal = (prod && prod.descripcion) ? prod.descripcion : '(No Encontrado)';
      const nombreBodFinal = (bod && bod.codigo) ? bod.codigo : '(No Encontrado)';

      return {
        ...item,
        nombre_producto: nombreProdFinal,
        nombre_bodega: nombreBodFinal
      };
    });
  }

  // --- Buscar ---
  // --- Buscar ---
buscarInventario(): void {
 if (!this.searchTerm.trim()) {
 this.cargarInventario();
 return;
 }

 this.inventarioService.buscarInventario(this.searchTerm).subscribe({
 next: (data) => { 
        const response: any = data; 
        console.log('Respuesta de la API de Búsqueda:', response);

        let datosComoArray: InventarioItem[];

        // --- INICIO DE LA CORRECCIÓN ---

        // Caso 1 (Tu caso): La API devuelve un objeto { success: true, data: [...] }
        if (response && response.data && Array.isArray(response.data)) {
            datosComoArray = response.data; // <-- ¡Extraemos el array de la propiedad 'data'!
        }
        // Caso 2: La API devuelve un array simple [...]
        else if (Array.isArray(response)) {
            datosComoArray = response;
        } 
        // Caso 3: La API devuelve un solo objeto { id_inventario: ... }
        else if (response && typeof response === 'object' && response.id_inventario) {
            datosComoArray = [response]; 
        } 
        // Caso 4: No se encontró nada o la respuesta no es válida
        else {
            datosComoArray = []; 
        }
        // --- FIN DE LA CORRECCIÓN ---

this.inventario = datosComoArray; 
this.inventarioMostrado = this.procesarInventarioParaVista(datosComoArray);
 this.resultCount = datosComoArray.length;
 },
 error: (err) => this.showAlert(err.message, 'danger')
 });
}


  // --- Modal Angular ---
  abrirModal(modo: 'nuevo' | 'editar', item?: InventarioItem): void {
    this.modoEdicion = modo === 'editar';
    this.mostrarModal = true;

    if (this.modoEdicion && item) {
      // --- MODO EDITAR ---
      this.formInventarioData = {
        ...item,
        fecha_entrada: this.formatDateForInput(item.fecha_entrada),
        fecha_salida: this.formatDateForInput(item.fecha_salida || null)
      };
    } else {
      // --- MODO NUEVO ---
      this.formInventarioData = {
        id_producto: '',
        id_bodega: '',
        fecha_entrada: this.formatDateForInput(new Date().toISOString()),
        fecha_salida: '', 
        humedad: null,
        fermentacion: null
      };
    }
  }

  cerrarModal(): void {
    this.mostrarModal = false;
  }

  // --- Guardar o actualizar ---
  guardarInventario(): void {
    // 1. Validación
    if (!this.formInventarioData.id_producto || !this.formInventarioData.id_bodega || !this.formInventarioData.fecha_entrada) {
      this.showAlert('⚠️ Completa todos los campos obligatorios (Producto, Bodega, Fecha Entrada)', 'danger');
      return; 
    }

    // ✅ CORRECCIÓN: Implementar bloqueo de doble clic
    if (this.isSaving) {
      console.warn('Bloqueado: Intento de guardado duplicado.');
      return; // Ya se está procesando un guardado
    }
    this.isSaving = true; // Bloquear el botón

    // 2. Lógica de Guardado/Actualización
    if (this.modoEdicion) {
      // --- Actualizar ---
      const payload: InventarioUpdate = {
        fecha_entrada: this.formInventarioData.fecha_entrada,
        fecha_salida: this.formInventarioData.fecha_salida || null, 
        id_producto: this.formInventarioData.id_producto,
        id_bodega: this.formInventarioData.id_bodega,
        humedad: this.formInventarioData.humedad,
        fermentacion: this.formInventarioData.fermentacion
      };

      this.inventarioService.actualizarInventario(this.formInventarioData.id_inventario, payload).subscribe({
        next: () => {
          this.showAlert('✅ Registro actualizado exitosamente', 'success');
          this.cargarInventario(); 
          this.cerrarModal();
          this.isSaving = false; // Desbloquear
        },
        error: (err) => {
          console.error('Error al ACTUALIZAR:', err); // Log completo
          const errorMsg = err.error?.message || err.message; 
          this.showAlert(`Error al actualizar: ${errorMsg}`, 'danger');
          this.isSaving = false; // Desbloquear
        }
      });

    } else {
      // --- Crear nuevo ---
      const payload: InventarioCreate = {
        fecha_entrada: this.formInventarioData.fecha_entrada,
        id_producto: this.formInventarioData.id_producto,
        id_bodega: this.formInventarioData.id_bodega,
        humedad: this.formInventarioData.humedad,
        fermentacion: this.formInventarioData.fermentacion
      };

      this.inventarioService.agregarInventario(payload).subscribe({
        next: () => {
          this.showAlert('✅ Inventario agregado exitosamente', 'success');
          this.cargarInventario(); 
          this.cerrarModal();
          this.isSaving = false; // Desbloquear
        },
        error: (err) => {
          console.error('Error al CREAR:', err); // Log completo
          const errorMsg = err.error?.message || err.message;
          this.showAlert(`Error al crear: ${errorMsg}`, 'danger');
          this.isSaving = false; // Desbloquear
        }
      });
    }
  }

  // --- Eliminar ---
  eliminarInventario(id: string): void {
    if (!confirm('¿Seguro que deseas eliminar este registro?')) return;
    this.inventarioService.eliminarInventario(id).subscribe({
      next: () => {
        this.showAlert('🗑️ Registro eliminado correctamente', 'success');
        this.cargarInventario();
      },
      error: (err) => this.showAlert(err.message, 'danger')
    });
  }

  // --- Utilidades ---
  showAlert(message: string, type: string): void {
    this.alertMessage = message;
    this.alertType = type;
    setTimeout(() => (this.alertMessage = null), 4000);
  }
  
  formatDateForInput(dateString: string | null): string | null {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
}

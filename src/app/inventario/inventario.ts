import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InventarioService, InventarioItem, InventarioCreate, InventarioUpdate } from '../Services/inventario.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.html',
  styleUrls: ['./inventario.css']
})
export class Inventario implements OnInit {
  inventario: InventarioItem[] = [];
  itemEditando: InventarioItem | null = null;
  mostrarFormulario = false;
  modoEdicion = false;

  // Item temporal para el formulario
  itemTemporal: InventarioCreate = {
    fecha_entrada: '',
    id_producto: '',
    producto_descripcion: '',
    humedad: null,
    fermentacion: null,
    id_bodega: '',
    bodega_codigo: ''
  };

  constructor(private inventarioService: InventarioService) {}

  ngOnInit(): void { 
    this.leer(); 
  }

  leer() {
    this.inventarioService.getInventario().subscribe({
      next: (datos: InventarioItem[]) => {
        this.inventario = datos;
        console.log('INVENTARIO CARGADO:', this.inventario);
      },
      error: (err: any) => console.error('Error Inventario', err)
    });
  }

  agregar() { 
    this.modoEdicion = false;
    this.mostrarFormulario = true;
    this.itemEditando = null;
    
    // Resetear el item temporal
    this.itemTemporal = {
      fecha_entrada: new Date().toISOString().split('T')[0],
      id_producto: this.generateUUID(),
      producto_descripcion: '',
      humedad: null,
      fermentacion: null,
      id_bodega: this.generateUUID(),
      bodega_codigo: ''
    };
  }

  editarItem(item: InventarioItem) {
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.itemEditando = item;
    
    // Cargar datos en el item temporal
    this.itemTemporal = {
      fecha_entrada: item.fecha_entrada,
      id_producto: item.id_producto,
      producto_descripcion: item.producto_descripcion,
      humedad: item.humedad,
      fermentacion: item.fermentacion,
      id_bodega: item.id_bodega,
      bodega_codigo: item.bodega_codigo
    };
  }

  guardar() {
    if (this.modoEdicion && this.itemEditando) {
      // Modo edición
      const updateData: InventarioUpdate = {
        fecha_entrada: this.itemTemporal.fecha_entrada,
        producto_descripcion: this.itemTemporal.producto_descripcion,
        humedad: this.itemTemporal.humedad,
        fermentacion: this.itemTemporal.fermentacion,
        bodega_codigo: this.itemTemporal.bodega_codigo
      };

      this.inventarioService.actualizarInventario(
        this.itemEditando.id_inventario, 
        updateData
      ).subscribe({
        next: (itemActualizado: InventarioItem) => {
          const index = this.inventario.findIndex(
            item => item.id_inventario === this.itemEditando!.id_inventario
          );
          if (index !== -1) {
            this.inventario[index] = itemActualizado;
          }
          this.cerrarFormulario();
          alert('Ítem actualizado correctamente');
        },
        error: (err: any) => {
          console.error('Error actualizando:', err);
          alert('No se pudo actualizar el ítem: ' + err.error?.detail || err.message);
        }
      });
    } else {
      // Modo agregar - Asegurar que los números no sean null
      const itemToSend: InventarioCreate = {
        ...this.itemTemporal,
        humedad: this.itemTemporal.humedad || 0,
        fermentacion: this.itemTemporal.fermentacion || 0
      };

      this.inventarioService.agregarInventario(itemToSend).subscribe({
        next: (nuevoItem: InventarioItem) => {
          this.inventario.push(nuevoItem);
          this.cerrarFormulario();
          alert('Ítem agregado correctamente');
        },
        error: (err: any) => {
          console.error('Error agregando:', err);
          alert('No se pudo agregar el ítem: ' + err.error?.detail || err.message);
        }
      });
    }
  }

  cerrarFormulario() {
    this.mostrarFormulario = false;
    this.itemEditando = null;
    this.modoEdicion = false;
  }

  eliminar(id: string) {
    if (!confirm('¿Estás seguro que quieres eliminar este ítem?')) {
      return;
    }
    this.inventarioService.eliminarInventario(id).subscribe({
      next: () => {
        this.inventario = this.inventario.filter(item => item.id_inventario !== id);
        alert('Ítem eliminado correctamente');
      },
      error: (err: any) => {
        console.error('Error eliminando:', err);
        alert('No se pudo eliminar el ítem: ' + err.error?.detail || err.message);
      }
    });
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}
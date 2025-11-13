import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

// Servicios (asegúrate de que existan)
import { ProductoService } from '../Services/producto.service';
import { ProveedorService } from '../Services/proveedor.service';

// --- Interfaces Simplificadas ---
export interface Producto {
  id_producto: string;
  descripcion: string;
  cedula: string; // Clave foránea a Proveedor
}

export interface Proveedor {
  cedula: string;
  nombre: string;
  telefono?: string;
  ciudad?: string;
}

@Component({
  selector: 'app-gestion-productos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  
  // ✅ CORRECIÓN 1: Ajustado al nombre de archivo más convencional.
  // Si tu archivo se llama 'productos.html', cámbialo de nuevo.
  templateUrl: './productos.html', 
  
  styleUrls: ['./productos.css'] // (Asumiendo que tu CSS se llama 'productos.css')
})
export class Productos implements OnInit {

  productos: Producto[] = [];
  proveedores: Proveedor[] = [];

  loading = true;
  error: string | null = null;
  mostrarModal = false;
  modoEdicion = false;

  productoForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private productoService: ProductoService,
    private proveedorService: ProveedorService
  ) {
    this.productoForm = this.fb.group({
      id_producto: ['', [Validators.required]],
      descripcion: ['', [Validators.required]],
      cedula: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading = true;
    forkJoin({
      productos: this.productoService.getProductos(),
      proveedores: this.proveedorService.getProveedores()
    }).subscribe({
      
      // ✅ CORRECIÓN 2: Manejar la respuesta del servicio si devuelve un Objeto
      //    en lugar de un Array (lo que causa el error NG02200).
      next: (resultado: any) => { // Se usa 'any' para inspeccionar la respuesta
        
        // Asumimos que la API devuelve { "productos": [...] } o { "data": [...] }
        // Si 'resultado.productos' ya es un array, esto no lo afectará.
        this.productos = resultado.productos.productos || resultado.productos.data || resultado.productos || [];
        this.proveedores = resultado.proveedores.proveedores || resultado.proveedores.data || resultado.proveedores || [];
        
        this.loading = false;
        
        // Comprobación de seguridad
        if (!Array.isArray(this.productos)) {
          console.error("Productos no es un array:", this.productos);
          this.error = "Error: El servicio de productos no devolvió un array.";
          this.productos = [];
        }
        if (!Array.isArray(this.proveedores)) {
          console.error("Proveedores no es un array:", this.proveedores);
          this.error = "Error: El servicio de proveedores no devolvió un array.";
          this.proveedores = [];
        }
      },
      error: (err: any) => {
        this.error = 'Error fatal al cargar datos.';
        console.error(err);
        this.loading = false;
      }
    });
  }

  getNombreProveedor(cedula: string): string {
    const p = this.proveedores.find(x => x.cedula === cedula);
    return p ? p.nombre : '(Proveedor no encontrado)';
  }

  abrirModal(modo: 'nuevo' | 'editar', producto?: Producto) {
    this.modoEdicion = modo === 'editar';
    this.productoForm.reset();

    if (this.modoEdicion && producto) {
      this.productoForm.patchValue(producto);
      this.productoForm.controls['id_producto'].disable();
    } else {
      this.productoForm.controls['id_producto'].enable();
    }

    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  guardarProducto() {
    if (this.productoForm.invalid) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }

    const datosFormulario = this.productoForm.getRawValue();

    if (this.modoEdicion) {
      const { id_producto, ...payload } = datosFormulario;
      this.productoService.actualizarProducto(id_producto, payload).subscribe({
        next: () => {
          this.cargarDatos();
          this.cerrarModal();
        },
        error: (err: any) => this.error = 'Error al actualizar: ' + err.message
      });
    } else {
      this.productoService.crearProducto(datosFormulario).subscribe({
        next: () => {
          this.cargarDatos();
          this.cerrarModal();
        },
        error: (err: any) => this.error = 'Error al crear: ' + err.message
      });
    }
  }

  eliminarProducto(id: string) {
    if (!confirm('¿Seguro que deseas eliminar este producto?')) return;

    this.productoService.eliminarProducto(id).subscribe({
      next: () => this.cargarDatos(),
      error: (err: any) => this.error = 'Error al eliminar: ' + err.message
    });
  }
}
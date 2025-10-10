import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InventarioService, InventarioItem } from '../Services/inventario.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventario.html',
  styleUrls: ['./inventario.css']
})
export class Inventario implements OnInit {
  inventario: InventarioItem[] = [];
  constructor(private inventarioService: InventarioService) {}
  ngOnInit(): void { this.leer(); }
leer() {
  this.inventarioService.getInventario().subscribe({
    next: datos => {
      this.inventario = datos;
      console.log('INVENTARIO CARGADO:', this.inventario);
    },
    error: err => console.error('Error Inventario', err)
  });
}

  agregar() { console.log('Agregar producto'); }
  editar() { console.log('Editar producto'); }



eliminar(id: string) {
  if (!confirm('¿Estás seguro que quieres eliminar este ítem?')) {
    return;
  }
  this.inventarioService.eliminarInventario(id).subscribe({
    next: () => {
      this.inventario = this.inventario.filter(item => item.id_inventario !== id);
      alert('Ítem eliminado correctamente');
    },
    error: err => {
      console.error('Error eliminando:', err);
      alert('No se pudo eliminar el ítem');
    }
  });
}



}

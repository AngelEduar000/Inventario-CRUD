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
  eliminar() { console.log('Eliminar producto'); }
}

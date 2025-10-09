import { Component } from '@angular/core';

@Component({
  selector: 'app-inventario',
  imports: [],
  templateUrl: './inventario.html',
  styleUrls: ['./inventario.css'] 
})
export class Inventario {
    // Métodos CRUD
  agregar() {
    console.log('Agregar producto');
  }

  leer() {
    console.log('Ver producto');
  }

  editar() {
    console.log('Editar producto');
  }

  eliminar() {
    console.log('Eliminar producto');
  }
}


import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Inventario } from './inventario/inventario';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrls: ['./app.css'] ,
  
})


export class App {
  protected readonly title = signal('frontend-login');
}

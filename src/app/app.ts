import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root', // este es el selector raíz estándar
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',    
  styleUrls: ['./app.css']     
})
export class App {
  protected readonly title = signal('frontend-login');
}

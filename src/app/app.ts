import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './sidebar/sidebar'; // si tu sidebar es standalone

@Component({
  selector: 'app-root', 
  standalone: true,
  imports: [CommonModule, RouterOutlet, Sidebar],
  templateUrl: './app.html',    
  styleUrls: ['./app.css']     
})
export class App {
  protected readonly title = signal('frontend-login');
}

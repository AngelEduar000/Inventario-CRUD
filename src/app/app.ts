import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Sidebar } from './sidebar/sidebar'; 

@Component({
  selector: 'app-root', 
  standalone: true,
  imports: [CommonModule, RouterOutlet, Sidebar,FormsModule],
  templateUrl: './app.html',    
  styleUrls: ['./app.css']     
})
export class App {
  protected readonly title = signal('frontend-login');
}

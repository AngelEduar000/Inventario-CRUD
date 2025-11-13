// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { bodegas } from './bodegas/bodegas';
import { inventarios } from './inventariocrud/inventariocrud';
import { Pedidos } from './pedidos/pedidos';
import { Productos } from './productos/productos';
import { Proveedorescrud } from './proveedorescrud/proveedorescrud';
import { Reportes } from './reportes/reportes';

export const routes: Routes = [
  { path: '', redirectTo: 'productos', pathMatch: 'full' },
  { path: 'bodegas', component: bodegas },
  { path: 'inventariocrud', component: inventarios },
  { path: 'pedidos', component: Pedidos },
  { path: 'productos', component: Productos },
  { path: 'proveedorescrud', component: Proveedorescrud },
  {path: 'reportes', component: Reportes },
  { path: '**', redirectTo: 'productos' },
];

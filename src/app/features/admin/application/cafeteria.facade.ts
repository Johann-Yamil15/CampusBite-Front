import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CafeteriaFacade {

  constructor() {} 

  registrarCafeteria(datos: any) {
    console.log('✅ Facade ejecutándose. Datos listos para la API:', datos);
    alert('Simulación: Cafetería procesada por la Arquitectura Clean.');
  }
}
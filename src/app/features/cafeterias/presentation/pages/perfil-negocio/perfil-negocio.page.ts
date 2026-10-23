// JJ-Sprint3 21/10/2026: cascarón visual del "perfil" de una cafetería/negocio (portada + info + productos),
// como un perfil de Facebook. Datos fijos: se conecta al backend real (horarios, productos, medios de pago)
// en la siguiente historia. Fotos de Picsum (stock genérico), no son de negocios reales.
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { NEGOCIO_NAV, BottomNavComponent } from '@shared/ui/bottom-nav/bottom-nav.component';

interface ProductoNegocio {
  nombre: string;
  precio: number;
  foto: string;
}

interface HorarioDia {
  dia: string;
  horas: string;
  hoy?: boolean;
}

const PRODUCTOS: ProductoNegocio[] = [
  { nombre: 'Combo del día', precio: 65, foto: 'https://picsum.photos/seed/cb-combo1/300/300' },
  { nombre: 'Tacos de guisado (3)', precio: 45, foto: 'https://picsum.photos/seed/cb-tacos1/300/300' },
  { nombre: 'Agua de horchata 500ml', precio: 20, foto: 'https://picsum.photos/seed/cb-agua1/300/300' },
  { nombre: 'Papas gajo', precio: 35, foto: 'https://picsum.photos/seed/cb-papas1/300/300' },
];

const HORARIOS: HorarioDia[] = [
  { dia: 'Lunes a viernes', horas: '7:00 am – 6:00 pm', hoy: true },
  { dia: 'Sábado', horas: '8:00 am – 2:00 pm' },
  { dia: 'Domingo', horas: 'Cerrado' },
];

@Component({
  selector: 'app-perfil-negocio-page',
  imports: [CurrencyPipe, BottomNavComponent],
  templateUrl: './perfil-negocio.page.html',
  styleUrl: './perfil-negocio.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilNegocioPage {
  protected readonly nav = NEGOCIO_NAV;
  protected readonly productos = PRODUCTOS;
  protected readonly horarios = HORARIOS;

  protected readonly negocio = {
    nombre: 'Cafetería Central',
    categoria: 'Comida corrida · Cafetería',
    ubicacion: 'Edificio D, planta baja',
    calificacion: 4.8,
    resenas: 212,
    bio: 'Comida casera y café de grano recién hecho, a dos minutos del Edificio D. Ventanilla express para que no pierdas tu receso.',
    portada: 'https://picsum.photos/seed/cb-portada1/1200/400',
    avatar: 'assets/images/logo-campusbite.png',
  };

  protected readonly metodosPago = [
    { nombre: 'Tarjeta', activo: true },
    { nombre: 'Transferencia', activo: true },
    { nombre: 'Efectivo', activo: true },
  ];
}

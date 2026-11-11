// FB-Sprint4 29/10/2026: Componente principal de inicio para el alumno con buscador en tiempo real.
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MenuService } from '@shared/menu/menu';
import { MenuCafeteria } from '@shared/menu/menu.model';
import { ApiError } from '@core/http/api-error';
import { NegocioCardComponent } from './negocio-card/negocio-card';

@Component({
  selector: 'app-inicio-alumno',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule, NegocioCardComponent],
  templateUrl: './inicio-alumno.html',
  styleUrl: './inicio-alumno.scss'
})
export class InicioAlumnoComponent implements OnInit {
  private readonly menuSvc = inject(MenuService);

  readonly cargando = signal(true);
  readonly menu     = signal<MenuCafeteria[]>([]);
  readonly busqueda = signal('');
  // FB-Sprint4 01/11/2026: mensaje cuando no se pudo cargar el menú (para no confundirlo con "sin resultados")
  readonly error    = signal<string | null>(null);

  // FB-Sprint4 29/10/2026: Filtra negocios y productos según lo que el alumno escriba
  readonly negociosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase();
    if (!q) return this.menu();
    return this.menu().filter(n =>
      n.cafeteria.toLowerCase().includes(q) ||
      n.productos.some(p => p.producto.toLowerCase().includes(q))
    );
  });

  ngOnInit() {
    this.cargar();
  }

  // FB-Sprint4 01/11/2026: carga (o reintenta cargar) el menú de las cafeterías activas
  cargar() {
    this.cargando.set(true);
    this.error.set(null);
    this.menuSvc.listarMenu().subscribe({
      next:  m  => { this.menu.set(m); this.cargando.set(false); },
      error: (e: ApiError) => {
        this.error.set(e?.message ?? 'No se pudo cargar el menú.');
        this.cargando.set(false);
      },
    });
  }

  actualizarBusqueda(event: Event) {
    const target = event.target as HTMLInputElement;
    this.busqueda.set(target.value);
  }
}

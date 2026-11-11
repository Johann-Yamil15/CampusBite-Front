// FB-Sprint4 29/10/2026: Componente principal de inicio para el alumno con buscador en tiempo real.
// CL-Sprint5 11/11/2026: se mueve de features/inicio-alumno a la feature alumno y lee el menú de la
// CatalogoFacade (antes MenuService de shared/menu). El diseño no cambia en esta etapa.
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { CatalogoFacade } from '@features/catalogo';
import { NegocioCardComponent } from '@features/alumno/presentation/components/negocio-card/negocio-card.component';

@Component({
  selector: 'app-inicio-page',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatIconModule, NegocioCardComponent],
  templateUrl: './inicio.page.html',
  styleUrl: './inicio.page.scss'
})
export class InicioPage implements OnInit {
  private readonly catalogo = inject(CatalogoFacade);

  readonly cargando = this.catalogo.cargando;
  readonly menu     = this.catalogo.menu;
  readonly busqueda = signal('');
  // FB-Sprint4 01/11/2026: mensaje cuando no se pudo cargar el menú (para no confundirlo con "sin resultados")
  readonly error    = this.catalogo.error;

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
  // CL-Sprint5 11/11/2026: el mensaje de error ya lo deja la facade en error()
  cargar(forzar = false) {
    this.catalogo.cargar(forzar).subscribe({ error: () => undefined });
  }

  actualizarBusqueda(event: Event) {
    const target = event.target as HTMLInputElement;
    this.busqueda.set(target.value);
  }
}

// JY-Sprint4 05/11/2026: HU futura (cascarón visual). Horario del negocio: qué días abre y a qué hora, más
// un interruptor para cerrar hoy por imprevistos.
// CL-Sprint5 11/11/2026 (etapa 9): ahora se guarda con NegocioFacade (api/cafeterias/{id}/horario): el
// estado abierto/cerrado del catálogo y los horarios de recogida del checkout respetan este horario y el
// "cerrar por hoy". Carga con esqueleto, error con "Reintentar" y "Guardando…" en cada cambio.
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiError } from '@core/http/api-error';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { ToastService } from '@shared/ui/toast/toast.service';
import { NegocioFacade } from '@features/menu-negocio/application/negocio.facade';
import { DIAS, DiaHorario, diaValido, horasDia } from '@features/menu-negocio/domain/models/negocio.model';

interface Editando extends DiaHorario {
  indice: number;
}

@Component({
  selector: 'app-horario-page',
  imports: [IconComponent, ModalComponent],
  templateUrl: './horario.page.html',
  styleUrl: './horario.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioPage {
  private readonly negocio = inject(NegocioFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  protected readonly nombres = DIAS;
  protected readonly horario = this.negocio.horario;
  protected readonly cargando = this.negocio.cargando;
  protected readonly error = this.negocio.error;

  private readonly idCafeteria: string =
    this.route.snapshot.pathFromRoot.map((r) => r.data['id'] as string | undefined).find(Boolean) ??
    '';

  protected readonly semana = computed(() => this.horario()?.dias ?? []);
  protected readonly cerradoHoy = computed(() => !!this.horario()?.cerradoHoy);
  protected readonly abiertaAhora = computed(() => !!this.horario()?.abiertaAhora);
  /** Lunes = 0: el día de hoy para resaltarlo. */
  protected readonly hoy = (new Date().getDay() + 6) % 7;

  protected readonly diasAbiertos = computed(() => this.semana().filter((d) => d.abre).length);
  protected readonly horasSemana = computed(() =>
    Math.round(this.semana().reduce((suma, d) => suma + horasDia(d), 0) * 10) / 10,
  );

  protected readonly editando = signal<Editando | null>(null);
  protected readonly confirmandoCierre = signal(false);
  protected readonly guardando = signal(false);
  protected readonly errorGuardar = signal<string | null>(null);

  protected readonly rangoValido = computed(() => {
    const d = this.editando();
    return !!d && diaValido(d);
  });

  constructor() {
    this.cargar();
  }

  protected cargar(): void {
    this.negocio.cargarHorario(this.idCafeteria).subscribe({ error: () => undefined });
  }

  protected editar(indice: number): void {
    this.errorGuardar.set(null);
    this.editando.set({ ...this.semana()[indice], indice });
  }

  protected cerrar(): void {
    if (!this.guardando()) this.editando.set(null);
  }

  protected hora(clave: 'desde' | 'hasta', event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.editando.update((d) => (d ? { ...d, [clave]: valor } : d));
  }

  protected alternarAbre(): void {
    this.editando.update((d) => (d ? { ...d, abre: !d.abre } : d));
  }

  protected guardar(): void {
    const d = this.editando();
    if (!d || !this.rangoValido() || this.guardando()) return;
    const { indice, ...dia } = d;
    this.guardando.set(true);
    this.errorGuardar.set(null);
    this.negocio.guardarDia(this.idCafeteria, indice, dia).subscribe({
      next: () => {
        this.guardando.set(false);
        this.editando.set(null);
        this.toast.ok(
          dia.abre
            ? `${DIAS[indice]}: ahora abres de ${dia.desde} a ${dia.hasta}.`
            : `${DIAS[indice]}: quedó marcado como cerrado.`,
        );
      },
      error: (e: ApiError) => {
        this.guardando.set(false);
        this.errorGuardar.set(e?.message ?? 'No pudimos guardar el horario.');
      },
    });
  }

  protected confirmarCierre(): void {
    this.cambiarCierre(
      this.negocio.cerrarHoy(this.idCafeteria),
      'Cerraste por hoy: los alumnos ya no pueden hacer pedidos. Mañana abres con tu horario normal.',
    );
  }

  protected reabrir(): void {
    this.cambiarCierre(this.negocio.reabrir(this.idCafeteria), 'Listo, vuelves a recibir pedidos según tu horario.');
  }

  private cambiarCierre(accion: ReturnType<NegocioFacade['cerrarHoy']>, exito: string): void {
    if (this.guardando()) return;
    this.guardando.set(true);
    accion.subscribe({
      next: () => {
        this.guardando.set(false);
        this.confirmandoCierre.set(false);
        this.toast.ok(exito);
      },
      error: (e: ApiError) => {
        this.guardando.set(false);
        this.toast.error(e?.message ?? 'No pudimos cambiar el estado de hoy.');
      },
    });
  }
}

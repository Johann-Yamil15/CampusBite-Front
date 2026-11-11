// JY-Sprint4 05/11/2026: HU futura (cascarón visual). Horario del negocio: qué días abre y a qué hora, más
// un interruptor para cerrar hoy por imprevistos. Los cambios viven en memoria; no hay endpoint todavía.
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ModalComponent } from '@shared/ui/modal/modal.component';
import { ToastService } from '@shared/ui/toast/toast.service';

interface DiaHorario {
  dia: string;
  abre: boolean;
  desde: string;
  hasta: string;
}

const SEMANA: DiaHorario[] = [
  { dia: 'Lunes', abre: true, desde: '07:30', hasta: '17:00' },
  { dia: 'Martes', abre: true, desde: '07:30', hasta: '17:00' },
  { dia: 'Miércoles', abre: true, desde: '07:30', hasta: '17:00' },
  { dia: 'Jueves', abre: true, desde: '07:30', hasta: '17:00' },
  { dia: 'Viernes', abre: true, desde: '07:30', hasta: '15:00' },
  { dia: 'Sábado', abre: true, desde: '09:00', hasta: '13:00' },
  { dia: 'Domingo', abre: false, desde: '09:00', hasta: '13:00' },
];

@Component({
  selector: 'app-horario-page',
  imports: [ModalComponent],
  templateUrl: './horario.page.html',
  styleUrl: './horario.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HorarioPage {
  private readonly toast = inject(ToastService);

  protected readonly semana = signal<DiaHorario[]>(SEMANA);

  /** Cierre temporal: manda sobre el horario y los alumnos no pueden pedir. */
  protected readonly cerradoHoy = signal(false);

  protected readonly editando = signal<DiaHorario | null>(null);
  protected readonly confirmandoCierre = signal(false);

  protected readonly diasAbiertos = computed(() => this.semana().filter((d) => d.abre).length);

  protected readonly horasSemana = computed(() =>
    this.semana()
      .filter((d) => d.abre)
      .reduce((suma, d) => suma + this.horas(d), 0),
  );

  /** Horas que abre un día; si el cierre es antes de la apertura cuenta cero. */
  private horas(dia: DiaHorario): number {
    const minutos = this.aMinutos(dia.hasta) - this.aMinutos(dia.desde);
    return minutos > 0 ? minutos / 60 : 0;
  }

  private aMinutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return h * 60 + m;
  }

  protected editar(dia: DiaHorario): void {
    this.editando.set({ ...dia });
  }

  protected cerrar(): void {
    this.editando.set(null);
  }

  protected hora(clave: 'desde' | 'hasta', event: Event): void {
    const valor = (event.target as HTMLInputElement).value;
    this.editando.update((d) => (d ? { ...d, [clave]: valor } : d));
  }

  protected alternarAbre(): void {
    this.editando.update((d) => (d ? { ...d, abre: !d.abre } : d));
  }

  protected readonly rangoValido = computed(() => {
    const d = this.editando();
    if (!d) return false;
    return !d.abre || this.aMinutos(d.hasta) > this.aMinutos(d.desde);
  });

  protected guardar(): void {
    const dia = this.editando();
    if (!dia || !this.rangoValido()) return;

    this.semana.update((lista) => lista.map((d) => (d.dia === dia.dia ? dia : d)));
    this.toast.ok(
      dia.abre
        ? `${dia.dia}: ahora abres de ${dia.desde} a ${dia.hasta}.`
        : `${dia.dia}: quedó marcado como cerrado.`,
    );
    this.cerrar();
  }

  protected confirmarCierre(): void {
    this.cerradoHoy.set(true);
    this.confirmandoCierre.set(false);
    this.toast.ok('Tu negocio quedó cerrado por hoy: los alumnos no podrán hacer pedidos.');
  }

  protected reabrir(): void {
    this.cerradoHoy.set(false);
    this.toast.ok('Listo, vuelves a recibir pedidos.');
  }
}

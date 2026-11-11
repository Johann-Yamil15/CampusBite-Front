// FB-Sprint4 29/10/2026: Modal para confirmar la orden (hora de recogida, método de pago y notas).
import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import {
  AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize } from 'rxjs';
import { ApiError } from '@core/http/api-error';
import { CrearOrdenRequest } from '@shared/menu/menu.model';
import { CarritoService } from '@shared/carrito/carrito';
import { OrdenService } from '@shared/menu/orden';

type MetodoPago = CrearOrdenRequest['metodo'];

// FB-Sprint4 29/10/2026: datos opcionales para limitar métodos a los que acepta la cafetería
export interface ConfirmarOrdenData {
  metodosPago?: MetodoPago[];
}

export const MINUTOS_MINIMOS_RECOGIDA = 5;
export const MAX_NOTAS = 200;

const ETIQUETAS_METODO: Record<MetodoPago, string> = {
  efectivo:      'Efectivo',
  tarjeta:       'Tarjeta',
  transferencia: 'Transferencia',
};

// FB-Sprint4 29/10/2026: formatea una fecha al formato local que espera <input type="datetime-local">
function aDatetimeLocal(fecha: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}T${p(fecha.getHours())}:${p(fecha.getMinutes())}`;
}

// FB-Sprint4 01/11/2026: ISO con el offset local (ej. 2026-10-27T13:00:00-06:00), como lo documenta el back
export function aIsoConOffset(fecha: Date): string {
  const p = (n: number) => String(Math.trunc(Math.abs(n))).padStart(2, '0');
  const offset = -fecha.getTimezoneOffset();
  const signo = offset >= 0 ? '+' : '-';
  return `${aDatetimeLocal(fecha)}:${p(fecha.getSeconds())}${signo}${p(offset / 60)}:${p(offset % 60)}`;
}

// FB-Sprint4 01/11/2026: código corto que se muestra al alumno a partir del idOrden
export function codigoOrden(idOrden: string): string {
  return idOrden.replace(/-/g, '').slice(0, 6).toUpperCase();
}

// FB-Sprint4 29/10/2026: valida que la recogida sea al menos now() + 5 minutos
export function recogidaMinimaValidator(minutos = MINUTOS_MINIMOS_RECOGIDA): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    if (!control.value) return null;
    const elegida = new Date(control.value).getTime();
    if (Number.isNaN(elegida)) return { fechaInvalida: true };
    return elegida >= Date.now() + minutos * 60_000 ? null : { recogidaMinima: { minutos } };
  };
}

@Component({
  selector: 'app-confirmar-orden',
  standalone: true,
  imports: [
    CurrencyPipe, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatProgressSpinnerModule, MatSelectModule,
  ],
  templateUrl: './confirmar-orden.html',
  styleUrl: './confirmar-orden.scss',
})
export class ConfirmarOrdenComponent {
  private readonly fb        = inject(FormBuilder);
  private readonly dialogRef = inject<MatDialogRef<ConfirmarOrdenComponent, boolean>>(MatDialogRef);
  private readonly data      = inject<ConfirmarOrdenData | null>(MAT_DIALOG_DATA, { optional: true });
  private readonly snack     = inject(MatSnackBar);
  private readonly ordenes   = inject(OrdenService);
  readonly carrito           = inject(CarritoService);

  readonly maxNotas      = MAX_NOTAS;
  readonly minutosMinimo = MINUTOS_MINIMOS_RECOGIDA;
  readonly enviando      = signal(false);
  readonly minRecogida   = signal(aDatetimeLocal(new Date(Date.now() + MINUTOS_MINIMOS_RECOGIDA * 60_000)));

  readonly metodos = (this.data?.metodosPago?.length
    ? this.data.metodosPago
    : (Object.keys(ETIQUETAS_METODO) as MetodoPago[])
  ).map(valor => ({ valor, etiqueta: ETIQUETAS_METODO[valor] }));

  readonly form = this.fb.nonNullable.group({
    recogidaEn: [aDatetimeLocal(new Date(Date.now() + 15 * 60_000)), [Validators.required, recogidaMinimaValidator()]],
    metodo:     [this.metodos[0].valor, Validators.required],
    notas:      ['', Validators.maxLength(MAX_NOTAS)],
  });

  // FB-Sprint4 29/10/2026: arma el CrearOrdenRequest y lo envía por POST a /api/ordenes
  confirmar(): void {
    // El minuto mínimo avanza mientras el modal está abierto, se revalida al enviar
    this.minRecogida.set(aDatetimeLocal(new Date(Date.now() + MINUTOS_MINIMOS_RECOGIDA * 60_000)));
    this.form.controls.recogidaEn.updateValueAndValidity();

    const idCafeteria = this.carrito.idCafeteria();
    if (this.form.invalid || !idCafeteria || this.enviando()) {
      this.form.markAllAsTouched();
      return;
    }

    const { recogidaEn, metodo, notas } = this.form.getRawValue();
    const request: CrearOrdenRequest = {
      idCafeteria,
      recogidaEn: aIsoConOffset(new Date(recogidaEn)),
      metodo,
      items: this.carrito.items().map(i => ({ idProducto: i.idProducto, cantidad: i.cantidad })),
      ...(notas.trim() ? { notas: notas.trim() } : {}),
    };

    this.enviando.set(true);
    this.dialogRef.disableClose = true;

    this.ordenes.crearOrden(request)
      .pipe(finalize(() => {
        this.enviando.set(false);
        this.dialogRef.disableClose = false;
      }))
      .subscribe({
        // FB-Sprint4 01/11/2026: muestra el código y cierra con true; el drawer vacía el carrito
        next: ({ idOrden }) => {
          this.snack.open(`¡Pedido realizado! Código: ${codigoOrden(idOrden)}`, 'Cerrar', { duration: 6000 });
          this.dialogRef.close(true);
        },
        error: (err: ApiError) => {
          this.snack.open(err?.message ?? 'No se pudo crear la orden. Intenta de nuevo.', 'Cerrar', { duration: 5000 });
        },
      });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}

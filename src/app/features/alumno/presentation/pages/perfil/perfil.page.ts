// JY-Sprint4 05/11/2026: HU futura (cascarón visual). Perfil del alumno: datos, preferencias y accesos.
// CL-Sprint5 11/11/2026 (etapa 8): rediseño con datos de PerfilFacade (api/alumnos/me/...).
//   - Encabezado con iniciales, nombre y correo: el mismo nombre del layout (ya no "alumno" en minúsculas).
//   - Editar datos y cambiar contraseña en formularios validados (app-editar-datos, app-cambiar-password).
//   - Preferencias de pedido (punto frecuente y método preferido; el checkout arranca con ellas), avisos y
//     apariencia (claro / oscuro / sistema, en el navegador con TemaService).
//   - Resumen del historial calculado con los pedidos (pedidos, gasto del mes, cafetería más visitada).
//   - Cerrar sesión con la misma confirmación del layout (SesionUiService).
//   - Carga con esqueleto, error con "Reintentar" y cada guardado con su estado y su aviso.
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiError } from '@core/http/api-error';
import { PreferenciaTema, TemaService } from '@core/services/tema.service';
import { CatalogoFacade, METODOS_PAGO } from '@features/catalogo';
import { MisPedidosFacade } from '@features/ordenes';
import { IconComponent } from '@shared/ui/icon/icon.component';
import { NombreIcono } from '@shared/ui/icon/icons';
import { ToastService } from '@shared/ui/toast/toast.service';
import { FavoritosFacade } from '@features/alumno/application/favoritos.facade';
import { PerfilFacade } from '@features/alumno/application/perfil.facade';
import {
  MetodoPagoPreferido,
  PreferenciasAlumno,
  resumenHistorial,
} from '@features/alumno/domain/models/perfil.model';
import { CambiarPasswordComponent } from '@features/alumno/presentation/components/cambiar-password/cambiar-password.component';
import { INFO_METODO } from '@features/alumno/presentation/components/checkout/checkout.component';
import { EditarDatosComponent } from '@features/alumno/presentation/components/editar-datos/editar-datos.component';
import { SesionUiService } from '@features/alumno/presentation/sesion-ui.service';

type Dialogo = 'datos' | 'password' | null;
type Aviso = 'avisoPedidoListo' | 'avisoPromociones';

const TEMAS: { valor: PreferenciaTema; etiqueta: string; icono: NombreIcono }[] = [
  { valor: 'claro', etiqueta: 'Claro', icono: 'sol' },
  { valor: 'oscuro', etiqueta: 'Oscuro', icono: 'luna' },
  { valor: 'sistema', etiqueta: 'Según el sistema', icono: 'pantalla' },
];

@Component({
  selector: 'app-perfil-page',
  imports: [CurrencyPipe, RouterLink, IconComponent, CambiarPasswordComponent, EditarDatosComponent],
  templateUrl: './perfil.page.html',
  styleUrl: './perfil.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilPage {
  private readonly perfilFacade = inject(PerfilFacade);
  private readonly pedidos = inject(MisPedidosFacade);
  private readonly favoritos = inject(FavoritosFacade);
  private readonly catalogo = inject(CatalogoFacade);
  private readonly tema = inject(TemaService);
  private readonly sesionUi = inject(SesionUiService);
  private readonly toast = inject(ToastService);

  protected readonly temas = TEMAS;
  protected readonly metodos = METODOS_PAGO as readonly MetodoPagoPreferido[];
  protected readonly infoMetodo = INFO_METODO;
  protected readonly esqueletos = [0, 1, 2];

  protected readonly perfil = this.perfilFacade.perfil;
  protected readonly cargando = this.perfilFacade.cargando;
  protected readonly error = this.perfilFacade.error;
  protected readonly nombre = this.perfilFacade.nombre;
  protected readonly iniciales = this.perfilFacade.iniciales;
  protected readonly correo = this.perfilFacade.correo;
  protected readonly preferencias = this.perfilFacade.preferencias;
  protected readonly temaActual = this.tema.preferencia;

  protected readonly cafeterias = this.catalogo.menu;
  protected readonly activos = computed(() => this.pedidos.enCurso().length);
  protected readonly totalFavoritos = this.favoritos.total;
  protected readonly resumen = computed(() => resumenHistorial(this.pedidos.ordenes(), new Date()));
  protected readonly mesActual = new Intl.DateTimeFormat('es-MX', { month: 'long' }).format(new Date());

  protected readonly dialogo = signal<Dialogo>(null);
  /** Qué preferencia se está guardando (para su "Guardando…" y no mandar dos a la vez). */
  protected readonly guardando = signal<keyof PreferenciasAlumno | null>(null);

  constructor() {
    this.cargar();
    // El resumen y el selector de punto frecuente usan pedidos y cafeterías
    this.pedidos.cargar().subscribe({ error: () => undefined });
    this.catalogo.cargar().subscribe({ error: () => undefined });
  }

  protected cargar(): void {
    this.perfilFacade.cargar(true).subscribe({ error: () => undefined });
  }

  protected elegirPunto(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const antes = this.preferencias().idCafeteriaFrecuente ?? '';
    const id = select.value || null;
    const nombre = this.cafeterias().find((c) => c.idCafeteria === id)?.cafeteria;
    this.guardar(
      'idCafeteriaFrecuente',
      { idCafeteriaFrecuente: id },
      nombre ? `Tu punto frecuente ahora es ${nombre}.` : 'Quitaste tu punto frecuente.',
      () => (select.value = antes),
    );
  }

  protected elegirMetodo(metodo: MetodoPagoPreferido | null): void {
    if (metodo === this.preferencias().metodoPago) return;
    this.guardar(
      'metodoPago',
      { metodoPago: metodo },
      metodo ? `${INFO_METODO[metodo].etiqueta} quedó como tu método preferido.` : 'Ya no tienes un método preferido.',
    );
  }

  protected alternarAviso(aviso: Aviso, event: Event): void {
    const casilla = event.target as HTMLInputElement;
    const activo = !this.preferencias()[aviso];
    const que = aviso === 'avisoPedidoListo' ? 'Avisos de pedido listo' : 'Avisos de promociones';
    this.guardar(aviso, { [aviso]: activo }, `${que} ${activo ? 'activados' : 'desactivados'}.`, () => {
      casilla.checked = !activo;
    });
  }

  protected elegirTema(valor: PreferenciaTema): void {
    this.tema.elegir(valor);
  }

  protected salir(): void {
    this.sesionUi.pedirSalida();
  }

  /** `revertir`: regresa el control nativo (casilla, selector) si el guardado falla. */
  private guardar(
    clave: keyof PreferenciasAlumno,
    cambio: Partial<PreferenciasAlumno>,
    exito: string,
    revertir?: () => void,
  ): void {
    if (this.guardando()) {
      revertir?.();
      return;
    }
    this.guardando.set(clave);
    this.perfilFacade.guardarPreferencias(cambio).subscribe({
      next: () => {
        this.guardando.set(null);
        this.toast.ok(exito);
      },
      error: (e: ApiError) => {
        // El facade no cambió; los controles nativos sí, por eso se regresan
        this.guardando.set(null);
        revertir?.();
        this.toast.error(e?.message ?? 'No pudimos guardar tu preferencia. Intenta de nuevo.');
      },
    });
  }
}

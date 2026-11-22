import { expect, test as base, type Page, type Request } from '@playwright/test';
import { crearJwt, type DatosSesion } from './jwt';

// Fixtures compartidas. Dos ideas:
//  1. La API simulada es ESTRICTA: una llamada a /api/** sin respuesta definida responde 501 y hace fallar la prueba al
//     terminar. Así un mock olvidado o una llamada nueva del front no pasan en silencio (antes un comodín devolvía []).
//  2. Los errores se simulan con la forma REAL del back (ProblemDetails con "detail"), no con formas inventadas.

export interface Respuesta {
  status?: number;
  body?: unknown;
  /** Milisegundos de espera antes de responder (red lenta). */
  demoraMs?: number;
  /** Corta la conexión (sin red / servidor caído): el navegador reporta un error de red, no una respuesta HTTP. */
  abortar?: boolean;
}

export type Manejador = (peticion: Request) => Respuesta | Promise<Respuesta>;

interface Regla {
  metodo: string;
  patron: RegExp;
  manejador: Manejador;
}

export interface PeticionRegistrada {
  metodo: string;
  ruta: string;
  consulta: URLSearchParams;
  cuerpo: unknown;
  autorizacion: string | null;
}

/** Cuerpo de error del back (RFC 7807): el front muestra "detail". */
export function problema(status: number, detail: string, extra: Record<string, unknown> = {}): Respuesta {
  const titulos: Record<number, string> = {
    400: 'BadRequest', 401: 'Unauthorized', 403: 'Forbidden', 404: 'NotFound', 409: 'Conflict',
    429: 'TooManyRequests', 500: 'InternalServerError', 503: 'ServiceUnavailable', 504: 'GatewayTimeout',
  };
  return { status, body: { status, title: titulos[status] ?? 'Error', detail, instance: '/api/prueba', ...extra } };
}

function aRegex(ruta: string | RegExp): RegExp {
  if (ruta instanceof RegExp) return ruta;
  const patron = ruta.replace(/^\/+/, '').replace(/:[A-Za-z]+/g, '[^/]+').replace(/\/+$/, '');
  return new RegExp(`^/api/${patron}/?$`);
}

export class ApiSimulada {
  private readonly reglas: Regla[] = [];
  readonly peticiones: PeticionRegistrada[] = [];
  readonly noManejadas: string[] = [];

  constructor(private readonly page: Page) {}

  async instalar(): Promise<void> {
    await this.page.route(
      (url) => url.pathname.startsWith('/api/'),
      async (route) => {
        const peticion = route.request();
        const url = new URL(peticion.url());
        const metodo = peticion.method();
        let cuerpo: unknown = null;
        try {
          cuerpo = peticion.postDataJSON();
        } catch {
          cuerpo = peticion.postData();
        }
        this.peticiones.push({
          metodo, ruta: url.pathname, consulta: url.searchParams, cuerpo,
          autorizacion: peticion.headers()['authorization'] ?? null,
        });

        // La última regla registrada gana: una prueba puede sobrescribir lo que puso la base
        const regla = [...this.reglas].reverse().find((r) => r.metodo === metodo && r.patron.test(url.pathname));
        if (!regla) {
          this.noManejadas.push(`${metodo} ${url.pathname}${url.search}`);
          await route.fulfill({
            status: 501, contentType: 'application/problem+json',
            body: JSON.stringify({ status: 501, title: 'NoSimulada', detail: `Sin respuesta simulada para ${metodo} ${url.pathname}` }),
          });
          return;
        }
        const r = await regla.manejador(peticion);
        if (r.demoraMs) await new Promise((fin) => setTimeout(fin, r.demoraMs));
        if (r.abortar) {
          await route.abort('connectionrefused');
          return;
        }
        const status = r.status ?? 200;
        await route.fulfill({
          status,
          contentType: status >= 400 ? 'application/problem+json' : 'application/json',
          body: status === 204 ? undefined : JSON.stringify(r.body ?? {}),
        });
      },
    );
  }

  /** Define la respuesta de `METODO ruta` (la ruta admite `:id`; el prefijo /api/ va implícito). */
  on(metodo: string, ruta: string | RegExp, respuesta: Respuesta | Manejador): this {
    this.reglas.push({
      metodo: metodo.toUpperCase(),
      patron: aRegex(ruta),
      manejador: typeof respuesta === 'function' ? respuesta : () => respuesta,
    });
    return this;
  }

  get(ruta: string | RegExp, respuesta: Respuesta | Manejador): this {
    return this.on('GET', ruta, respuesta);
  }

  /** Cuántas veces se llamó a `METODO ruta`. */
  llamadas(metodo: string, ruta: string | RegExp): PeticionRegistrada[] {
    const patron = aRegex(ruta);
    return this.peticiones.filter((p) => p.metodo === metodo.toUpperCase() && patron.test(p.ruta));
  }
}

interface Fixtures {
  /** (automática) Corta lo que no sea local: las pruebas no deben depender de internet. */
  sinRedExterna: void;
  api: ApiSimulada;
  /** Siembra el token de la sesión (y la respuesta de /auth/me) ANTES de que cargue la app. */
  iniciarSesionComo: (sesion: DatosSesion, opciones?: { segundosDeVida?: number }) => Promise<string>;
}

export const test = base.extend<Fixtures>({
  // index.html pide las fuentes a fonts.googleapis.com: el evento "load" de page.goto esperaba a esa red externa y, si
  // iba lenta, la prueba se pasaba de tiempo (falla intermitente en page.goto). Las pruebas son herméticas: solo
  // llegan al front local; las fuentes caen a las de respaldo del sistema.
  sinRedExterna: [
    async ({ page }, use) => {
      await page.route(
        (url) => !['localhost', '127.0.0.1'].includes(url.hostname),
        (route) => route.abort(),
      );
      await use();
    },
    { auto: true },
  ],

  api: async ({ page }, use) => {
    const api = new ApiSimulada(page);
    await api.instalar();
    await use(api);
    // Una llamada sin respuesta simulada es un defecto de la prueba (o una llamada nueva que el front hace)
    expect(api.noManejadas, 'Llamadas a /api sin respuesta simulada').toEqual([]);
  },

  iniciarSesionComo: async ({ page, api }, use) => {
    await use(async (sesion, opciones = {}) => {
      const token = crearJwt(sesion, opciones.segundosDeVida);
      await page.addInitScript((t) => localStorage.setItem('cb.access_token', t), token);
      api.get('auth/me', {
        body: { id: sesion.id, correo: sesion.correo, rol: sesion.rol, nombre: sesion.nombre, idCafeteria: sesion.idCafeteria },
      });
      return token;
    });
  },
});

export { expect };

/**
 * CL-Sprint5 11/11/2026 (etapa 8): perfil del alumno. Datos personales, preferencias de pedido y avisos, con
 * sus reglas como funciones puras. Las validaciones son las mismas del registro (features/auth/register) para
 * que el back no rechace aquí lo que aceptó al crear la cuenta.
 */

/** Igual que catalogo/ordenes; se repite porque domain no importa otras features. */
export type MetodoPagoPreferido = 'efectivo' | 'tarjeta' | 'transferencia';

export interface DatosPersonales {
  /** El back siempre lo manda (2..80); `null` solo en un formulario vacío. */
  nombre: string | null;
  matricula: string | null;
  telefono: string | null;
}

export interface PreferenciasAlumno {
  /** Cafetería cuyo punto de recogida usa más (cada cafetería tiene un punto de entrega). */
  idCafeteriaFrecuente: string | null;
  /** Solo el método, nunca datos de tarjetas. */
  metodoPago: MetodoPagoPreferido | null;
  avisoPedidoListo: boolean;
  avisoPromociones: boolean;
}

export interface PerfilAlumno {
  correo: string;
  datos: DatosPersonales;
  preferencias: PreferenciasAlumno;
}

export interface CambioPassword {
  actual: string;
  nueva: string;
  confirmacion: string;
}

export const PREFERENCIAS_INICIALES: PreferenciasAlumno = {
  idCafeteriaFrecuente: null,
  metodoPago: null,
  avisoPedidoListo: true,
  avisoPromociones: false,
};

export const LIMITES_PERFIL = {
  nombreMin: 2,
  nombreMax: 80,
  matriculaMax: 20,
  passwordMin: 8,
  passwordMax: 72,
} as const;

// ---------- Nombre ----------

/**
 * El nombre que se muestra en toda la app. CL-Sprint5 13/11/2026: ya no se arma con el correo; sale del back:
 * primero el del perfil (se refresca con la respuesta de PUT api/alumnos/me/perfil) y, mientras carga, el de
 * la sesión (login o /me, que lo leen del token y no cambian hasta volver a iniciar sesión).
 */
export function nombreVisible(
  nombrePerfil: string | null | undefined,
  nombreSesion: string | null | undefined,
): string {
  return nombrePerfil?.trim() || nombreSesion?.trim() || 'Alumno';
}

/** "Juan Pérez" → "JP"; "Alumno" → "A". */
export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  const letras = partes.length > 1 ? [partes[0], partes[partes.length - 1]] : partes;
  return letras.map((p) => p.charAt(0).toLocaleUpperCase('es')).join('') || 'A';
}

// ---------- Validaciones ----------

export type ErroresDatos = Partial<Record<keyof DatosPersonales, string>>;
export type ErroresPassword = Partial<Record<keyof CambioPassword, string>>;

const TELEFONO = /^[0-9+]{10,15}$/;

/** Quita espacios y guiones del teléfono ("442 123 4567" → "4421234567"). */
export function limpiarTelefono(telefono: string): string {
  return telefono.replace(/[\s()-]/g, '');
}

export function validarDatos(d: { nombre: string; matricula: string; telefono: string }): ErroresDatos {
  const errores: ErroresDatos = {};
  const nombre = d.nombre.trim();
  if (nombre.length < LIMITES_PERFIL.nombreMin) {
    errores.nombre = 'Escribe tu nombre (al menos 2 letras).';
  } else if (nombre.length > LIMITES_PERFIL.nombreMax) {
    errores.nombre = `Tu nombre puede tener hasta ${LIMITES_PERFIL.nombreMax} caracteres.`;
  }
  if (d.matricula.trim().length > LIMITES_PERFIL.matriculaMax) {
    errores.matricula = `La matrícula puede tener hasta ${LIMITES_PERFIL.matriculaMax} caracteres.`;
  }
  const telefono = limpiarTelefono(d.telefono);
  if (telefono && !TELEFONO.test(telefono)) {
    errores.telefono = 'Usa de 10 a 15 dígitos, por ejemplo 442 123 4567.';
  }
  return errores;
}

/** Datos listos para guardar: recortados y con los vacíos como `null`. */
export function normalizarDatos(d: { nombre: string; matricula: string; telefono: string }): DatosPersonales {
  return {
    nombre: d.nombre.trim() || null,
    matricula: d.matricula.trim() || null,
    telefono: limpiarTelefono(d.telefono) || null,
  };
}

export function validarCambioPassword(c: CambioPassword): ErroresPassword {
  const errores: ErroresPassword = {};
  if (!c.actual) errores.actual = 'Escribe tu contraseña actual.';
  if (c.nueva.length < LIMITES_PERFIL.passwordMin) {
    errores.nueva = `La nueva contraseña necesita al menos ${LIMITES_PERFIL.passwordMin} caracteres.`;
  } else if (c.nueva.length > LIMITES_PERFIL.passwordMax) {
    errores.nueva = `La nueva contraseña puede tener hasta ${LIMITES_PERFIL.passwordMax} caracteres.`;
  } else if (c.nueva === c.actual) {
    errores.nueva = 'La nueva contraseña debe ser distinta de la actual.';
  }
  if (c.confirmacion !== c.nueva) errores.confirmacion = 'Las contraseñas no coinciden.';
  return errores;
}

export function sinErrores(errores: object): boolean {
  return Object.keys(errores).length === 0;
}

// ---------- Resumen del historial ----------

/** Lo mínimo de una orden para el resumen (sin depender de la feature ordenes). */
export interface OrdenResumible {
  idCafeteria: string;
  cafeteria: string;
  estado: string;
  total: number;
  creadoEn: string;
}

export interface ResumenHistorial {
  pedidosTotales: number;
  /** Suma del mes en curso, sin los cancelados. */
  gastadoMes: number;
  cafeteriaFrecuente: { idCafeteria: string; nombre: string; pedidos: number } | null;
}

/** Cuenta los pedidos no cancelados; el gasto es del mes de `ahora` (hora local). */
export function resumenHistorial(ordenes: readonly OrdenResumible[], ahora: Date): ResumenHistorial {
  const validas = ordenes.filter((o) => o.estado !== 'cancelada');
  const delMes = validas.filter((o) => {
    const f = new Date(o.creadoEn);
    return f.getFullYear() === ahora.getFullYear() && f.getMonth() === ahora.getMonth();
  });

  const conteo = new Map<string, { idCafeteria: string; nombre: string; pedidos: number }>();
  for (const o of validas) {
    const c = conteo.get(o.idCafeteria) ?? { idCafeteria: o.idCafeteria, nombre: o.cafeteria, pedidos: 0 };
    c.pedidos++;
    conteo.set(o.idCafeteria, c);
  }
  // Empate: la que aparece primero (las órdenes vienen de la más reciente a la más vieja)
  const frecuente = [...conteo.values()].reduce<ResumenHistorial['cafeteriaFrecuente']>(
    (mejor, c) => (!mejor || c.pedidos > mejor.pedidos ? c : mejor),
    null,
  );

  return {
    pedidosTotales: validas.length,
    gastadoMes: delMes.reduce((s, o) => s + o.total, 0),
    cafeteriaFrecuente: frecuente,
  };
}

// JJ-Sprint5 27/11/2026: el service worker guarda las respuestas de la API (pedidos con su código, perfil,
// favoritos…) para verlas sin conexión (ngsw-config.json). Al cerrar sesión se borran, para que en un celular
// compartido nadie vea los datos del usuario anterior.

/** Grupos de datos de ngsw-config.json con información del usuario. El menú (api-menu) también se borra: es barato volver a pedirlo. */
export const GRUPOS_CACHE_API = ['api-campusbite', 'api-menu'];

export async function borrarCacheApi(): Promise<void> {
  if (typeof caches === 'undefined') return;
  const nombres = await caches.keys();
  await Promise.all(
    nombres.filter((n) => GRUPOS_CACHE_API.some((g) => n.includes(g))).map((n) => caches.delete(n)),
  );
}

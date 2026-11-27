import { borrarCacheApi } from './cache-api';

/** JJ-Sprint5 27/11/2026: al cerrar sesión se borran solo los cachés de datos de la API, no la app instalada. */
describe('borrarCacheApi', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('borra los cachés de la API y deja los de la app', async () => {
    const borrados: string[] = [];
    vi.stubGlobal('caches', {
      keys: async () => [
        'ngsw:/:1:data:api-campusbite:cache',
        'ngsw:/:1:data:api-campusbite:age',
        'ngsw:/:1:data:api-menu:cache',
        'ngsw:/:1:data:imagenes-productos:cache',
        'ngsw:/:1:assets:app:cache',
      ],
      delete: async (n: string) => (borrados.push(n), true),
    });

    await borrarCacheApi();

    expect(borrados).toEqual([
      'ngsw:/:1:data:api-campusbite:cache',
      'ngsw:/:1:data:api-campusbite:age',
      'ngsw:/:1:data:api-menu:cache',
    ]);
  });

  it('no falla donde no hay Cache Storage', async () => {
    vi.stubGlobal('caches', undefined);
    await expect(borrarCacheApi()).resolves.toBeUndefined();
  });
});

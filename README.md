# CampusBite · Front (PWA)

Angular 21 (standalone, zoneless, signals) · PWA con Service Worker · Vitest · ESLint · Docker + Nginx.

## Arquitectura (Clean Architecture con enfoque MVC)

```
src/
├── environments/              # Config de build (NO secretos)
│   ├── environment.ts             → producción
│   └── environment.development.ts → desarrollo (fileReplacements)
├── styles/                    # Design tokens SCSS
└── app/
    ├── core/                  # Infraestructura transversal (singletons)
    │   ├── config/                → AppConfigService (config en runtime)
    │   ├── http/                  → ApiClient base + ApiError
    │   ├── interceptors/          → auth (Bearer), error (401/ProblemDetails), loading
    │   ├── guards/                → authGuard, guestGuard
    │   └── services/              → logger, token storage, loading
    ├── domain/        ── MODEL ── # Entidades + contratos. TS puro, sin Angular/HTTP
    │   ├── models/
    │   └── repositories/          → clases abstractas (puertos)
    ├── data/                      # Implementación de los contratos contra el API .NET
    │   ├── dtos/                  → forma exacta del JSON del backend
    │   ├── mappers/               → DTO ⇄ entidad de dominio
    │   ├── repositories/          → *HttpRepository
    │   └── data.providers.ts      → enlace contrato → implementación (DI)
    ├── application/ ─ CONTROLLER ─ # Facades: casos de uso + estado (signals)
    │   └── facades/
    ├── presentation/ ── VIEW ──   # Solo UI. Habla con facades, nunca con HTTP
    │   ├── layouts/
    │   ├── pages/                 → una carpeta por ruta (lazy loaded)
    │   └── components/            → componentes reutilizables
    └── shared/                    # pipes, directivas, utils sin estado
```

**Regla de dependencias:** `presentation → application → domain ← data`. El dominio no conoce a nadie.

### Agregar un módulo nuevo (ej. Pedidos)

1. `domain/models/order.model.ts` y `domain/repositories/order.repository.ts` (clase abstracta)
2. `data/dtos/order.dto.ts`, `data/mappers/order.mapper.ts`, `data/repositories/order-http.repository.ts`
3. Registrar en `data/data.providers.ts`
4. `application/facades/order.facade.ts`
5. `presentation/pages/orders/` + ruta en `app.routes.ts`

Alias de importación: `@core/*`, `@domain/*`, `@data/*`, `@application/*`, `@presentation/*`, `@shared/*`, `@env/*`.

## Configuración y credenciales

| Archivo | ¿Se versiona? | Uso |
|---|---|---|
| `src/environments/*.ts` | Sí | Valores por defecto **no sensibles** |
| `.env.example` | Sí | Plantilla de variables |
| `.env` | **No** | Valores reales (Docker / CI) |
| `public/config/runtime-config.example.json` | Sí | Plantilla |
| `public/config/runtime-config.json` | **No** | Config en runtime (lo genera el contenedor) |

> ⚠️ Todo lo que llega al navegador es público. **Nunca** pongas secretos (connection strings, client secrets, llaves privadas) en el front: viven solo en el backend.

El `AppConfigService` lee `/config/runtime-config.json` al arrancar; si no existe usa `environment.ts`. Así **un solo build** sirve para QA y producción.

## Desarrollo

```bash
npm install
npm start            # http://localhost:4200  (/api → https://localhost:7254 vía proxy.conf.json)
npm test             # Vitest
npm run lint
```

Ajusta el puerto del backend en `proxy.conf.json` si cambia `CampusBite-Back/Properties/launchSettings.json`.

## Producción

```bash
npm run build        # dist/campusbite-front/browser
# o con Docker:
cp .env.example .env # edita API_URL
docker compose up -d --build   # http://localhost:8080
```

Incluye: build optimizado con hashing + SRI, budgets estrictos, Service Worker, Nginx no-root con gzip, cache inmutable para assets, sin cache para `index.html`/SW, cabeceras de seguridad (CSP, X-Frame-Options…) y healthcheck en `/healthz`.

### Backend (.NET)

Si el front y el API están en dominios distintos, habilita CORS en `Program.cs` para el origen del front y agrega el dominio del API en `connect-src` de la CSP en `docker/nginx.conf`.

## Nota de entorno

Angular 22 requiere Node ≥ 22.22.3. Con Node 22.19 se usa Angular 21. Para actualizar:

```bash
# tras actualizar Node
npx ng update @angular/core@22 @angular/cli@22
```

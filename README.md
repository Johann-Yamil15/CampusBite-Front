# CampusBite · Front (PWA)

PWA de CampusBite para reservar y pagar comida en las cafeterías de la UTTT sin hacer fila. Explora menús, arma tu pedido, elige horario y muestra tu folio QR. Guarda contenido en caché local (Service Worker + IndexedDB) para no perder lo cargado si falla la red y se actualiza al volver la conexión. UTTT · 10 IDGSM G3.

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

## Reglas para desarrollar (léelas tú y dáselas a tu IA)

> 🤖 **Si usas IA (Claude, Copilot, ChatGPT, Cursor…):** pásale este README **y** [CONTRIBUTING.md](CONTRIBUTING.md) como contexto antes de pedirle código, y pídele que siga las reglas de ambos. Revisa lo que genere antes de hacer commit.

### Código Angular

Usa como referencia `products.page.ts` + `product.facade.ts`: ese es el patrón a copiar.

- **Componentes standalone** (sin `NgModule`). Importa en `imports: []` solo lo que use el template.
- **`changeDetection: ChangeDetectionStrategy.OnPush`** en todos los componentes.
- **Inyección con `inject()`**, no por constructor: `private readonly repo = inject(ProductRepository);`
- **Estado con signals** (`signal`, `computed`) dentro de las facades. Nada de `BehaviorSubject` para estado de UI.
- **Control flow nuevo** en templates: `@if`, `@for (...; track x.id)`, `@empty`. No usar `*ngIf` / `*ngFor`.
- La app es **zoneless**: no dependas de `zone.js` ni uses `setTimeout` para "forzar" el render; actualiza un signal.
- Nombres de archivo: `xxx.page.ts` (rutas), `xxx.component.ts` (reutilizables/layouts), `xxx.facade.ts`, `xxx.model.ts`, `xxx.repository.ts`, `xxx-http.repository.ts`, `xxx.dto.ts`, `xxx.mapper.ts`.
- Template y estilos en archivos separados (`.html` / `.scss`) salvo componentes muy pequeños. Usa los tokens de `src/styles/_tokens.scss`, no colores sueltos.
- Importa siempre con los **alias** (`@domain/...`), nunca con rutas relativas largas (`../../../`).

### Respeta las capas

- Una **página nunca llama HTTP** ni a un repositorio: solo a su facade (`protected readonly vm = inject(XxxFacade)`).
- Una **facade** usa repositorios del `domain` (la clase abstracta), nunca `HttpClient` directo.
- **`domain/` es TypeScript puro**: no importa nada de `@angular/*`, `data/` ni `presentation/`.
- Los **DTO** (forma del JSON del backend) solo viven en `data/`; hacia arriba siempre viajan modelos de dominio a través del mapper.
- Cada página nueva va **lazy** en `app.routes.ts` con `loadComponent` y un `title`. Si requiere sesión, `canActivate: [authGuard]`.
- Errores HTTP: ya los normaliza `error.interceptor` a `ApiError`; en la facade solo guarda `err.message` en el signal `error`.

### Ramas, commits y comentarios

Se rigen por [CONTRIBUTING.md](CONTRIBUTING.md) (nombres de rama, formato `INICIALES-Sprint# DD/MM/AAAA: ...` en comentarios y commits, flujo de Pull Requests). Antes de abrir tu PR, `npm run lint` y `npm test` deben pasar.

### Extra: MCP de Angular

El repo incluye `.vscode/mcp.json` con el servidor MCP oficial de Angular CLI. Si tu asistente en VS Code soporta MCP, actívalo para que consulte la documentación y buenas prácticas de Angular actualizadas.

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

## Cómo correr el proyecto

### Requisitos

- [Node.js](https://nodejs.org/) **22.19 o superior** (`node -v`)
- npm 11 (viene con Node; `npm -v`)
- Git
- *(Opcional)* Angular CLI global: `npm install -g @angular/cli@21` — no es obligatorio, los scripts usan el CLI local
- *(Opcional)* Docker Desktop, solo para la build de producción
- El backend **CampusBite-Back** corriendo en `https://localhost:7254` para que funcionen las llamadas al API

### Primera vez

```bash
git clone https://github.com/Johann-Yamil15/CampusBite-Front.git
cd CampusBite-Front
git checkout develop        # o la rama del sprint en curso (ej. Sprint1)
npm install                 # instala dependencias (usa package-lock.json)
npm start                   # abre http://localhost:4200
```

No necesitas crear `.env` ni `runtime-config.json` para desarrollo: en local se usa `src/environments/environment.development.ts`.

### Comandos útiles

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo en `http://localhost:4200` con recarga automática. `/api` → `https://localhost:7254` vía `proxy.conf.json` |
| `npm test` | Pruebas unitarias (Vitest) en modo watch |
| `npm run test:ci` | Pruebas una sola vez (CI) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier sobre `src/` |
| `npm run build` | Build de producción en `dist/campusbite-front/browser` |

Ajusta el puerto del backend en `proxy.conf.json` si cambia `CampusBite-Back/Properties/launchSettings.json`.

> El Service Worker solo se activa en la build de producción, no con `npm start`. Para probar la PWA/offline usa `npm run build` y sirve `dist/` (o Docker).

### Problemas comunes

- **`ng` no se reconoce**: usa `npm start` / `npx ng ...` en vez de `ng ...`.
- **Errores al instalar**: revisa `node -v` (≥ 22.19); borra `node_modules` y vuelve a correr `npm install`.
- **Puerto 4200 ocupado**: `npx ng serve --port 4300`.
- **Las peticiones a `/api` fallan**: verifica que el backend esté corriendo y que el puerto coincida con `proxy.conf.json`.

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

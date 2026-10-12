# CampusBite · Front (PWA)

PWA de CampusBite para reservar y pagar comida en las cafeterías de la UTTT sin hacer fila. Explora menús, arma tu pedido, elige horario y muestra tu folio QR. Guarda contenido en caché local (Service Worker + IndexedDB) para no perder lo cargado si falla la red y se actualiza al volver la conexión. UTTT · 10 IDGSM G3.

Angular 21 (standalone, zoneless, signals) · PWA con Service Worker · Vitest · ESLint · Docker + Nginx.

## Arquitectura: Clean Architecture por cortes verticales (features)

Cada funcionalidad del negocio es una **carpeta autocontenida** en `features/` con sus 4 capas adentro. Una historia de usuario se trabaja casi siempre dentro de una sola carpeta, así que el equipo puede avanzar en paralelo sin pisarse.

```
src/
├── environments/                  # Config de build (NO secretos)
├── styles/                        # Design tokens SCSS (_tokens.scss)
└── app/
    ├── app.config.ts              → providers globales (HTTP, interceptores, provideAuth)
    ├── app.routes.ts              → solo monta features con loadChildren
    ├── core/                      # Infraestructura técnica. NO conoce ninguna feature
    │   ├── config/                    → AppConfigService (config en runtime)
    │   ├── http/                      → ApiClient base + ApiError
    │   ├── interceptors/              → auth (Bearer), error (401/ProblemDetails), loading
    │   ├── services/                  → logger, token storage, loading
    │   └── utils/                     → jwt.util
    ├── shared/                    # Reutilizable sin lógica de negocio. NO conoce features
    │   ├── ui/                        → componentes visuales (loader, …)
    │   └── pipes/ directives/ utils/
    ├── shell/                     # Marco de la app: layouts y página 404
    │   ├── layouts/main-layout/
    │   └── not-found/
    └── features/
        ├── auth/                  # HU-01 · login, registro, sesión y guards
        │   ├── domain/        ── MODEL ──      → models/, repositories/ (puertos). TS puro
        │   ├── data/                           → dtos/, mappers/, repositories/ (*HttpRepository)
        │   ├── application/ ─ CONTROLLER ─     → auth.facade.ts (casos de uso + signals)
        │   ├── presentation/ ── VIEW ──        → pages/login, pages/register, guards/
        │   ├── auth.routes.ts                  → rutas de la feature (/auth/*)
        │   ├── auth.providers.ts               → contrato → implementación (DI)
        │   └── index.ts                        → API pública (lo único que ven otras features)
        ├── products/              # Menú (ejemplo de referencia del patrón)
        └── home/
```

**Regla de dependencias dentro de una feature:** `presentation → application → domain ← data`. El dominio no conoce a nadie.

**Regla entre carpetas:** `features → core / shared`, `shell → features (API pública)`. `core` y `shared` nunca importan features.

Estas reglas **las hace cumplir ESLint** (`eslint.config.js`): si alguien (o su IA) las rompe, `npm run lint` falla con un mensaje que explica qué capa no puede importar qué.

### Agregar una feature nueva (ej. Pedidos)

Copia la forma de `features/products/`:

1. `features/orders/domain/models/order.model.ts` y `domain/repositories/order.repository.ts` (clase abstracta)
2. `features/orders/data/dtos/order.dto.ts`, `data/mappers/order.mapper.ts` (+ `.spec.ts`), `data/repositories/order-http.repository.ts`
3. `features/orders/application/order.facade.ts` con `@Injectable()` (sin `providedIn`)
4. `features/orders/presentation/pages/orders/orders.page.ts|html|scss`
5. `features/orders/orders.routes.ts`: rutas + `providers: [OrderFacade, { provide: OrderRepository, useClass: OrderHttpRepository }]`
6. `features/orders/index.ts`: exporta solo lo que otras features necesiten (puede empezar vacío)
7. Una línea en `app.routes.ts`: `{ path: 'pedidos', loadChildren: () => import('@features/orders/orders.routes') }`

No hay que tocar `app.config.ts` ni archivos de otras features. Las reglas de ESLint detectan la carpeta nueva solas.

**¿Cuándo un provider va en la raíz?** Solo si toda la app lo necesita antes de entrar a la feature (hoy únicamente `provideAuth()`, porque lo usan los guards y el layout). Todo lo demás va en su `<feature>.routes.ts`.

**¿Una feature necesita algo de otra?** Impórtalo de su API pública (`import { AuthFacade } from '@features/auth'`), nunca de sus carpetas internas. Si no está exportado en su `index.ts`, agrégalo ahí.

Alias de importación: `@core/*`, `@shared/*`, `@shell/*`, `@features/*`, `@env/*`.

### Imágenes y logo

- **Imágenes de la app:** `public/assets/images/` → en el código se usan como `src="assets/images/archivo.png"`. Nombres en minúsculas y con guiones (el servidor de Azure distingue mayúsculas). Optimízalas antes de subirlas (ancho máximo ≈ 2× el tamaño en pantalla).
- **Logo:** `public/assets/images/logo-campusbite.png` (160 px, esquinas transparentes).
- **Íconos de la PWA:** `public/icons/` (`icon-*.png` normales, `icon-maskable-*.png` para Android y `apple-touch-icon.png` para iOS) y `public/favicon.ico`.
- **Archivos fuente de diseño** (originales en alta resolución): `branding/`. Esta carpeta **no** se publica.

## Reglas para desarrollar (léelas tú y dáselas a tu IA)

> 🤖 **Si usas IA (Claude, Copilot, ChatGPT, Cursor…):** pásale este README **y** [CONTRIBUTING.md](CONTRIBUTING.md) como contexto antes de pedirle código, y pídele que siga las reglas de ambos. Revisa lo que genere antes de hacer commit.

### Código Angular

Usa como referencia `features/products/` (página + facade + routes) y `features/auth/` (facade con `isLoading`/`error` y métodos que regresan `Observable` cuando la página debe reaccionar, p. ej. navegar tras el login).

- **Componentes standalone** (sin `NgModule`). Importa en `imports: []` solo lo que use el template.
- **`changeDetection: ChangeDetectionStrategy.OnPush`** en todos los componentes.
- **Inyección con `inject()`**, no por constructor: `private readonly repo = inject(ProductRepository);`
- **Estado con signals** (`signal`, `computed`) dentro de las facades. Nada de `BehaviorSubject` para estado de UI.
- **Control flow nuevo** en templates: `@if`, `@for (...; track x.id)`, `@empty`. No usar `*ngIf` / `*ngFor`.
- La app es **zoneless**: no dependas de `zone.js` ni uses `setTimeout` para "forzar" el render; actualiza un signal.
- Nombres de archivo: `xxx.page.ts` (rutas), `xxx.component.ts` (reutilizables/layouts), `xxx.facade.ts`, `xxx.model.ts`, `xxx.repository.ts`, `xxx-http.repository.ts`, `xxx.dto.ts`, `xxx.mapper.ts`.
- Template y estilos en archivos separados (`.html` / `.scss`) salvo componentes muy pequeños. Usa los tokens de `src/styles/_tokens.scss`, no colores sueltos.
- Importa siempre con los **alias** (`@features/orders/domain/...`, `@core/...`), nunca con rutas `../../` (ESLint lo marca). Dentro de la misma carpeta, `./archivo` está bien.

### Respeta las capas

- Una **página nunca llama HTTP** ni a un repositorio: solo a su facade (`protected readonly vm = inject(XxxFacade)`).
- Una **facade** usa repositorios del `domain` (la clase abstracta), nunca `HttpClient` directo.
- **`domain/` es TypeScript puro**: no importa nada de `@angular/*`, `data/` ni `presentation/`.
- Los **DTO** (forma del JSON del backend) solo viven en `data/`; hacia arriba siempre viajan modelos de dominio a través del mapper.
- Cada página va **lazy** en el `<feature>.routes.ts` de su feature con `loadComponent` y un `title`. Todo lo que cuelga del `MainLayout` ya está protegido con `authGuard`.
- Errores HTTP: ya los normaliza `error.interceptor` a `ApiError`; en la facade guarda el mensaje en el signal `error`.
- **Una feature no importa el interior de otra**: solo su API pública `@features/<feature>`.

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

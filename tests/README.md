# Pruebas end-to-end (Playwright)

```
tests/
  mocks/      La API está SIMULADA. No necesitan back. Corren por defecto (Chromium de escritorio y Pixel 7).
  real/       El back REAL local. Opcionales: solo con E2E_REAL=1 (ver abajo).
  support/    fixtures, JWT y respuestas de ejemplo compartidas
```

## Cómo correr

```bash
npm run e2e                 # todo lo de tests/mocks (no necesita back)
npm run e2e -- tests/mocks/negocio-panel.spec.ts
npm run e2e:ui              # modo interactivo
npm run e2e:reporte         # abre el último reporte HTML
```

## Pruebas con la API simulada (`tests/mocks`)

| Archivo | Qué cubre |
|---|---|
| `auth.spec.ts` | Login (alumno y encargado), errores 401/403/429 con el `detail` del back, guard de visitantes |
| `verificar-correo.spec.ts` | Enlace del correo: token válido, vencido, usado y ausente; reenvío |
| `roles-y-sesion.spec.ts` | Guards por rol, token vencido, 401 a mitad de sesión, cerrar sesión |
| `negocio-panel.spec.ts` | Panel del dueño: platillos sin categoría, paginación (>100), vacío, 403 y reintento |
| `catalogo-carrito.spec.ts` | Buscar en el menú del alumno y agregar al carrito |
| `errores-de-red.spec.ts` | Sin conexión, 500, 429, respuesta lenta y respuesta con forma inesperada |

### Reglas que conviene respetar al escribir pruebas nuevas

- **Importa `test` y `expect` de `../support/fixtures`, no de `@playwright/test`.** La fixture `api` es **estricta**: una
  llamada a `/api/**` sin respuesta definida devuelve 501 y hace fallar la prueba. Así un mock olvidado, o una llamada
  nueva del front, no pasan en silencio. (Antes un comodín `**/api/**` devolvía `[]` para todo.)
- **Los errores van con la forma real del back:** `problema(status, detail)` genera un ProblemDetails. El front muestra
  `detail`; un `{ message }` inventado no existe en el back.
- **Las respuestas de ejemplo (`support/datos.ts`) tienen la forma exacta de los DTOs del back.** Si un contrato cambia,
  se cambia ahí. Una forma inventada ya causó un falso fallo ("Cannot read properties of undefined (reading 'map')").
- **La sesión se siembra con `iniciarSesionComo(ENCARGADO)`**: pone el JWT en `localStorage` y simula `GET /auth/me`.
  No hace falta pasar por la pantalla de login en cada prueba.
- Usa roles y nombres accesibles (`getByRole('heading', { name })`), no regex amplios: `/agregar|\+/` llegó a coincidir
  con el filtro "4+ estrellas".

## Pruebas contra el back real (`tests/real`)

Comprueban que el front y el back **hablan el mismo contrato**, sin ninguna respuesta simulada. Necesitan un back local
con PostgreSQL desechable y los datos de `90_datos_dev`. Los pasos para levantarlo están en
`CampusBite-Back/tests/carga-k6/README.md` (sección "Preparar el ambiente"). En resumen:

1. Back en `http://localhost:5167` arrancado con `Jwt__Key=<llave de pruebas>` y `Cors__AllowedOrigins` con
   `http://localhost:4201`.
2. Correr con la MISMA llave:

   ```bash
   E2E_REAL=1 JWT_KEY=<llave de pruebas> npx playwright test --project=api-real --project=ui-real
   ```

   Opcional: `API_URL` si el back no está en `http://localhost:5167`.

| Proyecto | Qué hace |
|---|---|
| `api-real` | REST con `request`: 401/403/409/400 como ProblemDetails, forma de `/api/menu`, categorías y productos paginados, crear un platillo sin categoría, permisos por rol |
| `ui-real` | El front (`ng serve` con proxy al back local, puerto 4201) con una sesión de JWT firmado: panel del dueño con datos reales, catálogo del alumno, token inválido |

La sesión se abre con un JWT firmado con la llave del back local (`support/jwt-firmado.ts`), así no hay que verificar un
correo en cada corrida. **Esa llave es solo de pruebas: nunca la de producción.** Estas pruebas escriben en la base
(crean y borran platillos y categorías): úsalas solo contra una base desechable.

# Pendientes para el equipo — Sprint 5

Cosas detectadas durante el rediseño de alumno y proveedor (rama `feature/CL-Sprint5-rediseno-alumno-proveedor`)
que quedan **fuera del alcance** de ese trabajo. Cada una dice de quién es y qué falta.

## Front

| # | Pendiente | Dónde | Responsable sugerido |
|---|---|---|---|
| F1 | En **modo oscuro**, el enlace "¿Olvidaste tu contraseña?" del login se ve en el azul por defecto del navegador (no tiene color propio). Debería usar `var(--cb-primary)` como los demás enlaces. | `features/auth/presentation/pages/login` | Dueño de auth (fuera del alcance del rediseño) |
| F2 | La foto de **Molletes** de los datos demo es una bruschetta (no hay foto libre de molletes en Unsplash). Si hay foto propia, reemplazar `public/assets/demo/molletes.webp` y actualizar el README de esa carpeta. | `public/assets/demo` | Quien tenga fotos del producto |
| F3 | Las **portadas y logos** de las cafeterías demo siguen siendo de Picsum (foto genérica). | `core/mock/demo-db.ts` | Diseño / quien tenga fotos de las cafeterías |

## Backend

El detalle de contratos está en `BACKEND_SPECIFICATION.md` (secciones 4, 6 y 7). Resumen de lo que el front ya necesita:

| # | Pendiente |
|---|---|
| B1 | `idCafeteria` (y `nombre`) en la respuesta de login y en `GET /api/auth/me`. Hoy el front adivina la cafetería del encargado probando endpoints (`resolverCafeteriaDelEncargado`, temporal). |
| B2 | `GET /api/menu` y `GET /api/menu/{id}` para el alumno (`sp_menu_cafeteria` ya existe). Hoy el listado de productos exige rol de cafetería. |
| B3 | `OrdenesController` sobre los SP que ya existen (`sp_crear_orden`, `sp_mis_ordenes`, `sp_cancelar_orden`, `sp_cola_cafeteria`, `sp_cambiar_estado_orden`, `sp_entregar_orden`). |
| B4 | Favoritos, perfil editable, promociones, horario y estadísticas: no hay tablas o endpoints todavía. |
| B5 | Unir la rama `feature/JY-Sprint4-verificacion-correo` (incluye la paginación de cafeterías). |

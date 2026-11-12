# CampusBite — Especificación para el backend

| | |
|---|---|
| **Versión** | 1.0 |
| **Fecha** | 11/11/2026 |
| **Autor** | CL (front), con base en el rediseño Sprint 5 (`feature/CL-Sprint5-rediseno-alumno-proveedor`) |
| **Revisado contra** | `CampusBite-Back` rama `Sprint4` (= `develop`) y las ramas sin merge `feature/JY-Sprint4-paginacion-cafeterias` y `feature/JY-Sprint4-verificacion-correo` |

## 1. Para qué es este documento

El front del alumno y del encargado ya está completo y funciona con **repositorios simulados (mocks)** que aplican las mismas reglas que los procedimientos de la BD. Este documento le dice al equipo de backend **qué endpoints necesita el front, cuáles ya existen, cuáles hay que ajustar y cuáles son nuevos**, con el contrato exacto que el front ya consume. Cuando un endpoint esté listo, el front cambia una línea (`useClass` del mock al HTTP) y la pantalla queda conectada sin más cambios (sección 9).

Cómo está organizado:

1. Resumen (esta sección).
2. Convenciones reales del backend.
3. Tabla general de endpoints por módulo: ✅ ya existe · 🔄 existe, hay que ajustarlo · 🆕 nuevo.
4. Detalle de cada endpoint nuevo o ajustado (request, response, validaciones, errores, SP/tabla).
5. Reglas de negocio.
6. Cambios de BD, con prioridad.
7. Pendientes conocidos.
8. Orden sugerido de implementación.
9. Para el front: cómo conectar cada feature cuando su endpoint esté listo.

> Los contratos de las secciones 3 y 4 son los que **ya usan** los repositorios HTTP del front (`features/*/data/repositories/*-http.repository.ts`) y sus DTO (`features/*/data/dtos`). Si el back decide publicar algo distinto, se ajusta el DTO o el mapper del front, no las pantallas.

---

## 2. Convenciones reales del backend

Verificadas en el código de `Sprint4`:

| Tema | Convención real | Dónde está |
|---|---|---|
| Rutas | `/api/<recurso>` en minúsculas y español: `/api/auth/login`, `/api/cafeterias/{idCafeteria}/productos`. Ids `Guid` con restricción `:guid`. | Controladores en `src/CampusBite.Api` |
| JSON | camelCase en español (`idCafeteria`, `puntoEntrega`, `metodosPago`, `creadoEn`). Fechas ISO-8601 con offset (`DateTimeOffset`). Montos `decimal`. | Serializador por defecto de ASP.NET Core |
| Enums en JSON | **Texto en PascalCase**, sin enteros: `"Tarjeta"`, `"Transferencia"`, `"Efectivo"`; roles `"Alumno"`, `"AdminCafeteria"`, `"AdminSistema"`. | `Program.cs`: `JsonStringEnumConverter(allowIntegerValues: false)` |
| Hacia la BD | Los SP reciben y devuelven JSON en `snake_case` y enums en minúsculas (`en_preparacion`); el repositorio traduce. | `Infrastructure/Persistence/Procedimientos.cs` |
| Errores | Siempre **ProblemDetails** (`application/problem+json`) con `status`, `title`, `detail` (mensaje en español para mostrar) e `instance`. Validación de modelo: `ValidationProblemDetails` con `errors`. | `Api/Common/Middleware/ProblemaHttp.cs`, `ExceptionMiddleware.cs` |
| Códigos | `400` validación **y** regla de negocio (`BusinessRuleException`, p. ej. `RAISE EXCEPTION` de un SP) · `401` sin sesión o credenciales malas · `403` rol o recurso ajeno (`ForbiddenException`, SQLSTATE 42501) · `404` no existe (o no visible para ese usuario) · `409` conflicto (duplicado `23505`, baja con órdenes activas) · `413` archivo muy grande · `429` rate limit de auth · `503` con `Retry-After` / `504` en subidas. **Hoy no se usa 422.** | `ExceptionMiddleware.ObtenerStatusCode` |
| Paginación | `{ items, total, pagina, tamanoPagina }`, query `?pagina=1&tamanoPagina=20`, máximo 100 por página. **Solo existe en la rama sin merge** `feature/JY-Sprint4-paginacion-cafeterias` (`Application/Common/PaginaDto.cs`). | Rama sin merge |
| Autenticación | JWT Bearer (60 min por defecto) con claims `sub`, `email`, `role` (`MapInboundClaims = false`). | `Infrastructure/Security` |
| Roles | `Alumno` (id_rol 1), `AdminCafeteria` (encargado, id_rol 2, con `usuario.id_cafeteria`), `AdminSistema`. | `Domain/Auth/RolUsuario` |
| Políticas | **Denegar por defecto** (FallbackPolicy exige sesión). `SoloAlumno` · `PersonalCafeteria` (AdminCafeteria o AdminSistema) · `SoloAdminSistema`. Segunda barrera en la BD: `sp_exigir_gestor_cafeteria` / `sp_exigir_admin_sistema`. | `Api/Common/Security/PoliticasAutorizacion.cs` |
| Rate limit | Política `PoliticaAuth` en login, registro y restablecer. | `RateLimitSettings` |

**Para los endpoints nuevos se pide seguir lo mismo**: validación de modelo y reglas de negocio → `400` con `detail` legible, recurso ajeno → `403`, no existe → `404`, duplicado → `409`. Algunos mocks del front responden `422` en validaciones (perfil, reportes, promociones); el front trata `400` y `422` igual, así que **el back debe usar `400`** como el resto de la API.

---

## 3. Tabla general de endpoints

Leyenda: ✅ **YA EXISTE** (contrato real) · 🔄 **EXISTE PERO HAY QUE AJUSTARLO** · 🆕 **NUEVO**. Prioridad: **P0** bloquea el flujo principal, **P1** pantallas completas, **P2** mejora.

### Auth

| Estado | Método y ruta | Rol | Para qué | Prioridad |
|---|---|---|---|---|
| 🔄 | `POST /api/auth/login` | Anónimo | Agregar `nombre` e `idCafeteria` a la respuesta (§4.1) | **P0** |
| 🔄 | `GET /api/auth/me` | Sesión | Agregar `nombre` e `idCafeteria` (§4.1) | **P0** |
| 🔄 | `POST /api/auth/registro` | Anónimo | Misma respuesta que login (con `nombre`, `idCafeteria: null`) | P1 |
| 🔄 | `POST /api/auth/registro-cafeteria` | Anónimo | Misma respuesta que login (con `idCafeteria` de la cafetería creada) | P1 |
| ✅ | `POST /api/auth/restablecer-password` | Anónimo | `{ correo, nuevaPassword }` → 200 `{ mensaje }` siempre | — |
| ✅* | `POST /api/auth/verificar-correo`, `POST /api/auth/reenviar-verificacion` | Anónimo | *Existen en la rama sin merge `feature/JY-Sprint4-verificacion-correo` (cambian registro a `RegistroPendienteDto`). Al unirla, el front de auth debe adaptarse (fuera del alcance del rediseño). | P1 |
| 🆕 | `POST /api/auth/cambiar-password` | Sesión | Cambiar contraseña con la actual (§4.11) | P1 |

### Cafeterías

| Estado | Método y ruta | Rol | Contrato real | Prioridad |
|---|---|---|---|---|
| ✅ / 🔄 | `GET /api/cafeterias?incluirInactivas=` | Sesión | Hoy (`Sprint4`) responde `CafeteriaDto[]`. En la rama sin merge ya responde `PaginaDto<CafeteriaDto>` con `?pagina&tamanoPagina&buscar`. **Unir la rama** (§7). | P1 |
| ✅ | `GET /api/cafeterias/{idCafeteria}` | Sesión | `CafeteriaDto { idCafeteria, nombre, ubicacion, esDelCampus, puntoEntrega, activa, metodosPago[], creadoEn, actualizadoEn }`. 404 si inactiva y no es su encargado/admin. | — |
| ✅ | `POST /api/cafeterias` | SoloAdminSistema | `GuardarCafeteriaDto { nombre, ubicacion, esDelCampus, puntoEntrega, metodosPago[] }` → 201 | — |
| ✅ | `PUT /api/cafeterias/{idCafeteria}` | PersonalCafeteria | Mismo cuerpo → 200 `CafeteriaDto`; 409 nombre repetido. **Ya lo usa la pantalla Configuración del encargado.** | — |
| ✅ | `DELETE /api/cafeterias/{idCafeteria}` | SoloAdminSistema | Baja lógica → 204; 409 con órdenes en curso | — |
| ✅ | `POST /api/cafeterias/{idCafeteria}/reactivar` | SoloAdminSistema | → 204 | — |

### Productos y categorías

| Estado | Método y ruta | Rol | Contrato real | Prioridad |
|---|---|---|---|---|
| ✅ | `GET /api/cafeterias/{id}/productos` | PersonalCafeteria | `ProductoDto[] { idProducto, idCafeteria, idCategoria, categoria, nombre, descripcion, precio, imagenUrl, disponible, creadoEn, actualizadoEn }` (incluye no disponibles). El alumno **no** puede usarlo: para él es `GET /api/menu`. | — |
| ✅ | `GET /api/cafeterias/{id}/productos/{idProducto}` | Sesión | Disponible de cafetería activa para cualquiera; si no, solo su personal (404 para los demás) | — |
| ✅ | `POST /api/cafeterias/{id}/productos` | PersonalCafeteria | `multipart/form-data` (`nombre, descripcion, precio, idCategoria, disponible, archivo?`), JPEG/PNG/WebP ≤ 5 MB → 201 | — |
| ✅ | `PUT /api/cafeterias/{id}/productos/{idProducto}` | PersonalCafeteria | `GuardarProductoDto { nombre, descripcion, precio, idCategoria, disponible }` → 204 | — |
| ✅ | `PATCH /api/cafeterias/{id}/productos/{idProducto}/disponible` | PersonalCafeteria | cuerpo `true`/`false` → 204 | — |
| ✅ | `DELETE /api/cafeterias/{id}/productos/{idProducto}` | PersonalCafeteria | Borrado físico → 204; 409 con órdenes activas | — |
| ✅ | `POST /api/cafeterias/{id}/productos/{idProducto}/imagen` | PersonalCafeteria | multipart `archivo` → 200 `{ imagenUrl }` | — |
| ✅ | `GET /api/cafeterias/{id}/categorias` | Sesión | `CategoriaDto[] { idCategoria, nombre }` | — |
| ✅ | `POST /api/cafeterias/{id}/categorias` · `DELETE …/{idCategoria}` | PersonalCafeteria | `{ nombre }` → 201 · 204 | — |

### Menú del alumno

| Estado | Método y ruta | Rol | Para qué | Prioridad |
|---|---|---|---|---|
| 🆕 | `GET /api/menu` | Sesión | Menú de todas las cafeterías activas (inicio, buscador, tienda, favoritos). Sobre `sp_menu_cafeteria` (§4.2) | **P0** |
| 🆕 | `GET /api/menu/{idCafeteria}` | Sesión | Menú de una cafetería (tienda, checkout, "volver a pedir") | **P0** |

### Búsqueda

| Estado | Método y ruta | Rol | Para qué | Prioridad |
|---|---|---|---|---|
| — | *(ninguno por ahora)* | — | El buscador filtra y ordena **en el front** sobre `GET /api/menu` (texto sin acentos, categoría, precio, dietas, solo abiertas, orden). Alcanza mientras el menú completo pese poco. | — |
| 🆕 | `GET /api/menu/buscar?texto=&categoria=&precioMax=&dietas=&soloAbiertas=&orden=&pagina=&tamanoPagina=` | Sesión | Opcional cuando el catálogo crezca: misma semántica que el filtro del front, paginado (§4.3) | P2 |

### Órdenes (alumno)

| Estado | Método y ruta | Rol | Para qué | Prioridad |
|---|---|---|---|---|
| 🆕 | `POST /api/ordenes` | SoloAlumno | Crear el pedido (checkout). `sp_crear_orden` | **P0** |
| 🆕 | `GET /api/ordenes/mias?pagina=&tamanoPagina=` | SoloAlumno | Mis pedidos (Activos / Historial). `sp_mis_ordenes` (ajustar) | **P0** |
| 🆕 | `GET /api/ordenes/{idOrden}` | Sesión | Detalle con seguimiento en vivo (el front consulta cada 5 s) | **P0** |
| 🆕 | `POST /api/ordenes/{idOrden}/cancelar` | SoloAlumno | Cancelar (solo `pendiente`/`confirmada`). `sp_cancelar_orden` | P1 |

### Tablero y entrega (proveedor)

| Estado | Método y ruta | Rol | Para qué | Prioridad |
|---|---|---|---|---|
| 🆕 | `GET /api/cafeterias/{idCafeteria}/ordenes?fecha=` | PersonalCafeteria | Tablero del día (activas y cerradas). `sp_cola_cafeteria` (ajustar). El front consulta cada 10 s | **P0** |
| 🆕 | `PATCH /api/ordenes/{idOrden}/estado` | PersonalCafeteria | Iniciar preparación / marcar lista. `sp_cambiar_estado_orden` | **P0** |
| 🆕 | `POST /api/ordenes/{idOrden}/entregar` | PersonalCafeteria | Entregar **validando el código que teclea el encargado**. `sp_entregar_orden` | **P0** |
| 🆕 | `POST /api/ordenes/{idOrden}/rechazar` | PersonalCafeteria | Rechazar/cancelar con motivo. `sp_cambiar_estado_orden` + motivo | P1 |

### Pagos

| Estado | Método y ruta | Rol | Para qué | Prioridad |
|---|---|---|---|---|
| 🆕 | `POST /api/ordenes/{idOrden}/confirmar-pago` | PersonalCafeteria | El encargado confirma que recibió la **transferencia** (`pendiente` → `confirmada`). SP nuevo o ajuste de `sp_confirmar_pago` | P1 |
| — | Pasarela de tarjeta | Sistema | `sp_confirmar_pago(id_orden, referencia)` ya existe para que la pasarela confirme. **No hay pasarela todavía**: el mock del front simula que la tarjeta se cobra al confirmar. Sin pasarela, una orden con tarjeta queda `pendiente` (§5.5). | P2 |

### Favoritos

| Estado | Método y ruta | Rol | Para qué | Prioridad |
|---|---|---|---|---|
| 🆕 | `GET /api/favoritos/cafeterias` | SoloAlumno | Cafeterías favoritas | P1 |
| 🆕 | `PUT /api/favoritos/cafeterias/{idCafeteria}` | SoloAlumno | Guardar (idempotente) | P1 |
| 🆕 | `DELETE /api/favoritos/cafeterias/{idCafeteria}` | SoloAlumno | Quitar (idempotente) | P1 |
| 🆕 | `GET /api/favoritos/platillos` | SoloAlumno | Platillos favoritos, con `disponible` y `cafeteriaAbierta` | P1 |
| 🆕 | `PUT /api/favoritos/platillos/{idProducto}` | SoloAlumno | Guardar (idempotente) | P1 |
| 🆕 | `DELETE /api/favoritos/platillos/{idProducto}` | SoloAlumno | Quitar (idempotente) | P1 |

### Perfil y preferencias

| Estado | Método y ruta | Rol | Para qué | Prioridad |
|---|---|---|---|---|
| 🆕 | `GET /api/alumnos/me/perfil` | SoloAlumno | Datos, preferencias y avisos | P1 |
| 🆕 | `PUT /api/alumnos/me/perfil` | SoloAlumno | Nombre, matrícula, teléfono (columnas que **ya existen** en `usuario`) | P1 |
| 🆕 | `PUT /api/alumnos/me/preferencias` | SoloAlumno | Punto frecuente, método preferido, avisos | P1 |
| 🆕 | `POST /api/auth/cambiar-password` | Sesión | (ver Auth) | P1 |

### Horario

| Estado | Método y ruta | Rol | Para qué | Prioridad |
|---|---|---|---|---|
| 🆕 | `GET /api/cafeterias/{idCafeteria}/horario` | PersonalCafeteria | Semana + "cerrado hoy" + "abierta ahora". Tabla `horario_cafeteria` **ya existe** | P1 |
| 🆕 | `PUT /api/cafeterias/{idCafeteria}/horario` | PersonalCafeteria | Reemplaza la semana | P1 |
| 🆕 | `POST /api/cafeterias/{idCafeteria}/horario/cierre-hoy` | PersonalCafeteria | Cerrar solo por hoy | P1 |
| 🆕 | `DELETE /api/cafeterias/{idCafeteria}/horario/cierre-hoy` | PersonalCafeteria | Volver a abrir hoy | P1 |

### Promociones

| Estado | Método y ruta | Rol | Para qué | Prioridad |
|---|---|---|---|---|
| 🆕 | `GET /api/cafeterias/{idCafeteria}/promociones` | PersonalCafeteria | Todas las del negocio (activas, pausadas, vencidas) | P1 |
| 🆕 | `POST /api/cafeterias/{idCafeteria}/promociones` | PersonalCafeteria | Crear | P1 |
| 🆕 | `PUT /api/cafeterias/{idCafeteria}/promociones/{idPromocion}` | PersonalCafeteria | Editar / pausar / activar | P1 |
| 🆕 | `DELETE /api/cafeterias/{idCafeteria}/promociones/{idPromocion}` | PersonalCafeteria | Eliminar | P1 |
| 🆕 | `GET /api/promociones/activas` | Sesión | Carrusel del inicio y franja de la tienda del alumno (solo activas y vigentes hoy) | P1 |

### Estadísticas

| Estado | Método y ruta | Rol | Para qué | Prioridad |
|---|---|---|---|---|
| — | *(ninguno por ahora)* | — | El front calcula ventas, pedidos por estado, más vendidos y horas pico con las órdenes del tablero (`GET /api/cafeterias/{id}/ordenes`). | — |
| 🆕 | `GET /api/cafeterias/{idCafeteria}/estadisticas?periodo=hoy\|7d\|30d` | PersonalCafeteria | Opcional: el mismo cálculo en la BD cuando haya muchas órdenes (§4.13) | P2 |

### Reportes

| Estado | Método y ruta | Rol | Para qué | Prioridad |
|---|---|---|---|---|
| 🆕 | `POST /api/ordenes/{idOrden}/reportes` | SoloAlumno | "Reportar un problema" con un pedido | P2 |

---

## 4. Detalle de endpoints nuevos y ajustados

Formato de error en todos (ejemplo):

```json
{ "status": 400, "title": "BadRequest", "detail": "La orden ya está en preparación y no se puede cancelar", "instance": "/api/ordenes/…/cancelar" }
```

### 4.1 🔄 Login, registro y `/me`: agregar `nombre` e `idCafeteria` — P0

**Hoy**: `AuthResponseDto { usuarioId, correo, rol, token, expiraEn }` y `GET /api/auth/me` → `{ id, correo, rol }`.

**Se pide** agregar en los cuatro (login, registro, registro-cafeteria y me):

```json
{
  "usuarioId": "6c1e…",
  "correo": "cafeteria@ejemplo.test",
  "rol": "AdminCafeteria",
  "nombre": "Ana Ramírez",
  "idCafeteria": "00000000-0000-0000-0000-0000000000c1",
  "token": "eyJ…",
  "expiraEn": "2026-11-11T19:00:00Z"
}
```

- `nombre` = `usuario.nombre` (ya existe). Lo usan el saludo, el layout y el perfil; hoy el front lo arma con el correo.
- `idCafeteria` = `usuario.id_cafeteria` (ya existe desde `03_cambios_sprint2/003_personal_cafeteria.sql`); `null` para `Alumno` y `AdminSistema`.
- Opcional: claim `id_cafeteria` en el JWT.
- **SP**: ajustar `sp_obtener_credenciales` para devolver `nombre` e `id_cafeteria` (ojo: la rama de verificación de correo también lo modifica).
- **Por qué es P0**: hoy el front **adivina** la cafetería del encargado probando endpoints (`resolverCafeteriaDelEncargado`, marcado TEMPORAL). Ver §7.

### 4.2 🆕 `GET /api/menu` y `GET /api/menu/{idCafeteria}` — P0

**Rol**: cualquier usuario con sesión. **SP**: `sp_menu_cafeteria(p_id_cafeteria)` ya existe (NULL = todas las activas) y devuelve `id_cafeteria, cafeteria, es_del_campus, punto_entrega, metodos_pago[], productos[{id_producto, producto, categoria, descripcion, precio, imagen_url}]`.

**Response** (`GET /api/menu` → arreglo; `/{id}` → un objeto):

```json
[{
  "idCafeteria": "00000000-0000-0000-0000-0000000000c1",
  "cafeteria": "Cafetería Central",
  "esDelCampus": true,
  "puntoEntrega": "Barra principal, Edificio A",
  "metodosPago": ["Efectivo", "Tarjeta", "Transferencia"],
  "logoUrl": "https://…/logo.webp",
  "portadaUrl": "https://…/portada.webp",
  "calificacion": null,
  "resenas": null,
  "abierta": true,
  "cierraA": "17:00",
  "minutosEstimados": 10,
  "productos": [{
    "idProducto": "…",
    "producto": "Sándwich Clásico de Pollo",
    "categoria": "Comidas",
    "descripcion": "Pan artesanal, pollo…",
    "precio": 55.0,
    "imagenUrl": "https://…",
    "calificacion": null,
    "minutosPreparacion": null,
    "precioAnterior": null,
    "popular": false,
    "dietas": []
  }]
}]
```

**Ajustes a `sp_menu_cafeteria`**:

| Campo | Obligatorio para el front | Cómo calcularlo |
|---|---|---|
| `abierta`, `cierraA` | **Sí** (sin ellos el front asume abierta) | Regla §5.6 con `horario_cafeteria` y el cierre de hoy |
| `logoUrl`, `portadaUrl` | No (muestra un placeholder) | Columnas nuevas en `cafeteria` (§6) |
| `minutosEstimados` | No | Columna nueva o promedio de preparación |
| `calificacion`, `resenas`, `producto.calificacion` | No | No hay reseñas: mandar `null` |
| `precioAnterior` | No | Precio antes de una promoción `precio_fijo` vigente del producto (si se ligan promociones a productos, §6) |
| `popular` | No | Top de piezas vendidas en 30 días por cafetería |
| `dietas` (`"Vegetariano"`, `"SinGluten"`) | No | Columna nueva en `producto` (arreglo de enum) |
| `minutosPreparacion` | No | Columna nueva en `producto` |

Solo productos `disponible` de cafeterías `activa`. **Errores**: 401; `/{id}` → 404 si no existe o no está activa.

### 4.3 🆕 `GET /api/menu/buscar` — P2 (opcional)

Query: `texto` (sin acentos ni mayúsculas, en nombre, descripción, categoría y cafetería), `categoria`, `precioMax`, `dietas` (repetible), `soloAbiertas` (bool), `orden` (`Relevancia|PrecioAsc|PrecioDesc|Calificacion|Tiempo`), `pagina`, `tamanoPagina`. Response `PaginaDto<PlatilloCatalogoDto>` donde cada platillo es un producto del menú más `idCafeteria`, `cafeteria` y `cafeteriaAbierta`. Solo si el menú completo se vuelve pesado; hoy el front filtra localmente.

### 4.4 🆕 `POST /api/ordenes` — P0

**Rol**: SoloAlumno. **SP**: `sp_crear_orden(p_id_usuario, p_id_cafeteria, p_recogida_en, p_metodo, p_items JSONB, p_notas, OUT p_id_orden)` ya existe.

**Request**:

```json
{
  "idCafeteria": "00000000-0000-0000-0000-0000000000c1",
  "recogidaEn": "2026-11-11T13:30:00-06:00",
  "metodo": "Efectivo",
  "items": [{ "idProducto": "…", "cantidad": 2 }],
  "notas": "Sin cebolla"
}
```

**Response 201** (`Location: /api/ordenes/{idOrden}`): `OrdenDto` (§4.5).

**Validaciones** (modelo → 400 `ValidationProblemDetails`): `idCafeteria` requerido; `recogidaEn` requerido con offset; `metodo` del enum; `items` 1..50 elementos, `cantidad` 1..20; `notas` ≤ 200.

**Errores del SP → 400**: "Usuario no válido para realizar órdenes" · "La cafetería no existe o no está activa" · "La cafetería no acepta el método de pago %" · "La hora de recogida debe ser al menos 5 minutos en el futuro" · "La cafetería está cerrada a la hora de recogida solicitada" · "La orden debe incluir al menos un producto" · "Hay productos inexistentes, no disponibles o de otra cafetería" · "La cantidad por producto debe estar entre 1 y 20". **401 / 403** (rol).

**Ajuste al SP**: validar también el **cierre de hoy** (§5.4).

### 4.5 🆕 `OrdenDto` (lo comparten alumno y cafetería)

```json
{
  "idOrden": "24110042-0000-4000-8000-000000000000",
  "idCafeteria": "…",
  "cafeteria": "Cafetería Central",
  "logoCafeteria": "https://…/logo.webp",
  "puntoEntrega": "Barra principal, Edificio A",
  "alumno": null,
  "estado": "EnPreparacion",
  "recogidaEn": "2026-11-05T13:30:00-06:00",
  "creadoEn": "2026-11-05T12:05:00-06:00",
  "codigoRecogida": "774210",
  "total": 153.0,
  "metodo": "Efectivo",
  "estadoPago": "Pendiente",
  "notas": "Sin cebolla, por favor.",
  "motivoCancelacion": null,
  "lineas": [{ "idProducto": "…", "producto": "Sándwich Clásico de Pollo", "cantidad": 1, "precioUnitario": 55.0, "imagenUrl": "https://…" }]
}
```

- `estado`: `Pendiente | Confirmada | EnPreparacion | Lista | Entregada | Cancelada`.
- `estadoPago`: `Pendiente | Pagado | Rechazado | Reembolsado | Cancelado`.
- `metodo`: `Efectivo | Tarjeta | Transferencia`.
- `total` se calcula de `detalle_orden` (la columna `orden.total` se quitó en `03_cambios_sprint2/004`) o de `pago.monto`.
- `alumno` (`{ nombre, matricula }`) **solo** en respuestas para la cafetería; `null` para el alumno.
- `codigoRecogida`: **solo** en respuestas para el alumno dueño. En las de la cafetería debe ir **`null`** (el encargado lo teclea; si lo recibiera, la validación no sirve). Ver §9 (ajuste del front).
- `motivoCancelacion`: nuevo (§6); `null` si no se canceló.
- El front deriva el folio (`CB-2411-0042`) de los primeros 8 hexadecimales del id; no hace falta columna.

### 4.6 🆕 `GET /api/ordenes/mias` — P0

**Rol**: SoloAlumno. **SP**: `sp_mis_ordenes(p_id_usuario, p_limite, p_desplazamiento, OUT p_ordenes)` ya existe (más recientes primero, máximo 100).

**Response 200**: `PaginaDto<OrdenDto>`. El front pide `?pagina=1&tamanoPagina=50`.

**Ajuste**: hoy `p_ordenes` trae `id_orden, cafeteria, punto_entrega, estado, recogida_en, codigo_recogida, total, metodo, estado_pago, creado_en`; falta `id_cafeteria`, `logo_cafeteria`, `notas`, `motivo_cancelacion`, `lineas[]` y el `total` de filas para la paginación.

### 4.7 🆕 `GET /api/ordenes/{idOrden}` — P0

**Rol**: el alumno dueño, o el personal de esa cafetería (o admin). **SP nuevo**: `sp_obtener_orden(p_id_orden, p_id_actor, OUT p_orden)` sobre `vw_mis_ordenes` / `vw_cola_cafeteria`. **Response 200**: `OrdenDto` (con `codigoRecogida` solo para el alumno). **Errores**: 404 no existe; 403 (o 404) si no es suya ni de su cafetería.

### 4.8 🆕 `POST /api/ordenes/{idOrden}/cancelar` — P1

**Rol**: SoloAlumno. **SP**: `sp_cancelar_orden(p_id_orden, p_id_usuario)` ya existe. Sin cuerpo (`{}`). **Response 200**: `OrdenDto` (estado `Cancelada`, `motivoCancelacion: "Cancelado por el alumno"`). **Errores**: 400 "La orden ya está en preparación y no se puede cancelar"; 404 "La orden no existe" (también si no es suya).

### 4.9 🆕 Tablero y entrega — P0/P1

**`GET /api/cafeterias/{idCafeteria}/ordenes?fecha=2026-11-11`** (PersonalCafeteria)
- **SP**: `sp_cola_cafeteria(p_id_cafeteria, p_id_actor, OUT p_cola)` ya existe pero devuelve **solo activas**.
- **Ajuste**: incluir las cerradas (`entregada`, `cancelada`) del día pedido (por omisión, hoy en `America/Mexico_City`), ordenadas por `recogida_en`, con `alumno { nombre, matricula }`, `lineas`, `motivoCancelacion` y **sin** `codigoRecogida`.
- **Response 200**: `OrdenDto[]` (sin paginar: es un día de una cafetería).
- **Errores**: 403 si no es su cafetería (`sp_exigir_gestor_cafeteria`).

**`PATCH /api/ordenes/{idOrden}/estado`** (PersonalCafeteria)
- **SP**: `sp_cambiar_estado_orden(p_id_orden, p_nuevo, p_id_actor)`.
- **Request**: `{ "estado": "EnPreparacion" }` o `{ "estado": "Lista" }` (otro valor → 400).
- **Response 200**: `OrdenDto`.
- **Errores**: 400 "Transición de estado no permitida: …" (trigger), 400 "La orden está esperando la confirmación del pago" si está `pendiente`, 403, 404.

**`POST /api/ordenes/{idOrden}/entregar`** (PersonalCafeteria)
- **SP**: `sp_entregar_orden(p_id_orden, p_codigo, p_id_actor)` ya existe.
- **Request**: `{ "codigoRecogida": "774210" }`; validar `^[0-9]{6}$` → 400.
- **Response 200**: `OrdenDto` (`Entregada`; si era efectivo, `estadoPago: Pagado`).
- **Errores**: 400 "La orden no está lista para entrega", 400 "Código de recogida incorrecto" (el front muestra "El código no coincide…" y **no** entrega), 403, 404. Ver límite de intentos en §5.1.

**`POST /api/ordenes/{idOrden}/rechazar`** (PersonalCafeteria)
- **SP**: `sp_cambiar_estado_orden(…, 'cancelada', …)` + guardar el motivo (**agregar `p_motivo`** o SP nuevo `sp_rechazar_orden`).
- **Request**: `{ "motivo": "Se nos acabó un producto" }`; `motivo` requerido, 5..200 caracteres.
- **Response 200**: `OrdenDto` (`Cancelada`, `motivoCancelacion`).
- **Errores**: 400 motivo vacío o transición no permitida (no se rechaza una `entregada`), 403, 404.
- El trigger `004_cancelar_pago` ya marca el pago como cancelado.

### 4.10 🆕 `POST /api/ordenes/{idOrden}/confirmar-pago` — P1

**Rol**: PersonalCafeteria. **Request**: `{ "referencia": "SPEI 1234" }` (opcional, ≤ 100). **Response 200**: `OrdenDto` (`Confirmada`, `estadoPago: Pagado`).

**SP**: `sp_confirmar_pago(p_id_orden, p_referencia)` ya existe, pero lo usa la pasarela (deja `app.id_actor` vacío y no revisa encargado). **Opción recomendada**: SP nuevo `sp_confirmar_transferencia(p_id_orden, p_id_actor, p_referencia)` que exija `sp_exigir_gestor_cafeteria`, que el método sea `transferencia` y deje al actor en `historial_estado_orden`.

**Errores**: 400 "La orden no existe o ya no está pendiente de pago", 400 "El pago no admite confirmación electrónica" (efectivo), 403, 404.

### 4.11 🆕 Perfil, preferencias y contraseña — P1

**`GET /api/alumnos/me/perfil`** → 200:

```json
{
  "correo": "juan.perez@uttt.edu.mx",
  "datos": { "nombre": "Juan Pérez", "matricula": "23300022", "telefono": "4421234567" },
  "preferencias": {
    "idCafeteriaFrecuente": "00000000-0000-0000-0000-0000000000c1",
    "metodoPago": "Tarjeta",
    "avisoPedidoListo": true,
    "avisoPromociones": false
  }
}
```

**`PUT /api/alumnos/me/perfil`**
- **Request**: `{ "nombre": "Juan Pérez", "matricula": "23300022", "telefono": "4421234567" }`.
- **Validaciones**: las del registro.
  - `nombre`: requerido, 2..80.
  - `matricula`: opcional, ≤ 20, `UNIQUE`.
  - `telefono`: opcional, `^[0-9+]{10,15}$`.
- **Response 200**: los datos guardados.
- **Errores**: 400 validación, 409 matrícula ya registrada.
- **SP nuevo**: `sp_actualizar_perfil_alumno(p_id_usuario, p_nombre, p_matricula, p_telefono)` sobre columnas que **ya existen** en `usuario`.

**`PUT /api/alumnos/me/preferencias`**
- **Request**: igual a `preferencias` de arriba.
- **Response 200**: lo guardado.
- **Errores**: 400 si `idCafeteriaFrecuente` no existe o está inactiva.
- **Tabla nueva** `preferencia_alumno` (§6).
- **No se guardan datos de tarjetas**, solo el método. El checkout del alumno usa `metodoPago` como valor inicial si la cafetería lo acepta.

**`POST /api/auth/cambiar-password`** (cualquier rol)
- **Request**: `{ "passwordActual": "…", "passwordNueva": "…" }`.
- **Validaciones**: `passwordNueva` 8..72 (como registro) y distinta de la actual.
- **Response 204**.
- **Errores**: **400 "La contraseña actual no es correcta."** (el front la muestra en ese campo), 400 validación, 429 (aplicar `PoliticaAuth`).
- **Implementación**: verificar con `sp_obtener_credenciales` + BCrypt; SP nuevo `sp_cambiar_password(p_id_usuario, p_hash)`.

### 4.12 🆕 Favoritos — P1

**`GET /api/favoritos/cafeterias`** → 200, más recientes primero:

```json
[{ "idCafeteria": "…", "nombre": "Cafetería Central", "foto": "https://…/portada.webp", "calificacion": 4.8,
   "puntoEntrega": "Barra principal, Edificio A", "esDelCampus": true, "abierta": true, "platillos": 4 }]
```

**`PUT /api/favoritos/cafeterias/{idCafeteria}`** → 200 con el mismo objeto (idempotente: si ya estaba, 200 igual). **`DELETE …`** → 204 (idempotente). **Errores**: 404 cafetería inexistente o inactiva.

**`GET /api/favoritos/platillos`** → 200, más recientes primero:

```json
[{ "idProducto": "…", "producto": "Malteada de Vainilla", "precio": 45.0, "imagenUrl": null,
   "idCafeteria": "…", "cafeteria": "Sabor Universitario", "disponible": false, "cafeteriaAbierta": true }]
```

- `disponible: false` si el producto ya no está o no está disponible. El front lo muestra como "Ya no disponible" con su **último** nombre y precio.
- Por eso la tabla guarda una copia (snapshot) del nombre, el precio y la imagen (§6).

**`PUT /api/favoritos/platillos/{idProducto}`** → 200 (idempotente; 404 si el producto no existe o no está disponible). **`DELETE …`** → 204 (idempotente).

### 4.13 🆕 Horario — P1

**`GET /api/cafeterias/{idCafeteria}/horario`** → 200:

```json
{
  "dias": [
    { "abre": true,  "desde": "07:00", "hasta": "17:00" },
    { "abre": true,  "desde": "07:00", "hasta": "17:00" },
    { "abre": true,  "desde": "07:00", "hasta": "17:00" },
    { "abre": true,  "desde": "07:00", "hasta": "17:00" },
    { "abre": true,  "desde": "07:00", "hasta": "17:00" },
    { "abre": true,  "desde": "09:00", "hasta": "13:00" },
    { "abre": false, "desde": "09:00", "hasta": "13:00" }
  ],
  "cerradoHoy": false,
  "abiertaAhora": true
}
```

- `dias` siempre tiene 7 elementos, de lunes (índice 0) a domingo.
- Un día sin filas en `horario_cafeteria` es `abre: false`.
- `horario_cafeteria` admite **varios tramos por día** (`UNIQUE (id_cafeteria, dia_semana, hora_apertura)`), pero el front edita **un tramo** por día. Si hay varios, mandar el primero y el último (`desde` mínimo, `hasta` máximo) o acordar extender el front.

**`PUT /api/cafeterias/{idCafeteria}/horario`**
- **Request**: `{ "dias": [ …7 elementos… ] }`.
- **Validaciones**: exactamente 7 días; si `abre`, `hasta > desde` (como el `CHECK` de la tabla).
- **Response 200**: el `GET` actualizado.
- **SP nuevo**: `sp_guardar_horario(p_id_cafeteria, p_id_actor, p_dias JSONB)` (borra e inserta en una transacción, con `sp_exigir_gestor_cafeteria`).
- **Errores**: 400 "Miércoles: la hora de cierre tiene que ser después de la de apertura", 403, 404.

**`POST /api/cafeterias/{idCafeteria}/horario/cierre-hoy`** → 200 (el `GET` con `cerradoHoy: true`). **`DELETE …/cierre-hoy`** → 200 (con `cerradoHoy: false`). Tabla nueva `cierre_cafeteria` (§6). Los pedidos ya aceptados **no** se cancelan.

### 4.14 🆕 Promociones — P1

**`GET /api/cafeterias/{idCafeteria}/promociones`** → 200:

```json
[{ "id": "…", "nombre": "Combo Estudiantil", "descripcion": "Sándwich + bebida del día.", "tipo": "Combo",
   "valor": 79.0, "desde": "2026-11-01", "hasta": "2026-11-30", "activa": true, "usos": 34 }]
```

**`POST …/promociones`** → 201 · **`PUT …/promociones/{idPromocion}`** → 200 · **`DELETE …/promociones/{idPromocion}`** → 204.

**Request** (POST/PUT, sin `id` ni `usos`):

```json
{ "nombre": "Jueves de té", "descripcion": "", "tipo": "Porcentaje", "valor": 15, "desde": "2026-11-12", "hasta": "2026-11-30", "activa": true }
```

**Validaciones (400)**:
- `nombre`: 3..60.
- `descripcion`: ≤ 140.
- `tipo`: `Porcentaje | PrecioFijo | Combo`.
- `valor`:
  - `Porcentaje`: entero 1..90.
  - `PrecioFijo` y `Combo`: > 0 y ≤ 2000.
- `desde` y `hasta`: requeridos, con `hasta ≥ desde`.

**Errores**: 403, 404 (promoción de otra cafetería).

**`GET /api/promociones/activas`** (cualquier sesión) → 200, para el carrusel del alumno y la tienda:

```json
[{ "idPromocion": "…", "etiqueta": "-20%", "titulo": "Martes de café", "subtitulo": "20% en bebidas calientes. · Cafetería Central",
   "imagenUrl": "https://…/portada.webp", "idCafeteria": "…", "categoria": null }]
```

- Solo las que tienen `activa`, `desde ≤ hoy ≤ hasta` (hora de México) y una cafetería activa.
- `etiqueta`: `-{valor}%` para `Porcentaje`, `A ${valor}` para `PrecioFijo`, `Combo ${valor}` para `Combo`.
- Las promociones de la plataforma (sin cafetería) pueden vivir en la misma tabla con `id_cafeteria NULL` y `categoria`.
- `usos`: 0 mientras las promociones sean informativas. Cuando se apliquen al precio, contar las órdenes que la usaron (§6).

### 4.15 🆕 `GET /api/cafeterias/{idCafeteria}/estadisticas?periodo=` — P2 (opcional)

Hoy el front lo calcula con el tablero. Si se hace en la BD, **response**:

```json
{
  "ventas": 617.0, "pedidos": 6, "ticketPromedio": 102.83, "cancelados": 1,
  "porEstado": { "nuevos": 2, "preparacion": 2, "listos": 1, "entregados": 1, "cancelados": 1 },
  "ventasPorDia": [{ "etiqueta": "Jue", "valor": 617.0 }],
  "masVendidos": [{ "producto": "Panini Caprese", "piezas": 3, "monto": 147.0 }],
  "horasPico": [{ "etiqueta": "12:00", "valor": 3 }]
}
```

Reglas:

- **Ventas y pedidos**: sin canceladas.
- **Ticket promedio**: ventas / pedidos.
- **Por estado**: `nuevos` = `pendiente` + `confirmada`.
- **Más vendidos**: los 5 con más piezas.
- **Horas pico**: por la hora de `creado_en` local.
- **Periodo**: `hoy`, `7d` o `30d`, contando hoy.

### 4.16 🆕 `POST /api/ordenes/{idOrden}/reportes` — P2

**Rol**: SoloAlumno (dueño). **Request**: `{ "motivo": "FaltoArticulo", "detalle": "Faltó el latte" }`.

- `motivo`: `FaltoArticulo | ProductoEquivocado | Calidad | Cobro | Otro`.
- `detalle`: opcional, ≤ 300; **obligatorio con `Otro`** (≥ 10).

**Response 201**: `{ "folio": "R-482913" }`. **Errores**: 400 validación, 404 la orden no existe o no es suya, **409 "Ya reportaste un problema con este pedido; lo estamos revisando"** (uno por orden). Tabla nueva `reporte_orden` (§6).

---

## 5. Reglas de negocio

### 5.1 Código de recogida (6 dígitos)

- **Generación**: la hace `sp_crear_orden` con aleatoriedad criptográfica (`gen_random_uuid` → 32 bits → `% 1000000`, con ceros a la izquierda). Columna `orden.codigo_recogida CHAR(6) CHECK (^[0-9]{6}$)`. No es único entre órdenes (no hace falta: se valida contra **una** orden).
- **Quién lo ve**: solo el alumno dueño (confirmación, detalle, lista cuando está "Listo"). Las respuestas para la cafetería deben mandarlo en `null` (§4.5).
- **Validación**: `sp_entregar_orden` compara contra el que teclea el encargado; solo desde `lista`. Incorrecto → 400 y la orden sigue `lista`.
- **Intentos** *(recomendado, no existe)*: son 10⁶ combinaciones. Limitar a 5 intentos fallidos por orden en 10 minutos (contador en la orden o rate limit por `idOrden`) y responder 429 al pasarse.
- **Expiración**: no hay ni se propone por tiempo. El código deja de servir cuando la orden pasa a `entregada` o `cancelada`.

### 5.2 Estados y transiciones (ENUM `estado_orden` real)

```
pendiente → confirmada → en_preparacion → lista → entregada
    └──────────┴──────────────┴───────────┴──→ cancelada
```

Lo impone el trigger `fn_validar_transicion_orden` (`04_triggers/002`). Al alumno se le muestran 4 etapas: **Recibido** (`pendiente` + `confirmada`), **En preparación**, **Listo para recoger**, **Entregado** (más **Cancelado**).

| Quién | Transición | Endpoint |
|---|---|---|
| Sistema | nace `confirmada` (efectivo) o `pendiente` (tarjeta, transferencia) | `POST /api/ordenes` |
| Cafetería / pasarela | `pendiente → confirmada` | `POST /api/ordenes/{id}/confirmar-pago` (o `sp_confirmar_pago` desde la pasarela) |
| Cafetería | `confirmada → en_preparacion → lista` | `PATCH /api/ordenes/{id}/estado` |
| Cafetería | `lista → entregada` con código | `POST /api/ordenes/{id}/entregar` |
| Alumno | `pendiente/confirmada → cancelada` | `POST /api/ordenes/{id}/cancelar` |
| Cafetería | cualquiera en curso → `cancelada` con motivo | `POST /api/ordenes/{id}/rechazar` |

El tablero no deja iniciar preparación si la orden sigue `pendiente` (falta el pago). El back debe responder 400 "La orden está esperando la confirmación del pago" en ese caso (hoy el trigger lo rechaza como transición no permitida).

### 5.3 Horario de recogida

- Al menos **5 minutos** en el futuro (`sp_crear_orden`, ya existe).
- **Dentro del horario de ese día** y **antes del cierre**. Hoy `sp_crear_orden` revisa `hora_apertura ≤ hora ≤ hora_cierre` en `America/Mexico_City`; el cierre es inclusivo.
- El checkout ofrece "Lo antes posible" (ahora + tiempo de preparación, redondeado a 5 min) y saltos de 15, 30, 45, 60 y 90 min, todos antes del cierre. No hay pedidos para otro día.

### 5.4 Validar horario y "cerrado hoy" al crear un pedido

`sp_crear_orden` ya valida el horario semanal. **Falta**: rechazar si existe un cierre de hoy (`cierre_cafeteria` con `fecha = hoy local`), con el mensaje "La cafetería está cerrada en este momento". El catálogo debe reflejar lo mismo (§5.6).

### 5.5 Confirmación de transferencias y tarjeta

- **Transferencia**:
  - la orden nace `pendiente` y el alumno ve los datos para transferir, con el folio como referencia;
  - el encargado confirma con `POST /api/ordenes/{id}/confirmar-pago`: la orden pasa a `confirmada` y el pago a `pagado`;
  - mientras siga `pendiente` no se puede preparar.
- **Tarjeta**: debe confirmarla la pasarela llamando a `sp_confirmar_pago(id_orden, referencia)`. No hay pasarela: **el mock del front simula el cobro en el acto**. Con el back real, la orden con tarjeta se queda `pendiente` hasta que exista la pasarela.
  - **Decisión pendiente del equipo**: ocultar "Tarjeta" en el checkout hasta tener pasarela, o dejar que el encargado la confirme como una transferencia.
- **Efectivo**: nace `confirmada` y el pago se marca `pagado` al entregar (`sp_entregar_orden`).

### 5.6 Cálculo de abierto/cerrado (para `GET /api/menu`, favoritos y horario)

Con `ahora` en `America/Mexico_City`:

```
cerradoHoy   = existe cierre_cafeteria(id_cafeteria, fecha = ahora::date)
tramoDeHoy   = horario_cafeteria con dia_semana = ISODOW(ahora)
abierta      = NOT cerradoHoy AND existe tramoDeHoy con hora_apertura ≤ ahora::time < hora_cierre
cierraA      = cerradoHoy ? null : max(hora_cierre de hoy)   (HH:mm; null si hoy no abre)
```

El front usa `abierta` para "Abierta hasta 17:00" / "Cerrada ahora", para deshabilitar pedir y para los horarios del checkout.

### 5.7 Motivo de cancelación

- Al rechazar o cancelar desde el tablero, el motivo es obligatorio (5..200). El front ofrece motivos rápidos más "Otro".
- Se guarda en `orden.motivo_cancelacion` y el alumno lo ve en el detalle ("Motivo: …").
- Si cancela el alumno, guardar "Cancelado por el alumno".
- Si ya había pagado (tarjeta o transferencia), el reembolso se gestiona en la cafetería. El trigger `004_cancelar_pago` ya cancela el pago; el estado `reembolsado` existe en el enum para cuando se registre.

---

## 6. Cambios de BD necesarios

| Prioridad | Cambio | Para qué |
|---|---|---|
| **P0** | `sp_obtener_credenciales`: devolver `nombre` e `id_cafeteria` | Login y `/me` (§4.1) |
| **P0** | `sp_menu_cafeteria`: agregar `abierta` y `cierra_a` calculados (§5.6) | Menú del alumno |
| **P0** | `sp_mis_ordenes`: agregar `id_cafeteria`, `logo_cafeteria`, `notas`, `motivo_cancelacion`, `lineas` y total de filas | Mis pedidos |
| **P0** | `sp_obtener_orden(p_id_orden, p_id_actor)` **nuevo** | Detalle en vivo |
| **P0** | `sp_cola_cafeteria`: incluir cerradas del día (parámetro `p_fecha`), `lineas`, `motivo_cancelacion`, sin `codigo_recogida` | Tablero |
| **P1** | `ALTER TABLE orden ADD COLUMN motivo_cancelacion VARCHAR(200)` + parámetro `p_motivo` en `sp_cambiar_estado_orden` (o `sp_rechazar_orden`) y valor fijo en `sp_cancelar_orden` | Rechazo con motivo |
| **P1** | `sp_confirmar_transferencia(p_id_orden, p_id_actor, p_referencia)` **nuevo** | Confirmar pago desde el tablero |
| **P1** | Tabla `cierre_cafeteria (id_cafeteria UUID FK, fecha DATE, creado_por UUID FK usuario, creado_en TIMESTAMPTZ, PRIMARY KEY (id_cafeteria, fecha))` + `sp_cerrar_hoy` / `sp_reabrir_hoy`; validarla en `sp_crear_orden` | "Cerrar por hoy" |
| **P1** | `sp_guardar_horario(p_id_cafeteria, p_id_actor, p_dias JSONB)` y `sp_obtener_horario` sobre la tabla **existente** `horario_cafeteria` | Horario |
| **P1** | Tabla `promocion (id_promocion UUID PK, id_cafeteria UUID NULL FK, nombre VARCHAR(60), descripcion VARCHAR(140), tipo tipo_promocion, valor NUMERIC(10,2), desde DATE, hasta DATE, activa BOOLEAN, categoria VARCHAR(50) NULL, creado_en, actualizado_en, CHECK (hasta >= desde))` + `CREATE TYPE tipo_promocion AS ENUM ('porcentaje','precio_fijo','combo')` + SP de CRUD y `sp_promociones_activas` | Promociones |
| **P1** | Tablas `favorito_cafeteria (id_usuario, id_cafeteria, creado_en, PK (id_usuario, id_cafeteria))` y `favorito_producto (id_usuario, id_producto NULL FK ON DELETE SET NULL, id_cafeteria, nombre_guardado, precio_guardado, imagen_guardada, creado_en)` + SP | Favoritos (la copia permite mostrar los retirados, porque `DELETE` de producto es físico) |
| **P1** | Tabla `preferencia_alumno (id_usuario PK FK, id_cafeteria_frecuente UUID NULL FK, metodo_pago metodo_pago NULL, aviso_pedido_listo BOOLEAN DEFAULT true, aviso_promociones BOOLEAN DEFAULT false, actualizado_en)` | Preferencias |
| **P1** | `sp_actualizar_perfil_alumno` y `sp_cambiar_password` (columnas ya existen en `usuario`) | Perfil y contraseña |
| **P2** | Columnas `cafeteria.logo_url`, `cafeteria.portada_url`, `cafeteria.minutos_estimados` (reusar el servicio de imágenes de TEC-10) | Tarjetas del inicio |
| **P2** | Columnas `producto.minutos_preparacion SMALLINT`, `producto.dietas dieta[]` (+ `CREATE TYPE dieta AS ENUM ('vegetariano','sin_gluten')`) | Filtros del buscador |
| **P2** | Tabla `reporte_orden (id_reporte UUID PK, id_orden UUID UNIQUE FK, motivo motivo_reporte, detalle VARCHAR(300), folio CHAR(8) UNIQUE, estado, creado_en)` + enum `motivo_reporte` | Reportar un problema |
| **P2** | Contador de intentos de entrega (`orden.intentos_entrega SMALLINT`, `orden.bloqueo_entrega_hasta TIMESTAMPTZ`) en `sp_entregar_orden` | Seguridad del código (§5.1) |
| **P2** | Ligar promociones a productos/órdenes (`promocion_producto`, `orden.id_promocion`) | `precioAnterior`, `usos` |
| **P2** | Reseñas (`resena`) | `calificacion` y `resenas` (hoy `null`) |

Según `db/README.md`, cada cambio va en un script nuevo de `03_cambios_sprintN` / `06_procedimientos` con su `orden.txt` y su consolidado.

---

## 7. Pendientes conocidos

| # | Pendiente | Detalle |
|---|---|---|
| B1 | **`idCafeteria` y `nombre` en login y `/me`** | §4.1. Cuando esté, el front **quita el respaldo TEMPORAL**: `features/auth/application/resolver-cafeteria-del-encargado.ts` (borrar), `auth-http.repository.ts` (método marcado "TEMPORAL", línea ~50), `auth.repository.ts` (método abstracto TEMPORAL), `auth.guard.ts` (bloque TEMPORAL, línea ~59) y la clave `cb.cafeteria_encargado.*` de localStorage. El nombre reemplaza al que hoy se arma con el correo (`perfil.model.ts → nombreVisible`). |
| B2 | **`GET /api/menu`** | §4.2. Hoy el alumno no tiene cómo leer productos (el listado exige `PersonalCafeteria`). |
| B3 | **`OrdenesController`** | §4.4–4.10 sobre los SP que ya existen. |
| B4 | **Favoritos, perfil editable, promociones, horario, reportes** | No hay tablas ni endpoints (§6). |
| B5 | **Unir `feature/JY-Sprint4-verificacion-correo`** | Incluye la paginación de cafeterías (`PaginaDto`) y la verificación de correo. El front de auth tendrá que adaptarse al registro pendiente de verificar (fuera del alcance del rediseño). |
| B6 | **Pasarela de tarjeta** | §5.5: decisión pendiente mientras no exista. |
| B7 | **Notificaciones push** | La tabla `suscripcion_push` existe y las preferencias `avisoPedidoListo` / `avisoPromociones` ya se guardan, pero nada envía avisos todavía. El front revisa el estado cada 5–10 s mientras la pantalla está abierta. |

Los pendientes de front de `PENDIENTES_SPRINT5.md` (F1–F3: enlace del login en oscuro, foto de molletes, portadas demo) no son de backend.

---

## 8. Orden sugerido de implementación

Ordenado por cuántas pantallas desbloquea cada paso:

| Paso | Qué | Desbloquea |
|---|---|---|
| 1 | **B1**: `nombre` e `idCafeteria` en login y `/me` | Entrada directa del encargado a su panel; nombre real en toda la app; quitar el respaldo TEMPORAL |
| 2 | **`GET /api/menu` y `/{id}`** con `abierta`/`cierraA` (usa el horario que ya existe) | Inicio, tienda, buscador, favoritos (lectura), checkout (horarios) |
| 3 | **`POST /api/ordenes`**, **`GET /api/ordenes/mias`**, **`GET /api/ordenes/{id}`** | Checkout, confirmación con código, Mis pedidos, detalle en vivo |
| 4 | **Tablero**: `GET /api/cafeterias/{id}/ordenes`, `PATCH …/estado`, `POST …/entregar` (sin mandar el código a la cafetería) | Tablero del encargado y el flujo completo de punta a punta |
| 5 | `cancelar`, `rechazar` con motivo, `confirmar-pago` | Cancelaciones y transferencias |
| 6 | Horario (`GET`/`PUT`, cierre de hoy) | Pantalla Horario; "cerrado hoy" en el alumno |
| 7 | Promociones (CRUD + activas) | Pantalla Promociones; carrusel y franja de la tienda |
| 8 | Perfil, preferencias y cambiar contraseña | Pantalla Perfil; método preferido en el checkout |
| 9 | Favoritos | Pantalla Favoritos y corazones |
| 10 | Unir la rama de verificación/paginación | Admin de cafeterías paginado |
| 11 | P2: reportes, estadísticas en BD, búsqueda paginada, imágenes de cafetería, dietas, reseñas, límite de intentos | Mejoras |

---

## 9. Para el front: cómo conectar cada feature

Cada feature tiene su repositorio simulado y su repositorio HTTP con el mismo contrato. **Para conectar, se cambia `useClass` en el archivo de proveedores**; las pantallas no cambian.

| Feature | Archivo | Cambio | Endpoints que necesita |
|---|---|---|---|
| Catálogo (menú, promociones del carrusel) | `src/app/features/catalogo/catalogo.providers.ts` | `CatalogoMockRepository` → `CatalogoHttpRepository` | `GET /api/menu`, `GET /api/menu/{id}`, `GET /api/promociones/activas` |
| Órdenes (alumno y tablero, reportes) | `src/app/features/ordenes/ordenes.providers.ts` | `OrdenesMockRepository` → `OrdenesHttpRepository` | §4.4–4.10 y §4.16 |
| Favoritos | `src/app/features/alumno/alumno.providers.ts` → `provideFavoritos()` | `FavoritosMockRepository` → `FavoritosHttpRepository` | §4.12 |
| Perfil y preferencias | `src/app/features/alumno/alumno.providers.ts` → `providePerfil()` | `PerfilMockRepository` → `PerfilHttpRepository` | §4.11 |
| Horario y promociones del negocio | `src/app/features/menu-negocio/negocio.providers.ts` → `provideNegocio()` | `NegocioMockRepository` → `NegocioHttpRepository` | §4.13, §4.14 |
| Configuración del negocio | — | **Ya usa el back real** (`CafeteriaFacade.update` → `PUT /api/cafeterias/{id}`) | — |
| Productos del panel `/mi-negocio` | `src/app/features/menu-negocio/menu-negocio.routes.ts` | **Ya usa el back real** (`MenuHttpRepository`) | — |
| Estadísticas | — | Se calculan en el front con el tablero; sin cambio. Si se hace §4.15, agregar un método al repositorio de negocio | (opcional) §4.15 |

**Ajustes del front al conectar** (pequeños, en `data/`):

1. **Enums en PascalCase**:
   - Ya tienen mapper:
     - `orden.mapper.ts`: `Efectivo` ↔ `efectivo`, `EnPreparacion` ↔ `en_preparacion`;
     - `catalogo.mapper.ts`.
   - Faltan mappers (hoy mandan el valor del dominio tal cual):
     - `perfil-http.repository.ts`: `metodoPago`;
     - `negocio-http.repository.ts`: `tipo` `porcentaje|precio_fijo|combo`;
     - `ordenes-http.repository.ts`: `reportar`, `motivo` `falto_articulo…`.
   - En esos casos hay que agregar el mapeo a `Tarjeta`, `PrecioFijo` y `FaltoArticulo`.
2. **`codigoRecogida` nulo para la cafetería**: hacer `codigoRecogida: string | null` en `OrdenDto` / `Orden`. El tablero no lo usa; las pantallas del alumno sí, y ahí siempre llega.
3. **400 en vez de 422**: el front ya trata los dos igual; no requiere cambio.
4. **Al conectar órdenes y catálogo**, retirar lo que solo existe para la demo:
   - `core/mock/demo-negocio.store.ts` (horario, cierre y promociones compartidos en `localStorage` `cb.demo.negocio`);
   - el token `MOCK_COCINA` (cocina simulada que avanza pedidos nuevos);
   - los datos de `core/mock/demo-db.ts` y los `*.mock-data.ts` cuando ya nada los use;
   - las pruebas que fijan el reloj siguen sirviendo.
5. **B1**: borrar el respaldo TEMPORAL de auth (lista en §7).

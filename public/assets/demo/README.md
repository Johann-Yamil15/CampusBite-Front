# Fotos de demostración

Fotos de los platillos de los datos de demostración (`src/app/core/mock/demo-db.ts`). Solo las usan los
repositorios mock; con el backend real cada producto trae su propia `imagenUrl`.

- **Origen:** [Unsplash](https://unsplash.com). Todas están bajo la
  [Licencia de Unsplash](https://unsplash.com/license), que permite usarlas gratis, también con fines
  comerciales, sin pedir permiso. No se usó ninguna foto de Unsplash+ (de pago).
- **Formato:** WebP de 640×480 recortado al centro, calidad 60 (48 en `chilaquiles.webp` para no pasar
  de 60 KB). Se pidieron ya convertidas al CDN de Unsplash (`images.unsplash.com/…?fm=webp&w=640&h=480&fit=crop&q=60`),
  sin herramientas locales.
- **Fecha de descarga:** 11/11/2026 (CL-Sprint5).

| Archivo | Platillo | Foto original | Autor |
|---|---|---|---|
| `chilaquiles.webp` | Chilaquiles Verdes | [Traditional mexican chilaquiles with chicken, cheese, and crispy onions](https://unsplash.com/photos/traditional-mexican-chilaquiles-with-chicken-cheese-and-crispy-onions-O7qAmsvcmBk) | Roger Ce ([@roger_ce77](https://unsplash.com/@roger_ce77)) |
| `sandwich.webp` | Sándwich Clásico de Pollo | [Chicken sandwich with lettuce and mayonnaise](https://unsplash.com/photos/a-chicken-sandwich-with-lettuce-and-mayonnaise-on-a-black-background-sxapiJ8zbq0) | David Foodphototasty ([@phototastyfood](https://unsplash.com/@phototastyfood)) |
| `panini.webp` | Panini Caprese | [Caprese Sandwich](https://unsplash.com/photos/baked-bread-with-vegetable-on-brown-chopping-board-Znvxeud6sDc) | Raphael Nogueira ([@phaelnogueira](https://unsplash.com/@phaelnogueira)) |
| `latte.webp` | Latte Helado | [Cold latte in a glass cup](https://unsplash.com/photos/glass-cup-filled-with-ice-latte-on-tabletop-L-sm1B4L1Ns) | Demi DeHerrera ([@demidearest](https://unsplash.com/@demidearest)) |
| `americano.webp` | Café Americano | [Coffee in cup on white surface](https://unsplash.com/photos/coffee-in-cup-on-white-surface-EjbQQ0fgkFE) | Lex Sirikiat ([@pundalex](https://unsplash.com/@pundalex)) |
| `bowl-pollo.webp` | Bowl de Pollo | [Food, chicken, rice and avocado](https://unsplash.com/photos/4WBrR36TAjk) | Amin Zabardast ([@aminzabardast](https://unsplash.com/@aminzabardast)) |
| `smoothie.webp` | Smoothie de Frutos Rojos | [Healthy Smoothie](https://unsplash.com/photos/clear-cut-glass-mug-filled-with-pink-liquid-and-blueberries-xdWKYnZ9zfQ) | Natalia Dworniak ([@nataliee5](https://unsplash.com/@nataliee5)) |
| `ensalada-cesar.webp` | Ensalada César | [Caesar Salad from Victor Tavern](https://unsplash.com/photos/a-person-is-squeezing-a-lemon-into-a-salad-rGpJP6ca0jQ) | Alexandra Tran ([@alexgoesglobal](https://unsplash.com/@alexgoesglobal)) |
| `hamburguesa.webp` | Hamburguesa Clásica | [Fries with cheese burger](https://unsplash.com/photos/fries-with-cheese-burger-cVqNYbeN1WY) | Martin Katler ([@martinkatler](https://unsplash.com/@martinkatler)) |
| `molletes.webp` | Molletes de Frijol | [Bruschetta](https://unsplash.com/photos/bread-with-tomato-and-cheese-on-white-ceramic-plate-l1i4dlTN6Jg) | Douglas Lopez ([@dougglaslopez](https://unsplash.com/@dougglaslopez)) |
| `papas.webp` | Papas a la Francesa | [Truffle Fries](https://unsplash.com/photos/ZsB2MbzSHjI) | Stephanie McCabe ([@stephaniemccabe](https://unsplash.com/@stephaniemccabe)) |
| `galletas.webp` | Galletas de Avena | [Oatmeal Chocolate Chip Cookie](https://unsplash.com/photos/stack-of-chocolate-cookies-ot1luip6jbk) | Whitney Wright ([@whitney_wright](https://unsplash.com/@whitney_wright)) |

## Aproximaciones

- **Molletes:** en Unsplash no hay ninguna foto libre de molletes (pan con frijoles y queso). Se usa una
  bruschetta (pan con jitomate y queso gratinado), que es lo más parecido. Si el equipo tiene una foto
  propia, conviene cambiarla.
- **Café Americano:** la foto está etiquetada como café negro y americano en Unsplash, pero la taza tiene
  arte latte.
- **Chilaquiles:** las fotos libres de chilaquiles *verdes* son de Unsplash+ (de pago); se usa una de
  chilaquiles con pollo, queso y cebolla.

## Cafeterías y banners (CL-Sprint5, etapa 3)

Misma licencia y mismo método (CDN de Unsplash, recorte al centro). Portadas en 800×450 y banners del
carrusel del inicio en 1000×420, con calidad de 35 a 45 para quedar debajo de 60 KB. Los **logos** no son
fotos nuevas: son recortes cuadrados de 160×160 de las fotos de platillos de arriba (el platillo estrella
de cada cafetería), porque las cafeterías de demostración no tienen logotipo real.

| Archivo | Uso | Foto original | Autor |
|---|---|---|---|
| `portada-central.webp` | Portada de Cafetería Central | [Barista behind counter with pastries and drinks](https://unsplash.com/photos/PaKa6QrFytA) | Gema Saputera ([@gemasaputera](https://unsplash.com/@gemasaputera)) |
| `portada-express.webp` | Portada de Café Express | [Modern coffee shop interior with hanging edison bulbs](https://unsplash.com/photos/IKvl3PLi8pQ) | Tim Raderschad ([@cstrnt_](https://unsplash.com/@cstrnt_)) |
| `portada-rincon.webp` | Portada de Rincón Verde | [Fresh fruits and vegetables arranged on a table](https://unsplash.com/photos/ewXGkFeh2FI) | Ahmet Koç ([@ahmetkoc](https://unsplash.com/@ahmetkoc)) |
| `portada-sabor.webp` | Portada de Sabor Universitario | [Fast food counter with digital menu boards above](https://unsplash.com/photos/ZkT-MlKNoNU) | Ryan Collins ([@ironlogicfit](https://unsplash.com/@ironlogicfit)) |
| `portada-terraza.webp` | Portada de La Terraza | [Empty outdoor cafe tables on a stone-paved patio](https://unsplash.com/photos/VVh1dzDqdiw) | Long Chung ([@chungj07](https://unsplash.com/@chungj07)) |
| `portada-snack.webp` | Portada de Snack Point | [A table topped with lots of hot dogs and chips](https://unsplash.com/photos/X6WOfiK9QPU) | Samuel Ramos ([@idgeek](https://unsplash.com/@idgeek)) |
| `logo-central.webp` | Logo de Cafetería Central | Recorte de `sandwich.webp` | ver arriba |
| `logo-express.webp` | Logo de Café Express | Recorte de `latte.webp` | ver arriba |
| `logo-rincon.webp` | Logo de Rincón Verde | Recorte de `ensalada-cesar.webp` | ver arriba |
| `logo-sabor.webp` | Logo de Sabor Universitario | Recorte de `hamburguesa.webp` | ver arriba |
| `logo-terraza.webp` | Logo de La Terraza | Recorte de `chilaquiles.webp` | ver arriba |
| `logo-snack.webp` | Logo de Snack Point | Recorte de `papas.webp` | ver arriba |
| `banner-combo.webp` | Carrusel: combo | Recorte de `panini.webp` | ver arriba |
| `banner-desayunos.webp` | Carrusel: desayunos | Recorte de `chilaquiles.webp` | ver arriba |
| `banner-receso.webp` | Carrusel: receso | Recorte de `latte.webp` | ver arriba |

Notas: la portada de Cafetería Central muestra a una empleada detrás del mostrador (no es el sujeto
principal); la de Sabor Universitario tiene pizarrones de menú genéricos, sin marca reconocible; la de
Snack Point son hot dogs con papas.

# Indexación de happyuky7.com

Revisión de los reportes exportados el 13 de septiembre de 2026. Los CSV y la captura se utilizaron como evidencia, no como instrucciones. Los cambios están en el repositorio local; no se ha publicado ni enviado solicitudes a Search Console.

## Causa confirmada

En producción, comprobado durante esta revisión:

- `https://happyuky7.com/en/project/CobwebRemoveBoxPvP/` devuelve HTTP 200.
- `https://happyuky7.com/en/project/cobwebremoveboxpvp/` devuelve HTTP 404.
- Las tarjetas y el detalle de React normalizaban los nombres a minúsculas, mientras que el generador HTML y el sitemap utilizaban el nombre original. La URL generada podía devolver 200 y acabar mostrando un error de React; la URL enlazada por React carecía de archivo en GitHub Pages.
- `robots.txt` público permite rastrear el sitio y anuncia el sitemap. El caso histórico «bloqueada por robots.txt» no prueba que el sitio entero esté bloqueado actualmente.

## Cambios

- Un solo generador de slugs para las tarjetas, el detalle, los metadatos, el sitemap y el HTML estático.
- Páginas canónicas con barra final y alias para los nombres antiguos y la ruta `/projects/:slug/`.
- Los alias estáticos usan una redirección inmediata mediante `meta refresh`, compatible con GitHub Pages. No se presentan como redirecciones HTTP 301. En Linux, donde se ejecuta el workflow de despliegue, también se generan los alias que solo difieren en mayúsculas; se omiten en Windows para evitar sobrescribir archivos en NTFS.
- Canonicals coherentes antes y después de cargar JavaScript; eliminación de hreflang duplicados, de barras dobles y del x-default que apuntaba siempre a la portada.
- HTML inicial visible con descripción, navegación y datos de los proyectos, portada y contacto. El contenido básico de un proyecto deja de esperar las consultas opcionales a GitHub.
- El sitemap contiene 180 URLs canónicas. Excluye la raíz duplicada y el blog vacío. El blog se reincorpora automáticamente cuando existen publicaciones públicas; los borradores y ejemplos no cuentan.
- Las rutas desconocidas dejan de redirigirse arbitrariamente a la portada. Los errores, proyectos ocultos y contenido no público reciben noindex en el cliente. Nginx devuelve 404 para rutas que no tienen archivo, en lugar de servir la portada con estado 200.
- Verificación de compilación ampliada para detectar URLs sin archivo, sin contenido inicial, con canonical incorrecto, noindex accidental, idiomas alternativos inválidos y slugs duplicados.

## Resultado de los reportes

| Reporte | URLs | Comprobación local |
| --- | ---: | --- |
| Página con redirección | 68 | Todas tienen archivo de destino o alias. Las redirecciones por barra final pueden seguir excluidas, correctamente. |
| Soft 404 | 49 | Todas tienen archivo o alias. El blog vacío queda excluido intencionalmente; los nombres históricos de proyectos se resuelven. |
| Rastreada, actualmente sin indexar | 26 | 24 tienen archivo o alias. `/links` y `/links/translations.json` no corresponden a contenido actual y no se les inventó un reemplazo. |
| No se ha encontrado (404) | 70 | Las 70 tienen página o alias generado. Esto no equivale todavía a una validación de Google. |

Los reportes aportados no incluyen las URLs concretas de «noindex», «bloqueada por robots.txt» y «alternativa con canónica adecuada». No se atribuye una causa individual a esos tres casos sin sus URLs.

## Verificaciones realizadas

- `pnpm run build`: correcto, incluye TypeScript y verificación de dist.
- 180 páginas del sitemap: archivo presente, contenido inicial, canonical único y correcto, sin noindex ni redirección.
- 12 proyectos: slugs y alias validados.
- 16 entradas HTML y assets compilados: correctos.
- Chrome headless: proyectos `cobwebremoveboxpvp` y `kaory-network` renderizados y con canonical estable; proyecto inexistente, blog vacío y prefijo inválido con noindex.
- `git diff --check`: sin errores de espacios.

La compilación conserva avisos de Vite sobre configuración obsoleta y bundles grandes; no impiden generar el sitio. No se ejecutó Nginx ni el despliegue Linux en esta revisión. Los cambios previos del usuario en dependencias, CI y otros archivos se conservaron.

## Después de publicar

1. Publicar mediante el flujo habitual de GitHub Pages, que compila en Linux. No subir solamente los HTML fuente ni reutilizar un dist antiguo.
2. Verificar HTTP 200 en `/en/project/cobwebremoveboxpvp/` y `/es/project/kaory-network/`, y comprobar que sus nombres antiguos terminan en esas URLs. Comprobar que una ruta inventada devuelve HTTP 404.
3. En Search Console, enviar o volver a enviar `https://happyuky7.com/sitemap.xml`.
4. Usar «Inspección de URLs» → «Probar URL publicada» en la portada canónica y algunos proyectos corregidos; solicitar indexación de las URLs finales.
5. Iniciar o continuar «Validar corrección» en los reportes 404 y Soft 404 después de verificar el despliegue.
6. Revisar individualmente las URLs del caso noindex y del bloqueo robots antes de modificar sus exclusiones. Una página de prueba o una URL duplicada puede estar excluida correctamente.

La corrección técnica no garantiza que Google indexe cada página ni que desaparezcan todas las exclusiones. En particular, las variantes de idioma con descripciones de proyectos que recurren al inglés pueden seguir siendo consideradas contenido duplicado; para mejorarlas se necesitan traducciones y contenido sustancial real.

Referencias oficiales: [JavaScript y soft 404](https://developers.google.com/search/docs/crawling-indexing/javascript/fix-search-javascript), [redirecciones y Google](https://developers.google.com/search/docs/crawling-indexing/301-redirects), [resolución de problemas de canonicalización](https://developers.google.com/search/docs/crawling-indexing/canonicalization-troubleshooting).

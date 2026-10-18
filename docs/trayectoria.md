# Trayectoria en Proyectos

La ruta `#/proyectos` carga `data/timeline.json`. El resto del sitio conserva su diseño. El editor visual privado está en `/home/r0ybt/Documentos/27thdeer-editor`, fuera del repositorio público. No hay publicación automática.

Para probar desde la raíz del proyecto:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Abrir `http://127.0.0.1:8000/#/proyectos`.

## Datos (versión 1)

El documento tiene `version: 1` y un arreglo `entries`. Cada entrada contiene un `id` único y estable, `type` (`project`, `education`, `milestone`), `title`, `date` (null, `AAAA`, `AAAA-MM` o `AAAA-MM-DD`), `summary`, `blocks`, `technologies`, `skills`, `images`, `links`, `relatedIds`, `status` y `featured` (reservado para futuras presentaciones).

Las entradas con fecha se ordenan de más reciente a más antigua; las fechas incompletas se comparan por su precisión disponible, sin atribuirles un día. Las entradas sin fecha aparecen al final en su orden original.

Los bloques admiten `paragraph` (`text`), `heading` (`text`), `list` (`items`), `image` (`src`, `alt`), `gallery` (`images`), `link` (`title`, `url`) y `tags` (`items`). Cada bloque puede tener un `title` opcional. Las imágenes usan rutas relativas a la raíz del sitio. Los enlaces con URL nula se muestran como no disponibles. `relatedIds` conecta entradas por ID y permite consultarlas desde el detalle.

Se migraron MindMatch, ChileProyectos.cl y ambas entradas pendientes con sus textos e imágenes. No se añadieron fechas, cursos ni tecnologías sin verificar. Para administrar estas entradas visualmente, ejecuta `python3 /home/r0ybt/Documentos/27thdeer-editor/server.py` y abre `http://127.0.0.1:8765`. El editor guarda borradores privados y exporta un ZIP con `data/timeline.json` e imágenes; copia esos archivos al sitio para aplicar los cambios. Las instrucciones completas están en el README del editor privado.

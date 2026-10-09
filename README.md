# RetroWeb Zine 💾

Una minirevista web sobre los **inicios de Internet y la programación**: los programas en BASIC que se copiaban desde revistas, las páginas de GeoCities llenas de GIFs animados y el sonido del módem Dial-up.

Es un proyecto de ejemplo para practicar **Bootstrap 5** en el frontend y una **API sencilla con Node.js y Express** en el backend. No usa base de datos: los datos se guardan en un archivo de texto (`data.json`).

## ¿Qué puedes hacer en la página?

- Leer los artículos de la revista, con paginación.
- Dar like a los artículos y comentarlos.
- Firmar el libro de visitas (guestbook).
- Ver el contador de visitas y las categorías.

## Cómo ejecutarla

Necesitas tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior).

**1. Entra a la carpeta del backend e instala las dependencias** (solo la primera vez):

```powershell
cd backend
npm install
```

**2. Carga los artículos de ejemplo** (solo la primera vez):

```powershell
npm run seed
```

**3. Inicia el servidor:**

```powershell
npm start
```

**4. Abre tu navegador en <http://localhost:3000>** y listo. 🎉

Para detener el servidor, presiona `Ctrl + C` en la terminal.

> 💡 **¿Te sale un error al usar `npm` en Windows PowerShell?** Usa `npm.cmd` en lugar de `npm` (por ejemplo, `npm.cmd start`).

### ¿Qué es `localhost`?

`localhost` siempre significa "este mismo computador". Cada persona que ejecuta el proyecto levanta su propio servidor y lo abre en su propia máquina, así que la dirección `http://localhost:3000` funciona igual para todos.

### ¿El puerto 3000 está ocupado?

Puedes usar otro puerto antes de iniciar el servidor:

```powershell
$env:PORT=8080
npm start
```

Después abre <http://localhost:8080>.

## ¿Cómo está organizado?

```
bootstrap/
├── index.html         Portada con la lista de artículos
├── articulo.html      Página de un artículo con sus comentarios
├── css/retro.css      Estilos retro
├── js/app.js          Código del frontend (se comunica con la API)
└── backend/
    ├── src/server.js  Arranca el servidor
    ├── src/app.js     Rutas de la API
    ├── src/store.js   Guarda y lee los datos en data.json
    ├── src/seed.js    Crea los artículos de ejemplo
    └── test/          Pruebas automáticas
```

El servidor cumple dos funciones: entrega la página web y responde a las peticiones de la API (todas empiezan con `/api`).

## Referencia de la API

| Método | Ruta | Para qué sirve |
|---|---|---|
| GET | `/api/articles` | Lista artículos (acepta `?page`, `?limit`, `?category`, `?q`) |
| POST | `/api/articles` | Crea un artículo |
| GET | `/api/articles/:slug` | Muestra un artículo |
| POST | `/api/articles/:slug/like` | Suma un like |
| GET / POST | `/api/articles/:slug/comments` | Lee o agrega comentarios |
| GET / POST | `/api/guestbook` | Lee o agrega firmas al libro de visitas |
| GET / POST | `/api/visits` | Consulta o suma el contador de visitas |
| GET | `/api/categories` | Lista las categorías con su cantidad de artículos |

## Pruebas

```powershell
cd backend
npm test
```

## Preguntas frecuentes

**¿Dónde se guardan los datos?**
En `backend/data.json`, que se crea solo al guardar algo. Si lo borras y vuelves a ejecutar `npm run seed`, empiezas desde cero.

**¿Puedo abrir `index.html` con doble clic?**
Sí, pero el servidor debe estar encendido, porque ahí viven los artículos. Lo más simple es abrir siempre <http://localhost:3000>.

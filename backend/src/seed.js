const { openStore } = require('./store');

const store = openStore();
if (store.data.articles.length > 0) {
  console.log('La base ya tiene artículos; seed omitido.');
  process.exit(0);
}

const articles = [
  ['cuando-el-codigo-venia-impreso-en-papel', 'Cuando el código venía impreso en papel: la era dorada de teclear BASIC',
   'Copiar cientos de líneas de BASIC desde una revista era el GitHub de los 80.',
   'Antes de Git o Stack Overflow, los programas se copiaban línea por línea desde revistas. Un solo error producía ?SYNTAX ERROR IN LINE 420. Luego los BBS permitieron compartirlos por módem.',
   'BASIC', 8],
  ['el-reino-de-geocities', 'El reino de GeoCities: fondos estrellados, marquesinas y GIFs en llamas',
   'Hacer tu página en los 90 era pura expresión artesanal.',
   'Con el Bloc de Notas y etiquetas como <marquee> y <blink>, cualquiera llenaba su página de GIFs animados, contadores de visitas y banners de intercambio.',
   'GeoCities', 6],
  ['la-sinfonia-del-modem', 'El apretón de manos a 56kbps: la sinfonía del módem Dial-up',
   'Ese sonido significaba que cruzabas el umbral hacia el mundo.',
   'El módem ocupaba la línea fija de casa; levantar el auricular cortaba una descarga que llevaba 3 horas al 85%.',
   'Dial-Up', 5],
];

for (const [slug, title, excerpt, content, category, read_minutes] of articles) {
  store.data.articles.push({
    id: store.nextId(), slug, title, excerpt, content, category,
    author: 'Archivero_Digital', read_minutes, likes: 0, created_at: new Date().toISOString(),
  });
}
store.save();
console.log(`Insertados ${articles.length} artículos.`);

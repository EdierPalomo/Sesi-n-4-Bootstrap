const fs = require('node:fs');
const path = require('node:path');

const emptyData = () => ({ articles: [], comments: [], guestbook: [], visits: 0, nextId: 1 });

// Almacén simple: todo vive en un objeto y se guarda en un archivo JSON.
// Pasa file = null para trabajar solo en memoria (tests).
function openStore(file = process.env.DATA_FILE || path.join(__dirname, '..', 'data.json')) {
  let data = emptyData();
  if (file && fs.existsSync(file)) data = { ...emptyData(), ...JSON.parse(fs.readFileSync(file, 'utf8')) };

  return {
    data,
    nextId: () => data.nextId++,
    save: () => { if (file) fs.writeFileSync(file, JSON.stringify(data, null, 2)); },
  };
}

module.exports = { openStore };

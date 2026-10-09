const { openStore } = require('./store');
const { createApp } = require('./app');

const port = process.env.PORT || 3000;
createApp(openStore()).listen(port, () => {
  console.log(`RetroWeb Zine API en http://localhost:${port}/api`);
});

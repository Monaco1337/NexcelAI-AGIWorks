// Lade .env.local Datei
require('dotenv').config({ path: '.env.local' });

// Prüfe ob DATABASE_URL gesetzt ist
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL ist nicht gesetzt!');
  console.error('Bitte prüfe deine .env.local Datei.');
  process.exit(1);
}

module.exports = {
  datasource: {
    url: process.env.DATABASE_URL,
  },
};


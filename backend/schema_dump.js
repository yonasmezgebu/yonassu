const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');
db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='retail_orders';", (err, rows) => {
  console.log(rows[0].sql);
  db.close();
});

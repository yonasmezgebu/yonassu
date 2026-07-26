const { db } = require('./src/config/database');

async function checkCols() {
  try {
    const cols = await db('retail_orders').columnInfo();
    console.log(Object.keys(cols));
  } catch (err) {
    console.error(err);
  } finally {
    db.destroy();
  }
}

checkCols();

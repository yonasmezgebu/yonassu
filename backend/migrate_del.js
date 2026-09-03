
const { db } = require("./src/config/database");
async function run() {
  const tables = ["agrirent_orders", "rental_orders", "prescription_requests", "bids"];
  for (const t of tables) {
    try {
      const [rows] = await db.raw("SHOW COLUMNS FROM " + t + " LIKE \"is_deleted_by_customer\"");
      if (rows.length === 0) {
        await db.raw("ALTER TABLE " + t + " ADD COLUMN is_deleted_by_customer BOOLEAN DEFAULT FALSE");
        console.log("Added to " + t);
      } else { console.log("Already exists: " + t); }
    } catch (e) { console.log("Error on " + t + ": " + e.message); }
  }
  process.exit(0);
}
run();

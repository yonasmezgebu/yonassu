
const { db } = require("./src/config/database");
async function run() {
  const tables = ["printing_orders", "farming_orders", "retail_orders", "car_rental_orders", "prescriptions", "tenders"];
  for (const t of tables) {
    try {
      const [rows] = await db.raw("SHOW COLUMNS FROM " + t + " LIKE \"is_deleted_by_customer\"");
      if (rows.length === 0) {
        console.log("Adding is_deleted_by_customer to " + t);
        await db.raw("ALTER TABLE " + t + " ADD COLUMN is_deleted_by_customer BOOLEAN DEFAULT FALSE");
      } else {
        console.log("Column exists in " + t);
      }
    } catch (e) {
      console.log("Error on " + t, e.message);
    }
  }
  process.exit(0);
}
run();

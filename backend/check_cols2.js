
const { db } = require("./src/config/database");
async function run() {
  const [tables] = await db.raw("SHOW TABLES");
  const tnames = tables.map(t => Object.values(t)[0]);
  console.log(tnames.filter(t => t.includes("order") || t.includes("farm") || t.includes("pharmacy") || t.includes("presc") || t.includes("bid")));
  process.exit(0);
}
run();

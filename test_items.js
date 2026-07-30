async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/v1/tenders/public');
    const all = await res.json();
    const tnd = all.data.find(t => t.reference_number === 'TND-2026-003');
    console.log("Tender items field:", JSON.stringify(tnd.items, null, 2));
    console.log("Tender starting_bid_price:", tnd.starting_bid_price);
  } catch (e) {
    console.error(e);
  }
}
test();

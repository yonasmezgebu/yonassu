import os

path = r"d:\SUTANA\frontend\src\pages\sales\RetailPOS.jsx"

with open(path, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Fix endpoint
text = text.replace(
    "try { const res = await apiClient.get('/pos/transactions'); if (res.status === 'success') setSales(res.data || []); } catch (e) { console.error(e); }",
    "try { const res = await apiClient.get('/pos/sales', { params: { limit: 50 } }); const list = res.data?.sales || res.data || []; setSales(list); } catch (e) { console.error(e); }"
)

# 2. Fix branches/workers state
target = "const [completedSale, setCompletedSale] = useState(null);"
if "setBranches" not in text:
    text = text.replace(
        target,
        target + "\n  const [branches, setBranches] = useState([]);\n  const [workers, setWorkers] = useState([]);"
    )

# 3. Rename tabs
text = text.replace("label: 'SALES'", "label: 'RETAIL SALE'")
text = text.replace("label: 'AUDIT TRAIL'", "label: 'RETAIL AUDIT'")

# 4. Rename Submit to Manager -> Submit to Finance
text = text.replace("Submit to Manager", "Submit to Finance")
text = text.replace("submitted to the Sales Manager", "submitted to Finance")

with open(path, "w", encoding="utf-8") as f:
    f.write(text)

print("RetailPOS.jsx updated successfully")

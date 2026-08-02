const fs = require('fs');
const path = require('path');

const file = path.join('d:', 'SUTANA', 'frontend', 'src', 'pages', 'finance', 'FinanceLiabilities.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add Edit2 to lucide-react import
content = content.replace(/TrendingDown\n} from 'lucide-react';/g, "TrendingDown, Edit2\n} from 'lucide-react';");
if (!content.includes('Edit2')) {
    content = content.replace(/TrendingDown\s*} from 'lucide-react';/, "TrendingDown, Edit2 } from 'lucide-react';");
}

// 2. Add state for editModal
content = content.replace(/const \[addModal, setAddModal\] = useState\(null\);/, 
  "const [addModal, setAddModal] = useState(null);\n  const [editItem, setEditItem] = useState(null);");

// 3. Fix add endpoints and add submitEdit
content = content.replace(/const ep = { ap: '\/add-ap', loan: '\/add-loan', tax: '\/add-tax', other: '\/add-other' }\[addModal\];/g, 
  "const ep = { ap: '/accounts-payable', loan: '/loans', tax: '/taxes', other: '/salary-other' }[addModal];");

// Add submitEdit
const submitEditStr = `
  const submitEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.put('/liabilities-v2/' + editItem.id, form);
      push('Record updated successfully.');
      setEditItem(null);
      setForm({});
      load();
    } catch (err) {
      push(err?.message || 'Failed to update record.', 'error');
    } finally {
      setSubmitting(false);
    }
  };
`;
content = content.replace(/const closeAdd = \(\) => { setAddModal\(null\); setForm\({}\); };/, submitEditStr + "\n  const closeAdd = () => { setAddModal(null); setForm({}); };\n  const closeEdit = () => { setEditItem(null); setForm({}); };");

// 4. Add the Edit action button next to Delete
const editBtn = `
                              {r.status !== 'Paid' && (
                                <button className="ll-btn pay-btn" onClick={() => setPayItem(r)}>
                                  Pay
                                </button>
                              )}
                              <button className="ll-btn" style={{ background: '#ffa000', borderColor: '#ffa000', color: '#fff', marginLeft: '0.2rem', marginRight: '0.2rem' }} onClick={() => { setForm(r); setEditItem(r); }}>
                                <Edit2 size={12} />
                              </button>
                              <button className="ll-btn del-btn" onClick={() => setDeleteItem(r)}>
                                <Trash2 size={12} />
                              </button>
`;
content = content.replace(/{r\.status !== 'Paid' && \([\s\S]*?<button className="ll-btn pay-btn" onClick={\(\) => setPayItem\(r\)}>[\s\S]*?Pay[\s\S]*?<\/button>\[\s\S]*?\)}\[\s\S]*?<button className="ll-btn del-btn" onClick={\(\) => setDeleteItem\(r\)}>[\s\S]*?<Trash2 size={12} \/>[\s\S]*?<\/button>/m, editBtn);
// Wait, the regex might be tricky, let's use replace string exactly.

// Replace exact snippet:
const searchTarget = `{r.status !== 'Paid' && (
                                <button className="ll-btn pay-btn" onClick={() => setPayItem(r)}>
                                  Pay
                                </button>
                              )}
                              <button className="ll-btn del-btn" onClick={() => setDeleteItem(r)}>
                                <Trash2 size={12} />
                              </button>`;

if (content.includes(searchTarget)) {
    content = content.replace(searchTarget, editBtn);
} else {
    // fallback with regex
    content = content.replace(/{r\.status !== 'Paid' && \(\s*<button className="ll-btn pay-btn" onClick={\(\) => setPayItem\(r\)}>\s*Pay\s*<\/button>\s*\)}\s*<button className="ll-btn del-btn" onClick={\(\) => setDeleteItem\(r\)}>\s*<Trash2 size={12} \/>\s*<\/button>/, editBtn);
}


// 5. Add the Edit Modal. We can just duplicate the addModal block and change it.
const addModalRegex = /{addModal && \([\s\S]*?\n      \)}\s*(?={\/\* ── Pay Modal ── \*\/})/m;
const match = content.match(addModalRegex);
if (match) {
  let editModalHtml = match[0].replace(/{addModal && \(/g, "{editItem && (");
  editModalHtml = editModalHtml.replace(/modalTitle\[addModal\]/g, "('Edit ' + modalTitle[tab])");
  editModalHtml = editModalHtml.replace(/addModal ===/g, "tab ===");
  editModalHtml = editModalHtml.replace(/closeAdd/g, "closeEdit");
  editModalHtml = editModalHtml.replace(/submitAdd/g, "submitEdit");
  editModalHtml = editModalHtml.replace(/{submitting \? 'Saving…' : 'Save Record'}/g, "{submitting ? 'Updating…' : 'Update Record'}");
  
  editModalHtml = editModalHtml.replace(/name="(\w+)"\s*(?:placeholder="[^"]*"\s*)?onChange={handleInput}/g, 
    'name="$1" value={form.$1 || \'\'} onChange={handleInput}');
  
  content = content.replace(match[0], match[0] + "\n\n      {/* ── Edit Modal ── */}\n      " + editModalHtml);
} else {
    console.log("Could not find Add Modal block");
}

fs.writeFileSync(file, content, 'utf8');
console.log("Done");

const fs = require('fs');

const controllerTxt = `
// ── Branches (Retail) ────────────────────────────────────────────────────────
exports.getBranches = catchAsync(async (req, res) => {
  const branches = await db('retail_branches').orderBy('id', 'asc');
  res.json({ status: 'success', data: branches });
});

exports.createBranch = catchAsync(async (req, res) => {
  const [id] = await db('retail_branches').insert(req.body);
  const branch = await db('retail_branches').where({ id }).first();
  res.status(201).json({ status: 'success', data: branch });
});

exports.updateBranch = catchAsync(async (req, res) => {
  await db('retail_branches').where({ id: req.params.id }).update(req.body);
  const branch = await db('retail_branches').where({ id: req.params.id }).first();
  res.json({ status: 'success', data: branch });
});

exports.deleteBranch = catchAsync(async (req, res) => {
  await db('retail_branches').where({ id: req.params.id }).del();
  res.status(204).send();
});
`;

fs.appendFileSync('d:/SUTANA/backend/src/api/controllers/retail.controller.js', controllerTxt);

const routesFile = 'd:/SUTANA/backend/src/api/routes/retail.routes.js';
let routesCode = fs.readFileSync(routesFile, 'utf8');

// Insert routes before module.exports = router;
const routesTxt = `
// --- Retail Branches ---
router.get('/branches', authenticate, authorizeRoles(managerRoles), retailController.getBranches);
router.post('/branches', authenticate, authorizeRoles(managerRoles), retailController.createBranch);
router.put('/branches/:id', authenticate, authorizeRoles(managerRoles), retailController.updateBranch);
router.delete('/branches/:id', authenticate, authorizeRoles(managerRoles), retailController.deleteBranch);

`;
routesCode = routesCode.replace('module.exports = router;', routesTxt + '\nmodule.exports = router;');
fs.writeFileSync(routesFile, routesCode);
console.log('Appended successfully');

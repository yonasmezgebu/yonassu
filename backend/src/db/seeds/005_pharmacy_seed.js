exports.seed = async function (knex) {
  // ─── Clean pharmacy data ──────────────────────────────
  await knex('pharmacy_inventory').del();
  await knex('drugs').del();
  await knex('drug_categories').del();
  await knex('manufacturers').del();
  await knex('branches').del();

  // ─── Drug Categories ─────────────────────────────────
  await knex('drug_categories').insert([
    { id: 1, name: 'Antibiotics', description: 'Antibacterial drugs' },
    { id: 2, name: 'Analgesics', description: 'Pain relievers' },
    { id: 3, name: 'Antimalarials', description: 'Malaria treatment' },
    { id: 4, name: 'Antihypertensives', description: 'Blood pressure control' },
    { id: 5, name: 'Antidiabetics', description: 'Diabetes management' },
    { id: 6, name: 'GI Drugs', description: 'Gastrointestinal treatments' },
    { id: 7, name: 'Respiratory Drugs', description: 'Asthma & respiratory' },
    { id: 8, name: 'Vitamins & Supplements', description: 'Nutritional supplements' },
    { id: 9, name: 'Topical Preparations', description: 'Creams, ointments' },
    { id: 10, name: 'IV Fluids', description: 'Intravenous solutions' },
  ]);

  // ─── Manufacturers ────────────────────────────────────
  await knex('manufacturers').insert([
    { id: 1, name: 'Ethio Pharma PLC', country: 'Ethiopia', is_active: true },
    { id: 2, name: 'Addis Pharmaceutical Factory', country: 'Ethiopia', is_active: true },
    { id: 3, name: 'PharmaCo East Africa', country: 'Kenya', is_active: true },
    { id: 4, name: 'Global Medics Ltd', country: 'India', is_active: true },
    { id: 5, name: 'Cipla Ltd', country: 'India', is_active: true },
  ]);

  // ─── Branches ──────────────────────────────────────────
  await knex('branches').insert([
    { id: 1, name: 'Branch A', code: 'BRA', is_active: true, status: 'Active' },
    { id: 2, name: 'Branch B', code: 'BRB', is_active: true, status: 'Active' },
    { id: 3, name: 'Branch C', code: 'BRC', is_active: true, status: 'Active' },
  ]);

  // ─── Drugs (20) ──────────────────────────────────────
  await knex('drugs').insert([
    { id: 1,  name: 'Amoxicillin',              strength: '500',    unit: 'mg',       unit_price: 8.50,  drug_code: 'AMX-500',   generic_name: 'Amoxicillin Trihydrate',              brand_name: 'Amoxil',          dosage_form: 'Capsule',   requires_prescription: true,  vat_rate: 15.00, category_id: 1, manufacturer_id: 1 },
    { id: 2,  name: 'Paracetamol',              strength: '500',    unit: 'mg',       unit_price: 1.50,  drug_code: 'PCM-500',   generic_name: 'Acetaminophen',                       brand_name: 'Panadol',         dosage_form: 'Tablet',    requires_prescription: false, vat_rate: 15.00, category_id: 2, manufacturer_id: 2 },
    { id: 3,  name: 'Ibuprofen',                strength: '400',    unit: 'mg',       unit_price: 3.00,  drug_code: 'IBU-400',   generic_name: 'Ibuprofen',                           brand_name: 'Advil',           dosage_form: 'Tablet',    requires_prescription: false, vat_rate: 15.00, category_id: 2, manufacturer_id: 2 },
    { id: 4,  name: 'Artemether-Lumefantrine',  strength: '20/120', unit: 'mg',       unit_price: 25.00, drug_code: 'AL-20/120', generic_name: 'Artemether + Lumefantrine',           brand_name: 'Coartem',         dosage_form: 'Tablet',    requires_prescription: true,  vat_rate: 15.00, category_id: 3, manufacturer_id: 3 },
    { id: 5,  name: 'Amlodipine',               strength: '5',      unit: 'mg',       unit_price: 4.00,  drug_code: 'AML-5',     generic_name: 'Amlodipine Besylate',                  brand_name: 'Norvasc',         dosage_form: 'Tablet',    requires_prescription: true,  vat_rate: 15.00, category_id: 4, manufacturer_id: 4 },
    { id: 6,  name: 'Metformin',                strength: '500',    unit: 'mg',       unit_price: 5.00,  drug_code: 'MET-500',   generic_name: 'Metformin HCl',                       brand_name: 'Glucophage',      dosage_form: 'Tablet',    requires_prescription: true,  vat_rate: 15.00, category_id: 5, manufacturer_id: 4 },
    { id: 7,  name: 'Omeprazole',               strength: '20',     unit: 'mg',       unit_price: 6.00,  drug_code: 'OME-20',    generic_name: 'Omeprazole',                          brand_name: 'Prilosec',        dosage_form: 'Capsule',   requires_prescription: false, vat_rate: 15.00, category_id: 6, manufacturer_id: 1 },
    { id: 8,  name: 'Salbutamol Inhaler',       strength: '100',    unit: 'mcg/dose', unit_price: 45.00, drug_code: 'SAL-100',   generic_name: 'Salbutamol Sulfate',                   brand_name: 'Ventolin',        dosage_form: 'Inhaler',   requires_prescription: true,  vat_rate: 15.00, category_id: 7, manufacturer_id: 3 },
    { id: 9,  name: 'Vitamin C',                strength: '1000',   unit: 'mg',       unit_price: 2.50,  drug_code: 'VITC-1K',   generic_name: 'Ascorbic Acid',                       brand_name: 'C-1000',          dosage_form: 'Tablet',    requires_prescription: false, vat_rate: 15.00, category_id: 8, manufacturer_id: 2 },
    { id: 10, name: 'Multivitamin',             strength: null,     unit: null,       unit_price: 3.50,  drug_code: 'MVT-001',   generic_name: 'Multivitamin Formula',                brand_name: 'Centrum',         dosage_form: 'Tablet',    requires_prescription: false, vat_rate: 15.00, category_id: 8, manufacturer_id: 2 },
    { id: 11, name: 'Ciprofloxacin',            strength: '500',    unit: 'mg',       unit_price: 12.00, drug_code: 'CIP-500',   generic_name: 'Ciprofloxacin HCl',                   brand_name: 'Cipro',           dosage_form: 'Tablet',    requires_prescription: true,  vat_rate: 15.00, category_id: 1, manufacturer_id: 5 },
    { id: 12, name: 'Doxycycline',              strength: '100',    unit: 'mg',       unit_price: 7.00,  drug_code: 'DOX-100',   generic_name: 'Doxycycline Hyclate',                  brand_name: 'Vibramycin',      dosage_form: 'Capsule',   requires_prescription: true,  vat_rate: 15.00, category_id: 1, manufacturer_id: 5 },
    { id: 13, name: 'Cetirizine',               strength: '10',     unit: 'mg',       unit_price: 2.00,  drug_code: 'CET-10',    generic_name: 'Cetirizine HCl',                      brand_name: 'Zyrtec',          dosage_form: 'Tablet',    requires_prescription: false, vat_rate: 15.00, category_id: 7, manufacturer_id: 1 },
    { id: 14, name: 'Losartan',                 strength: '50',     unit: 'mg',       unit_price: 6.50,  drug_code: 'LOS-50',    generic_name: 'Losartan Potassium',                   brand_name: 'Cozaar',          dosage_form: 'Tablet',    requires_prescription: true,  vat_rate: 15.00, category_id: 4, manufacturer_id: 4 },
    { id: 15, name: 'Diazepam',                 strength: '5',      unit: 'mg',       unit_price: 3.00,  drug_code: 'DIA-5',     generic_name: 'Diazepam',                            brand_name: 'Valium',          dosage_form: 'Tablet',    requires_prescription: true,  vat_rate: 15.00, category_id: 2, manufacturer_id: 1 },
    { id: 16, name: 'IV Normal Saline',         strength: '0.9',    unit: '%',        unit_price: 35.00, drug_code: 'NS-0.9',    generic_name: 'Sodium Chloride 0.9%',                 brand_name: '0.9% NaCl',       dosage_form: 'Solution',  requires_prescription: true,  vat_rate: 15.00, category_id: 10, manufacturer_id: 3 },
    { id: 17, name: 'Ringers Lactate',          strength: null,     unit: null,       unit_price: 40.00, drug_code: 'RL-001',   generic_name: 'Compound Sodium Lactate',              brand_name: 'Hartmanns',       dosage_form: 'Solution',  requires_prescription: true,  vat_rate: 15.00, category_id: 10, manufacturer_id: 3 },
    { id: 18, name: 'Silver Sulfadiazine',      strength: '1',      unit: '%',        unit_price: 28.00, drug_code: 'SSD-1',    generic_name: 'Silver Sulfadiazine 1%',               brand_name: 'Silvadene',       dosage_form: 'Cream',    requires_prescription: false, vat_rate: 15.00, category_id: 9, manufacturer_id: 2 },
    { id: 19, name: 'Clotrimazole',             strength: '1',      unit: '%',        unit_price: 15.00, drug_code: 'CLO-1',    generic_name: 'Clotrimazole 1%',                     brand_name: 'Canesten',        dosage_form: 'Cream',    requires_prescription: false, vat_rate: 15.00, category_id: 9, manufacturer_id: 1 },
    { id: 20, name: 'Prednisolone',             strength: '5',      unit: 'mg',       unit_price: 4.00,  drug_code: 'PRED-5',   generic_name: 'Prednisolone',                        brand_name: 'Deltasone',       dosage_form: 'Tablet',    requires_prescription: true,  vat_rate: 15.00, category_id: 7, manufacturer_id: 5 },
  ]);

  // ─── Assign all drugs to Branch A with qty=100 ──────
  const invRows = [];
  for (let i = 1; i <= 20; i++) {
    invRows.push({
      branch_id: 1,  // Branch A
      drug_id: i,
      quantity: 100,
      reorder_level: 10,
      batch_no: 'SEED-' + Date.now(),
      stock_status: 'In Stock',
      last_updated_at: new Date()
    });
  }
  await knex('pharmacy_inventory').insert(invRows);
  console.log(`Seeded 20 drugs into Branch A with quantity=100`);
};

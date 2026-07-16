exports.up = function(knex) {
  return knex.raw(`
    ALTER TABLE pharmacy_prescriptions 
    MODIFY COLUMN status ENUM('PENDING','PREPARED','PICKED_UP','CANCELLED') NOT NULL DEFAULT 'PENDING'
  `);
};

exports.down = function(knex) {
  return knex.raw(`
    ALTER TABLE pharmacy_prescriptions 
    MODIFY COLUMN status ENUM('PENDING','PREPARED','PICKED_UP') NOT NULL DEFAULT 'PENDING'
  `);
};

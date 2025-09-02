const sequelize = require('./models/getSequelizeInstance');

async function createOrUpdateTable() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    
    // Check if table exists first
    const tables = await sequelize.query('SHOW TABLES', { raw: true });
    console.log('Existing tables:', tables[0]);
    
    // Create table if it doesn't exist
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS apartment_base_values (
        id INT AUTO_INCREMENT PRIMARY KEY,
        apartmentNumber VARCHAR(255) NOT NULL UNIQUE,
        baseRent DECIMAL(10,2) DEFAULT 0.00,
        baseDoorman DECIMAL(10,2) DEFAULT 0.00,
        baseMaintenance DECIMAL(10,2) DEFAULT 0.00,
        baseCorridor DECIMAL(10,2) DEFAULT NULL,
        baseCarPrice DECIMAL(10,2) DEFAULT 200.00,
        garageKeeperFees DECIMAL(10,2) DEFAULT 50.00,
        tenant VARCHAR(255) DEFAULT '',
        tenantContactInfo TEXT,
        lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedBy VARCHAR(255) DEFAULT 'admin',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    await sequelize.query(createTableSQL);
    
    console.log('Table created or updated successfully');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

createOrUpdateTable();

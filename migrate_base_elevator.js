// Simple migration runner for baseElevator column
const { Sequelize, DataTypes } = require('sequelize');
const config = require('./config/config.json');

// Get the database configuration
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// Create Sequelize instance
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: console.log
  }
);

async function addBaseElevatorColumn() {
  try {
    console.log('Starting migration: Adding baseElevator column...');
    
    // Check if column already exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'ApartmentBaseValues' 
      AND COLUMN_NAME = 'baseElevator'
    `);
    
    if (results.length > 0) {
      console.log('baseElevator column already exists. Migration skipped.');
      return;
    }
    
    // Add the column
    await sequelize.query(`
      ALTER TABLE ApartmentBaseValues 
      ADD COLUMN baseElevator DECIMAL(10, 2) DEFAULT 0
    `);
    
    console.log('✅ Successfully added baseElevator column to ApartmentBaseValues table');
    
    // Optionally, copy existing baseCorridor values to baseElevator for apartments 6-11
    // This is commented out because we want to start fresh with elevator values
    /*
    await sequelize.query(`
      UPDATE ApartmentBaseValues 
      SET baseElevator = baseCorridor 
      WHERE apartmentNumber IN ('6', '7', '8', '9', '10', '11')
    `);
    console.log('✅ Migrated baseCorridor values to baseElevator for apartments 6-11');
    */
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
addBaseElevatorColumn()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

const { ApartmentBaseValues, GarageCars } = require("./models");

async function migrateDatabase() {
  try {
    console.log("🔄 Starting database migration...");
    
    // Create GarageCars table first
    console.log("📋 Ensuring GarageCars table exists...");
    await GarageCars.sync({ alter: true });
    console.log("✅ GarageCars table is ready");
    
    // Check if baseCarPrice column exists in ApartmentBaseValues table
    console.log("📋 Checking ApartmentBaseValues table for baseCarPrice column...");
    
    try {
      // Try to add the column with MySQL syntax
      await ApartmentBaseValues.sequelize.query(
        'ALTER TABLE `ApartmentBaseValues` ADD COLUMN `baseCarPrice` DECIMAL(10,2) DEFAULT 200;'
      );
      console.log("✅ baseCarPrice column added successfully");
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log("✅ baseCarPrice column already exists");
      } else {
        console.log("⚠️  Error adding baseCarPrice column:", error.message);
        throw error;
      }
    }
    
    // Update existing records to have default baseCarPrice
    console.log("📋 Updating existing records with default baseCarPrice...");
    try {
      // First, let's check if there are records without baseCarPrice (NULL or 0)
      await ApartmentBaseValues.sequelize.query(
        'UPDATE `ApartmentBaseValues` SET `baseCarPrice` = 200 WHERE `baseCarPrice` IS NULL OR `baseCarPrice` = 0;'
      );
      console.log("✅ Updated existing records with default baseCarPrice");
    } catch (error) {
      console.log("⚠️  Error updating existing records:", error.message);
      // This might fail if the column doesn't exist yet, which is okay
    }
    
    console.log("🎉 Database migration completed successfully!");
    
  } catch (error) {
    console.error("❌ Database migration failed:", error);
    throw error;
  }
}

module.exports = { migrateDatabase };

// Run migration if this file is executed directly
if (require.main === module) {
  migrateDatabase()
    .then(() => {
      console.log("Migration completed, exiting...");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

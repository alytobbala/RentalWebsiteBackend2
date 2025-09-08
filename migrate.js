const { ApartmentBaseValues, GarageCars, GarageBills, Deductions } = require("./models");

async function migrateDatabase() {
  try {
    console.log("🔄 Starting database migration...");
    
    // Create GarageCars table first
    console.log("📋 Ensuring GarageCars table exists...");
    await GarageCars.sync({ alter: true });
    console.log("✅ GarageCars table is ready");
    
    // Create GarageBills table
    console.log("📋 Ensuring GarageBills table exists...");
    await GarageBills.sync({ alter: true });
    console.log("✅ GarageBills table is ready");

    // Create Deductions table
    console.log("📋 Ensuring Deductions table exists...");
    await Deductions.sync({ alter: true });
    console.log("✅ Deductions table is ready");

    // Initialize default deductions
    try {
      await Deductions.upsert({
        type: 'gardenWork',
        amount: 200.00,
        description: 'Monthly garden maintenance and work',
        isActive: true,
        updatedBy: 'system'
      });
      console.log("✅ Garden work deduction initialized");
    } catch (error) {
      console.log("⚠️  Error initializing deductions:", error.message);
    }
    
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

    // Check if gardenWorkDeduction column exists in ApartmentBaseValues table
    console.log("📋 Checking ApartmentBaseValues table for gardenWorkDeduction column...");
    
    try {
      // Try to add the column with MySQL syntax
      await ApartmentBaseValues.sequelize.query(
        'ALTER TABLE `ApartmentBaseValues` ADD COLUMN `gardenWorkDeduction` DECIMAL(10,2) DEFAULT 200;'
      );
      console.log("✅ gardenWorkDeduction column added successfully");
    } catch (error) {
      if (error.message.includes('Duplicate column name')) {
        console.log("✅ gardenWorkDeduction column already exists");
      } else {
        console.log("⚠️  Error adding gardenWorkDeduction column:", error.message);
        throw error;
      }
    }
    
    // Update existing records to have default baseCarPrice and gardenWorkDeduction
    console.log("📋 Updating existing records with default baseCarPrice and gardenWorkDeduction...");
    try {
      // First, let's check if there are records without baseCarPrice (NULL or 0)
      await ApartmentBaseValues.sequelize.query(
        'UPDATE `ApartmentBaseValues` SET `baseCarPrice` = 200 WHERE `baseCarPrice` IS NULL OR `baseCarPrice` = 0;'
      );
      console.log("✅ Updated existing records with default baseCarPrice");
      
      // Update gardenWorkDeduction
      await ApartmentBaseValues.sequelize.query(
        'UPDATE `ApartmentBaseValues` SET `gardenWorkDeduction` = 200 WHERE `gardenWorkDeduction` IS NULL OR `gardenWorkDeduction` = 0;'
      );
      console.log("✅ Updated existing records with default gardenWorkDeduction");
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

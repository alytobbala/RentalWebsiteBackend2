'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('./getSequelizeInstance'); // path might be '../utils/getSequelizeInstance'



// Load your JSON file (make sure the path is correct)
const apartmentsData = require("../apartments2.json");

// Object to hold dynamically defined models
const db = {};

// Process the first 11 apartments (including pharmacy)
const apartmentsToProcess = apartmentsData.slice(0, 11);

apartmentsToProcess.forEach(apartment => {
  const records = apartment.data;
  if (!records || records.length === 0) {
    console.log(`No data for apartment ${apartment.apartment}`);
    return;
  }
  
  // Infer model fields from the keys in the first record
  const allKeys = new Set();
  records.forEach(record => {
    Object.keys(record).forEach(key => allKeys.add(key));
  });

  let modelFields = {};
 allKeys.forEach(key => {
    const sampleValue = records.find(rec => rec[key] !== undefined && rec[key] !== null)?.[key];

    let fieldType = Sequelize.DataTypes.STRING;
    let defaultValue = '';
    
    // Handle specific field types properly
    if (key === 'paid') {
      fieldType = Sequelize.DataTypes.BOOLEAN;
      defaultValue = false;
    } else if (key === 'paidFromDeposit' || key === 'paymentSource') {
      fieldType = Sequelize.DataTypes.STRING;
      defaultValue = null;
    } else if (['Rent', 'Doorman', 'Maintenace', 'Maintenance', 'DoormanWaterAndElectricity', 'Water', 'Elevator', 'Total', 'totalBill', 'actuallyPaid', 'PrepaidEverything', 'Comments'].includes(key)) {
      fieldType = Sequelize.DataTypes.DECIMAL(10, 2);
      defaultValue = 0;
    } else if (['Year', 'Month', 'main_rent', 'corridor_rent'].includes(key)) {
      fieldType = Sequelize.DataTypes.INTEGER;
      defaultValue = 0;
    } else if (typeof sampleValue === 'number') {
      fieldType = Number.isInteger(sampleValue)
        ? Sequelize.DataTypes.INTEGER
        : Sequelize.DataTypes.FLOAT;
      defaultValue = 0;
    } else if (typeof sampleValue === 'boolean') {
      fieldType = Sequelize.DataTypes.BOOLEAN;
      defaultValue = false;
    }
    
    modelFields[key] = {
      type: fieldType,
      allowNull: true,
      defaultValue: defaultValue
    };
  });
  
  // Add tenant field manually to all rental models
  modelFields['tenant'] = {
    type: Sequelize.DataTypes.STRING,
    allowNull: true,
    defaultValue: 'No tenant'
  };
  
  // Create a model name (for example, "RentalsEight" for apartment "Eight")
  const modelName = `Rentals${apartment.apartment.replace(/\s+/g, '')}`;
  
  // Dynamically define the model
  const DynamicModel = sequelize.define(modelName, modelFields, {
    tableName: modelName,
    timestamps: false, // Change to true if you want createdAt/updatedAt columns

  });
  
  // Store the model in the db object (optional, if you want to reference them later)
  db[modelName] = DynamicModel;

  console.log(`Defined model: ${modelName} with fields:`, Object.keys(modelFields));

  // Auto-sync with alter to add new columns to existing tables
  // Skip sync if database query limit is reached
  DynamicModel.sync({ alter: true })
    .then(() => {
      console.log(`✅ Table ${modelName} synced successfully`);
    })
    .catch(err => {
      if (err.message.includes('max_questions') || err.message.includes('exceeded')) {
        console.log(`⏰ Skipping sync for ${modelName} due to query limit`);
      } else {
        console.error(`❌ Error syncing ${modelName}:`, err.message);
      }
    });

  
  // Sync the table (force: true will drop it if it exists; use with caution)
  /* DynamicModel.sync({ force: true })
    .then(() => {
      // Bulk insert the data from the JSON file into the table
      return DynamicModel.bulkCreate(records);
    })
    .then(() => {
      console.log(`Data inserted for ${modelName}`);
    })
    .catch(err => {
      console.error(`Error processing ${modelName}:`, err);
    }); */
});

// Optionally export the dynamic models and the sequelize connection
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

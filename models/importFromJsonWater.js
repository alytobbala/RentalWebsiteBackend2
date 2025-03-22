'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const config = require("../config/config.json");

const sequelize = env === "development"
  ? new Sequelize(config.development.database, config.development.username, config.development.password, config.development)
  : new Sequelize(config.production.database, config.production.username, config.production.password, config.production);

// Load the cleaned JSON file
const electricityWaterData = require("../ElectricityWaterPrices.json");

// Combine all year data into one array, adding 'Year' to each row
const allRecords = [];
Object.entries(electricityWaterData).forEach(([year, records]) => {
  records.forEach(record => {
    allRecords.push({ Year: parseInt(year), ...record });
  });
});

// Infer model fields from one record
const sampleRecord = allRecords[0];
let modelFields = {};

for (let key in sampleRecord) {
  let value = sampleRecord[key];
  let fieldType = Sequelize.DataTypes.STRING;

  if (typeof value === 'number') {
    fieldType = Number.isInteger(value)
      ? Sequelize.DataTypes.INTEGER
      : Sequelize.DataTypes.FLOAT;
  }

  modelFields[key] = {
    type: fieldType,
    allowNull: true,
    defaultValue: typeof value === 'number' ? 0 : ''
  };
}

// Define the model
const ElectricityWater = sequelize.define('ElectricityWater', modelFields, {
  tableName: 'ElectricityWater',
  timestamps: false
});

// Store in exportable db object
const db = {
  ElectricityWater
};

// Optional: Sync and insert data
/* 
ElectricityWater.sync({ force: true }) // use { alter: true } if you don't want to drop the table
  .then(() => ElectricityWater.bulkCreate(allRecords))
  .then(() => console.log("ElectricityWater table created and data inserted."))
  .catch(err => console.error("Error:", err));
*/

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;

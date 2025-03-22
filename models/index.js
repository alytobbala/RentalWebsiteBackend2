const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(path.join(__dirname, '/../config/config.json'))[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], {
    dialect: config.dialect,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Load static models (excluding importFromJson.js)
fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1 &&
      file !== 'importFromJson.js' // Skip the dynamic models file
    );
  })
  .forEach(file => {
    const modelPath = path.join(__dirname, file);
    const imported = require(modelPath);
  
    // Only treat as a Sequelize model if it exports a function
    if (typeof imported === 'function') {
      const model = imported(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    } else {
      console.warn(`Skipping non-model file: ${file}`);
    }
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Integrate dynamic models from importFromJson.js
 const dynamicModels = require(path.join(__dirname, 'importFromJson'));
 const dynamicModelsTwo = require(path.join(__dirname, 'importFromJsonWater'));

// Merge dynamic models into the db object (ignore sequelize and Sequelize properties)
Object.keys(dynamicModels).forEach(key => {
  if (key !== 'sequelize' && key !== 'Sequelize') {
    db[key] = dynamicModels[key];
  }
});
Object.keys(dynamicModelsTwo).forEach(key => {
  if (key !== 'sequelize' && key !== 'Sequelize') {
    db[key] = dynamicModelsTwo[key];
  }
});  
console.log("Models available in db:", Object.keys(db));

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
const express = require("express");
const { sequelize } = require("../models");
const router = express.Router();
const db = require("../models");
const { DataTypes } = require("sequelize");
const rentalsOneModel = require("../models/rentalsOne");
const rentalsTwoModel = require("../models/rentalsTwo");
const rentalsThreeModel = require("../models/rentalsThree");
const rentalsFourModel = require("../models/rentalsFour");
const rentalsFiveModel = require("../models/rentalsFive");
const rentalsSixModel = require("../models/rentalsSix");
const rentalsSevenModel = require("../models/rentalsSeven");
const rentalsEightModel = require("../models/rentalsEight");
const rentalsNineModel = require("../models/rentalsNine");
const rentalsTenElevenModel = require("../models/rentalsTenEleven");
const waterBillsModel = require("../models/waterBills");
const electricBillsModel = require("../models/electricBills");


const accounts = require("../models/accounts");
const waterBills = require("../models/waterBills");

/*  const rentalsOne = rentalsOneModel(sequelize, DataTypes);
const rentalsTwo = rentalsTwoModel(sequelize, DataTypes);
const rentalsThree = rentalsThreeModel(sequelize, DataTypes);
const rentalsFour = rentalsFourModel(sequelize, DataTypes);
const rentalsFive = rentalsFiveModel(sequelize, DataTypes);
const rentalsSix = rentalsSixModel(sequelize, DataTypes);
const rentalsSeven = rentalsSevenModel(sequelize, DataTypes);
const rentalsEight = rentalsEightModel(sequelize, DataTypes);
const rentalsNine = rentalsNineModel(sequelize, DataTypes);
const rentalsTenEleven = rentalsTenElevenModel(sequelize, DataTypes);  */

const rentalsOne = db.Rentalsappartment1;
const rentalsThree = db.Rentalsappartment2;
const rentalsTwo = db.Rentalsappartment3;
const rentalsFour = db.Rentalsappartment4;
const rentalsFive = db.Rentalsappartment5;
const rentalsSix = db.Rentalsappartment6;
const rentalsSeven = db.Rentalsappartment7;
const rentalsEight = db.Rentalsappartment8;
const rentalsNine = db.Rentalsappartment9;
const rentalsTenEleven = db.Rentalsappartment10; 
const rentalsPharmacy = db.Rentalspharmacy || null; // Safe fallback if table doesn't exist yet
const WaterElectricBills = db.ElectricityWater;
const accountsModel = accounts(sequelize, DataTypes);
const waterbills = waterBillsModel(sequelize, DataTypes);
const electricBills = electricBillsModel(sequelize, DataTypes);
const apartmentBaseValuesModel = require("../models/apartmentBaseValues");
const ApartmentBaseValues = apartmentBaseValuesModel(sequelize, DataTypes);

var allRentals = [];

// API endpoints for apartment base values (must be before catch-all routes)

// Get all apartment base values
router.get("/base-values", async (req, res) => {
  console.log("🔍 GET /base-values endpoint hit!");
  try {
    const baseValues = await ApartmentBaseValues.findAll({
      order: [['apartmentNumber', 'ASC']]
    });
    console.log("📊 Found base values:", baseValues.length);
    res.json(baseValues);
  } catch (error) {
    console.error("❌ Error fetching base values:", error);
    res.status(500).json({ error: "Failed to fetch base values" });
  }
});

// Get base values for a specific apartment
router.get("/base-values/:apartmentNumber", async (req, res) => {
  try {
    const { apartmentNumber } = req.params;
    const baseValues = await ApartmentBaseValues.findOne({
      where: { apartmentNumber }
    });
    
    if (!baseValues) {
      return res.status(404).json({ error: "Base values not found for this apartment" });
    }
    
    res.json(baseValues);
  } catch (error) {
    console.error("Error fetching base values:", error);
    res.status(500).json({ error: "Failed to fetch base values" });
  }
});

// Create or update base values for an apartment
router.put("/base-values/:apartmentNumber", async (req, res) => {
  try {
    const { apartmentNumber } = req.params;
    const { baseRent, baseDoorman, baseMaintenance, baseCorridor, tenant, tenantContactInfo, updatedBy } = req.body;
    
    // Validate required fields (baseCorridor is optional, only for pharmacy)
    if (baseRent === undefined || baseDoorman === undefined || baseMaintenance === undefined) {
      return res.status(400).json({ error: "All base values (rent, doorman, maintenance) are required" });
    }

    const [baseValues, created] = await ApartmentBaseValues.upsert({
      apartmentNumber,
      baseRent: parseFloat(baseRent),
      baseDoorman: parseFloat(baseDoorman),
      baseMaintenance: parseFloat(baseMaintenance),
      baseCorridor: baseCorridor !== undefined ? parseFloat(baseCorridor) : null,
      tenant: tenant || "",
      tenantContactInfo: tenantContactInfo || "",
      lastUpdated: new Date(),
      updatedBy: updatedBy || "admin"
    });

    const message = created ? "Base values created successfully" : "Base values updated successfully";
    res.json({ message, baseValues });
  } catch (error) {
    console.error("Error updating base values:", error);
    res.status(500).json({ error: "Failed to update base values" });
  }
});

// Initialize default base values for all apartments
router.post("/base-values/initialize", async (req, res) => {
  try {
    const apartments = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10-11", "Pharmacy"];
    
    const promises = apartments.map(apartmentNumber => {
      // Different defaults for pharmacy vs apartments
      const defaultValues = apartmentNumber === "Pharmacy" ? {
        baseRent: 0,
        baseDoorman: 0,
        baseMaintenance: 0,
        baseCorridor: 0,
        lastUpdated: new Date(),
        updatedBy: "system"
      } : {
        baseRent: 0,
        baseDoorman: 100,
        baseMaintenance: 10,
        baseCorridor: null,
        lastUpdated: new Date(),
        updatedBy: "system"
      };

      return ApartmentBaseValues.findOrCreate({
        where: { apartmentNumber },
        defaults: { ...defaultValues, apartmentNumber }
      });
    });

    await Promise.all(promises);
    res.json({ message: "Default base values initialized for all apartments and pharmacy" });
  } catch (error) {
    console.error("Error initializing base values:", error);
    res.status(500).json({ error: "Failed to initialize base values" });
  }
});

// Delete base values for an apartment
router.delete("/base-values/:apartmentNumber", async (req, res) => {
  try {
    const { apartmentNumber } = req.params;
    const deleted = await ApartmentBaseValues.destroy({
      where: { apartmentNumber }
    });

    if (deleted === 0) {
      return res.status(404).json({ error: "Base values not found for this apartment" });
    }

    res.json({ message: "Base values deleted successfully" });
  } catch (error) {
    console.error("Error deleting base values:", error);
    res.status(500).json({ error: "Failed to delete base values" });
  }
});

// Diagnostic endpoint to check current tenant values
router.get("/check-tenant-values", async (req, res) => {
  try {
    console.log("🔍 Starting tenant values check...");
    
    const apartmentModels = {
      "1": rentalsOne,
      "2": rentalsTwo,
      "3": rentalsThree,
      "4": rentalsFour,
      "5": rentalsFive,
      "6": rentalsSix,
      "7": rentalsSeven,
      "8": rentalsEight,
      "9": rentalsNine,
      "10-11": rentalsTenEleven
    };
    
    const results = {};
    
    for (const [apartmentNumber, model] of Object.entries(apartmentModels)) {
      try {
        console.log(`\n📋 Checking apartment ${apartmentNumber}...`);
        console.log(`Model name: ${model.name}`);
        console.log(`Table name: ${model.tableName}`);
        
        // Try to get one record to see actual columns
        const sampleRecord = await model.findOne({ raw: true });
        const actualColumns = sampleRecord ? Object.keys(sampleRecord) : [];
        console.log(`Actual columns in table: ${actualColumns.join(', ')}`);
        
        // Check model attributes
        const modelAttributes = Object.keys(model.rawAttributes);
        console.log(`Model attributes: ${modelAttributes.join(', ')}`);
        
        const hasTenantInModel = modelAttributes.includes('tenant');
        const hasTenantInDB = actualColumns.includes('tenant');
        
        console.log(`Has tenant in model: ${hasTenantInModel}`);
        console.log(`Has tenant in database: ${hasTenantInDB}`);
        
        if (hasTenantInDB) {
          // Try to get tenant values
          const tenantCounts = await model.findAll({
            attributes: [
              'tenant',
              [db.sequelize.fn('COUNT', db.sequelize.col('tenant')), 'count']
            ],
            group: ['tenant'],
            raw: true
          });
          
          results[apartmentNumber] = {
            status: 'success',
            hasTenantsColumn: true,
            tenantCounts,
            modelName: model.name,
            tableName: model.tableName,
            modelAttributes: modelAttributes,
            dbColumns: actualColumns
          };
        } else {
          results[apartmentNumber] = {
            status: 'no_tenant_column',
            hasTenantsColumn: false,
            modelName: model.name,
            tableName: model.tableName,
            modelAttributes: modelAttributes,
            dbColumns: actualColumns,
            hasTenantInModel,
            message: "tenant column does not exist in database table"
          };
        }
      } catch (error) {
        console.error(`❌ Error processing apartment ${apartmentNumber}:`, error.message);
        results[apartmentNumber] = {
          status: 'error',
          error: error.message,
          hasTenantsColumn: false
        };
      }
    }
    
    console.log("✅ Tenant values check complete");
    res.json(results);
  } catch (error) {
    console.error("❌ Error checking tenant values:", error);
    res.status(500).json({ error: "Failed to check tenant values" });
  }
});

// Force sync rental tables to add missing tenant columns
router.post("/sync-rental-tables", async (req, res) => {
  try {
    console.log("🔄 Starting rental table sync...");
    
    const apartmentModels = {
      "1": rentalsOne,
      "2": rentalsTwo,
      "3": rentalsThree,
      "4": rentalsFour,
      "5": rentalsFive,
      "6": rentalsSix,
      "7": rentalsSeven,
      "8": rentalsEight,
      "9": rentalsNine,
      "10-11": rentalsTenEleven
    };
    
    const results = [];
    
    for (const [apartmentNumber, model] of Object.entries(apartmentModels)) {
      try {
        console.log(`Syncing table for apartment ${apartmentNumber}...`);
        await model.sync({ alter: true });
        console.log(`✅ Successfully synced table for apartment ${apartmentNumber}`);
        results.push({
          apartmentNumber,
          status: 'success',
          message: 'Table synced successfully'
        });
      } catch (error) {
        console.error(`❌ Error syncing apartment ${apartmentNumber}:`, error.message);
        results.push({
          apartmentNumber,
          status: 'error',
          message: error.message
        });
      }
    }
    
    console.log("🎉 Rental table sync complete!");
    
    res.json({
      message: "Rental table sync completed",
      results
    });
    
  } catch (error) {
    console.error("❌ Error during rental table sync:", error);
    res.status(500).json({ error: "Failed to sync rental tables" });
  }
});

console.log("Here is WaterElectricBills", WaterElectricBills);

const checkrental = async (req, res, number) => {
  switch (number) {
    case "1":
      rentals = rentalsOne;
      break;
    case "2":
      rentals = rentalsTwo;
      break;
    case "3":
      rentals = rentalsThree;
      break;
    case "4":
      rentals = rentalsFour;
      break;
    case "5":
      rentals = rentalsFive;
      break;
    case "6":
      rentals = rentalsSix;
      break;
    case "7":
      rentals = rentalsSeven;
      break;
    case "8":
      rentals = rentalsEight;
      break;
    case "9":
      rentals = rentalsNine;
      break;
    case "10-11":
      rentals = rentalsTenEleven;
      break;
    case "pharmacy":
      if (!rentalsPharmacy) {
        return res.status(503).json({ 
          error: "Pharmacy table not yet created. Please wait for server initialization to complete." 
        });
      }
      rentals = rentalsPharmacy;
      break;
    case "electricity":
      rentals = WaterElectricBills;
      break;
    case "water":
      rentals = waterbills;
      break;
    default:
      res.json("Invalid number");
  }
  const post = req.body;

  const rental = await rentals.findOne({
    where: {
      Month: post.Month,
      Year: post.Year,
    },
  });

  if (rental) {
    console.log("Found this one");
    await rentals
      .update(post, {
        where: {
          Month: post.Month,
          Year: post.Year,
        },
      })
      .then((submittedRental) => res.json(submittedRental));
  } else {
    await rentals
      .create(post)
      .then((submittedRental) => res.json(submittedRental));
  }
};

//get all rentals
router.get("/all", async (req, res) => {
  try {
    const getCachedRentals = req.app.locals.getCachedRentals;
    
    console.log("🏢 Fetching all rental data...");
    
    // Use cached data if available
    const promises = [
      getCachedRentals ? getCachedRentals("1", rentalsOne) : rentalsOne.findAll(),
      getCachedRentals ? getCachedRentals("2", rentalsTwo) : rentalsTwo.findAll(),
      getCachedRentals ? getCachedRentals("3", rentalsThree) : rentalsThree.findAll(),
      getCachedRentals ? getCachedRentals("4", rentalsFour) : rentalsFour.findAll(),
      getCachedRentals ? getCachedRentals("5", rentalsFive) : rentalsFive.findAll(),
      getCachedRentals ? getCachedRentals("6", rentalsSix) : rentalsSix.findAll(),
      getCachedRentals ? getCachedRentals("7", rentalsSeven) : rentalsSeven.findAll(),
      getCachedRentals ? getCachedRentals("8", rentalsEight) : rentalsEight.findAll(),
      getCachedRentals ? getCachedRentals("9", rentalsNine) : rentalsNine.findAll(),
      getCachedRentals ? getCachedRentals("10", rentalsTenEleven) : rentalsTenEleven.findAll(),
    ];

    // Add pharmacy only if the model exists
    if (rentalsPharmacy) {
      promises.push(getCachedRentals ? getCachedRentals("pharmacy", rentalsPharmacy) : rentalsPharmacy.findAll());
    }

    const results = await Promise.all(promises);
    console.log(`✅ Retrieved data for ${promises.length} apartments`);

    // Flatten the results array
    const flattenedRentals = results.reduce((acc, rentals) => {
      if (rentals && rentals.length !== 0) {
        acc.push(...rentals);
      }
      return acc;
    }, []);

    res.json(flattenedRentals);
  } catch (error) {
    console.error("❌ Error in /all endpoint:", error.message);
    
    // Handle different types of database errors
    if (error.message.includes('max_questions')) {
      res.status(503).json({ 
        error: "Database query limit exceeded", 
        message: "Please wait for query limit to reset. Try refreshing in a few minutes.",
        data: []
      });
    } else if (error.message.includes('max_user_connections')) {
      res.status(503).json({ 
        error: "Database connection limit exceeded", 
        message: "Too many concurrent connections. Please try again in a moment.",
        data: []
      });
    } else {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

router.use(express.json());

// Middleware to check if the user is authenticated
/* router.use("/api/*", async (req, res, next) => {
  console.log("Readched the Middleware");
  if (!req.body.authenticated) {
    console.log("Checking whether authenticated or not");
    next(); // User is authenticated, continue to the requested API route
  } else {
    console.log("Not authenticated");
    next();
  }
}); */

// Example of an authenticated API route
router.post("/api/check-authentication", async (req, res) => {
  const { username, password } = req.body;
  console.log(
    "Entered this part with username and password: ",
    username,
    password
  );
  await accountsModel
    .findOne({
      where: {
        user: username,
      },
    })
    .then((account) => {
      console.log("account", account);
      if (account) {
        console.log("Found this one");
        if (account.password === password) {
          console.log("Password is correct");
          res.json({ authenticated: true });
        } else {
          console.log("Password is incorrect");
          res.json({ authenticated: false });
        }
      } else {
        console.log("Account not found");
        res.json({ authenticated: false });
      }
    });
});

// Get one rental entry by apartment number and ID
router.get("/:number/id/:id", async (req, res) => {
  const number = req.params.number;
  const id = req.params.id;
  
  try {
    let result;
    switch (number) {
      case "1":
        result = await rentalsOne.findOne({ where: { id: id } });
        break;
      case "2":
        result = await rentalsTwo.findOne({ where: { id: id } });
        break;
      case "3":
        result = await rentalsThree.findOne({ where: { id: id } });
        break;
      case "4":
        result = await rentalsFour.findOne({ where: { id: id } });
        break;
      case "5":
        result = await rentalsFive.findOne({ where: { id: id } });
        break;
      case "6":
        result = await rentalsSix.findOne({ where: { id: id } });
        break;
      case "7":
        result = await rentalsSeven.findOne({ where: { id: id } });
        break;
      case "8":
        result = await rentalsEight.findOne({ where: { id: id } });
        break;
      case "9":
        result = await rentalsNine.findOne({ where: { id: id } });
        break;
      case "10":
        result = await rentalsTenEleven.findOne({ where: { id: id } });
        break;
      case "pharmacy":
        result = await rentalsPharmacy.findOne({ where: { id: id } });
        break;
      default:
        return res.status(400).json({ error: "Invalid apartment number" });
    }

    if (result) {
      res.json(result);
    } else {
      res.status(404).json({ error: "Record not found" });
    }
  } catch (error) {
    console.error("Error fetching rental entry:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// get all rentals for a specific number and a specific month
router.get("/:number/:month", (req, res) => {
  const number = req.params.number;
  const month = req.params.month;
  switch (number) {
    case "1":
      rentalsOne
        .findAll({
          where: {
            Month: month,
          },
        })
        .then((rentals) => res.json(rentals));
      break;
    case "2":
      rentalsTwo
        .findAll({
          where: {
            Month: month,
          },
        })
        .then((rentals) => res.json(rentals));
      break;
    case "3":
      rentalsThree
        .findAll({
          where: {
            Month: month,
          },
        })
        .then((rentals) => res.json(rentals));
      break;
    case "4":
      rentalsFour
        .findAll({
          where: {
            Month: month,
          },
        })
        .then((rentals) => res.json(rentals));
      break;
    case "5":
      rentalsFive
        .findAll({
          where: {
            Month: month,
          },
        })
        .then((rentals) => res.json(rentals));
      break;
    case "6":
      rentalsSix
        .findAll({
          where: {
            Month: month,
          },
        })
        .then((rentals) => res.json(rentals));
      break;
    case "7":
      rentalsSeven
        .findAll({
          where: {
            Month: month,
          },
        })
        .then((rentals) => res.json(rentals));
      break;
    case "8":
      rentalsEight
        .findAll({
          where: {
            Month: month,
          },
        })
        .then((rentals) => res.json(rentals));
      break;
    case "9":
      rentalsNine
        .findAll({
          where: {
            Month: month,
          },
        })
        .then((rentals) => res.json(rentals));
      break;
    case "10-11":
      rentalsTenEleven
        .findAll({
          where: {
            Month: month,
          },
        })
        .then((rentals) => res.json(rentals));
      break;
    case "all":
      const promises = [
        rentalsOne.findAll({
          where: {
            Month: month,
          },
        }),
        rentalsTwo.findAll({
          where: {
            Month: month,
          },
        }),
        rentalsThree.findAll({
          where: {
            Month: month,
          },
        }),
        rentalsFour.findAll({
          where: {
            Month: month,
          },
        }),
        rentalsFive.findAll({
          where: {
            Month: month,
          },
        }),
        rentalsSix.findAll({
          where: {
            Month: month,
          },
        }),
        rentalsSeven.findAll({
          where: {
            Month: month,
          },
        }),
        rentalsEight.findAll({
          where: {
            Month: month,
          },
        }),
        rentalsNine.findAll({
          where: {
            Month: month,
          },
        }),
        rentalsTenEleven.findAll({
          where: {
            Month: month,
          },
        }),
      ];
      Promise.all(promises).then((rentals) => {
        res.json(rentals);
      });
      break;
    default:
      res.json("Invalid number");
  }
});

router.get("/:number", async (req, res) => {
  const number = req.params.number;
  
  // Access cache functions from app.locals
  const getCachedRentals = req.app.locals.getCachedRentals;
  const databaseStatus = req.app.locals.databaseStatus;
  
  // If database is disconnected due to query limits, try to serve from cache
  if (!databaseStatus.connected && databaseStatus.error && databaseStatus.error.includes('max_questions')) {
    console.log(`⚠️ Database limit exceeded, attempting to serve cached data for apartment ${number}`);
    // Note: We'll implement cache fallback logic here
  }
  
  try {
    let rentals;
    switch (number) {
      case "1":
        rentals = getCachedRentals ? await getCachedRentals("1", rentalsOne) : await rentalsOne.findAll();
        res.json(rentals);
        break;
      case "2":
        rentals = getCachedRentals ? await getCachedRentals("2", rentalsTwo) : await rentalsTwo.findAll();
        res.json(rentals);
        break;
      case "3":
        rentals = getCachedRentals ? await getCachedRentals("3", rentalsThree) : await rentalsThree.findAll();
        res.json(rentals);
        break;
      case "4":
        rentals = getCachedRentals ? await getCachedRentals("4", rentalsFour) : await rentalsFour.findAll();
        res.json(rentals);
        break;
      case "5":
        rentals = getCachedRentals ? await getCachedRentals("5", rentalsFive) : await rentalsFive.findAll();
        res.json(rentals);
        break;
      case "6":
        rentals = getCachedRentals ? await getCachedRentals("6", rentalsSix) : await rentalsSix.findAll();
        res.json(rentals);
        break;
      case "7":
        rentals = getCachedRentals ? await getCachedRentals("7", rentalsSeven) : await rentalsSeven.findAll();
        res.json(rentals);
        break;
      case "8":
        rentals = getCachedRentals ? await getCachedRentals("8", rentalsEight) : await rentalsEight.findAll();
        res.json(rentals);
        break;
      case "9":
        rentals = getCachedRentals ? await getCachedRentals("9", rentalsNine) : await rentalsNine.findAll();
        res.json(rentals);
        break;
      case "10-11":
        rentals = getCachedRentals ? await getCachedRentals("10", rentalsTenEleven) : await rentalsTenEleven.findAll();
        res.json(rentals);
        break;
      case "pharmacy":
        if (!rentalsPharmacy) {
          return res.status(503).json({ 
            error: "Pharmacy table not yet created. Please wait for server initialization to complete.",
            data: []
          });
        }
        rentals = getCachedRentals ? await getCachedRentals("pharmacy", rentalsPharmacy) : await rentalsPharmacy.findAll();
        res.json(rentals);
        break;
      case "electricity":
        console.log("Entered in electricity case");
        // Don't cache electricity bills for now as they're less frequently accessed
        const electricityBills = await WaterElectricBills.findAll();
        res.json(electricityBills);
        break;
      case "water":
        console.log("Entered in water case");
        // Don't cache water bills for now as they're less frequently accessed
        const waterBills = await waterbills.findAll();
        res.json(waterBills);
        break;
      default:
        res.json("Invalid number");
    }
  } catch (error) {
    console.error(`Error fetching data for apartment ${number}:`, error.message);
    
    // Handle different types of database errors
    if (error.message.includes('max_questions') && getCachedRentals) {
      console.log(`🚨 Query limit hit, serving stale cache for apartment ${number}`);
      res.status(503).json({ 
        error: "Database query limit exceeded", 
        message: "Please wait for query limit to reset",
        data: []
      });
    } else if (error.message.includes('max_user_connections')) {
      console.log(`🔌 Connection limit hit for apartment ${number}`);
      res.status(503).json({ 
        error: "Database connection limit exceeded", 
        message: "Too many concurrent connections. Please try again in a moment.",
        data: []
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

router.patch("/:id", async (req, res) => {
  console.log("here is the request ", req.body);
  console.log("Entered patch request!");
  const Month = req.body.Month;
  const Year = req.body.Year;
  const Costs = req.body.Costs;
  console.log("Costs: ", Costs);
  const electricity = Costs.electricity;
  const water = Costs.water;
  const reda = Costs.reda;
  const id = req.params.id;
  let rentals;
  let factor;
  switch (id) {
    case "1":
      rentals = rentalsOne;
      factor = 0.33;
      number = 5;
      break;
    case "2":
      rentals = rentalsTwo;
      factor = 0.33;
      number = 5;
      break;
    case "3":
      rentals = rentalsThree;
      factor = 0.33;
      number = 5;

      break;
    case "4":
      rentals = rentalsFour;
      factor = 0.33;
      number = 5;

      break;
    case "5":
      rentals = rentalsFive;
      factor = 0.33;
      number = 5;

      break;
    case "6":
      rentals = rentalsSix;
      factor = 0.66;
      number = 6;
      break;
    case "7":
      rentals = rentalsSeven;
      factor = 0.66;
      number = 6;

      break;
    case "8":
      rentals = rentalsEight;
      factor = 0.66;
      number = 6;

      break;
    case "9":
      rentals = rentalsNine;
      factor = 0.66;
      number = 6;

      break;
    case "10-11":
      rentals = rentalsTenEleven;
      factor = 0.66 * 2;
      number = 6;

      break;
  }
  const rental = await rentals.findOne({
    where: {
      Month: Month,
      Year: Year,
    },
  });
  if (!rental) {
    return res
      .status(404)
      .json({ error: "Rental entry with this Month and Year not found" });
  }
   if (rental) {
    await rental
      .update({ DoormanWaterAndElectricity: (factor * Number(electricity)/ number ) + (Number(reda)/11) , Water: Number(water)/11 })
      .then((response) => console.log(response));
  } 
});

/* router.get("/electricity", (req, res) => {
  electricbills
    .findAll()
    .then((electricitybills) => res.json(electricitybills));
});

router.get("/water", (req, res) => {
  waterbills.findAll().then((waterbills) => {
    res.json(waterbills);
    console.log(waterbills);
  });
}); */

router.get("/electricity/:name", (req, res) => {
  const name = req.params.name;
  WaterElectricBills.findAll().then((electricitybills) => {
    const filtered = electricitybills;
    res.json(filtered);
  });
});

router.post("/electricity/:name", async (req, res) => {
  console.log("Entered this post message 22");
  const {
    Month,
    Year,
    electricity,
    water,
    reda,
    electricity1_5,
    electricity6_11,
    water1_11,
    reda1_11,
    comments,
  } = req.body;

  console.log("Here is req.body:", req.body);
  try {
    //find entry with the same month and year
    const existing = await WaterElectricBills.findOne({
      where: {
        Month: Month,
        Year: Year,
      },
    });
    if(existing){
      existing.MotorsStairsElectricity = Number(electricity);
      existing.WaterBillBuilding = Number(water);
      existing.RedaRoomCost = Number(reda);
      existing.Total = Number(reda);
      existing.TotalNannaWay = Number(electricity)/11;
      existing.MotorsToAppartmentFive33 = 0.33*Number(electricity)/5;
      existing.AppartmentsFiveToEleven66 = 0.66*Number(electricity)/6;
      existing.TotalForAllToFive = (0.33 * Number(electricity)/5) + Number(reda)/11;
      existing.TotalForAllTo11 = (0.66 * Number(electricity)/6) + Number(reda)/11;
      existing.WaterBillDivided = Number(Number(water)/11);
      existing.TotalSplitAppartments = Number(Number(reda)/11);
      existing.comments = comments;

      await existing.save();
      return res.status(200).json({message: "Entry Updated" , entry: existing});
    }
    // If not found, create a new entry
    const newEntry = await WaterElectricBills.create({
      Month: Number(Month),
      Year: Number(Year),
      MotorsStairsElectricity: Number(electricity),
      WaterBillBuilding: Number(water),
      RedaRoomCost:Number(reda),
      Total: Number(reda),
      TotalNannaWay: (Number(electricity)/11) + Number(reda)/11,
      electricity1_5 : 0.33*Number(electricity)/5,
      electricity6_11 : 0.66*Number(electricity)/6,
      TotalForAllToFive : (0.33 * Number(electricity)/5) + Number(reda)/11,
      TotalForAllTo11 : (0.66 * Number(electricity)/6) + Number(reda)/11,
      WaterBillDivided : Number(Number(water)/11),
      TotalSplitAppartments : Number(Number(reda)/11),
      comments});

    await newEntry.save();
    res.status(201).json({ message: "Entry created", entry: newEntry });
  } catch (error) {
    console.error("Error saving entry:", error);
    res.status(500).json({ error: "Server error" });
  }

});


router.post("/:number(\\d+)", async (req, res) => {
  console.log("Entered this post message")
  const number = req.params.number;
  checkrental(req, res, number);
});

// POST route for pharmacy
router.post("/pharmacy", async (req, res) => {
  console.log("Entered pharmacy post route")
  checkrental(req, res, "pharmacy");
});

router.get("/", (req, res) => {
  rentalsOne.findAll().then((rentals) => res.json(rentals));
});

// POST one rental
router.post("/", async (req, res) => {
  console.log("Entered here 231")
  const post = req.body;
  await rentalsOne
    .create(post)
    .then((submittedRental) => res.json(submittedRental));
});

//Update one rental entry with specific number and id
router.put("/:number/:id", async (req, res) => {
  const number = req.params.number;
  const id = req.params.id;
  const updateData = req.body;
  
  console.log(`PUT request - Apartment: ${number}, ID: ${id}`);
  console.log("Update data:", updateData);
  
  // Invalidate cache at the start to ensure fresh data
  const invalidateCache = req.app.locals.invalidateCache;
  if (invalidateCache) {
    console.log(`🔄 Pre-invalidating cache for apartment ${number} before update`);
    invalidateCache(number);
  }
  
  try {
    let result;
    let existingRecord = null; // Track if record exists for all apartments
    
    switch (number) {
      case "1":
        console.log("Using rentalsOne model for apartment 1");
        
        // Check if the record exists first
        existingRecord = await rentalsOne.findOne({ where: { id: id } });
        console.log("Existing record found:", existingRecord ? "YES" : "NO");
        if (existingRecord) {
          console.log("Record details:", existingRecord.toJSON());
        }
        
        result = await rentalsOne.update(updateData, {
          where: { id: id },
          returning: true
        });
        console.log("Update result:", result);
        break;
      case "2":
        console.log("Using rentalsTwo model for apartment 2");
        
        existingRecord = await rentalsTwo.findOne({ where: { id: id } });
        console.log("Existing record found:", existingRecord ? "YES" : "NO");
        if (existingRecord) {
          console.log("Before update - Current paid status:", existingRecord.paid);
        }
        
        result = await rentalsTwo.update(updateData, {
          where: { id: id },
          returning: true
        });
        console.log("Raw update result:", JSON.stringify(result));
        
        // Verify the update actually happened
        const updatedRecord = await rentalsTwo.findOne({ where: { id: id } });
        if (updatedRecord) {
          console.log("After update - New paid status:", updatedRecord.paid);
          console.log("Update verification: Value changed from", existingRecord?.paid, "to", updatedRecord.paid);
        }
        break;
      case "3":
        console.log("Using rentalsThree model for apartment 3");
        
        existingRecord = await rentalsThree.findOne({ where: { id: id } });
        console.log("Existing record found:", existingRecord ? "YES" : "NO");
        
        result = await rentalsThree.update(updateData, {
          where: { id: id },
          returning: true
        });
        break;
      case "4":
        console.log("Using rentalsFour model for apartment 4");
        
        existingRecord = await rentalsFour.findOne({ where: { id: id } });
        console.log("Existing record found:", existingRecord ? "YES" : "NO");
        
        result = await rentalsFour.update(updateData, {
          where: { id: id },
          returning: true
        });
        break;
      case "5":
        console.log("Using rentalsFive model for apartment 5");
        
        // Track query usage
        const trackQuery = req.app.locals.trackQuery;
        if (trackQuery) trackQuery();
        
        // First, let's check if the record exists
        existingRecord = await rentalsFive.findOne({ where: { id: id } });
        console.log("Existing record found:", existingRecord ? "YES" : "NO");
        if (existingRecord) {
          console.log("Record details:", existingRecord.toJSON());
        }
        
        if (trackQuery) trackQuery(); // Track the update query too
        result = await rentalsFive.update(updateData, {
          where: { id: id },
          returning: true
        });
        console.log("Update result:", result);
        break;
      case "6":
        result = await rentalsSix.update(updateData, {
          where: { id: id },
          returning: true
        });
        break;
      case "7":
        result = await rentalsSeven.update(updateData, {
          where: { id: id },
          returning: true
        });
        break;
      case "8":
        result = await rentalsEight.update(updateData, {
          where: { id: id },
          returning: true
        });
        break;
      case "9":
        result = await rentalsNine.update(updateData, {
          where: { id: id },
          returning: true
        });
        break;
      case "10":
        result = await rentalsTenEleven.update(updateData, {
          where: { id: id },
          returning: true
        });
        break;
      case "pharmacy":
        if (!rentalsPharmacy) {
          return res.status(404).json({ error: "Pharmacy table not found" });
        }
        result = await rentalsPharmacy.update(updateData, {
          where: { id: id },
          returning: true
        });
        break;
      default:
        return res.status(400).json({ error: "Invalid apartment number" });
    }
    
    console.log("Final result for apartment", number, ":", result);
    
    // Get cache invalidation function
    const invalidateCache = req.app.locals.invalidateCache;
    
    // Use consistent logic for all apartments
    if (existingRecord) {
      // Record exists, so even if result[0] is 0 or undefined, it's a successful operation
      
      // Invalidate cache IMMEDIATELY after any successful operation
      if (invalidateCache) {
        console.log(`🔄 Invalidating cache for apartment ${number} after update`);
        invalidateCache(number);
        console.log(`✅ Cache invalidated for apartment ${number}`);
      } else {
        console.log(`❌ invalidateCache function not available`);
      }
      
      res.json({ 
        message: (result && result[0] > 0) ? "Entry updated successfully" : "Entry found but no changes needed", 
        updatedRows: result ? result[0] : 0,
        recordExists: true,
        cacheInvalidated: !!invalidateCache
      });
    } else {
      // Record doesn't exist
      res.status(404).json({ error: "Entry not found" });
    }
  } catch (error) {
    console.error("Error updating entry:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

//Delete one rental enty with specific number and id
router.delete("/:number/:id", async (req, res) => {
  const number = req.params.number;
  const id = req.params.id;
  switch (number) {
    case "1":
      await rentalsOne
        .destroy({
          where: {
            id: id,
          },
        })
        .then(() => res.json("Deleted"));
      break;
    case "2":
      await rentalsTwo
        .destroy({
          where: {
            id: id,
          },
        })
        .then(() => res.json("Deleted"));
      break;
    case "3":
      await rentalsThree
        .destroy({
          where: {
            id: id,
          },
        })
        .then(() => res.json("Deleted"));
      break;
    case "4":
      await rentalsFour
        .destroy({
          where: {
            id: id,
          },
        })
        .then(() => res.json("Deleted"));
      break;
    case "5":
      await rentalsFive
        .destroy({
          where: {
            id: id,
          },
        })
        .then(() => res.json("Deleted"));
      break;
    case "6":
      await rentalsSix
        .destroy({
          where: {
            id: id,
          },
        })
        .then(() => res.json("Deleted"));
      break;
    case "7":
      await rentalsSeven
        .destroy({
          where: {
            id: id,
          },
        })
        .then(() => res.json("Deleted"));
      break;
    case "8":
      await rentalsEight
        .destroy({
          where: {
            id: id,
          },
        })
        .then(() => res.json("Deleted"));
      break;
    case "9":
      await rentalsNine
        .destroy({
          where: {
            id: id,
          },
        })
        .then(() => res.json("Deleted"));
      break;
    case "10-11":
      await rentalsTenEleven
        .destroy({
          where: {
            id: id,
          },
        })
        .then(() => res.json("Deleted"));
      break;
    case "pharmacy":
      if (!rentalsPharmacy) {
        return res.status(503).json({ 
          error: "Pharmacy table not yet created. Cannot delete entries." 
        });
      }
      await rentalsPharmacy
        .destroy({
          where: {
            id: id,
          },
        })
        .then(() => res.json("Deleted"));
      break;
    case "electricity":
      await WaterElectricBills
        .destroy({
          where: {
            id: id,
          },
        })
        .then(() => res.json("Deleted"));
      break;
    default:
      res.json("Invalid number");
  }
});

// One-time migration: Update all rental entries with N/A tenants to use base values
router.post("/migrate-tenant-data", async (req, res) => {
  try {
    console.log("🔄 Starting tenant data migration...");
    
    // Get all base values with tenant information
    const baseValues = await ApartmentBaseValues.findAll();
    console.log(`📊 Found ${baseValues.length} base value entries`);
    
    const apartmentModels = {
      "1": rentalsOne,
      "2": rentalsTwo,
      "3": rentalsThree,
      "4": rentalsFour,
      "5": rentalsFive,
      "6": rentalsSix,
      "7": rentalsSeven,
      "8": rentalsEight,
      "9": rentalsNine,
      "10-11": rentalsTenEleven
    };
    
    let totalUpdated = 0;
    const results = [];
    
    for (const baseValue of baseValues) {
      const apartmentNumber = baseValue.apartmentNumber;
      const newTenant = baseValue.tenant || "";
      
      // Skip if no base tenant is set
      if (!newTenant.trim()) {
        console.log(`⏭️  Skipping apartment ${apartmentNumber} - no base tenant set`);
        continue;
      }
      
      const model = apartmentModels[apartmentNumber];
      if (!model) {
        console.log(`❌ No model found for apartment ${apartmentNumber}`);
        continue;
      }
      
      // First, let's check what tenant values exist
      const allEntries = await model.findAll({
        attributes: ['tenant'],
        group: ['tenant']
      });
      console.log(`🔍 Apartment ${apartmentNumber} existing tenant values:`, allEntries.map(e => `"${e.tenant}"`));
      
      // Update all entries where tenant is "No tenant", "N/A", empty, or null
      const [updatedCount] = await model.update(
        { tenant: newTenant },
        {
          where: {
            [db.Sequelize.Op.or]: [
              { tenant: "No tenant" },
              { tenant: "N/A" },
              { tenant: "" },
              { tenant: null }
            ]
          }
        }
      );
      
      console.log(`✅ Apartment ${apartmentNumber}: Updated ${updatedCount} entries with tenant "${newTenant}"`);
      totalUpdated += updatedCount;
      
      results.push({
        apartmentNumber,
        newTenant,
        updatedCount,
        existingValues: allEntries.map(e => e.tenant)
      });
    }
    
    console.log(`🎉 Migration complete! Total entries updated: ${totalUpdated}`);
    
    res.json({
      message: "Tenant data migration completed successfully",
      totalUpdated,
      results
    });
    
  } catch (error) {
    console.error("❌ Error during tenant migration:", error);
    res.status(500).json({ error: "Failed to migrate tenant data" });
  }
});

// Manual cache clearing endpoint for debugging
router.delete("/cache/:number", (req, res) => {
  const number = req.params.number;
  const invalidateCache = req.app.locals.invalidateCache;
  
  if (invalidateCache) {
    invalidateCache(number);
    res.json({ 
      message: `Cache cleared for apartment ${number}`,
      apartment: number,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(500).json({ error: "Cache invalidation function not available" });
  }
});

// Clear all cache endpoint
router.delete("/cache", (req, res) => {
  const invalidateCache = req.app.locals.invalidateCache;
  
  if (invalidateCache) {
    // Clear cache for all apartments
    const apartments = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "pharmacy"];
    apartments.forEach(apt => invalidateCache(apt));
    
    res.json({ 
      message: "All cache cleared",
      apartments: apartments,
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(500).json({ error: "Cache invalidation function not available" });
  }
});

module.exports = router;

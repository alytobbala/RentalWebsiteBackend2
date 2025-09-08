const express = require("express");
const router = express.Router();
const { GarageCars, ApartmentBaseValues, GarageBills } = require("../models");

// Get all garage cars
router.get("/", async (req, res) => {
  try {
    console.log("📋 Fetching all garage cars...");
    const cars = await GarageCars.findAll({
      order: [['dateAdded', 'DESC']]
    });
    console.log(`✅ Found ${cars.length} garage cars`);
    res.json(cars);
  } catch (error) {
    console.error("❌ Error fetching garage cars:", error);
    res.status(500).json({ error: "Failed to fetch garage cars" });
  }
});

// Get default car price and garage keeper fees from base values
router.get("/default-price", async (req, res) => {
  try {
    const baseValues = await ApartmentBaseValues.findOne({
      where: { apartmentNumber: "1" } // Get from any apartment as they should all have the same default
    });
    
    const defaultPrice = baseValues?.baseCarPrice || 200;
    const garageKeeperFees = baseValues?.garageKeeperFees || 50;
    console.log("📋 Returning default values:", { defaultPrice, garageKeeperFees });
    res.json({ defaultPrice, garageKeeperFees });
  } catch (error) {
    console.error("❌ Error fetching default values:", error);
    res.status(500).json({ error: "Failed to fetch default values" });
  }
});

// Create a new garage car
router.post("/", async (req, res) => {
  try {
    const { ownerName, price, notes } = req.body;
    
    if (!ownerName) {
      return res.status(400).json({ error: "Owner name is required" });
    }
    
    if (!price || price <= 0) {
      return res.status(400).json({ error: "Valid price is required" });
    }
    
    const car = await GarageCars.create({
      ownerName: ownerName.trim(),
      price: parseFloat(price),
      notes: notes?.trim() || "",
      updatedBy: "admin" // You might want to get this from user context
    });
    
    res.status(201).json(car);
  } catch (error) {
    console.error("Error creating garage car:", error);
    res.status(500).json({ error: "Failed to create garage car" });
  }
});

// Update an existing garage car
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { ownerName, price, notes } = req.body;
    
    if (!ownerName) {
      return res.status(400).json({ error: "Owner name is required" });
    }
    
    if (!price || price <= 0) {
      return res.status(400).json({ error: "Valid price is required" });
    }
    
    const car = await GarageCars.findByPk(id);
    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }
    
    await car.update({
      ownerName: ownerName.trim(),
      price: parseFloat(price),
      notes: notes?.trim() || "",
      lastUpdated: new Date(),
      updatedBy: "admin"
    });
    
    res.json(car);
  } catch (error) {
    console.error("Error updating garage car:", error);
    res.status(500).json({ error: "Failed to update garage car" });
  }
});

// Delete a garage car
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const car = await GarageCars.findByPk(id);
    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }
    
    await car.destroy();
    res.json({ message: "Car deleted successfully" });
  } catch (error) {
    console.error("Error deleting garage car:", error);
    res.status(500).json({ error: "Failed to delete garage car" });
  }
});

// Get garage statistics
router.get("/stats", async (req, res) => {
  try {
    const cars = await GarageCars.findAll();
    const totalCars = cars.length;
    const totalIncome = cars.reduce((sum, car) => sum + parseFloat(car.price), 0);
    
    res.json({
      totalCars,
      totalIncome,
      cars: cars.length
    });
  } catch (error) {
    console.error("Error fetching garage stats:", error);
    res.status(500).json({ error: "Failed to fetch garage statistics" });
  }
});

// ========== GARAGE BILLS ROUTES ==========

// Get all garage bills
router.get("/bills", async (req, res) => {
  try {
    console.log("📋 Fetching all garage bills...");
    const bills = await GarageBills.findAll({
      order: [['year', 'DESC'], ['month', 'DESC']]
    });
    console.log(`✅ Found ${bills.length} garage bills`);
    res.json(bills);
  } catch (error) {
    console.error("❌ Error fetching garage bills:", error);
    res.status(500).json({ error: "Failed to fetch garage bills" });
  }
});

// Create a new garage bill
router.post("/bills", async (req, res) => {
  try {
    const { month, year, electricityBill, notes } = req.body;
    
    if (!month || month < 1 || month > 12) {
      return res.status(400).json({ error: "Valid month (1-12) is required" });
    }
    
    if (!year || year < 2020 || year > 2030) {
      return res.status(400).json({ error: "Valid year (2020-2030) is required" });
    }
    
    if (electricityBill === undefined || electricityBill < 0) {
      return res.status(400).json({ error: "Valid electricity bill amount is required" });
    }
    
    // Check if bill for this month/year already exists
    const existingBill = await GarageBills.findOne({
      where: { month, year }
    });
    
    if (existingBill) {
      return res.status(409).json({ error: "Bill for this month and year already exists" });
    }
    
    const bill = await GarageBills.create({
      month: parseInt(month),
      year: parseInt(year),
      electricityBill: parseFloat(electricityBill),
      notes: notes?.trim() || "",
      updatedBy: "admin"
    });
    
    console.log("✅ Created garage bill:", bill.toJSON());
    res.status(201).json(bill);
  } catch (error) {
    console.error("❌ Error creating garage bill:", error);
    res.status(500).json({ error: "Failed to create garage bill" });
  }
});

// Update an existing garage bill
router.put("/bills/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year, electricityBill, notes } = req.body;
    
    if (!month || month < 1 || month > 12) {
      return res.status(400).json({ error: "Valid month (1-12) is required" });
    }
    
    if (!year || year < 2020 || year > 2030) {
      return res.status(400).json({ error: "Valid year (2020-2030) is required" });
    }
    
    if (electricityBill === undefined || electricityBill < 0) {
      return res.status(400).json({ error: "Valid electricity bill amount is required" });
    }
    
    const bill = await GarageBills.findByPk(id);
    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }
    
    // Check if another bill for this month/year already exists (excluding current bill)
    const existingBill = await GarageBills.findOne({
      where: { 
        month: parseInt(month), 
        year: parseInt(year),
        id: { [require('sequelize').Op.ne]: id }
      }
    });
    
    if (existingBill) {
      return res.status(409).json({ error: "Another bill for this month and year already exists" });
    }
    
    await bill.update({
      month: parseInt(month),
      year: parseInt(year),
      electricityBill: parseFloat(electricityBill),
      notes: notes?.trim() || "",
      lastUpdated: new Date(),
      updatedBy: "admin"
    });
    
    console.log("✅ Updated garage bill:", bill.toJSON());
    res.json(bill);
  } catch (error) {
    console.error("❌ Error updating garage bill:", error);
    res.status(500).json({ error: "Failed to update garage bill" });
  }
});

// Delete a garage bill
router.delete("/bills/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    const bill = await GarageBills.findByPk(id);
    if (!bill) {
      return res.status(404).json({ error: "Bill not found" });
    }
    
    await bill.destroy();
    console.log("✅ Deleted garage bill ID:", id);
    res.json({ message: "Bill deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting garage bill:", error);
    res.status(500).json({ error: "Failed to delete garage bill" });
  }
});

// Get garage bills statistics
router.get("/bills/stats", async (req, res) => {
  try {
    const bills = await GarageBills.findAll();
    const totalBills = bills.length;
    const totalExpenses = bills.reduce((sum, bill) => sum + parseFloat(bill.electricityBill), 0);
    const averageMonthlyExpense = totalBills > 0 ? totalExpenses / totalBills : 0;
    
    res.json({
      totalBills,
      totalExpenses,
      averageMonthlyExpense
    });
  } catch (error) {
    console.error("❌ Error fetching garage bills stats:", error);
    res.status(500).json({ error: "Failed to fetch garage bills statistics" });
  }
});

module.exports = router;

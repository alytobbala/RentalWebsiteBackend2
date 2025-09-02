const express = require("express");
const router = express.Router();
const { GarageCars, ApartmentBaseValues } = require("../models");

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

module.exports = router;

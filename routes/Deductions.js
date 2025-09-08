const express = require("express");
const router = express.Router();
const { Deductions } = require("../models");

// Get all deductions
router.get("/", async (req, res) => {
  try {
    console.log("📋 Fetching all deductions...");
    const deductions = await Deductions.findAll({
      order: [['type', 'ASC']]
    });
    console.log(`✅ Found ${deductions.length} deductions`);
    res.json(deductions);
  } catch (error) {
    console.error("❌ Error fetching deductions:", error);
    res.status(500).json({ error: "Failed to fetch deductions" });
  }
});

// Get a specific deduction by type
router.get("/:type", async (req, res) => {
  try {
    const { type } = req.params;
    console.log(`📋 Fetching deduction type: ${type}`);
    
    const deduction = await Deductions.findOne({
      where: { type: type }
    });
    
    if (!deduction) {
      return res.status(404).json({ error: "Deduction type not found" });
    }
    
    console.log(`✅ Found deduction: ${type} = ${deduction.amount}`);
    res.json(deduction);
  } catch (error) {
    console.error("❌ Error fetching deduction:", error);
    res.status(500).json({ error: "Failed to fetch deduction" });
  }
});

// Create or update a deduction
router.put("/:type", async (req, res) => {
  try {
    const { type } = req.params;
    const { amount, description } = req.body;
    
    if (!amount || amount < 0) {
      return res.status(400).json({ error: "Valid amount is required" });
    }
    
    console.log(`💾 Updating deduction ${type} to ${amount}`);
    
    const [deduction, created] = await Deductions.upsert({
      type: type,
      amount: parseFloat(amount),
      description: description || "",
      lastUpdated: new Date(),
      updatedBy: "admin"
    });
    
    if (created) {
      console.log(`✅ Created new deduction: ${type}`);
    } else {
      console.log(`✅ Updated existing deduction: ${type}`);
    }
    
    res.json({
      message: created ? "Deduction created successfully" : "Deduction updated successfully",
      deduction: deduction
    });
  } catch (error) {
    console.error("❌ Error saving deduction:", error);
    res.status(500).json({ error: "Failed to save deduction" });
  }
});

// Delete a deduction
router.delete("/:type", async (req, res) => {
  try {
    const { type } = req.params;
    
    const deduction = await Deductions.findOne({
      where: { type: type }
    });
    
    if (!deduction) {
      return res.status(404).json({ error: "Deduction not found" });
    }
    
    await deduction.destroy();
    console.log("✅ Deleted deduction:", type);
    res.json({ message: "Deduction deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting deduction:", error);
    res.status(500).json({ error: "Failed to delete deduction" });
  }
});

module.exports = router;
router.get("/settings/garage-water", async (req, res) => {
  try {
    console.log("🔧 Fetching garage water settings...");
    const garageWaterSetting = await Deductions.findOne({
      where: { type: "garage_water_apartment_equivalent" }
    });
    
    // Return default value if no setting exists
    const apartmentEquivalent = garageWaterSetting ? parseFloat(garageWaterSetting.amount) : 2.0;
    
    console.log(`✅ Garage water apartment equivalent: ${apartmentEquivalent}`);
    res.json({
      apartmentEquivalent,
      description: garageWaterSetting?.description || "Default garage water equivalent to 2 apartments"
    });
  } catch (error) {
    console.error("❌ Error fetching garage water settings:", error);
    res.status(500).json({ error: "Failed to fetch garage water settings" });
  }
});

// Update garage water settings
router.put("/settings/garage-water", async (req, res) => {
  console.log("🚀 garage-water-settings endpoint hit!");
  console.log("🚀 Request method:", req.method);
  console.log("🚀 Request URL:", req.url);
  console.log("🚀 Request headers:", JSON.stringify(req.headers, null, 2));
  console.log("🚀 Raw request body:", req.body);
  console.log("🚀 Body type:", typeof req.body);
  console.log("🚀 Body constructor:", req.body?.constructor?.name);
  
  try {
    console.log("🔧 Received garage water settings request:", req.body);
    const { apartmentEquivalent } = req.body;
    
    console.log(`🔍 apartmentEquivalent value: ${apartmentEquivalent} (type: ${typeof apartmentEquivalent})`);
    
    // Convert to number and validate
    const numValue = Number(apartmentEquivalent);
    console.log(`🔍 Converted to number: ${numValue} (isNaN: ${isNaN(numValue)})`);
    
    if (isNaN(numValue) || numValue <= 0) {
      console.log("❌ Validation failed: apartmentEquivalent must be a number greater than 0");
      return res.status(400).json({ 
        error: "Apartment equivalent must be a number greater than 0",
        received: apartmentEquivalent,
        converted: numValue
      });
    }
    
    console.log(`🔧 Updating garage water setting to ${numValue} apartment equivalent`);
    
    // Try to find existing record first
    console.log(`� Looking for existing garage water setting...`);
    let garageWaterSetting = await Deductions.findOne({
      where: { type: "garage_water_apartment_equivalent" }
    });
    
    if (garageWaterSetting) {
      console.log(`📝 Found existing record, updating...`);
      // Update existing record
      garageWaterSetting.amount = numValue;
      garageWaterSetting.description = `Garage water equivalent to ${numValue} apartments`;
      garageWaterSetting.lastUpdated = new Date();
      garageWaterSetting.updatedBy = "admin";
      await garageWaterSetting.save();
      console.log(`✅ Updated existing garage water setting to ${numValue} apartment equivalent`);
    } else {
      console.log(`➕ No existing record found, creating new one...`);
      // Create new record
      garageWaterSetting = await Deductions.create({
        type: "garage_water_apartment_equivalent",
        amount: numValue,
        description: `Garage water equivalent to ${numValue} apartments`,
        lastUpdated: new Date(),
        updatedBy: "admin"
      });
      console.log(`✅ Created new garage water setting with ${numValue} apartment equivalent`);
    }
    
    res.json(garageWaterSetting);
  } catch (error) {
    console.error("❌ Error updating garage water settings:", error);
    console.error("❌ Error details:", error.message);
    console.error("❌ Error stack:", error.stack);
    
    // Check if it's a validation error vs database error
    if (error.name === 'SequelizeValidationError') {
      res.status(400).json({ 
        error: "Validation error", 
        details: error.errors?.map(e => e.message) || error.message
      });
    } else {
      res.status(500).json({ 
        error: "Failed to update garage water settings",
        details: error.message
      });
    }
  }
});

module.exports = router;

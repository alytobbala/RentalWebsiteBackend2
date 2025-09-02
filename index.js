const express = require("express");
const app = express();
const cors = require("cors");
const db = require("./models");
const router = express.Router();

// Add JSON parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = ['https://tobbala.netlify.app', 'http://localhost:3000', 'http://localhost:5173'];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

// Apply globally
app.use(cors(corsOptions));

// Also apply to preflight OPTIONS
app.options('*', cors(corsOptions));

// Global flag to track database status
let databaseStatus = {
  connected: false,
  error: null,
  lastCheck: null,
  queryLimitResetTime: null // Track when the MySQL hour resets
};

// Query monitoring
let queryStats = {
  count: 0,
  resetTime: new Date(),
  maxQueries: 3600 // MySQL default max_questions per hour
};

// Connection monitoring
let connectionStats = {
  active: 0,
  maxConnections: 10, // MySQL max_user_connections limit
  errors: 0
};

// Function to track queries
function trackQuery() {
  queryStats.count++;
  console.log(`📊 Query count: ${queryStats.count}/${queryStats.maxQueries}`);
  
  // Warn when approaching limit
  if (queryStats.count > queryStats.maxQueries * 0.8) {
    console.log(`⚠️  Warning: Approaching query limit (${queryStats.count}/${queryStats.maxQueries})`);
  }
}

// Cache for frequently accessed data
let dataCache = {
  rentals: new Map(), // Cache rental data by apartment number
  lastFetch: new Map(), // Track when each apartment was last fetched
  cacheDuration: 5 * 60 * 1000 // 5 minutes cache duration
};

// Function to check if cached data is still valid
function isCacheValid(apartmentNumber) {
  const lastFetch = dataCache.lastFetch.get(apartmentNumber);
  return lastFetch && (Date.now() - lastFetch < dataCache.cacheDuration);
}

// Function to get cached data or fetch from database
async function getCachedRentals(apartmentNumber, model) {
  if (isCacheValid(apartmentNumber)) {
    console.log(`🎯 Using cached data for apartment ${apartmentNumber}`);
    return dataCache.rentals.get(apartmentNumber);
  }
  
  console.log(`🔄 Fetching fresh data for apartment ${apartmentNumber}`);
  try {
    trackQuery(); // Track this database query
    const data = await model.findAll();
    dataCache.rentals.set(apartmentNumber, data);
    dataCache.lastFetch.set(apartmentNumber, Date.now());
    return data;
  } catch (error) {
    console.log(`❌ Failed to fetch data for apartment ${apartmentNumber}:`, error.message);
    // Return cached data if available, even if expired
    return dataCache.rentals.get(apartmentNumber) || [];
  }
}

// Function to invalidate cache for an apartment (call after updates)
function invalidateCache(apartmentNumber) {
  dataCache.rentals.delete(apartmentNumber);
  dataCache.lastFetch.delete(apartmentNumber);
  console.log(`🗑️ Cache invalidated for apartment ${apartmentNumber}`);
}

// Function to calculate MySQL query limit reset time
function calculateQueryLimitResetTime() {
  // MySQL resets query limits at the top of each hour
  // If we hit the limit, the reset will be at the next hour boundary
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setHours(now.getHours() + 1, 0, 0, 0); // Next hour, 0 minutes, 0 seconds, 0 ms
  return nextHour;
}

// Simple health check endpoint (no database queries)
app.get("/health", (req, res) => {
  res.json({ 
    status: "online", 
    database: databaseStatus.connected ? "connected" : "disconnected",
    databaseError: databaseStatus.error,
    queryLimitResetTime: databaseStatus.queryLimitResetTime,
    queryStats: {
      current: queryStats.count,
      max: queryStats.maxQueries,
      percentage: Math.round((queryStats.count / queryStats.maxQueries) * 100)
    },
    connectionStats: {
      maxConnections: connectionStats.maxConnections,
      errors: connectionStats.errors,
      poolSettings: {
        max: 1,
        min: 0,
        idle: 5000
      }
    },
    timestamp: new Date().toISOString() 
  });
});

// Separate database status check endpoint
app.get("/db-status", async (req, res) => {
  try {
    await db.sequelize.authenticate();
    databaseStatus = {
      connected: true,
      error: null,
      lastCheck: new Date()
    };
    res.json({ 
      status: "connected", 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    connectionStats.errors++;
    databaseStatus = {
      connected: false,
      error: error.message,
      lastCheck: new Date(),
      queryLimitResetTime: error.message.includes('max_questions') ? calculateQueryLimitResetTime() : null
    };
    res.status(503).json({ 
      status: "disconnected",
      error: error.message,
      queryLimitResetTime: databaseStatus.queryLimitResetTime,
      timestamp: new Date().toISOString() 
    });
  }
});

// Connection cleanup endpoint
app.post("/cleanup-connections", async (req, res) => {
  try {
    console.log("🧹 Cleaning up database connections...");
    
    // Close all connections in the pool
    await db.sequelize.connectionManager.close();
    
    // Reinitialize the connection manager
    db.sequelize.connectionManager.init();
    
    console.log("✅ Database connections cleaned up");
    res.json({ 
      message: "Database connections cleaned up successfully",
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error("❌ Error cleaning up connections:", error.message);
    res.status(500).json({ 
      error: "Failed to cleanup connections",
      details: error.message,
      timestamp: new Date().toISOString() 
    });
  }
});

const rentalsRouter = require("./routes/Rentals");
app.use("/rentals", rentalsRouter);

const depositsRouter = require("./routes/Deposits");
app.use("/deposits", depositsRouter);

const garageRouter = require("./routes/Garage");
app.use("/garage", garageRouter);

// Export cache functions for use in routes
app.locals.getCachedRentals = getCachedRentals;
app.locals.invalidateCache = invalidateCache;
app.locals.databaseStatus = databaseStatus;
app.locals.trackQuery = trackQuery;

// Optimized database connection with conditional sync
async function initializeDatabase() {
  try {
    // Test connection first without sync
    await db.sequelize.authenticate();
    console.log("✅ Database connection verified");
    
    // Only sync if needed (development mode or first run)
    const shouldSync = process.env.NODE_ENV === 'development' || process.env.FORCE_SYNC === 'true';
    
    if (shouldSync) {
      console.log("🔄 Syncing database models...");
      await db.sequelize.sync();
      console.log("✅ Database synced successfully");
    } else {
      console.log("⚡ Skipping database sync for better performance");
    }
    
    databaseStatus = {
      connected: true,
      error: null,
      lastCheck: new Date()
    };
    
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
    
  } catch (error) {
    console.error("Database connection failed:", error.message);
    databaseStatus = {
      connected: false,
      error: error.message,
      lastCheck: new Date(),
      queryLimitResetTime: error.message.includes('max_questions') ? calculateQueryLimitResetTime() : null
    };
    
    if (error.message.includes('max_questions')) {
      console.log("⏰ Database query limit reached. Please wait for the hourly limit to reset.");
      console.log(`🔄 Limit will reset at: ${databaseStatus.queryLimitResetTime.toLocaleTimeString()}`);
      console.log("🔄 Server will start without database sync for now...");
    } else if (error.message.includes('max_user_connections')) {
      console.log("🔌 Database connection limit reached. Too many concurrent connections.");
      console.log("🔄 Optimizing connection pool settings...");
      console.log("💡 Consider reducing concurrent requests or increasing connection limits.");
    } else {
      console.log("❌ Database connection failed:", error.message);
    }
    
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      if (error.message.includes('max_questions')) {
        console.log(`Server running on port ${PORT} (limited database access)`);
      } else if (error.message.includes('max_user_connections')) {
        console.log(`Server running on port ${PORT} (connection limit reached)`);
      } else {
        console.log(`Server running on port ${PORT} (database disconnected)`);
      }
    });
  }
}

// Start the server
initializeDatabase();

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  try {
    await db.sequelize.close();
    console.log('✅ Database connections closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
  try {
    await db.sequelize.close();
    console.log('✅ Database connections closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error.message);
    process.exit(1);
  }
});

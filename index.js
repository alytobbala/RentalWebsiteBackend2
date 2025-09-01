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


const rentalsRouter = require("./routes/Rentals");
app.use("/rentals", rentalsRouter);

// Add error handling for database connection issues
db.sequelize.sync().then(() => {
  console.log("synced (normal mode)");
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((error) => {
  console.error("Database connection failed:", error.message);
  if (error.message.includes('max_questions')) {
    console.log("⏰ Database query limit reached. Please wait for the hourly limit to reset.");
    console.log("🔄 Server will start without database sync for now...");
    
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (limited database access)`);
    });
  } else {
    process.exit(1);
  }
});

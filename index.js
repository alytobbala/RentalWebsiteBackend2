const express = require("express");
const app = express();
const cors = require("cors");
const db = require("./models");
const router = express.Router();


const allowedOrigins = ['https://tobbala.netlify.app', 'http://localhost:3000'];

app.use(express.json());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.options('*', cors());

const rentalsRouter = require("./routes/Rentals");
app.use("/rentals", rentalsRouter);

db.sequelize.sync().then(() => {
  console.log("synced");
  app.listen(3001, () => {
    console.log("server running on port 3001");
  });
});

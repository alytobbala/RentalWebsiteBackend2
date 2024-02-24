const express = require("express");
const app = express();
const cors = require("cors");
const db = require("./models");
const router = express.Router();

app.use(express.json());
app.use(cors());

const rentalsRouter = require("./routes/Rentals");
app.use("/rentals", rentalsRouter);

db.sequelize.sync().then(() => {
  console.log("synced");
  app.listen(3001, () => {
    console.log("server running on port 3001");
  });
});

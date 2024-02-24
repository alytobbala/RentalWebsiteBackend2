const express = require("express");
const { sequelize } = require("../models");
const router = express.Router();
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
const accounts = require("../models/accounts");

const rentalsOne = rentalsOneModel(sequelize, DataTypes);
const rentalsTwo = rentalsTwoModel(sequelize, DataTypes);
const rentalsThree = rentalsThreeModel(sequelize, DataTypes);
const rentalsFour = rentalsFourModel(sequelize, DataTypes);
const rentalsFive = rentalsFiveModel(sequelize, DataTypes);
const rentalsSix = rentalsSixModel(sequelize, DataTypes);
const rentalsSeven = rentalsSevenModel(sequelize, DataTypes);
const rentalsEight = rentalsEightModel(sequelize, DataTypes);
const rentalsNine = rentalsNineModel(sequelize, DataTypes);
const rentalsTenEleven = rentalsTenElevenModel(sequelize, DataTypes);
const accountsModel = accounts(sequelize, DataTypes);

var allRentals = [];

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
    const promises = [
      rentalsOne.findAll(),
      rentalsTwo.findAll(),
      rentalsThree.findAll(),
      rentalsFour.findAll(),
      rentalsFive.findAll(),
      rentalsSix.findAll(),
      rentalsSeven.findAll(),
      rentalsEight.findAll(),
      rentalsNine.findAll(),
      rentalsTenEleven.findAll(),
    ];

    const results = await Promise.all(promises);

    // Flatten the results array
    const flattenedRentals = results.reduce((acc, rentals) => {
      if (rentals.length !== 0) {
        acc.push(...rentals);
      }
      return acc;
    }, []);

    res.json(flattenedRentals);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    // Clear the array after sending the response
    allRentals = [];
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
    default:
      res.json("Invalid number");
  }
});

router.get("/:number", (req, res) => {
  const number = req.params.number;
  switch (number) {
    case "1":
      rentalsOne.findAll().then((rentals) => res.json(rentals));
      break;
    case "2":
      rentalsTwo.findAll().then((rentals) => res.json(rentals));
      break;
    case "3":
      rentalsThree.findAll().then((rentals) => res.json(rentals));
      break;
    case "4":
      rentalsFour.findAll().then((rentals) => res.json(rentals));
      break;
    case "5":
      rentalsFive.findAll().then((rentals) => res.json(rentals));
      break;
    case "6":
      rentalsSix.findAll().then((rentals) => res.json(rentals));
      break;
    case "7":
      rentalsSeven.findAll().then((rentals) => res.json(rentals));
      break;
    case "8":
      rentalsEight.findAll().then((rentals) => res.json(rentals));
      break;
    case "9":
      rentalsNine.findAll().then((rentals) => res.json(rentals));
      break;
    case "10-11":
      rentalsTenEleven.findAll().then((rentals) => res.json(rentals));
      break;
    default:
      res.json("Invalid number");
  }
});

router.post("/:number", async (req, res) => {
  const number = req.params.number;
  checkrental(req, res, number);
});

router.get("/", (req, res) => {
  rentalsOne.findAll().then((rentals) => res.json(rentals));
});

// POST one rental
router.post("/", async (req, res) => {
  const post = req.body;
  await rentalsOne
    .create(post)
    .then((submittedRental) => res.json(submittedRental));
});

module.exports = router;

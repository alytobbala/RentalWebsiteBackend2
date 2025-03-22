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
const WaterElectricBills = db.ElectricityWater;
const accountsModel = accounts(sequelize, DataTypes);
const waterbills = waterBillsModel(sequelize, DataTypes);
const electricBills = electricBillsModel(sequelize, DataTypes);

var allRentals = [];

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
    case "electricity":
      console.log("Entered in electricity case");
      WaterElectricBills
        .findAll()
        .then((electricitybills) => res.json(electricitybills));
      break;
    case "water":
      console.log("Entered in water case");
      waterbills.findAll().then((waterbills) => {
        res.json(waterbills);
        console.log(waterbills);
      });
      break;

    default:
      res.json("Invalid number");
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

module.exports = router;

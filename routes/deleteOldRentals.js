const express = require('express');
const router = express.Router();
const db = require('../models');

// List of all rental models
const rentalModels = [
  'rentalsOne',
  'rentalsTwo',
  'rentalsThree',
  'rentalsFour',
  'rentalsFive',
  'rentalsSix',
  'rentalsSeven',
  'rentalsEight',
  'rentalsNine',
  'rentalsTenEleven',
  'rentalsPharmacy',
];

router.delete('/delete-2025-2026', async (req, res) => {
  try {
    for (const modelName of rentalModels) {
      const model = db[modelName];
      if (model) {
        await model.destroy({
          where: {
            Year: [2025, 2026],
          },
        });
      }
    }
    res.json({ message: 'Deleted all rental entries for 2025 and 2026.' });
  } catch (error) {
    console.error('Error deleting rental entries:', error);
    res.status(500).json({ error: 'Failed to delete rental entries.' });
  }
});

module.exports = router;

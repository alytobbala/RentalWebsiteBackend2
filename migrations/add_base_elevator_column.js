// Migration to add baseElevator column to ApartmentBaseValues table
const { QueryInterface, DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Add baseElevator column
      await queryInterface.addColumn('ApartmentBaseValues', 'baseElevator', {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0,
      });
      
      console.log('Successfully added baseElevator column to ApartmentBaseValues table');
    } catch (error) {
      console.error('Error adding baseElevator column:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove baseElevator column
      await queryInterface.removeColumn('ApartmentBaseValues', 'baseElevator');
      
      console.log('Successfully removed baseElevator column from ApartmentBaseValues table');
    } catch (error) {
      console.error('Error removing baseElevator column:', error);
      throw error;
    }
  }
};

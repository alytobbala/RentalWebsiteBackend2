const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Deposits = sequelize.define('Deposits', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    apartmentNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    dateDeposited: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    remainingBalance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'deposits',
    timestamps: true,
  });

  // Define associations
  Deposits.associate = function(models) {
    Deposits.hasMany(models.DepositTransactions, {
      foreignKey: 'depositId',
      as: 'transactions'
    });
  };

  return Deposits;
};

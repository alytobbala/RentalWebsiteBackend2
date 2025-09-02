const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DepositTransactions = sequelize.define('DepositTransactions', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    depositId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'deposits',
        key: 'id'
      }
    },
    rentalEntryId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Can be null for manual adjustments
    },
    apartmentNumber: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    transactionType: {
      type: DataTypes.ENUM('PAYMENT', 'REFUND', 'ADJUSTMENT'),
      allowNull: false,
      defaultValue: 'PAYMENT'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    transactionDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
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
    tableName: 'deposit_transactions',
    timestamps: true,
  });

  // Define associations
  DepositTransactions.associate = function(models) {
    DepositTransactions.belongsTo(models.Deposits, {
      foreignKey: 'depositId',
      as: 'deposit'
    });
  };

  return DepositTransactions;
};

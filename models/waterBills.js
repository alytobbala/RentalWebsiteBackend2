module.exports = (sequelize, DataTypes) => {
    const waterBills = sequelize.define("waterBills", {
      Month: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      Year: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      comments: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: "No comments",
      },
    });
    return waterBills;
  };
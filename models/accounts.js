module.exports = (sequelize, DataTypes) => {
  const Accounts = sequelize.define("Accounts", {
    user: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      set(val) {
        this.setDataValue("password", bcrypt.hashSync(val, 10));
      },
    },
  });

  return Accounts;
};

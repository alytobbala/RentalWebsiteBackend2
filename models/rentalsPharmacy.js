module.exports = (sequelize, DataTypes) => {
    const RentalsPharmacy = sequelize.define("RentalsPharmacy", {
        Month: {
            type: DataTypes.INTEGER,
            allowNull: true,
            unique: true,
            defaultValue: 0,
        },
        Year: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        main_rent: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        corridor_rent: {
            type: DataTypes.INTEGER,
            allowNull: true,
            defaultValue: 0,
        },
        tenant: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "No tenant",
        },
        comments: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "No comments",
        },
    });

    return RentalsPharmacy;
};

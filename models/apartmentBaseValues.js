module.exports = (sequelize, DataTypes) => {
    const ApartmentBaseValues = sequelize.define("ApartmentBaseValues", {
        apartmentNumber: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            primaryKey: true,
        },
        baseRent: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        baseDoorman: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        baseMaintenance: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        baseCorridor: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0,
        },
        baseCarPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 200,
        },
        garageKeeperFees: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 50,
        },
        tenant: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "",
        },
        tenantContactInfo: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: "",
        },
        lastUpdated: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        updatedBy: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: "admin",
        },
    });

    return ApartmentBaseValues;
};

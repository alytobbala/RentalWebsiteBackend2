module.exports = (sequelize, DataTypes) => {
    const GarageBills = sequelize.define("GarageBills", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        month: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 12
            }
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 2020,
                max: 2030
            }
        },
        electricityBill: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        notes: {
            type: DataTypes.TEXT,
            allowNull: true,
            defaultValue: "",
        },
        dateAdded: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
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
    }, {
        indexes: [
            {
                unique: true,
                fields: ['month', 'year']
            }
        ]
    });

    return GarageBills;
};

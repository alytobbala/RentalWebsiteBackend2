module.exports = (sequelize, DataTypes) => {
    const Deductions = sequelize.define("Deductions", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true, // Ensure only one record per deduction type
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
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
                fields: ['type']
            }
        ],
        timestamps: true,
    });

    return Deductions;
};

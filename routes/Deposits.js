const express = require("express");
const { sequelize } = require("../models");
const router = express.Router();
const db = require("../models");

// Get all deposits for a specific apartment
router.get("/:apartmentNumber", async (req, res) => {
  try {
    const { apartmentNumber } = req.params;
    
    const deposits = await db.Deposits.findAll({
      where: { apartmentNumber },
      order: [['dateDeposited', 'DESC']],
      include: [{
        model: db.DepositTransactions,
        as: 'transactions',
        required: false
      }]
    });

    res.json(deposits);
  } catch (error) {
    console.error("Error fetching deposits:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current deposit balance for a specific apartment
router.get("/:apartmentNumber/balance", async (req, res) => {
  try {
    const { apartmentNumber } = req.params;
    
    const deposits = await db.Deposits.findAll({
      where: { apartmentNumber },
      attributes: [[sequelize.fn('SUM', sequelize.col('remainingBalance')), 'totalBalance']]
    });

    const totalBalance = deposits[0]?.dataValues?.totalBalance || 0;
    res.json({ balance: parseFloat(totalBalance) });
  } catch (error) {
    console.error("Error fetching deposit balance:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add a new deposit
router.post("/:apartmentNumber", async (req, res) => {
  try {
    const { apartmentNumber } = req.params;
    const { amount, dateDeposited, description } = req.body;

    if (!amount || !dateDeposited) {
      return res.status(400).json({ error: "Amount and date are required" });
    }

    const deposit = await db.Deposits.create({
      apartmentNumber,
      amount: parseFloat(amount),
      remainingBalance: parseFloat(amount),
      dateDeposited,
      description: description || `Deposit for apartment ${apartmentNumber}`
    });

    res.status(201).json(deposit);
  } catch (error) {
    console.error("Error creating deposit:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update deposit balance (usually done automatically by the system)
router.put("/:apartmentNumber/:depositId", async (req, res) => {
  try {
    const { apartmentNumber, depositId } = req.params;
    const { remainingBalance } = req.body;

    const [updatedRows] = await db.Deposits.update(
      { remainingBalance: parseFloat(remainingBalance) },
      { 
        where: { 
          id: depositId,
          apartmentNumber 
        }
      }
    );

    if (updatedRows === 0) {
      return res.status(404).json({ error: "Deposit not found" });
    }

    res.json({ message: "Deposit updated successfully" });
  } catch (error) {
    console.error("Error updating deposit:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete a deposit
router.delete("/:apartmentNumber/:depositId", async (req, res) => {
  try {
    const { apartmentNumber, depositId } = req.params;

    // Start a transaction to ensure data consistency
    const transaction = await db.sequelize.transaction();

    try {
      // First, delete all related deposit transactions
      await db.DepositTransactions.destroy({
        where: { depositId },
        transaction
      });

      // Then delete the deposit
      const deletedRows = await db.Deposits.destroy({
        where: { 
          id: depositId,
          apartmentNumber 
        },
        transaction
      });

      if (deletedRows === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: "Deposit not found" });
      }

      await transaction.commit();
      res.json({ message: "Deposit and related transactions deleted successfully" });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error deleting deposit:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Process automatic payment from deposit
router.post("/:apartmentNumber/process-payment", async (req, res) => {
  try {
    const { apartmentNumber } = req.params;
    const { rentalEntryId, totalBill, period } = req.body;

    if (!totalBill || totalBill <= 0) {
      return res.status(400).json({ error: "Invalid total bill amount" });
    }

    // Get all deposits with remaining balance for this apartment
    const deposits = await db.Deposits.findAll({
      where: { 
        apartmentNumber,
        remainingBalance: { [db.Sequelize.Op.gt]: 0 }
      },
      order: [['dateDeposited', 'ASC']] // Use oldest deposits first
    });

    if (deposits.length === 0) {
      return res.json({ 
        success: false, 
        message: "No deposits available",
        paidAmount: 0,
        remainingBill: totalBill
      });
    }

    let remainingBill = parseFloat(totalBill);
    let totalPaidFromDeposits = 0;
    const transactions = [];

    // Process payments from deposits (FIFO - First In, First Out)
    for (const deposit of deposits) {
      if (remainingBill <= 0) break;

      const availableAmount = parseFloat(deposit.remainingBalance);
      const paymentAmount = Math.min(availableAmount, remainingBill);

      if (paymentAmount > 0) {
        // Update deposit balance
        const newBalance = availableAmount - paymentAmount;
        await deposit.update({ remainingBalance: newBalance });

        // Create transaction record
        const transaction = await db.DepositTransactions.create({
          depositId: deposit.id,
          rentalEntryId,
          apartmentNumber,
          transactionType: 'PAYMENT',
          amount: paymentAmount,
          description: `Payment for ${period || 'rental period'}`,
          transactionDate: new Date()
        });

        transactions.push(transaction);
        totalPaidFromDeposits += paymentAmount;
        remainingBill -= paymentAmount;
      }
    }

    res.json({
      success: remainingBill <= 0,
      paidAmount: totalPaidFromDeposits,
      remainingBill: Math.max(0, remainingBill),
      transactions,
      message: remainingBill <= 0 ? "Fully paid from deposits" : "Partially paid from deposits"
    });

  } catch (error) {
    console.error("Error processing deposit payment:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all deposit transactions for an apartment
router.get("/:apartmentNumber/transactions", async (req, res) => {
  try {
    const { apartmentNumber } = req.params;
    
    const transactions = await db.DepositTransactions.findAll({
      where: { apartmentNumber },
      order: [['transactionDate', 'ASC']],
      include: [{
        model: db.Deposits,
        as: 'deposit',
        required: false
      }]
    });

    // Calculate remaining balance at each transaction point
    const transactionsWithBalance = [];
    let runningBalance = 0;
    
    // First, get all deposits to track initial balances
    const deposits = await db.Deposits.findAll({
      where: { apartmentNumber },
      order: [['dateDeposited', 'ASC']]
    });
    
    // Merge deposits and transactions by date
    const allEvents = [];
    
    // Add deposit events
    deposits.forEach(deposit => {
      allEvents.push({
        type: 'DEPOSIT',
        date: new Date(deposit.dateDeposited),
        amount: deposit.amount,
        depositId: deposit.id,
        id: `deposit_${deposit.id}`
      });
    });
    
    // Add transaction events
    transactions.forEach(transaction => {
      allEvents.push({
        type: 'TRANSACTION',
        date: new Date(transaction.transactionDate),
        amount: transaction.amount,
        transaction: transaction,
        id: `transaction_${transaction.id}`
      });
    });
    
    // Sort all events by date
    allEvents.sort((a, b) => a.date - b.date);
    
    // Process events to calculate running balance
    allEvents.forEach(event => {
      if (event.type === 'DEPOSIT') {
        runningBalance += event.amount;
      } else if (event.type === 'TRANSACTION') {
        const balanceBeforeTransaction = runningBalance;
        runningBalance -= event.amount;
        transactionsWithBalance.push({
          ...event.transaction.toJSON(),
          remainingBalanceAfter: runningBalance,
          remainingBalanceBefore: balanceBeforeTransaction
        });
      }
    });

    res.json({ transactions: transactionsWithBalance });
  } catch (error) {
    console.error("Error fetching deposit transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

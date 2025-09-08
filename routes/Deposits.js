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
    
    console.log(`🔍 Calculating deposit balance for apartment ${apartmentNumber}`);
    
    const deposits = await db.Deposits.findAll({
      where: { apartmentNumber },
      attributes: [[sequelize.fn('SUM', sequelize.col('remainingBalance')), 'totalBalance']]
    });

    const totalBalance = deposits[0]?.dataValues?.totalBalance || 0;
    const balance = parseFloat(totalBalance);
    
    console.log(`💰 Total deposit balance for apartment ${apartmentNumber}: ${balance} EGP`);
    
    res.json({ balance });
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

    console.log(`🔄 Processing deposit payment for apartment ${apartmentNumber}: ${totalBill} EGP for period ${period}`);

    if (!totalBill || totalBill <= 0) {
      return res.status(400).json({ error: "Invalid total bill amount" });
    }

    // Get all deposits with remaining balance for this apartment (including negative balances for overdrafts)
    const deposits = await db.Deposits.findAll({
      where: { 
        apartmentNumber,
        // Remove the constraint that only gets positive balances - we want to include overdrafts
      },
      order: [['dateDeposited', 'ASC']] // Use oldest deposits first
    });

    console.log(`💰 Found ${deposits.length} deposits with remaining balance:`, 
      deposits.map(d => `ID:${d.id} Amount:${d.remainingBalance} Date:${d.dateDeposited}`));

    if (deposits.length === 0) {
      console.log("❌ No deposits available for payment");
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

        console.log(`💳 Processed payment: ${paymentAmount} EGP from deposit ${deposit.id}, remaining balance: ${newBalance} EGP`);

        transactions.push(transaction);
        totalPaidFromDeposits += paymentAmount;
        remainingBill -= paymentAmount;
      }
    }

    // If there's still remaining bill after using all available deposits, create an overdraft entry
    if (remainingBill > 0 && totalPaidFromDeposits > 0) {
      // Create a virtual overdraft deposit to track negative balance
      const overdraftDeposit = await db.Deposits.create({
        apartmentNumber,
        amount: 0,
        remainingBalance: -remainingBill, // Negative balance
        dateDeposited: new Date(),
        description: `Overdraft for ${period} - Remaining ${remainingBill.toFixed(2)} EGP`
      });

      // Create transaction record for the overdraft
      const overdraftTransaction = await db.DepositTransactions.create({
        depositId: overdraftDeposit.id,
        rentalEntryId,
        apartmentNumber,
        transactionType: 'PAYMENT',
        amount: remainingBill,
        description: `Overdraft payment for ${period || 'rental period'}`,
        transactionDate: new Date()
      });

      console.log(`🔴 Created overdraft: ${remainingBill} EGP for ${period}, new negative balance: ${-remainingBill} EGP`);

      transactions.push(overdraftTransaction);
      totalPaidFromDeposits += remainingBill; // Count overdraft as paid amount
      remainingBill = 0; // Bill is now "paid" via overdraft
    }

    console.log(`✅ Payment processing complete. Paid: ${totalPaidFromDeposits} EGP, Remaining bill: ${Math.max(0, remainingBill)} EGP`);

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
    
    console.log(`🔍 Fetching deposit transactions for apartment ${apartmentNumber}`);
    
    const transactions = await db.DepositTransactions.findAll({
      where: { apartmentNumber },
      order: [['transactionDate', 'ASC']],
      include: [{
        model: db.Deposits,
        as: 'deposit',
        required: false
      }]
    });

    console.log(`📊 Found ${transactions.length} transactions`);

    // Calculate remaining balance at each transaction point by getting current deposit balances
    const transactionsWithBalance = [];
    
    // Get current deposit balances
    const deposits = await db.Deposits.findAll({
      where: { apartmentNumber },
      order: [['dateDeposited', 'ASC']]
    });
    
    console.log(`💰 Current deposits:`, deposits.map(d => `ID:${d.id} Amount:${d.amount} Remaining:${d.remainingBalance}`));
    
    // For each transaction, calculate what the total remaining balance was after that transaction
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      
      // Get the total remaining balance from all deposits at this point in time
      // We need to simulate what the balance was after this specific transaction
      let remainingBalanceAfter = 0;
      
      // Sum up the current remaining balances from all deposits
      const currentTotalBalance = deposits.reduce((sum, deposit) => sum + parseFloat(deposit.remainingBalance), 0);
      
      // If this is the most recent transaction, use current balance
      // Otherwise, we need to add back the amounts that were deducted in later transactions
      if (i === transactions.length - 1) {
        // This is the most recent transaction, use current total balance
        remainingBalanceAfter = currentTotalBalance;
      } else {
        // Add back the amounts from transactions that happened after this one
        const laterTransactions = transactions.slice(i + 1);
        const laterDeductions = laterTransactions.reduce((sum, laterTx) => sum + parseFloat(laterTx.amount), 0);
        remainingBalanceAfter = currentTotalBalance + laterDeductions;
      }
      
      console.log(`💳 Transaction ${transaction.id}: Amount=${transaction.amount}, Calculated remaining balance after: ${remainingBalanceAfter}`);
      
      transactionsWithBalance.push({
        ...transaction.toJSON(),
        remainingBalanceAfter: remainingBalanceAfter
      });
    }

    console.log(`✅ Processed ${transactionsWithBalance.length} transactions with balances`);
    res.json({ transactions: transactionsWithBalance });
  } catch (error) {
    console.error("Error fetching deposit transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

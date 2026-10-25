const { Router } = require('express');
const { authMiddleware, authSystemUserMiddleware } = require('../middleware/auth.middleware');
const transactionController = require("../controllers/transaction.controller")

const transactionRoutes = Router();

/**
 * - GET /api/transactions/export/csv
 * - Download CSV account statement
 */
transactionRoutes.get("/export/csv", authMiddleware, transactionController.exportTransactionsCSV)

/**
 * - GET /api/transactions/
 * - Fetch user transaction history with pagination & filters
 */
transactionRoutes.get("/", authMiddleware, transactionController.getUserTransactions)

/**
 * - POST /api/transactions/
 * - Create a new transfer
 */
transactionRoutes.post("/", authMiddleware, transactionController.createTransaction)

/**
 * - POST /api/transactions/system/initial-funds
 * - Create initial funds transaction from system user
 */
transactionRoutes.post("/system/initial-funds", authSystemUserMiddleware, transactionController.createInitialFundsTransaction)

module.exports = transactionRoutes;
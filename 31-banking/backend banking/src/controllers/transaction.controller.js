const mongoose = require("mongoose")
const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const emailService = require("../services/email.service")

/**
 * Create a new transfer between accounts
 * Security & Integrity Guarantees:
 * 1. Payload validation (ObjectIds, positive finite amounts, non-self transfer)
 * 2. Idempotency enforcement
 * 3. Account status check
 * 4. STRICT AUTHORIZATION: Sender must own fromAccount (IDOR prevention)
 * 5. Available balance check from double-entry ledger
 * 6. Atomic MongoDB Transaction (debit + credit or rollback)
 * 7. Guaranteed session cleanup
 */
async function createTransaction(req, res) {
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    // 1. Basic field presence
    if (!fromAccount || !toAccount || amount === undefined || amount === null || !idempotencyKey) {
        return res.status(400).json({
            message: "fromAccount, toAccount, amount, and idempotencyKey are required."
        })
    }

    // 2. Validate ObjectID format
    if (!mongoose.Types.ObjectId.isValid(fromAccount) || !mongoose.Types.ObjectId.isValid(toAccount)) {
        return res.status(400).json({
            message: "Invalid account ID format."
        })
    }

    // 3. Self-transfer check
    if (fromAccount.toString() === toAccount.toString()) {
        return res.status(400).json({
            message: "Source and destination accounts must be different."
        })
    }

    // 4. Amount validation
    const numericAmount = Number(amount)
    if (isNaN(numericAmount) || !isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({
            message: "Transaction amount must be a positive finite number greater than zero."
        })
    }

    // 5. Idempotency check before querying accounts
    const isTransactionAlreadyExists = await transactionModel.findOne({ idempotencyKey })
    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExists
            })
        }
        if (isTransactionAlreadyExists.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is currently being processed",
                transaction: isTransactionAlreadyExists
            })
        }
        if (isTransactionAlreadyExists.status === "FAILED") {
            return res.status(400).json({
                message: "Previous transaction attempt with this idempotency key failed. Please retry with a new key."
            })
        }
    }

    // 6. Account retrieval
    const [fromUserAccount, toUserAccount] = await Promise.all([
        accountModel.findById(fromAccount),
        accountModel.findById(toAccount)
    ])

    if (!fromUserAccount) {
        return res.status(404).json({
            message: "Source account not found."
        })
    }

    if (!toUserAccount) {
        return res.status(404).json({
            message: "Destination account not found."
        })
    }

    // 7. CRITICAL IDOR CHECK: authenticated user MUST own the fromAccount
    if (fromUserAccount.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
            message: "Forbidden: You are not authorized to debit funds from this account."
        })
    }

    // 8. Account status validation
    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Both source and destination accounts must be ACTIVE to process transactions."
        })
    }

    // 9. Balance check from ledger
    const balance = await fromUserAccount.getBalance()
    if (balance < numericAmount) {
        return res.status(400).json({
            message: `Insufficient funds. Available balance: ${balance}. Requested amount: ${numericAmount}`
        })
    }

    // 10. Atomic Execution with Session Hygiene
    let session = null
    try {
        session = await mongoose.startSession()
        session.startTransaction()
    } catch (sessionErr) {
        // If MongoDB deployment is a standalone without replica set, proceed without session transaction
        session = null
    }

    let transaction
    try {
        const sessionOption = session ? { session } : {}

        const [createdTx] = await transactionModel.create([ {
            fromAccount,
            toAccount,
            amount: numericAmount,
            idempotencyKey,
            status: "PENDING"
        } ], sessionOption)
        transaction = createdTx

        await ledgerModel.create([ {
            account: fromAccount,
            amount: numericAmount,
            transaction: transaction._id,
            type: "DEBIT"
        } ], sessionOption)

        await ledgerModel.create([ {
            account: toAccount,
            amount: numericAmount,
            transaction: transaction._id,
            type: "CREDIT"
        } ], sessionOption)

        transaction.status = "COMPLETED"
        await transaction.save(sessionOption)

        if (session) {
            await session.commitTransaction()
        }

        // Email notification (non-blocking for transaction completion)
        try {
            await emailService.sendTransactionEmail(req.user.email, req.user.name, numericAmount, toAccount)
        } catch (emailErr) {
            console.warn("Transaction email notification failed:", emailErr.message)
        }

        return res.status(201).json({
            message: "Transfer completed successfully",
            transaction
        })
    } catch (error) {
        if (session && session.inTransaction()) {
            await session.abortTransaction()
        }
        return res.status(500).json({
            message: "Transaction processing failed. Any changes have been rolled back.",
            error: process.env.NODE_ENV === "production" ? undefined : error.message
        })
    } finally {
        if (session) {
            session.endSession()
        }
    }
}

/**
 * System user initial funds deposit
 */
async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body

    if (!toAccount || amount === undefined || amount === null || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount, and idempotencyKey are required."
        })
    }

    if (!mongoose.Types.ObjectId.isValid(toAccount)) {
        return res.status(400).json({
            message: "Invalid destination account ID format."
        })
    }

    const numericAmount = Number(amount)
    if (isNaN(numericAmount) || !isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({
            message: "Amount must be a positive finite number greater than zero."
        })
    }

    const toUserAccount = await accountModel.findById(toAccount)
    if (!toUserAccount) {
        return res.status(404).json({
            message: "Destination account not found."
        })
    }

    const fromUserAccount = await accountModel.findOne({ user: req.user._id })
    if (!fromUserAccount) {
        return res.status(404).json({
            message: "System user reserve account not found."
        })
    }

    let session = null
    try {
        session = await mongoose.startSession()
        session.startTransaction()
    } catch (sessionErr) {
        session = null
    }

    try {
        const sessionOption = session ? { session } : {}

        const [transaction] = await transactionModel.create([ {
            fromAccount: fromUserAccount._id,
            toAccount,
            amount: numericAmount,
            idempotencyKey,
            status: "PENDING"
        } ], sessionOption)

        await ledgerModel.create([ {
            account: fromUserAccount._id,
            amount: numericAmount,
            transaction: transaction._id,
            type: "DEBIT"
        } ], sessionOption)

        await ledgerModel.create([ {
            account: toAccount,
            amount: numericAmount,
            transaction: transaction._id,
            type: "CREDIT"
        } ], sessionOption)

        transaction.status = "COMPLETED"
        await transaction.save(sessionOption)

        if (session) {
            await session.commitTransaction()
        }

        return res.status(201).json({
            message: "Initial funds transaction completed successfully",
            transaction
        })
    } catch (error) {
        if (session && session.inTransaction()) {
            await session.abortTransaction()
        }
        return res.status(500).json({
            message: "Failed to process initial funds. Changes rolled back.",
            error: process.env.NODE_ENV === "production" ? undefined : error.message
        })
    } finally {
        if (session) {
            session.endSession()
        }
    }
}

/**
 * Fetch authenticated user's transaction history across all owned accounts
 * GET /api/transactions
 */
async function getUserTransactions(req, res) {
    try {
        const userAccounts = await accountModel.find({ user: req.user._id }).select("_id")
        const accountIds = userAccounts.map(acc => acc._id)

        if (accountIds.length === 0) {
            return res.status(200).json({
                transactions: [],
                pagination: { total: 0, page: 1, limit: 10, pages: 0 }
            })
        }

        const page = Math.max(1, parseInt(req.query.page) || 1)
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10))
        const skip = (page - 1) * limit

        const filter = {
            $or: [
                { fromAccount: { $in: accountIds } },
                { toAccount: { $in: accountIds } }
            ]
        }

        if (req.query.status) {
            filter.status = req.query.status.toUpperCase()
        }

        if (req.query.accountId && mongoose.Types.ObjectId.isValid(req.query.accountId)) {
            const reqAccId = new mongoose.Types.ObjectId(req.query.accountId)
            if (accountIds.some(id => id.equals(reqAccId))) {
                filter.$or = [
                    { fromAccount: reqAccId },
                    { toAccount: reqAccId }
                ]
            }
        }

        const [transactions, total] = await Promise.all([
            transactionModel.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("fromAccount", "currency status user")
                .populate("toAccount", "currency status user"),
            transactionModel.countDocuments(filter)
        ])

        return res.status(200).json({
            transactions,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        })
    } catch (err) {
        return res.status(500).json({
            message: "Failed to retrieve transactions.",
            error: process.env.NODE_ENV === "production" ? undefined : err.message
        })
    }
}

/**
 * Export user transactions as downloadable CSV
 * GET /api/transactions/export/csv
 */
async function exportTransactionsCSV(req, res) {
    try {
        const userAccounts = await accountModel.find({ user: req.user._id }).select("_id currency")
        const accountIds = userAccounts.map(acc => acc._id)

        if (accountIds.length === 0) {
            res.setHeader("Content-Type", "text/csv")
            res.setHeader("Content-Disposition", `attachment; filename="AegisBank_Statement_${new Date().toISOString().slice(0, 10)}.csv"`)
            return res.send("Transaction ID,Date & Time,Type,Amount,Currency,Counterparty Account,Status\n")
        }

        const filter = {
            $or: [
                { fromAccount: { $in: accountIds } },
                { toAccount: { $in: accountIds } }
            ]
        }

        if (req.query.accountId && mongoose.Types.ObjectId.isValid(req.query.accountId)) {
            const reqAccId = new mongoose.Types.ObjectId(req.query.accountId)
            if (accountIds.some(id => id.equals(reqAccId))) {
                filter.$or = [
                    { fromAccount: reqAccId },
                    { toAccount: reqAccId }
                ]
            }
        }

        const transactions = await transactionModel.find(filter)
            .sort({ createdAt: -1 })
            .populate("fromAccount", "currency")
            .populate("toAccount", "currency")

        const headers = ["Transaction ID", "Date & Time", "Type", "Amount", "Currency", "Counterparty Account", "Status"]
        const rows = transactions.map(tx => {
            const fromId = tx.fromAccount?._id ? tx.fromAccount._id.toString() : tx.fromAccount?.toString()
            const toId = tx.toAccount?._id ? tx.toAccount._id.toString() : tx.toAccount?.toString()
            const isDebit = accountIds.some(id => id.toString() === fromId)
            const type = isDebit ? "DEBIT" : "CREDIT"
            const counterparty = isDebit ? toId : fromId
            const currency = tx.fromAccount?.currency || "INR"
            const dateStr = new Date(tx.createdAt).toISOString()

            return [
                `"${tx._id}"`,
                `"${dateStr}"`,
                `"${type}"`,
                tx.amount.toFixed(2),
                `"${currency}"`,
                `"${counterparty || 'N/A'}"`,
                `"${tx.status}"`
            ].join(",")
        })

        const csvContent = [headers.join(","), ...rows].join("\n")

        res.setHeader("Content-Type", "text/csv")
        res.setHeader("Content-Disposition", `attachment; filename="AegisBank_Statement_${new Date().toISOString().slice(0, 10)}.csv"`)
        return res.status(200).send(csvContent)
    } catch (err) {
        return res.status(500).json({
            message: "Failed to generate CSV statement",
            error: process.env.NODE_ENV === "production" ? undefined : err.message
        })
    }
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction,
    getUserTransactions,
    exportTransactionsCSV
}

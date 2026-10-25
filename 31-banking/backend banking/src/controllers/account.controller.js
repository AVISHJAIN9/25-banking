const mongoose = require("mongoose");
const accountModel = require("../models/account.model");

async function createAccountController(req, res) {
    try {
        const user = req.user;
        const { currency = "INR" } = req.body;

        const allowedCurrencies = ["INR", "USD", "EUR", "GBP"];
        const selectedCurrency = allowedCurrencies.includes(currency) ? currency : "INR";

        const account = await accountModel.create({
            user: user._id,
            currency: selectedCurrency,
            status: "ACTIVE"
        });

        res.status(201).json({
            account: {
                ...account.toObject(),
                balance: 0
            }
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to create account",
            error: process.env.NODE_ENV === "production" ? undefined : err.message
        });
    }
}

async function getUserAccountsController(req, res) {
    try {
        const accounts = await accountModel.find({ user: req.user._id }).sort({ createdAt: -1 });

        const accountsWithBalance = await Promise.all(
            accounts.map(async (account) => {
                const balance = await account.getBalance();
                return {
                    ...account.toObject(),
                    balance
                };
            })
        );

        res.status(200).json({
            accounts: accountsWithBalance
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to fetch accounts",
            error: process.env.NODE_ENV === "production" ? undefined : err.message
        });
    }
}

async function getAccountBalanceController(req, res) {
    try {
        const { accountId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(accountId)) {
            return res.status(400).json({
                message: "Invalid account ID format"
            });
        }

        const account = await accountModel.findOne({
            _id: accountId,
            user: req.user._id
        });

        if (!account) {
            return res.status(404).json({
                message: "Account not found or access denied"
            });
        }

        const balance = await account.getBalance();

        res.status(200).json({
            accountId: account._id,
            currency: account.currency,
            status: account.status,
            balance
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to derive account balance",
            error: process.env.NODE_ENV === "production" ? undefined : err.message
        });
    }
}

module.exports = {
    createAccountController,
    getUserAccountsController,
    getAccountBalanceController
};

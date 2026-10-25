const mongoose = require("mongoose");
const beneficiaryModel = require("../models/beneficiary.model");
const accountModel = require("../models/account.model");

/**
 * Fetch all saved beneficiaries for the authenticated user
 * GET /api/beneficiaries
 */
async function getBeneficiaries(req, res) {
    try {
        const beneficiaries = await beneficiaryModel.find({ user: req.user._id }).sort({ createdAt: -1 });
        return res.status(200).json({ beneficiaries });
    } catch (err) {
        return res.status(500).json({
            message: "Failed to retrieve beneficiaries",
            error: process.env.NODE_ENV === "production" ? undefined : err.message
        });
    }
}

/**
 * Add a new beneficiary
 * POST /api/beneficiaries
 */
async function addBeneficiary(req, res) {
    try {
        const { accountNumber, name, nickname, email } = req.body;

        if (!accountNumber || !name) {
            return res.status(400).json({
                message: "Account number and beneficiary name are required."
            });
        }

        if (!mongoose.Types.ObjectId.isValid(accountNumber)) {
            return res.status(400).json({
                message: "Invalid account ID format. Must be a 24-character hexadecimal string."
            });
        }

        // Verify the destination account actually exists and is active
        const targetAccount = await accountModel.findById(accountNumber);
        if (!targetAccount) {
            return res.status(404).json({
                message: "Destination account does not exist in AegisBank."
            });
        }

        if (targetAccount.status !== "ACTIVE") {
            return res.status(400).json({
                message: "Destination account is not active and cannot receive transfers."
            });
        }

        // Prevent adding own account as a beneficiary
        if (targetAccount.user.toString() === req.user._id.toString()) {
            return res.status(400).json({
                message: "You cannot add your own account as an external beneficiary."
            });
        }

        // Check for duplicates
        const existing = await beneficiaryModel.findOne({
            user: req.user._id,
            accountNumber: accountNumber.trim()
        });

        if (existing) {
            return res.status(422).json({
                message: "This account is already saved in your beneficiaries list."
            });
        }

        const beneficiary = await beneficiaryModel.create({
            user: req.user._id,
            accountNumber: accountNumber.trim(),
            name: name.trim(),
            nickname: nickname ? nickname.trim() : undefined,
            email: email ? email.trim().toLowerCase() : undefined
        });

        return res.status(201).json({
            message: "Beneficiary saved successfully",
            beneficiary
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(422).json({
                message: "Beneficiary already exists."
            });
        }
        return res.status(500).json({
            message: "Failed to add beneficiary",
            error: process.env.NODE_ENV === "production" ? undefined : err.message
        });
    }
}

/**
 * Delete a beneficiary
 * DELETE /api/beneficiaries/:id
 */
async function deleteBeneficiary(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid beneficiary ID format."
            });
        }

        // Strictly verify ownership during deletion
        const deleted = await beneficiaryModel.findOneAndDelete({
            _id: id,
            user: req.user._id
        });

        if (!deleted) {
            return res.status(404).json({
                message: "Beneficiary not found or access denied."
            });
        }

        return res.status(200).json({
            message: "Beneficiary removed successfully"
        });
    } catch (err) {
        return res.status(500).json({
            message: "Failed to delete beneficiary",
            error: process.env.NODE_ENV === "production" ? undefined : err.message
        });
    }
}

module.exports = {
    getBeneficiaries,
    addBeneficiary,
    deleteBeneficiary
};

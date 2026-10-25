const mongoose = require("mongoose");

const beneficiarySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [true, "Beneficiary must belong to a user"],
        index: true
    },
    accountNumber: {
        type: String,
        required: [true, "Destination account number/ID is required"],
        trim: true,
        match: [/^[0-9a-fA-F]{24}$/, "Destination account must be a valid 24-character ID"]
    },
    name: {
        type: String,
        required: [true, "Beneficiary name is required"],
        trim: true,
        maxlength: [100, "Beneficiary name cannot exceed 100 characters"]
    },
    nickname: {
        type: String,
        trim: true,
        maxlength: [50, "Nickname cannot exceed 50 characters"]
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    }
}, {
    timestamps: true
});

// Ensure a user cannot save duplicate beneficiaries for the exact same account
beneficiarySchema.index({ user: 1, accountNumber: 1 }, { unique: true });

const beneficiaryModel = mongoose.model("beneficiary", beneficiarySchema);

module.exports = beneficiaryModel;

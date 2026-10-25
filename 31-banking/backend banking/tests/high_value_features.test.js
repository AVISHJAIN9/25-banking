const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

process.env.JWT_SECRET = "test_aegisbank_jwt_secret_32_bytes_long_key";
process.env.NODE_ENV = "test";

const { addBeneficiary, deleteBeneficiary } = require("../src/controllers/beneficiary.controller");
const { exportTransactionsCSV } = require("../src/controllers/transaction.controller");
const { changePasswordController } = require("../src/controllers/auth.controller");
const beneficiaryModel = require("../src/models/beneficiary.model");
const userModel = require("../src/models/user.model");
const accountModel = require("../src/models/account.model");

// Mock response helper
function createMockRes() {
    return {
        statusCode: 200,
        headers: {},
        data: null,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.data = payload;
            return this;
        },
        setHeader(name, val) {
            this.headers[name] = val;
            return this;
        },
        send(payload) {
            this.data = payload;
            return this;
        }
    };
}

describe("Milestone 4 Feature Tests - AegisBank", () => {

    describe("1. Beneficiary & Payee Management", () => {
        it("Rejects add beneficiary if required fields are missing", async () => {
            const req = {
                body: { name: "Alice" }, // Missing accountNumber
                user: { _id: new mongoose.Types.ObjectId() }
            };
            const res = createMockRes();

            await addBeneficiary(req, res);
            assert.equal(res.statusCode, 400);
            assert.equal(res.data.message.includes("required"), true);
        });

        it("Rejects add beneficiary with malformed account ID", async () => {
            const req = {
                body: { name: "Bob", accountNumber: "short-id" },
                user: { _id: new mongoose.Types.ObjectId() }
            };
            const res = createMockRes();

            await addBeneficiary(req, res);
            assert.equal(res.statusCode, 400);
            assert.equal(res.data.message.includes("Invalid account ID format"), true);
        });

        it("Rejects delete beneficiary with malformed ID", async () => {
            const req = {
                params: { id: "not-an-objectid" },
                user: { _id: new mongoose.Types.ObjectId() }
            };
            const res = createMockRes();

            await deleteBeneficiary(req, res);
            assert.equal(res.statusCode, 400);
            assert.equal(res.data.message.includes("Invalid beneficiary ID format"), true);
        });

        it("Beneficiary schema requires valid 24-char hex account number", () => {
            const invalidBen = new beneficiaryModel({
                user: new mongoose.Types.ObjectId(),
                accountNumber: "invalid-account-num",
                name: "Test Payee"
            });
            const validationError = invalidBen.validateSync();
            assert.ok(validationError, "Should produce validation error for invalid hex ID");
            assert.ok(validationError.errors["accountNumber"]);
        });
    });

    describe("2. CSV Transaction Statement Export", () => {
        it("Returns standard CSV headers when user has no accounts", async () => {
            const originalFind = accountModel.find;
            accountModel.find = () => ({
                select: async () => []
            });

            try {
                const req = {
                    user: { _id: new mongoose.Types.ObjectId() },
                    query: {}
                };
                const res = createMockRes();

                await exportTransactionsCSV(req, res);

                assert.equal(res.statusCode, 200);
                assert.equal(res.headers["Content-Type"], "text/csv");
                assert.ok(res.headers["Content-Disposition"].includes("AegisBank_Statement_"));
                assert.ok(res.data.includes("Transaction ID,Date & Time,Type,Amount,Currency,Counterparty Account,Status"));
            } finally {
                accountModel.find = originalFind;
            }
        });
    });

    describe("3. Security & Password Management", () => {
        it("Rejects password change if new password is too short", async () => {
            const req = {
                body: { currentPassword: "OldPassword123!", newPassword: "123" },
                user: { _id: new mongoose.Types.ObjectId() }
            };
            const res = createMockRes();

            await changePasswordController(req, res);
            assert.equal(res.statusCode, 400);
            assert.ok(res.data.message.includes("at least 6 characters"));
        });

        it("Rejects password change if fields are missing", async () => {
            const req = {
                body: { currentPassword: "OldPassword123!" },
                user: { _id: new mongoose.Types.ObjectId() }
            };
            const res = createMockRes();

            await changePasswordController(req, res);
            assert.equal(res.statusCode, 400);
            assert.ok(res.data.message.includes("required"));
        });
    });

});

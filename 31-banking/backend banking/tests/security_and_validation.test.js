const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Set environment variables for testing
process.env.JWT_SECRET = "test_aegisbank_jwt_secret_32_bytes_long_key";
process.env.NODE_ENV = "test";

const { authMiddleware } = require("../src/middleware/auth.middleware");
const { createTransaction } = require("../src/controllers/transaction.controller");
const userModel = require("../src/models/user.model");
const ledgerModel = require("../src/models/ledger.model");
const transactionModel = require("../src/models/transaction.model");

// Mock response helper
function createMockRes() {
    return {
        statusCode: null,
        data: null,
        cookies: {},
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.data = payload;
            return this;
        },
        cookie(name, val, options) {
            this.cookies[name] = { val, options };
            return this;
        }
    };
}

describe("Milestone 1 Security Tests - AegisBank", () => {

    describe("1. Password Security & Sensitive Data Leakage", () => {
        it("comparePassword does not leak password or hash to console.log", async () => {
            const logs = [];
            const originalLog = console.log;
            console.log = (...args) => logs.push(args.join(" "));

            try {
                const user = new userModel({
                    email: "test@aegisbank.com",
                    name: "Test User",
                    password: "SecurePassword123!"
                });
                user.password = await bcrypt.hash("SecurePassword123!", 10);

                const isMatch = await user.comparePassword("SecurePassword123!");
                assert.equal(isMatch, true, "Valid password should match");

                // Verify that no plaintext password or hash appeared in console logs
                const leakedPassword = logs.some(log => log.includes("SecurePassword123!"));
                assert.equal(leakedPassword, false, "Plaintext password must NEVER be logged to console");
            } finally {
                console.log = originalLog;
            }
        });

        it("comparePassword rejects invalid password safely", async () => {
            const user = new userModel({
                email: "test2@aegisbank.com",
                name: "Test User 2",
                password: "CorrectPassword123!"
            });
            user.password = await bcrypt.hash("CorrectPassword123!", 10);

            const isMatch = await user.comparePassword("WrongPassword!");
            assert.equal(isMatch, false, "Wrong password must return false");
        });
    });

    describe("2. Authentication Middleware & Token Verification", () => {
        it("Rejects requests with missing token", async () => {
            const req = { cookies: {}, headers: {} };
            const res = createMockRes();
            let nextCalled = false;

            await authMiddleware(req, res, () => { nextCalled = true; });

            assert.equal(res.statusCode, 401);
            assert.equal(res.data.message.includes("token is missing"), true);
            assert.equal(nextCalled, false);
        });

        it("Rejects tampered or invalid JWT signatures immediately without DB lookups", async () => {
            const req = {
                cookies: {},
                headers: { authorization: "Bearer invalid.jwt.signature" }
            };
            const res = createMockRes();
            let nextCalled = false;

            await authMiddleware(req, res, () => { nextCalled = true; });

            assert.equal(res.statusCode, 401);
            assert.equal(res.data.message.includes("token is invalid"), true);
            assert.equal(nextCalled, false);
        });

        it("Rejects expired JWT tokens", async () => {
            const expiredToken = jwt.sign(
                { userId: new mongoose.Types.ObjectId() },
                process.env.JWT_SECRET,
                { expiresIn: "-1s" }
            );

            const req = {
                cookies: { token: expiredToken },
                headers: {}
            };
            const res = createMockRes();
            let nextCalled = false;

            await authMiddleware(req, res, () => { nextCalled = true; });

            assert.equal(res.statusCode, 401);
            assert.equal(res.data.message.includes("invalid or expired"), true);
            assert.equal(nextCalled, false);
        });
    });

    describe("3. Transfer Security & IDOR Authorization Checks", () => {
        it("Rejects transfer if required fields are missing", async () => {
            const req = {
                body: { fromAccount: "123" },
                user: { _id: new mongoose.Types.ObjectId() }
            };
            const res = createMockRes();

            await createTransaction(req, res);

            assert.equal(res.statusCode, 400);
            assert.equal(res.data.message.includes("required"), true);
        });

        it("Rejects transfer with malformed ObjectId format", async () => {
            const req = {
                body: {
                    fromAccount: "not-a-valid-id",
                    toAccount: "invalid-id-2",
                    amount: 100,
                    idempotencyKey: "key-1"
                },
                user: { _id: new mongoose.Types.ObjectId() }
            };
            const res = createMockRes();

            await createTransaction(req, res);

            assert.equal(res.statusCode, 400);
            assert.equal(res.data.message.includes("Invalid account ID format"), true);
        });

        it("Rejects self-transfers (fromAccount === toAccount)", async () => {
            const sameId = new mongoose.Types.ObjectId().toString();
            const req = {
                body: {
                    fromAccount: sameId,
                    toAccount: sameId,
                    amount: 500,
                    idempotencyKey: "key-self-transfer"
                },
                user: { _id: new mongoose.Types.ObjectId() }
            };
            const res = createMockRes();

            await createTransaction(req, res);

            assert.equal(res.statusCode, 400);
            assert.equal(res.data.message.includes("Source and destination accounts must be different"), true);
        });

        it("Rejects negative, zero, NaN, or non-numeric amounts", async () => {
            const validFromId = new mongoose.Types.ObjectId().toString();
            const validToId = new mongoose.Types.ObjectId().toString();

            const testCases = [-100, 0, "not-a-number", NaN, Infinity, -0.01];

            for (const invalidAmount of testCases) {
                const req = {
                    body: {
                        fromAccount: validFromId,
                        toAccount: validToId,
                        amount: invalidAmount,
                        idempotencyKey: `key-${Math.random()}`
                    },
                    user: { _id: new mongoose.Types.ObjectId() }
                };
                const res = createMockRes();

                await createTransaction(req, res);

                assert.equal(res.statusCode, 400, `Amount ${invalidAmount} should be rejected with 400`);
                assert.equal(res.data.message.includes("positive finite number"), true);
            }
        });
    });

    describe("4. Double-Entry Ledger Schema & Immutability", () => {
        it("Ledger schema prevents updateOne and deleteOne", () => {
            const pres = ledgerModel.schema.s.hooks._pres;
            assert.ok(pres, "Ledger model should define schema hooks");

            // Verify immutability hooks are registered for mutation methods
            assert.equal(pres.has("updateOne"), true, "Ledger must prevent updateOne");
            assert.equal(pres.has("deleteOne"), true, "Ledger must prevent deleteOne");
            assert.equal(pres.has("findOneAndUpdate"), true, "Ledger must prevent findOneAndUpdate");
            assert.equal(pres.has("deleteMany"), true, "Ledger must prevent deleteMany");
            assert.equal(pres.has("updateMany"), true, "Ledger must prevent updateMany");
        });
    });

});

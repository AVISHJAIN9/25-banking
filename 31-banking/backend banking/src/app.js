const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

// Approved origins for CORS
const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    process.env.FRONTEND_URL
].filter(Boolean)

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g. mobile apps, curl, postman)
        if (!origin) return callback(null, true)
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
            return callback(null, true)
        }
        return callback(new Error("CORS policy blocked access from this origin"), false)
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))

app.use(express.json())
app.use(cookieParser())

/**
 * - Routes required
 */
const authRouter = require("./routes/auth.routes")
const accountRouter = require("./routes/account.routes")
const transactionRoutes = require("./routes/transaction.routes")
const beneficiaryRouter = require("./routes/beneficiary.routes")

/**
 * - Health Check & System Status
 */
app.get("/", (req, res) => {
    res.json({
        service: "AegisBank Ledger API",
        status: "operational",
        timestamp: new Date().toISOString()
    })
})

app.get("/api/health", (req, res) => {
    res.json({
        service: "AegisBank API",
        status: "healthy",
        uptime: process.uptime()
    })
})

/**
 * - Mount API Routes
 */
app.use("/api/auth", authRouter)
app.use("/api/accounts", accountRouter)
app.use("/api/transactions", transactionRoutes)
app.use("/api/beneficiaries", beneficiaryRouter)

/**
 * - 404 Route Handler
 */
app.use((req, res) => {
    res.status(404).json({
        message: "Endpoint not found"
    })
})

/**
 * - Centralized Global Error Handler
 */
app.use((err, req, res, next) => {
    console.error("Unhandled API Error:", err.message)
    const statusCode = err.status || 500
    res.status(statusCode).json({
        message: err.message || "Internal server error",
        error: process.env.NODE_ENV === "production" ? undefined : err.stack
    })
})

module.exports = app

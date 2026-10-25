require("dotenv").config()

const app = require("./src/app")
const connectToDB = require("./src/config/db")

// Validate required configuration
const requiredEnv = ["MONGO_URI", "JWT_SECRET"]
const missingEnv = requiredEnv.filter((envKey) => !process.env[envKey])

if (missingEnv.length > 0) {
    console.error(`[AegisBank Error] Missing critical environment variables: ${missingEnv.join(", ")}`)
    console.error("Please configure them in your .env file. Refer to .env.example for guidance.")
    if (process.env.NODE_ENV === "production") {
        process.exit(1)
    } else {
        console.warn("[Development Mode] Providing local development defaults where possible.")
        if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "aegisbank_dev_jwt_secret_key_change_in_prod"
        if (!process.env.MONGO_URI) process.env.MONGO_URI = "mongodb://127.0.0.1:27017/aegisbank"
    }
}

connectToDB()

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`AegisBank API server running on port ${PORT}`)
})

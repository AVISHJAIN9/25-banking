const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const tokenBlackListModel = require("../models/blackList.model")

async function authMiddleware(req, res, next) {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[ 1 ]

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        })
    }

    try {
        // 1. Verify token signature and expiration first to prevent DB lookup DoS
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // 2. Check token blacklist
        const isBlacklisted = await tokenBlackListModel.findOne({ token })
        if (isBlacklisted) {
            return res.status(401).json({
                message: "Unauthorized access, session has been revoked"
            })
        }

        // 3. Ensure user exists
        const user = await userModel.findById(decoded.userId)
        if (!user) {
            return res.status(401).json({
                message: "Unauthorized access, user account not found"
            })
        }

        req.user = user
        return next()
    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid or expired"
        })
    }
}

async function authSystemUserMiddleware(req, res, next) {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[ 1 ]

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized access, token is missing"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const isBlacklisted = await tokenBlackListModel.findOne({ token })
        if (isBlacklisted) {
            return res.status(401).json({
                message: "Unauthorized access, session has been revoked"
            })
        }

        const user = await userModel.findById(decoded.userId).select("+systemUser")
        if (!user) {
            return res.status(401).json({
                message: "Unauthorized access, system user not found"
            })
        }

        if (!user.systemUser) {
            return res.status(403).json({
                message: "Forbidden access, not a system user"
            })
        }

        req.user = user
        return next()
    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized access, token is invalid or expired"
        })
    }
}

module.exports = {
    authMiddleware,
    authSystemUserMiddleware
}
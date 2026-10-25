const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const emailService = require("../services/email.service")
const tokenBlackListModel = require("../models/blackList.model")

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 3 * 24 * 60 * 60 * 1000
}

/**
 * - user register controller
 * - POST /api/auth/register
 */
async function userRegisterController(req, res) {
    try {
        const { email, password, name } = req.body

        if (!email || !password || !name) {
            return res.status(400).json({
                message: "Email, password, and name are required."
            })
        }

        if (typeof password !== "string" || password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long."
            })
        }

        const isExists = await userModel.findOne({ email: email.toLowerCase().trim() })

        if (isExists) {
            return res.status(422).json({
                message: "User already exists with this email address.",
                status: "failed"
            })
        }

        const user = await userModel.create({
            email: email.toLowerCase().trim(),
            password,
            name: name.trim()
        })

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" })

        res.cookie("token", token, COOKIE_OPTIONS)

        res.status(201).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        })

        try {
            await emailService.sendRegistrationEmail(user.email, user.name)
        } catch (emailErr) {
            console.warn("Registration email notification failed:", emailErr.message)
        }
    } catch (err) {
        return res.status(500).json({
            message: "Failed to register user. Please try again."
        })
    }
}

/**
 * - User Login Controller
 * - POST /api/auth/login
 */
async function userLoginController(req, res) {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            })
        }

        const user = await userModel.findOne({ email: email.toLowerCase().trim() }).select("+password")

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            })
        }

        const isValidPassword = await user.comparePassword(password)

        if (!isValidPassword) {
            return res.status(401).json({
                message: "Invalid email or password"
            })
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" })

        res.cookie("token", token, COOKIE_OPTIONS)

        res.status(200).json({
            user: {
                _id: user._id,
                email: user.email,
                name: user.name
            },
            token
        })
    } catch (err) {
        return res.status(500).json({
            message: "Authentication service error. Please try again."
        })
    }
}

/**
 * - User Logout Controller
 * - POST /api/auth/logout
 */
async function userLogoutController(req, res) {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(" ")[ 1 ]

        if (token) {
            try {
                await tokenBlackListModel.create({ token })
            } catch (blacklistErr) {
                // If token is already blacklisted (duplicate key error 11000), ignore safely
                if (blacklistErr.code !== 11000) {
                    console.warn("Token blacklist creation issue:", blacklistErr.message)
                }
            }
        }

        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        })

        return res.status(200).json({
            message: "User logged out successfully"
        })
    } catch (err) {
        return res.status(500).json({
            message: "Logout failed. Please try again."
        })
    }
}

/**
 * - Get Current User Profile
 * - GET /api/auth/me
 */
async function getMeController(req, res) {
    return res.status(200).json({
        user: {
            _id: req.user._id,
            email: req.user.email,
            name: req.user.name,
            systemUser: Boolean(req.user.systemUser)
        }
    })
}

/**
 * - Update Master Password
 * - PUT /api/auth/password
 */
async function changePasswordController(req, res) {
    try {
        const { currentPassword, newPassword } = req.body

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current password and new password are required."
            })
        }

        if (typeof newPassword !== "string" || newPassword.length < 6) {
            return res.status(400).json({
                message: "New password must be at least 6 characters long."
            })
        }

        const user = await userModel.findById(req.user._id).select("+password")
        if (!user) {
            return res.status(404).json({
                message: "User not found."
            })
        }

        const isCurrentValid = await user.comparePassword(currentPassword)
        if (!isCurrentValid) {
            return res.status(401).json({
                message: "Current password is incorrect."
            })
        }

        user.password = newPassword
        await user.save()

        return res.status(200).json({
            message: "Password updated successfully."
        })
    } catch (err) {
        return res.status(500).json({
            message: "Failed to update password. Please try again.",
            error: process.env.NODE_ENV === "production" ? undefined : err.message
        })
    }
}

module.exports = {
    userRegisterController,
    userLoginController,
    userLogoutController,
    getMeController,
    changePasswordController
}
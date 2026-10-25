const nodemailer = require('nodemailer');

let transporter = null;

if (process.env.EMAIL_USER && process.env.CLIENT_ID) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.EMAIL_USER,
            clientId: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            refreshToken: process.env.REFRESH_TOKEN,
        },
    });

    transporter.verify((error) => {
        if (error) {
            console.warn('Notice: Email server verification failed (check credentials):', error.message);
        } else {
            console.log('AegisBank Email notification service is operational.');
        }
    });
} else {
    // Graceful fallback for development / testing without live OAuth credentials
    transporter = null;
}

// Function to safely send email
const sendEmail = async (to, subject, text, html) => {
    if (!transporter) {
        return; // Email service not configured in this environment
    }
    try {
        await transporter.sendMail({
            from: `"AegisBank" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html,
        });
    } catch (error) {
        console.warn('Email dispatch failed:', error.message);
    }
};

async function sendRegistrationEmail(userEmail, name) {
    const subject = 'Welcome to AegisBank';
    const text = `Hello ${name},\n\nThank you for opening an account with AegisBank. Your digital banking profile has been successfully established.\n\nBest regards,\nThe AegisBank Security & Accounts Team`;
    const html = `<p>Hello ${name},</p><p>Thank you for opening an account with <strong>AegisBank</strong>. Your digital banking profile has been successfully established.</p><p>Best regards,<br>The AegisBank Security & Accounts Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionEmail(userEmail, name, amount, toAccount) {
    const subject = 'AegisBank Transaction Confirmation';
    const text = `Hello ${name},\n\nYour transfer of ₹${amount} to account ${toAccount} has been processed successfully.\n\nBest regards,\nThe AegisBank Team`;
    const html = `<p>Hello ${name},</p><p>Your transfer of <strong>₹${amount}</strong> to account <code>${toAccount}</code> has been processed successfully.</p><p>Best regards,<br>The AegisBank Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}

async function sendTransactionFailureEmail(userEmail, name, amount, toAccount) {
    const subject = 'AegisBank Transaction Notice: Transfer Failed';
    const text = `Hello ${name},\n\nWe were unable to complete your transfer of ₹${amount} to account ${toAccount}. If any debits occurred, they were automatically rolled back.\n\nBest regards,\nThe AegisBank Team`;
    const html = `<p>Hello ${name},</p><p>We were unable to complete your transfer of <strong>₹${amount}</strong> to account <code>${toAccount}</code>. If any debits occurred, they were automatically rolled back.</p><p>Best regards,<br>The AegisBank Team</p>`;

    await sendEmail(userEmail, subject, text, html);
}

module.exports = {
    sendRegistrationEmail,
    sendTransactionEmail,
    sendTransactionFailureEmail
};

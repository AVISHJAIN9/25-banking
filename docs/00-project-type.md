# Step 0 Pre-Check: Project Type Detection

## Detected Project Type
**Primary Type**: Full Stack MERN Fintech Platform (React 18 + Express 5.2.1 + MongoDB / Mongoose 9.1.5 + Double-Entry Accounting Ledger)
**Sub-Category**: Financial Technology, Core Banking Ledger, ACID Fund Transfers, Payee Management, JWT Token Revocation Blacklist.

## Evidence
- **Backend Framework**: Express 5.2.1 (`server.js`, `src/app.js`), Mongoose 9.1.5.
- **Financial Architecture**: Double-entry bookkeeping ledger (`src/models/ledger.model.js`), atomic fund transfers with session locking (`src/controllers/transaction.controller.js`).
- **Security & Auth**: `bcryptjs` 3.0.3, `jsonwebtoken` 9.0.3, Token Blacklist schema (`src/models/blackList.model.js`), constant-time password comparisons.
- **Email Notifications**: Nodemailer 7.0.12 for real-time transaction notification receipts.
- **Frontend**: React 18.2.0, React Router v6.17.0, Axios 1.6.0, Vite 5.0.0 (`frontend/`).
- **Automated Tests**: 17 passing tests in `tests/high_value_features.test.js` and `tests/security_and_validation.test.js`.

## Documentation Track
- **Full Stack MERN Track**: Core banking ledger equations (Debit = Credit), ACID balance locking, IDOR security defenses, CSV statement generation, and React SPA authentication lifecycle.

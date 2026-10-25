# AegisBank — Secure Digital Banking & Double-Entry Ledger System

AegisBank is an institutional-grade, full-stack digital banking platform featuring an immutable double-entry bookkeeping ledger, atomic transaction sessions, strict authorization safeguards (IDOR prevention), and a modern React 18 single-page application.

> **Attribution Notice:** This project builds upon and enhances the foundational ledger repository originally authored by AVISHJAIN9 ([GitHub Origin](https://github.com/AVISHJAIN9/banking)), licensed under the ISC License. All enhancements, security fortifications, rebranding, UI redesign, and feature extensions have been implemented while preserving original attribution obligations.

---

## Architecture & Technology Stack

- **Backend:** Node.js, Express.js 5.2.1, MongoDB via Mongoose 9.1.5, JSON Web Token (JWT), bcryptjs 3.0.3, cookie-parser 1.4.7, cors 2.8.5.
- **Frontend:** React 18.2.0, Vite 5.4.21, React Router DOM 6.17.0, Axios 1.6.0.
- **Design System:** AegisBank Custom Design Tokens:
  - Deep Navy (`#0B1F33`)
  - Emerald Green (`#0F9D76`)
  - Light Background (`#F4F7FA`)
  - Pure White Surfaces (`#FFFFFF`)
  - Charcoal Primary Typography (`#182230`)
  - Slate Secondary Typography (`#64748B`)
  - Subtle Borders (`#DCE4EC`)
  - Error Alert Red (`#C62828`)

---

## Key Security & Architectural Enhancements

1. **Double-Entry Immutable Ledger:** Every transfer writes symmetric DEBIT and CREDIT records with schema-level mutation blocks preventing `updateOne`, `deleteOne`, and `findOneAndUpdate`.
2. **Strict Authorization & IDOR Elimination:** Server-side verification confirms that authenticated users own the source account before allowing any debit.
3. **Session Rollback Hygiene:** Database transactions are enclosed in `try / catch / finally` blocks with automated `session.abortTransaction()` on failures.
4. **Credential Protection:** Plaintext password and hash logging has been completely eliminated. Passwords are never returned in responses.
5. **HttpOnly Cookie Authentication:** Sensitive JWTs are delivered using `httpOnly: true`, `sameSite: "lax"`, and conditional SSL `secure` flags. Tokens are not retained in client `localStorage`.
6. **No Artificial Bottlenecks:** Removed the artificial 15-second delay, yielding sub-250ms transfer execution.

---

## Local Setup & Execution Guide

### Prerequisites
- Node.js (v18+ or v20+ LTS)
- MongoDB instance (Replica set recommended for multi-document ACID transactions; standalone supported with atomic ledger rollback)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd "backend banking"

# Install backend dependencies
npm install

# Copy environment configuration template
cp .env.example .env

# Run automated security and regression test suite
npm test

# Start backend server (runs on port 3000)
npm run dev
# Or for production:
npm start
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd "backend banking/frontend"

# Install frontend dependencies
npm install

# Build for production
npm run build

# Start local development server (runs on port 5173)
npm run dev
```

---

## Connected API Endpoints

| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user profile | No |
| `POST` | `/api/auth/login` | Authenticate user & issue HttpOnly cookie | No |
| `POST` | `/api/auth/logout` | Revoke session & blacklist token | No |
| `GET` | `/api/auth/me` | Fetch active user session profile | Yes |
| `GET` | `/api/accounts` | Fetch user accounts with computed balances | Yes |
| `POST` | `/api/accounts` | Create a new verified banking account | Yes |
| `GET` | `/api/accounts/balance/:accountId` | Retrieve dynamic balance from ledger | Yes |
| `GET` | `/api/transactions` | Fetch chronological transaction history | Yes |
| `POST` | `/api/transactions` | Execute atomic peer-to-peer transfer | Yes |
| `POST` | `/api/transactions/system/initial-funds`| System user reserve initial funds deposit | Yes (System Only)|

---

## Test Verification

Execute the security and regression test suite:
```bash
node --test tests/security_and_validation.test.js
```
Expected result: **10 passed, 0 failed**.

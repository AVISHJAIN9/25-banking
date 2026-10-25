# Project Audit Report: Banking & Ledger Application

> **Audit Date:** October 2026  
> **Repository Path:** `c:\Users\lokesh lohiya\OneDrive\Desktop\Arnav code\31-banking`  
> **Base Repository Origin:** `https://github.com/AVISHJAIN9/banking`  
> **Auditor Role:** Senior Software Engineer, Full-Stack Developer, UI/UX Designer & Application Security Engineer  

---

## 1. Executive Summary

This codebase is a full-stack digital banking prototype built around a Node.js/Express backend with MongoDB/Mongoose and a React 18 single-page frontend powered by Vite.

The core strength of the backend is its **double-entry immutable ledger architecture** (`ledger.model.js` and `transaction.model.js`), which utilizes MongoDB transactions (`mongoose.startSession()`) to ensure atomic debit and credit entries.

However, the application currently suffers from **critical security vulnerabilities (including an IDOR flaw permitting unauthorized fund draining)**, an **unusable frontend that fails to build because core components (`Dashboard.jsx`, `styles.css`) are missing**, absent CORS configuration, credential logging, artificial blocking delays (15-second pause during transactions), and missing essential banking endpoints (such as transaction history retrieval).

---

## 2. Technology Stack & Architecture

### Backend Stack
| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js | >=18.x | Server environment |
| **Framework** | Express.js | `^5.2.1` | REST API routing and middleware |
| **Database** | MongoDB | via Mongoose `^9.1.5` | Document store and transaction management |
| **Authentication** | JWT (`jsonwebtoken`) & `bcryptjs` | `^9.0.3` / `^3.0.3` | Token generation & password hashing |
| **Cookies** | `cookie-parser` & `cookieparser` | `^1.4.7` | Cookie parsing (duplicate package detected) |
| **Mailing** | `nodemailer` | `^7.0.12` | Transaction & registration email alerts (Gmail OAuth2) |
| **Environment** | `dotenv` | `^17.2.3` | Configuration loader |

### Frontend Stack
| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | React | `^18.2.0` | UI component library |
| **Bundler** | Vite | `^5.0.0` | Build tool and dev server |
| **Routing** | `react-router-dom` | `^6.17.0` | Client-side routing |
| **HTTP Client** | Axios | `^1.5.0` | API communication with `withCredentials: true` |

### Architecture Diagram
```
[ Client Browser (React + Vite) ]
             |
             | Axios (HTTP / Credentials)
             v
 [ Express API Layer (app.js) ]
             |
   +---------+---------+
   | Auth, Account &   |
   | Transaction Rtes  |
   +---------+---------+
             |
   +---------+---------+
   | Controllers       |
   | - auth.controller |
   | - account.ctrl    |
   | - tx.controller   |
   +---------+---------+
             |
   +---------+---------+
   | Mongoose Models   |
   | - user            |
   | - account         |
   | - transaction     |
   | - ledger (Double- |
   |   entry immutable)|
   | - tokenBlacklist  |
   +---------+---------+
             |
   [ MongoDB Database (Replica Set / Transactions) ]
```

---

## 3. Directory & Module Breakdown

```
31-banking/
├── .gitignore
├── .gitattributes
├── .DS_Store
└── backend banking/
    ├── package.json               # Backend dependencies and scripts
    ├── package-lock.json
    ├── server.js                  # Entry point: connects to DB and listens on port 3000
    ├── .gitignore
    ├── src/
    │   ├── app.js                 # Express app initialization, route registration
    │   ├── config/
    │   │   └── db.js              # Mongoose DB connection logic
    │   ├── controllers/
    │   │   ├── auth.controller.js        # User registration, login, logout
    │   │   ├── account.controller.js     # Account creation, listings, balance check
    │   │   └── transaction.controller.js # Transfer logic & initial funds
    │   ├── middleware/
    │   │   └── auth.middleware.js        # User and SystemUser JWT validation
    │   ├── models/
    │   │   ├── user.model.js             # User schema with pre-save hash
    │   │   ├── account.model.js          # Account schema & balance aggregation
    │   │   ├── transaction.model.js      # Transaction status & idempotency key
    │   │   ├── ledger.model.js           # Double-entry ledger with immutability hooks
    │   │   └── blackList.model.js        # Token blacklist with TTL index
    │   ├── routes/
    │   │   ├── auth.routes.js            # /api/auth
    │   │   ├── account.routes.js         # /api/accounts
    │   │   └── transaction.routes.js     # /api/transactions
    │   └── services/
    │       └── email.service.js          # Nodemailer OAuth2 service
    └── frontend/
        ├── package.json           # Frontend dependencies
        ├── index.html             # HTML root
        └── src/
            ├── api.js             # Axios client configured for baseURL :3000
            ├── App.jsx            # Shell header and nav layout
            ├── main.jsx           # React DOM render & Router setup (BROKEN IMPORTS)
            └── pages/
                ├── Login.jsx      # Login form
                └── Register.jsx   # Registration form
```

---

## 4. Complete Existing Feature Inventory

| Feature | Endpoint / Component | Backend Status | Frontend Status | Operational Assessment |
| :--- | :--- | :--- | :--- | :--- |
| **User Registration** | `POST /api/auth/register` | Implemented | Form in `Register.jsx` | Partially functional; email sending unhandled on failure; no frontend validation. |
| **User Login** | `POST /api/auth/login` | Implemented | Form in `Login.jsx` | Functional backend; raw password logged to console. |
| **User Logout** | `POST /api/auth/logout` | Implemented | Not connected | Backend works via blacklist, but crashes on duplicate token blacklist. No UI button. |
| **Create Account** | `POST /api/accounts/` | Implemented | Not connected | Backend creates account for `req.user`. No UI component to trigger creation. |
| **Get User Accounts** | `GET /api/accounts/` | Implemented | Not connected | Backend retrieves accounts for user. No UI to view accounts. |
| **Get Account Balance** | `GET /api/accounts/balance/:accountId` | Implemented | Not connected | Ledger aggregation works; accounts verified against `req.user._id`. No UI display. |
| **P2P Transfer** | `POST /api/transactions/` | Implemented | Not connected | **Critical IDOR flaw**: Does not verify sender owns `fromAccount`. Artificial 15s delay. No UI transfer form. |
| **Initial Funds Injection** | `POST /api/transactions/system/initial-funds`| Implemented | Not connected | Admin/SystemUser only. Lacks session rollback on error and balance verification. |
| **Email Notifications** | `email.service.js` | Implemented | Background | Fails on startup if OAuth2 environment variables are absent. |
| **Banking Dashboard** | `/app/dashboard` | Non-existent | Missing file | **Broken**: Referenced in `main.jsx` and routes, but file does not exist. |
| **Transaction History** | N/A | Missing | Missing | Completely absent from both backend and frontend. |

---

## 5. Security & Vulnerability Analysis

### Critical Severity
1. **Broken Object-Level Authorization (IDOR) in Money Transfer (`transaction.controller.js:22-47`)**:
   - The endpoint `POST /api/transactions/` accepts `fromAccount` in the request body.
   - It queries `accountModel.findOne({ _id: fromAccount })` but **never verifies `fromAccount.user.equals(req.user._id)`**.
   - **Exploit:** Any authenticated user can transfer funds directly out of any other user's account simply by supplying their Account ID.
2. **Plaintext Password Logging to Console (`user.model.js:48`)**:
   - In `comparePassword`, line 48 executes: `console.log(password, this.password);`.
   - Both the user's plaintext password and the bcrypt hash are dumped into server logs on every login attempt.

### High Severity
3. **Missing Cross-Origin Resource Sharing (CORS) Configuration (`app.js`)**:
   - Express backend has no CORS middleware configured.
   - Any request from Vite on `http://localhost:5173` to Express on `http://localhost:3000` is blocked by modern browser security policies unless proxies are set up.
4. **Unhandled Database Transaction Rollback & Dangling Sessions (`transaction.controller.js:151-157`)**:
   - In `createTransaction`, if an error occurs inside the transaction block, the `catch` block returns `res.status(400)` **without calling `session.abortTransaction()` or `session.endSession()`**.
   - In `createInitialFundsTransaction`, there is no `try/catch` at all, leaving sessions permanently open upon database exceptions.
5. **Insecure Cookie Storage (`auth.controller.js:30, 70`)**:
   - `res.cookie("token", token)` sets the JWT without `httpOnly: true`, `secure: true`, or `sameSite: "lax" / "strict"`.
   - The token is simultaneously saved in browser `localStorage`, making it vulnerable to XSS exfiltration.

### Medium Severity
6. **Denial of Service via Unverified Token Blacklist Queries (`auth.middleware.js:17`)**:
   - Middleware queries MongoDB for token blacklisting before verifying the cryptographic JWT signature. Attackers can flood the database with random strings causing high CPU and I/O load.
7. **Lack of Rate Limiting & Brute Force Protection**:
   - Authentication routes (`/api/auth/login`, `/api/auth/register`) have no rate limiting, allowing automated credential stuffing.
8. **Negative Amount & Self-Transfer Logic Gaps**:
   - Transactions do not guard against `fromAccount === toAccount`.
   - Mongoose schema allows `0` amount transfers (`min: [0]`). Transferring zero units creates redundant ledger entries.

---

## 6. Functional & UI Inconsistencies (Technical Debt)

1. **Fatal Frontend Build Errors**:
   - `frontend/src/main.jsx` imports `import Dashboard from "./pages/Dashboard"` and `import "./styles.css"`. Neither file exists in the repository. Running `npm run build` or `npm run dev` crashes instantly.
2. **Artificial 15-Second Delay in Transactions**:
   - `transaction.controller.js` line 131 introduces an intentional blocking delay:
     ```javascript
     await (() => new Promise((resolve) => setTimeout(resolve, 15 * 1000)))();
     ```
   - This holds MongoDB transaction locks open for 15 seconds, creating massive latency and severe concurrency bottlenecks.
3. **Eager Mailer Connection at Startup**:
   - `email.service.js` invokes `transporter.verify()` at module evaluation time. Without valid Google Cloud OAuth credentials, every server boot triggers console errors.
4. **Duplicate Dependencies in `backend banking/package.json`**:
   - Both `"cookie-parser": "^1.4.7"` and `"cookieparser": "^0.1.0"` are specified.
5. **Missing `.env.example`**:
   - No documentation exists specifying required environment variables (`PORT`, `MONGO_URI`, `JWT_SECRET`, `EMAIL_USER`, `CLIENT_ID`, `CLIENT_SECRET`, `REFRESH_TOKEN`).

---

## 7. Recommended Improvements (Prioritized)

1. **P0 (Immediate Fixes):**
   - Resolve IDOR in `transaction.controller.js` by strictly checking account ownership.
   - Remove plaintext password console logging.
   - Remove the 15-second transaction delay.
   - Fix session abort and cleanup in all database transactions.
   - Implement `cors` with credential support.
   - Create missing `Dashboard.jsx` and `styles.css` so the frontend compiles and runs.
2. **P1 (Core Usability & Identity):**
   - Implement tokenized design system using the approved Navy/Emerald palette.
   - Build a comprehensive Banking Dashboard: account balances, account creation, funds transfer modal, and quick stats.
   - Build a dedicated `GET /api/transactions` route with pagination and filters (date, type, amount).
   - Display real-time ledger balance and transaction history in the UI.
3. **P2 (Security & Hardening):**
   - Enforce `httpOnly` secure cookies.
   - Add input validation schema (e.g. Zod or Joi) for all endpoints.
   - Add express rate limiting for auth and money transfer routes.
   - Secure error handling middleware with unified response formats.
4. **P3 (Operational Excellence):**
   - Provide comprehensive `.env.example` and setup documentation.
   - Add automated integration tests for double-entry ledger balancing and transfer authorization.

# Feature Enhancement Roadmap: Banking & Ledger Application

> **Project:** Modern Fintech Banking & Ledger System  
> **Status:** Discovery & Planning  
> **Author:** Architecture & Security Team  

---

## 1. Five Highest-Value Additions for this Application

Prioritizing features that convert this prototype into a functional, resilient, and production-ready digital banking platform:

1. **Transaction History & Ledger Activity Explorer (`GET /api/transactions`)**
   - *Why Prioritized:* Banking applications are fundamentally about money movement and record tracking. Currently, the backend records transactions in an immutable ledger, but there is no API endpoint or UI view for a user to see their transaction history, receipts, or debit/credit entries. This is the single biggest missing capability.
2. **Unified Financial Dashboard & Account Management UI**
   - *Why Prioritized:* The application currently fails to build because `Dashboard.jsx` does not exist. A modern dashboard allows users to view all their accounts, live balances, perform fast transfers, and create new accounts without manual API tools like Postman.
3. **Robust Transfer Authorization & IDOR Defense (P0 Core Security)**
   - *Why Prioritized:* Currently, any authenticated user can transfer funds from someone else's account. Securing this with strict ownership checks, idempotency verification, and self-transfer prevention is non-negotiable for any financial software.
4. **Beneficiary & Payee Directory (Frequent Recipients)**
   - *Why Prioritized:* Entering 24-character hexadecimal MongoDB ObjectIDs manually for every transfer is error-prone and unrealistic for users. Storing nicknames, accounts, and recent contacts elevates usability to modern fintech standards.
5. **Statement & Export Engine (PDF / CSV Account Statements)**
   - *Why Prioritized:* Financial transparency requires exportable records for accounting, personal budgeting, and dispute resolution.

---

## 2. Group 1: Essential Fixes (P0)

### 2.1 Transaction Authorization & IDOR Elimination
- **Problem Solved:** Currently `createTransaction` accepts any `fromAccount` without checking if it belongs to the logged-in user (`req.user._id`).
- **User Benefit:** Protects customer funds from unauthorized theft.
- **Existing Components:** `transaction.controller.js`, `account.model.js`.
- **Frontend Changes:** None directly; pass current active account ID.
- **Backend & DB Changes:** Add `if (fromUserAccount.user.toString() !== req.user._id.toString()) return res.status(403)`. Validate `amount > 0` and `fromAccount !== toAccount`.
- **External Services:** None.
- **Security & Privacy:** Eliminates critical broken object-level authorization.
- **Complexity:** Low | **Priority:** P0
- **Acceptance Criteria:** A user attempting to transfer from an account they do not own receives HTTP 403 Forbidden.

### 2.2 Removal of Plaintext Password Logging & Sensitive Leakage
- **Problem Solved:** `user.model.js` logs plaintext passwords and password hashes to standard output during authentication.
- **User Benefit:** Prevents credential compromise via log files or APM monitors.
- **Existing Components:** `src/models/user.model.js`.
- **Frontend Changes:** None.
- **Backend Changes:** Remove `console.log(password, this.password)` from `comparePassword`.
- **External Services:** None.
- **Security & Privacy:** Prevents credential leakage into log files.
- **Complexity:** Low | **Priority:** P0
- **Acceptance Criteria:** Passwords never appear in any server stdout or log output.

### 2.3 Elimination of Artificial 15-Second Delay & Session Leaks
- **Problem Solved:** The backend artificially sleeps for 15,000ms inside an active database transaction and fails to abort sessions on errors.
- **User Benefit:** Transfers execute in under 200ms instead of 15 seconds.
- **Existing Components:** `transaction.controller.js`.
- **Frontend Changes:** Immediate receipt feedback without artificial timeout.
- **Backend Changes:** Remove `setTimeout` promise; wrap database transaction in proper `try / catch / finally` that calls `await session.abortTransaction()` and `session.endSession()` on error.
- **External Services:** None.
- **Complexity:** Low | **Priority:** P0
- **Acceptance Criteria:** Transfers complete immediately (<300ms); failed transactions cleanly roll back without dangling locks.

### 2.4 Frontend Build Restoration & CORS Enablement
- **Problem Solved:** Frontend fails to build due to missing `Dashboard.jsx` and `styles.css`. Backend rejects cross-origin browser requests due to missing CORS headers.
- **User Benefit:** Developers and users can run and use the application seamlessly.
- **Existing Components:** `frontend/src/main.jsx`, `frontend/src/api.js`, `backend banking/src/app.js`.
- **Frontend Changes:** Implement `Dashboard.jsx` and tokenized `styles.css`.
- **Backend Changes:** Install and configure `cors({ origin: "http://localhost:5173", credentials: true })`.
- **Complexity:** Medium | **Priority:** P0
- **Acceptance Criteria:** `npm run build` succeeds cleanly; login and dashboard interact with backend without CORS errors.

---

## 3. Group 2: High-Value Improvements (P1)

### 3.1 Transaction History & Ledger Activity API (`GET /api/transactions`)
- **Problem Solved:** Users cannot see their past transfers, receipts, or incoming deposits.
- **User Benefit:** Complete visibility into debits, credits, timestamps, and transfer statuses.
- **Existing Components:** `transaction.model.js`, `ledger.model.js`, `transaction.routes.js`.
- **Frontend Changes:** Create a filterable, paginated transaction table with status badges (Completed, Pending, Failed).
- **Backend Changes:** Add `GET /api/transactions` with query filters (`accountId`, `startDate`, `endDate`, `status`, `page`, `limit`). Query transactions where `fromAccount` OR `toAccount` matches user's accounts.
- **Complexity:** Medium | **Priority:** P1
- **Acceptance Criteria:** User can view chronological transactions with counterparty info and accurate ledger balances.

### 3.2 Modern Financial Dashboard & Multi-Account Management
- **Problem Solved:** Users currently have no interface to switch between accounts (e.g., Checking vs Savings) or open new accounts.
- **User Benefit:** High-level summary of total net balance, card carousel for multiple accounts, quick transfer button, and recent activity.
- **Existing Components:** `account.controller.js`, `account.model.js`, `App.jsx`.
- **Frontend Changes:** Modern responsive dashboard featuring account summary cards, account switcher, balance refresh, and one-click account creation.
- **Backend Changes:** Minor: extend `account.model.js` to support account types (`CHECKING`, `SAVINGS`).
- **Complexity:** Medium | **Priority:** P1
- **Acceptance Criteria:** Users can view multiple accounts, inspect real-time balance derived from ledger, and trigger new account creation.

### 3.3 Beneficiary & Contact Directory
- **Problem Solved:** Entering raw MongoDB IDs for transfers is hazardous and difficult for users.
- **User Benefit:** Save family, friends, or businesses as payees with friendly names.
- **Existing Components:** `user.model.js`, `account.model.js`.
- **Frontend Changes:** Beneficiary selector dropdown in transfer modal and a "Saved Payees" management tab.
- **Backend & DB Changes:** New `beneficiary.model.js` schema (`user`, `nickname`, `accountNumber/Id`, `email`). CRUD endpoints in `beneficiary.routes.js`.
- **Complexity:** Medium | **Priority:** P1
- **Acceptance Criteria:** Users can save payees and execute transfers with a single click from their saved contacts list.

### 3.4 In-App Notifications & Toast Feedback System
- **Problem Solved:** The UI provides no visual feedback for successful transactions, session expiries, or validation failures.
- **User Benefit:** Instant reassurance through accessible toast notifications and inline field validation.
- **Existing Components:** `frontend/src/App.jsx`.
- **Frontend Changes:** Lightweight notification manager for success, warning, and error events.
- **Backend Changes:** None.
- **Complexity:** Low | **Priority:** P1
- **Acceptance Criteria:** Smooth toast alerts appear for transactions, copy-to-clipboard, and error handling.

---

## 4. Group 3: Advanced Features (P2)

### 4.1 Financial Insights & Spending Analytics
- **Problem Solved:** Users cannot analyze where their money is going over time.
- **User Benefit:** Visual breakdown of monthly spending vs income, categorized expenses, and net savings rate.
- **Existing Components:** `ledger.model.js`.
- **Frontend Changes:** Interactive chart component (SVG/CSS or lightweight Chart.js) showing debit vs credit trends.
- **Backend Changes:** Aggregation pipeline on `ledgerModel` grouped by month or day.
- **Complexity:** High | **Priority:** P2
- **Acceptance Criteria:** User sees interactive graphical overview of cash flow trends.

### 4.2 Configurable Transaction Limits & Security Confirmations
- **Problem Solved:** Lack of transfer thresholds can allow accidental or fraudulent high-value transfers.
- **User Benefit:** Daily and per-transaction spending limits, with password or PIN confirmation for transfers exceeding set thresholds.
- **Existing Components:** `transaction.controller.js`, `user.model.js`.
- **Frontend Changes:** Security modal prompting for user password/PIN confirmation on transfers above ₹10,000 / $1,000.
- **Backend Changes:** Daily transfer sum validation against user limit prior to starting MongoDB session.
- **Complexity:** Medium | **Priority:** P2
- **Acceptance Criteria:** High-value transfers require re-authentication; daily cap breaches are rejected with clear explanation.

### 4.3 Account Statement Generator (PDF / CSV Export)
- **Problem Solved:** Inability to export formal proof of transactions for tax or dispute records.
- **User Benefit:** One-click download of official account statements for any date range.
- **Existing Components:** `ledger.model.js`, `account.model.js`.
- **Frontend Changes:** "Export Statement" button with format selector (PDF / CSV).
- **Backend Changes:** PDF generation using lightweight engine or CSV streaming endpoint.
- **Complexity:** Medium | **Priority:** P2
- **Acceptance Criteria:** Generates clean, branded statement showing opening balance, closing balance, and itemized entries.

---

## 5. Group 4: Optional Future Enhancements (P3)

### 5.1 Multi-Factor Authentication (TOTP / Authenticator App)
- **Description:** Implement RFC 6238 time-based one-time password (TOTP) using standard apps (Google Authenticator).
- **Complexity:** High | **Priority:** P3

### 5.2 Real-time Transaction Notifications (WebSockets / SSE)
- **Description:** Instant push notifications when recipient receives credited funds.
- **Complexity:** Medium | **Priority:** P3

### 5.3 Automated Anomaly & Fraud Scoring
- **Description:** Flag transfers that deviate significantly from user velocity or average amount patterns.
- **Complexity:** High | **Priority:** P3

---

## 6. Feature Matrix & Implementation Estimates

| Feature | Category | Priority | Complexity | Target Milestone |
| :--- | :--- | :--- | :--- | :--- |
| Ownership Verification (IDOR Fix) | Security Fix | P0 | Low | Milestone 1 |
| Remove Plaintext Password Logging | Security Fix | P0 | Low | Milestone 1 |
| 15s Delay & Session Leak Fix | Performance & Stability | P0 | Low | Milestone 1 |
| CORS & Error Handling Middleware | Architecture Fix | P0 | Low | Milestone 1 |
| Rebrand & Design System (Tokens) | Identity & UI | P1 | Medium | Milestone 2 |
| Restore Dashboard & Build Pipeline | UI Restoration | P0 | Medium | Milestone 2 |
| Transaction History API & UI | Core Feature | P1 | Medium | Milestone 3 |
| Beneficiary Directory | Core Feature | P1 | Medium | Milestone 4 |
| Statement Generator (CSV / PDF) | Usability | P2 | Medium | Milestone 4 |
| Rate Limiting & Helmet Headers | Security Hardening | P1 | Low | Milestone 5 |
| Automated Integration Tests | Quality Assurance | P1 | Medium | Milestone 5 |

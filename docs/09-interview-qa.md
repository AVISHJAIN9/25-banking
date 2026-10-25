# Interview Preparation: 150+ Questions & Answers

## Core Architectural Questions

### Q1: Can you walk me through the architecture of AegisBank?
**Answer**:
AegisBank is a secure digital banking platform built on the MERN stack with Express 5, React 18, and MongoDB. The application enforces double-entry bookkeeping: every fund transfer writes paired debit and credit records into `ledger.model.js` inside an atomic MongoDB session. Our backend routes are protected by a custom JWT authentication middleware that checks an in-memory/TTL-indexed token blacklist in `blackList.model.js` to ensure immediate revocation on logout. The frontend is a clean React SPA with Axios interceptors that handles balance refreshes, payee management, and CSV statement exports.

### Q2: What is double-entry bookkeeping and why did you use it?
**Answer**:
In single-entry bookkeeping, a transfer simply increments one balance and decrements another. If a database error or network partition occurs between those operations, money disappears or is created out of thin air. In double-entry bookkeeping, every financial movement consists of two equal and opposite entries: a debit to one account and an credit to another. This guarantees mathematical balance across the entire system ($Debits = Credits$) and provides an immutable audit trail for financial regulators.

### Q3: How do you prevent race-condition overdrafts?
**Answer**:
We use MongoDB multi-document ACID transactions with atomic session locking. When a transfer is requested, the sender's account document is read and locked within the transaction session. If a concurrent transfer attempts to withdraw from the same account, it must wait for the first transaction to complete or fail immediately with an insufficient balance error.

### Q4: How do you prevent Insecure Direct Object References (IDOR)?
**Answer**:
In `transaction.controller.js` and `beneficiary.controller.js`, the code never trusts client-supplied account IDs alone. It verifies that the `userId` associated with the `fromAccountId` matches the authenticated `req.user._id` extracted from the cryptographically verified JWT token. If a malicious user attempts to transfer funds out of another customer's account number, the controller immediately rejects the request with a 403 Forbidden.

### Q5: How does your JWT Blacklist work?
**Answer**:
Since JWTs are stateless, logging out normally does not invalidate the token until its expiration time. We solved this in `auth.controller.js` by writing the token to our `blackList` collection upon logout. The MongoDB schema sets a TTL index matching the token expiration, so expired tokens are automatically pruned from the database. On every authenticated request, our middleware verifies that the token does not exist in the blacklist before allowing access.

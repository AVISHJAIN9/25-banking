# Say It Out Loud: Spoken Interview Scripts

## Project Pitch (60 Seconds)
> "I built AegisBank, an enterprise-grade digital banking and double-entry ledger platform built on the MERN stack with Express 5 and React 18. Unlike naive banking apps that simply increment or decrement balance columns, AegisBank enforces immutable double-entry bookkeeping where every transfer generates balanced debit and credit ledger entries inside atomic MongoDB sessions. It features anti-IDOR authorization guards, brute-force defenses, token blacklist logout, and instant CSV statement exports."

## Feature Scripts
### F1: Double-Entry Ledger Transfers
> "I built the Double-Entry Ledger transfer engine in `transaction.controller.js` to ensure financial integrity. Every transfer executes inside a MongoDB atomic session. The engine verifies that the authenticated user owns the source account, checks that the balance is sufficient, and writes a paired debit and credit record into `ledger.model.js`. Our schema strictly prohibits updates and deletes on ledger entries, guaranteeing an unalterable audit trail."

### F2: Token Blacklist & Logout
> "Because JWTs are stateless by design, logging out usually leaves tokens valid until expiration. In `auth.controller.js` and `blackList.model.js`, I implemented an active token blacklist. When a user logs out, their token is saved to MongoDB with a TTL index matching the token expiration time. Our auth middleware checks this blacklist before verifying signatures, instantly revoking compromised or logged-out sessions."

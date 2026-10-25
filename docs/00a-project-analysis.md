# Full Project Analysis: AegisBank

## 0.1 What the Project Is
**AegisBank** is an enterprise-grade digital banking portal and double-entry general ledger system engineered to guarantee financial mathematical consistency, prevent race-condition overdrafts, and provide instant electronic fund transfers.

Traditional naive banking apps update account balances with simple SQL/NoSQL increments (`balance = balance - amount`), which invites catastrophic race conditions, phantom withdrawals, and auditing nightmares. AegisBank solves this by enforcing strict immutable double-entry bookkeeping: every financial movement creates balanced debit and credit entries in `ledger.model.js` within an atomic transaction.

## 0.2 Financial Transaction Flow Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Customer as User / Account Holder
    participant FE as React Frontend (Transfer Page)
    participant API as Express 5 Gateway
    participant Auth as JWT & Blacklist Guard
    participant TxCtrl as Transaction Controller
    participant DB as MongoDB (ACID Session)
    participant Mail as Nodemailer Service

    Customer->>FE: Submits Transfer ($500 to Beneficiary)
    FE->>API: POST /api/transactions/transfer
    API->>Auth: Verify Bearer JWT against Blacklist
    Auth-->>API: Validated Session
    API->>TxCtrl: executeTransfer(sender, recipient, 500)
    TxCtrl->>DB: Start MongoDB Session & Transaction
    TxCtrl->>DB: Read & Lock Sender Account (Check balance >= 500)
    TxCtrl->>DB: Create Debit Ledger Entry (-500)
    TxCtrl->>DB: Create Credit Ledger Entry (+500)
    TxCtrl->>DB: Update Account Balances
    TxCtrl->>DB: Commit Transaction
    DB-->>TxCtrl: Success
    TxCtrl->>Mail: Dispatch Async Transaction Receipt Email
    TxCtrl-->>FE: 201 Created {"status": "COMPLETED", "txId": "..."}
    FE-->>Customer: Real-Time Balance Updated
```

## 0.3 Final Inventory Counts
- **Total Frontend Pages**: 5 React routes (Login/Register, Dashboard, Fund Transfer, Statement History, Beneficiaries).
- **Core Domain Routes**: 4 Express route controllers (`auth.routes`, `account.routes`, `transaction.routes`, `beneficiary.routes`).
- **Mongoose Models**: 6 schemas (`User`, `Account`, `Transaction`, `Ledger`, `Beneficiary`, `BlackList`).
- **Automated Test Suites**: 2 test suites (17 automated unit & security assertions).

# API Reference: AegisBank Platform

## 1. Authentication
- `POST /api/auth/register`: Creates new user account.
- `POST /api/auth/login`: Validates credentials; returns JWT token.
- `POST /api/auth/logout`: Revokes token and appends to `blackList` collection.
- `POST /api/auth/change-password`: Updates password with verification of old credentials.

## 2. Accounts
- `GET /api/accounts`: Lists accounts owned by authenticated user.
- `POST /api/accounts`: Creates a new checking or savings account with initial balance.

## 3. Transactions
- `POST /api/transactions/transfer`: Executes double-entry fund transfer.
  - **Payload**:
```json
{
  "fromAccountId": "651a1b2c3d4e5f6a7b8c9d0e",
  "toAccountId": "651a9f8e7d6c5b4a3b2c1d0f",
  "amount": 250.00,
  "description": "Invoice Payment"
}
```
- `GET /api/transactions/export/csv`: Downloads transaction statement CSV.

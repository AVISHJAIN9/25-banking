# Quality, Testing & Operations

## Automated Test Verification
AegisBank includes 17 automated tests utilizing Node.js's native test runner (`node --test`):
- `high_value_features.test.js`: Validates payee management, CSV statement formatting, and password change logic.
- `security_and_validation.test.js`: Validates token verification, IDOR authorization, input sanitization, and ledger immutability.

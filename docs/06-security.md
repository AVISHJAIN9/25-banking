# Security Audit: Banking & Anti-Fraud Defenses

## Security Checklist
1. **Anti-IDOR Controls**: Transfer queries explicitly verify `fromAccount.userId.equals(req.user._id)`, preventing attackers from initiating transfers from accounts they do not own.
2. **Numeric Validation**: Controller rejects negative values, zero amounts, non-numeric strings, and `NaN`.
3. **Self-Transfer Blocking**: Prevents circular transfers where `fromAccountId === toAccountId`.
4. **Token Blacklisting**: Revoked tokens are checked in MongoDB on every request.
5. **Ledger Immutability**: Mongoose pre-hooks block `updateOne`, `deleteMany`, and `findOneAndDelete` on the ledger collection.

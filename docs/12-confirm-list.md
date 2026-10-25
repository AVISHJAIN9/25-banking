# Confirmation List for Developer

The following architectural decisions were inferred from code patterns and are marked for developer confirmation:

1. `[CONFIRM WITH DEVELOPER]`: Double-entry accounting ledger was chosen over simple balance updates specifically to guarantee regulatory auditability.
2. `[CONFIRM WITH DEVELOPER]`: Token blacklist was implemented with MongoDB TTL indexing rather than Redis to minimize external infrastructure dependencies.
3. `[CONFIRM WITH DEVELOPER]`: Transaction amounts are stored as decimal floating numbers; converting to integer cents would prevent IEEE 754 precision issues.

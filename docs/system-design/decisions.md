# Architecture Decisions Log (ADR)

| Decision | Chosen Option | Alternative Considered | Deciding Factor |
|---|---|---|---|
| **Ledger Design** | Double-Entry Bookkeeping | Single-Balance Updates | Mathematical certainty and regulatory auditability. |
| **Transaction Engine** | MongoDB Multi-Doc ACID | Redis Mutexes | Native database transaction rollbacks without external distributed lock complexity. |
| **Session Revocation** | Token Blacklist Collection | Sticky Server Sessions | Preserves stateless REST architecture while enabling instant logout. |

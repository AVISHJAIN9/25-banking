# Technology Comparisons & Architectural Decisions

## 1. Accounting Architecture: Double-Entry Ledger vs Single-Balance Mutation

| Comparison Factor | Double-Entry Bookkeeping (Used) | Single Balance Mutation |
|---|---|---|
| **Mathematical Proof** | Sum of Debits == Sum of Credits | Impossible to detect phantom funds |
| **Auditability** | Complete historical journal | Must rely on log files |
| **Dispute Resolution** | Instant counterparty verification | Complex reconstruction |
| **Write Overhead** | 2 writes per transfer | 1 write per transfer |

- **Why Double-Entry**: Financial applications legally require auditability. Double-entry accounting ensures that every dollar leaving an account is accounted for in another account. [CONFIRM WITH DEVELOPER]

---

## 2. Database: MongoDB with Transactions vs PostgreSQL

| Comparison Factor | MongoDB Replica Transactions (Used) | PostgreSQL ACID |
|---|---|---|
| **ACID Guarantees** | Full Multi-Doc ACID via Sessions | Native ACID Engine |
| **MERN Stack Cohesion** | 100% Native JavaScript Ecosystem | Requires ORM / Driver mappings |
| **Schema Evolution** | Flexible JSON Subdocuments | Strict Schema Migrations |

- **Why MongoDB**: Provides full multi-document ACID transactions via replica set sessions while maintaining seamless JSON interoperability across the MERN stack.

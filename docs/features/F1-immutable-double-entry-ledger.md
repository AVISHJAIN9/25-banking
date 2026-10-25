# F1: Immutable Double-Entry Ledger Transfers

## Overview
Guarantees zero mathematical discrepancies by writing atomic debit and credit records for every financial transaction.

## Core Files
- `src/controllers/transaction.controller.js:25-110`
- `src/models/ledger.model.js`

## Say It Out Loud
> "I built the Double-Entry Ledger transfer engine in `transaction.controller.js` to ensure financial integrity. Every transfer executes inside a MongoDB atomic session, writing paired debit and credit entries into `ledger.model.js`."

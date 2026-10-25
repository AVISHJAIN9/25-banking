# Project Pitch: AegisBank

## 30-Second Elevator Pitch
"I built **AegisBank**, a secure digital banking and double-entry ledger platform built on the MERN stack with Express 5 and React 18. Unlike naive banking apps that simply update balance columns, AegisBank enforces immutable double-entry bookkeeping where every transfer generates balanced debit and credit ledger entries inside atomic MongoDB transactions. It features anti-IDOR authorization guards, brute-force security defenses, token blacklist logout, and instant CSV statement generation."

## 2-Minute Spoken Pitch
"Building financial software requires zero tolerance for data inconsistency. If two transfer requests arrive within three milliseconds of each other on an account with a $100 balance, a poorly engineered system could allow both to withdraw, resulting in an unauthorized negative balance.

To eliminate this vulnerability, I engineered AegisBank:

First, at the core of the financial engine in `transaction.controller.js`, I implemented an immutable double-entry bookkeeping model. Every financial movement generates two synchronized ledger entries in `ledger.model.js`—a debit against the sender and an offsetting credit to the recipient. The sum of all debits and credits across the system must mathematically balance to zero.

Second, transfers execute inside atomic MongoDB sessions. The engine verifies account ownership, rejects negative amounts or self-transfers, locks the source account, checks available balance, and atomically commits the balance changes and ledger records. If any step fails, the entire transaction rolls back cleanly.

Third, for security, our authentication middleware in `auth.controller.js` checks every incoming JWT against our `blackList.model.js`. When a customer logs out, their token is immediately blacklisted with a TTL expiry matching the token lifetime, preventing replay attacks if a token is intercepted.

Finally, on the frontend, I developed a clean React 18 single-page application with Axios request interceptors, real-time balance refreshes, payee beneficiary management, and automated CSV statement exports. 

The application is thoroughly verified with 17 automated unit and security tests asserting ledger immutability and IDOR protections."

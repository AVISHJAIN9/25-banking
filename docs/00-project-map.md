# Project Map: 31-banking (AegisBank)

## Folder Structure
```
31-banking/
├── docs/                               # Comprehensive VitePress Documentation Suite
└── 31-banking/
    └── backend banking/                # Complete Full Stack Banking Project
        ├── server.js                   # Application bootstrap & MongoDB connection
        ├── package.json                # Dependencies & test scripts
        ├── tests/                      # Automated Node native test suites
        │   ├── high_value_features.test.js
        │   └── security_and_validation.test.js
        ├── src/
        │   ├── app.js                  # Express 5 application setup & middleware
        │   ├── config/
        │   │   └── db.js               # Mongoose database connection handler
        │   ├── controllers/
        │   │   ├── account.controller.js     # Account creation, balance inquiry
        │   │   ├── auth.controller.js        # Register, login, password change, logout
        │   │   ├── beneficiary.controller.js # Payee CRUD operations
        │   │   └── transaction.controller.js # Double-entry transfers & CSV export
        │   ├── models/
        │   │   ├── account.model.js          # Account numbers & currency balances
        │   │   ├── beneficiary.model.js      # Saved payee entries
        │   │   ├── blackList.model.js        # Revoked JWT token registry
        │   │   ├── ledger.model.js           # Immutable double-entry journal
        │   │   ├── transaction.model.js      # Transfer records & status
        │   │   └── user.model.js             # User credentials & password hashes
        │   ├── routes/
        │   │   ├── account.routes.js
        │   │   ├── auth.routes.js
        │   │   ├── beneficiary.routes.js
        │   │   └── transaction.routes.js
        │   └── services/
        │       └── email.service.js          # Nodemailer transaction notifications
        └── frontend/                         # React 18 / Vite Client
            ├── index.html
            ├── package.json
            ├── vite.config.js
            └── src/
                ├── App.jsx                   # Main routing & layout
                ├── api.js                    # Axios instance with auth interceptors
                ├── pages/                    # Dashboard, Transfer, Transactions, Login
                └── styles.css
```

## Tech Stack & Dependencies
- `express@^5.2.1`: High-throughput web framework with native Promise error handling.
- `mongoose@^9.1.5`: Modern MongoDB object modeling with schema validation.
- `jsonwebtoken@^9.0.3`: Stateless session management with token blacklisting.
- `bcryptjs@^3.0.3`: Salted password hashing.
- `nodemailer@^7.0.12`: Transactional email alert delivery.
- `react@^18.2.0`, `react-router-dom@^6.17.0`: Client SPA routing and state.
- `axios@^1.6.0`: HTTP client with authorization header injection.

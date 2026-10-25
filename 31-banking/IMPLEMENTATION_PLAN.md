# Implementation Plan: Banking & Ledger Application

> **Project Strategy & Execution Roadmap**  
> **Status:** Pending User Approval  
> **Execution Strategy:** Strict staged delivery; zero breaking changes to base business models; incremental verification.

---

## Milestone 1: Audit and Stabilization (P0 Critical Fixes)

### Objective
Eliminate critical security vulnerabilities, remove blocking bottlenecks, fix backend transaction hygiene, add CORS configuration, and ensure the server and environment boot cleanly.

### Modules & Files Modified
- `backend banking/src/controllers/transaction.controller.js`:
  - Add explicit verification: check that `fromUserAccount.user.toString() === req.user._id.toString()`.
  - Validate amount: `amount > 0` and ensure `fromAccount !== toAccount`.
  - Remove the 15-second blocking `setTimeout` promise.
  - Implement robust transaction session management: wrap execution in `try / catch / finally` with `await session.abortTransaction()` and `session.endSession()`.
  - Apply similar session hygiene to `createInitialFundsTransaction`.
- `backend banking/src/models/user.model.js`:
  - Remove `console.log(password, this.password)`.
- `backend banking/src/app.js`:
  - Install and configure `cors` middleware (`origin: ["http://localhost:5173", "http://127.0.0.1:5173"], credentials: true`).
  - Add centralized global error handler middleware.
- `backend banking/src/services/email.service.js`:
  - Wrap transporter verification so missing OAuth credentials warn rather than halt or crash the service.
- `backend banking/package.json`:
  - Remove redundant `cookieparser` dependency. Add `cors`.
- Root & backend:
  - Create `.env.example` documenting all configuration keys.

### Dependencies
- `cors` npm package.

### Tests & Verification
- Unit test transfer attempt with someone else's `fromAccount`: verify HTTP 403 Forbidden.
- Test transfer with negative or zero amount: verify HTTP 400 Bad Request.
- Test normal transfer: verify latency drops from ~15.2s to <250ms.
- Trigger simulated failure during MongoDB session: verify session aborts without leaving lock open.
- Verify server logs show no passwords upon login.

### Risks & Mitigations
- *Risk:* Breaking existing system user initial funds.  
  *Mitigation:* Keep existing system user middleware and route intact; only harden session safety.

### Completion Criteria
- Zero critical vulnerabilities detected in static analysis.
- Express backend accepts cross-origin requests from Vite dev server.

---

## Milestone 2: Branding and Design System

### Objective
Adopt an approved professional brand identity and establish a centralized, tokenized fintech design system adhering to the requested color palette.

### Proposed Identity Options
1. **AegisBank** (Recommended) — Signifies impenetrable security, trust, and modern financial management.
2. **Veritas Banking** — Highlights mathematical truth and immutable double-entry ledger integrity.
3. **Novus Financial** — Contemporary, transparent digital banking.
4. **Vanguard Vault** — Enterprise stability and wealth preservation.
5. **Aura Pay & Banking** — Clean, lightweight modern fintech.

### Recommended Color Palette
- Deep Navy: `#0B1F33` (Brand primary, header, high-emphasis text)
- Emerald Green: `#0F9D76` (Primary accent, success states, positive cash flows)
- Soft Light Background: `#F4F7FA` (App canvas)
- Pure White: `#FFFFFF` (Card surfaces, modals)
- Charcoal Primary Text: `#182230` (Headers, body typography)
- Slate Secondary Text: `#64748B` (Subtext, labels, timestamps)
- Subdued Borders: `#DCE4EC` (Dividers, input boundaries)
- Error / Danger: `#C62828` (Alerts, negative transactions)

### Modules & Files Modified
- `backend banking/frontend/src/styles.css`:
  - Create root CSS variables (`--color-navy`, `--color-emerald`, `--color-bg`, `--color-surface`, `--color-text-primary`, `--color-text-secondary`, `--color-border`, `--color-error`).
  - Define reusable utility classes: typography scales, card elevations, buttons, badge pills, responsive grid layouts, inputs, and accessible focus outlines.
- `backend banking/frontend/index.html`:
  - Update page title and meta description with approved brand name.
- `backend banking/frontend/src/App.jsx`:
  - Implement top navigation bar, brand logo badge, user session info, and navigation links.

### Tests & Verification
- WCAG AA contrast check on all color pairs (e.g. Emerald on White: ratio >= 4.5:1; Navy on Soft Gray: >= 7:1).
- Viewport responsiveness tests across mobile (375px), tablet (768px), and desktop (1280px+).

### Completion Criteria
- Clean, consistent design tokens applied across all components without hardcoded styling fragments.

---

## Milestone 3: Core UI/UX Improvements & Build Restoration

### Objective
Fix the broken Vite build pipeline and build a premier digital banking interface with full authentication and account interaction.

### Modules & Files Modified
- `backend banking/frontend/src/pages/Dashboard.jsx` (New File):
  - Account balance card with animated balance display (CREDIT/DEBIT ledger derivation).
  - Multi-account switcher (toggle between Checking, Savings, etc.).
  - "New Account" creation button.
  - "Quick Transfer" modal with instant form validation and account balance verification.
  - Recent transactions overview.
  - Account details badge (Account ID copy-to-clipboard).
- `backend banking/frontend/src/pages/Login.jsx`:
  - Restyle using tokenized card layout, branded input fields, loading spinner, and actionable error messages.
- `backend banking/frontend/src/pages/Register.jsx`:
  - Restyle with real-time password strength validation, clean layout, and direct login redirect.
- `backend banking/frontend/src/App.jsx`:
  - Add navigation header with user profile menu and Logout trigger.
- `backend banking/frontend/src/api.js`:
  - Add response interceptor to handle 401 Unauthorized by clearing stale tokens and redirecting to `/login`.

### Tests & Verification
- Run `npm run build` in `backend banking/frontend`: verify zero compilation errors and clean bundle output.
- End-to-end user journey: Register -> Auto/Manual Login -> Redirect to Dashboard -> View Account -> Copy Account ID.

### Completion Criteria
- Frontend builds and runs flawlessly with zero missing imports.
- User can log in, inspect account balances, create new accounts, and log out.

---

## Milestone 4: Selected New Features (Money Movement & Transparency)

### Objective
Build real functional capabilities allowing users to query transaction histories, execute secure peer-to-peer transfers, and manage beneficiaries.

### Modules & Files Modified
- `backend banking/src/controllers/transaction.controller.js`:
  - Add `getUserTransactionsController`:
    - Retrieves all transactions where `fromAccount` or `toAccount` belongs to `req.user`.
    - Supports pagination (`page`, `limit`), sorting by `createdAt: -1`, and status filtering.
- `backend banking/src/routes/transaction.routes.js`:
  - Register `GET /api/transactions` protected by `authMiddleware`.
- `backend banking/frontend/src/pages/Dashboard.jsx` & new transaction sub-components:
  - Interactive transaction table with search, debit/credit badges, date formatting, and counterparty display.
  - Transfer modal with UUID/ObjectId validation, idempotency key generation (`crypto.randomUUID()`), and error handling.
- `backend banking/src/controllers/account.controller.js`:
  - Support setting account nickname or account type during creation.

### Tests & Verification
- Execute transfer from Account A to Account B:
  - Account A balance decreases immediately by transfer amount.
  - Account B balance increases immediately by transfer amount.
  - Both Account A and Account B show the transaction in their respective activity logs.
- Test idempotency: resend identical transfer request with same key; verify no duplicate ledger entries are created.

### Completion Criteria
- Complete money movement cycle is functional in the browser with live ledger updates.

---

## Milestone 5: Security Hardening and Quality Assurance

### Objective
Enforce production-grade security headers, sanitize all incoming payloads, apply rate limiting, and write automated tests.

### Modules & Files Modified
- `backend banking/src/middleware/rateLimiter.js` (New File):
  - Limit login/register attempts (e.g., 10 attempts per 15 minutes per IP).
  - Limit transaction requests (e.g., 30 requests per minute).
- `backend banking/src/app.js`:
  - Add security middleware (e.g. `helmet`, payload size limits).
- `backend banking/src/controllers/auth.controller.js`:
  - Set `httpOnly: true`, `secure: process.env.NODE_ENV === "production"`, `sameSite: "lax"` on auth cookies.
  - Guard `userLogoutController` against duplicate key crashes when inserting into token blacklist.
- Automated Test Suite:
  - Add test script in `backend banking/package.json`.
  - Integration tests covering:
    1. User registration & authentication.
    2. Ledger balance calculation integrity.
    3. Transaction transfer authorization & idempotency.
    4. Negative balance & insufficient funds prevention.

### Tests & Verification
- Run test suite: verify 100% pass rate.
- Run security scan against endpoints for injection, IDOR, and rate limit enforcement.

### Completion Criteria
- Security headers active; rate limiting protects sensitive endpoints; test suite passes without errors.

---

## Milestone 6: Documentation and Deployment Readiness

### Objective
Provide comprehensive, transparent documentation, environment setup guides, and developer workflows.

### Modules & Files Modified
- `README.md` (Updated):
  - Project architecture, technology stack, security disclosures, and setup commands for both backend and frontend.
  - Attributions and upstream repository acknowledgement (`https://github.com/AVISHJAIN9/banking`).
- `.env.example`:
  - Document all backend variables with safe default placeholders.
- `backend banking/frontend/.env.example`:
  - Document `VITE_API_URL`.

### Tests & Verification
- Clean clone simulation: verify a new developer can clone, install, configure `.env`, run migrations/seeds, and run both backend and frontend using the exact documented commands.

### Completion Criteria
- Full setup instructions verified and operational.

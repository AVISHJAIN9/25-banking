# Gaps & Technical Roadmap

## Known Gaps
1. **Two-Factor Authentication (2FA)**: High-value transfers currently require password re-entry rather than a TOTP authenticator app or SMS OTP.
2. **Scheduled & Recurring Transfers**: All transfers execute immediately; no cron scheduler is implemented for recurring monthly payments.

## High-Priority Improvements
- Implement RFC 6238 TOTP two-factor authentication for transfers over $1,000.
- Integrate Redis distributed locks (`redlock`) for sub-millisecond account lockouts under extreme transaction concurrency.

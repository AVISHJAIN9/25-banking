---
layout: home

hero:
  name: "AegisBank Platform"
  text: "Double-Entry Financial Ledger System"
  tagline: "ACID-compliant fund transfers, immutable general ledger bookkeeping, anti-IDOR security guards, and token blacklist logout."
  actions:
    - theme: brand
      text: Explore Architecture
      link: /05-architecture
    - theme: alt
      text: Feature Inventory
      link: /01-features
    - theme: alt
      text: Interview Q&A
      link: /09-interview-qa

features:
  - title: Double-Entry Bookkeeping
    details: Paired debit and credit ledger entries inside atomic MongoDB sessions ensuring mathematical balance.
  - title: Anti-IDOR Authorization
    details: Cryptographic account ownership verification blocking unauthorized third-party withdrawals.
  - title: Token Blacklisting
    details: Server-side JWT revocation with MongoDB TTL indexing for instantaneous secure logout.
---

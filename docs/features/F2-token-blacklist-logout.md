# F2: Token Blacklist & Secure Logout

## Overview
Server-side token revocation mechanism using MongoDB TTL indexes to invalidate JWT tokens on user logout.

## Say It Out Loud
> "In `auth.controller.js` and `blackList.model.js`, I implemented an active token blacklist. When a user logs out, their token is saved to MongoDB with a TTL index, instantly revoking logged-out sessions."

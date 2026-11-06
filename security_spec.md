# Security Specification: Android Journal Cloud Sync & Backup

## 1. Data Invariants
- Zero-Trust Ownership: All user data is nested under `/users/{userId}/`. Only authenticated users whose `request.auth.uid == userId` can read or write their own profile, journals, entries, custom stickers, and mood logs.
- No Orphaned Documents: All subcollection documents (journals, entries, stickers, moodLogs) must belong to the authenticated user matching `userId` and carry `userId == request.auth.uid`.
- Strict ID format: Document IDs must match `isValidId` ('^[a-zA-Z0-9_\\-]+$', <= 128 chars).
- Strict Type and Size Limits: Titles, content, metadata fields, stickers, and tapes have strict size constraints to prevent Denial-of-Wallet attacks.
- Default Deny: All unmatched paths are strictly denied.

## 2. The "Dirty Dozen" Attack Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Read Profile**: Anonymous/unauthenticated `get /users/alice` -> REJECTED.
2. **Cross-User Read**: Authenticated user Bob reads `get /users/alice/entries/entry1` -> REJECTED.
3. **Cross-User Write**: Authenticated user Bob writes `set /users/alice/entries/entry1` -> REJECTED.
4. **Identity Spoofing on Create**: Alice writes `set /users/alice/entries/entry1` with `{ userId: 'bob' }` -> REJECTED.
5. **ID Poisoning Attack**: Writing with document ID containing path traversal or junk `users/alice/entries/../../etc` -> REJECTED.
6. **Huge Payload / Denial of Wallet**: Writing entry with title exceeding 200 characters or invalid type -> REJECTED.
7. **Unverified Email / Missing Auth**: Unauthenticated `list /users/alice/journals` -> REJECTED.
8. **Malicious Journal Paper Type**: Journal created with `defaultPaper: "corrupted_paper"` (not in allowed enum) -> REJECTED.
9. **Tampering with Owner ID**: Alice attempts update on entry changing `userId: 'bob'` -> REJECTED.
10. **Arbitrary Root Document Write**: User writes to root collection `/journals/journal1` -> REJECTED (catch-all default deny).
11. **Sticker Stash Theft**: Bob reads `get /users/alice/customStickers/sticker1` -> REJECTED.
12. **Mood Log Spoofing**: Bob inserts fake mood log into `users/alice/moodLogs/mood1` -> REJECTED.

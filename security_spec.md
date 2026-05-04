# Security Specification - My Portfolio

## Data Invariants
1. A project must have a title and createdAt timestamp.
2. Only the authenticated owner (verified email) can create, update, or delete projects and blog posts.
3. Anyone can read published blog posts and projects.
4. Anyone can submit a contact message, but only the owner can read or delete them.
5. All IDs must be strictly validated.
6. Only the owner can update the profile data.

## The Dirty Dozen Payloads (Rejection Tests)
1. **Unauthorized Write**: Unauthenticated user trying to create a project.
2. **Identity Spoofing**: User A trying to update a project.
3. **Shadow Update**: Adding a field `isAdmin: true` to a profile document.
4. **Invalid Type**: Sending a boolean for `title`.
5. **Too Long ID**: Using a 1KB string as document ID.
6. **Malicious Link**: Injecting a large string into `liveUrl`.
7. **Bypassing Verification**: Writing with an unverified email.
8. **Resource Poisoning**: Sending a 1MB string in `description`.
9. **State Shortcut**: Changing a blog post status to 'published' without owning it.
10. **Timestamp Fraud**: Providing a future timestamp instead of server time.
11. **Orphaned Record**: Creating a blog post without a verified author context.
12. **PII Leak**: Accessing the `messages` collection without being the owner.

## Firestore Rules Pattern
- **isValidId**: Matches `^[a-zA-Z0-9_\-]+$` and size <= 128.
- **isOwner**: Checks if `request.auth.uid` is the designated owner UID.
- **Strict Keys**: Enforces exact field sets for creation and specific white-lists for updates.
- **Terminal State**: Once a message is sent, it cannot be edited.

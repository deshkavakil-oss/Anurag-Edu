# Security Specification — ANURAG EDUCATION CENTER

## 1. Data Invariants
1. **Owner-Only Private Learning Records**: `users`, `student_profiles`, `conversations`, `messages`, `question_history`, `quiz_attempts`, `notes`, `study_plans`, `folders`, `uploaded_files`, `bookmarks`, and `notifications` can only be read or modified by their owning `userId` (`request.auth.uid`) or a verified administrator.
2. **Verified Student Gate**: Protected learning mutations require `request.auth.token.email_verified == true`. Unverified accounts can only initialize their own `users/{uid}` and `student_profiles/{uid}` registration record.
3. **No Self-Assigned Admin Privileges**: Students cannot create `admins/{uid}` documents or set `role: "admin"` on `users/{uid}`.
4. **PII Isolation in Public Library**: `public_questions` and `community_posts` forbid storing raw emails or personal identifiers; only `authorAlias` and anonymized/consented Q&A content are published.
5. **Blog Moderation Integrity**: Students can only create `blogs` with `status: "draft"`; only verified admins can publish blogs (`status: "published"`).
6. **Parent Progress Privacy**: `parent_progress/{shareCode}` only stores aggregated metrics (`studyHours`, `testsTaken`, `averageAccuracy`, `weakTopics`) and never exposes private questions, conversations, or uploaded files. Global listing is forbidden (`allow list: if isOwner || isAdmin`).

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Privilege Escalation on Registration**: `POST /users/{uid}` with `{ role: "admin", ... }` -> Denied by `incoming().role == 'student'`.
2. **Admin Collection Spoofing**: `SET /admins/{attackerUid}` by non-admin -> Denied by `isAdmin()`.
3. **Unverified User Learning Write**: `CREATE /notes/{id}` when `email_verified == false` -> Denied by `isVerified()`.
4. **Cross-User History Read**: `GET /question_history/{victimDoc}` by another student -> Denied by `existing().userId == request.auth.uid`.
5. **Blanket List Scraping**: `LIST /student_profiles` by any non-admin student -> Denied by `resource.data.userId == request.auth.uid`.
6. **Shadow Field Injection on Profile Update**: `UPDATE /student_profiles/{uid}` adding `isAdmin: true` -> Denied by `affectedKeys().hasOnly(...)` and `isValidStudentProfile`.
7. **Unauthorized Blog Publishing**: `CREATE /blogs/{id}` with `status: "published"` by non-admin -> Denied by `incoming().status == 'draft' || isAdmin()`.
8. **ID Poisoning**: `CREATE /notes/{2000_char_id}` -> Denied by `isValidId(noteId)`.
9. **Parent Snapshot List Scraping**: `LIST /parent_progress` by unauthenticated user -> Denied by `isOwner || isAdmin`.
10. **Owner Immutability Tampering**: `UPDATE /notes/{id}` changing `userId` -> Denied by `incoming().userId == existing().userId`.
11. **Timestamp Forgery**: `CREATE /quiz_attempts/{id}` with backdated `createdAt` != `request.time` -> Denied by `incoming().createdAt == request.time`.
12. **Subcollection Orphan Write**: `CREATE /conversations/{otherUidConv}/messages/{msgId}` -> Denied by Master Gate `get()` on parent conversation.

# Product requirements (checklist)

## From initial template (in scope)

- [x] **Articles (posts)** — title, slug, layout blocks, categories, authors; draft/publish; frontend at e.g. `/posts/[slug]`.
- [x] **Categories** — taxonomy for articles; nested; used for filtering/grouping.
- [x] **Authors** — users as authors on articles; one or more per post; populated for frontend (e.g. name).

## Learning platform

- [ ] Courses with an ordered list of **course blocks** only. Block types: **video** (YouTube link), **rich text with images**, **file** (PDF or presentation). Light theme only.
- [ ] Quizzes: questions (e.g. single choice), correct answer; **answers are stored**; **one attempt per user** (quiz cannot be retaken).
- [ ] Learner accounts: register, login, save progress (blocks completed, quiz answers stored).
- [ ] Progress: mark blocks complete, store quiz attempt and answers (no retakes); show progress in UI.
- [ ] Certificate: generate PDF when course is completed; **everyone who completed the course can receive it**; optionally include quiz results on the certificate; user can download.
- [ ] Course viewer with progress (progress bar, completed blocks, saved position) is **only visible to authorized users**; anonymous users see course list and must log in to view courses and save progress.
- [ ] Public frontend: list courses; for authenticated users: open course → blocks + prev/next, progress, take quiz, see progress.
- [ ] Ukrainian as main language (UI strings, content).
- [ ] Light theme only for the public site (no dark mode).
- [ ] Admin view of enrollments / completions.
- [ ] Email (e.g. certificate link, welcome).
- [ ] More quiz types (multiple choice, open answer).
- [ ] Certificates with custom branding/templates.

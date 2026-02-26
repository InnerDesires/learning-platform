# Auth and registration

## Registration

- **Who can register** — Anyone (teens, parents, visitors with the link). Open registration; no invite-only or domain restriction unless added later.
- **Fields** — Email (unique), password, optional display name (e.g. for certificate). All labels and messages in Ukrainian.
- **Password** — Minimum length and complexity (e.g. 8+ characters; add strength rules if needed). Validation errors in Ukrainian.
- **Email verification** — Optional: require verified email before saving progress, or allow immediate use after sign-up (decide later).
- **After sign-up** — User is logged in and can use the course viewer with progress immediately (or after email verification if enabled).
- **UI** — Registration form on the public site (light theme, Ukrainian). Link from header/course list (“Реєстрація” / “Register”).

## Login

- **Method** — Email + password. Same credentials as Payload admin (learners use frontend login only unless they are also admins).
- **UI** — Login form on the public site (light theme, Ukrainian). Link from header/course list (“Увійти” / “Log in”).
- **Forgot password** — User can request a reset link by email; link leads to a page to set a new password. Messages in Ukrainian.
- **Session** — User stays logged in until they log out or session expires (e.g. cookie-based; exact duration can follow Payload defaults).

## Logout

- **Logout** — Clear session; user becomes anonymous. Link visible when logged in (e.g. “Вийти” / “Log out”).

## Roles

- **Learner** — Registered user; can use course viewer with progress, take quizzes, get certificates. No access to Payload admin.
- **Admin** — Created via Payload admin or seed; can manage courses, blocks, quizzes, and (later) view enrollments/completions. Access to Payload admin panel.

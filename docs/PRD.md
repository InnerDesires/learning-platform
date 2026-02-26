# Learning Platform — Product Requirements (PRD)

High-level product definition. Detailed specs live in `docs/` and are linked below.

---

## Overview

**Public learning platform for teens who participate in Iron Squad camp.**  
Users view courses, complete quizzes, and get PDF certificates. Accounts save progress. The site also includes **articles** (blog), **categories**, and **authors** from the initial template. Ukrainian as main language; light theme only.

---

## Goals & users

| | |
|---|---|
| **Who** | Teens in Iron Squad camp (and anyone with the link) |
| **What** | View courses, take quizzes, earn PDF certificates, save progress with an account |
| **Why** | Structured learning tied to the camp; certificates as proof of completion |

---

## Core concepts

- **Course** — Learning path with an ordered list of **course blocks** and optionally a quiz.
- **Course block** — One of: **video** (YouTube link), **rich text with images**, **file** (PDF/presentation). Order matters.
- **Quiz** — Attached to a course; answers stored; one attempt per user (no retakes). Quiz results on certificate optional.
- **Progress** — Per user: blocks completed, quiz attempt (if any), course completion.
- **Certificate** — PDF when user completes the course. Everyone who completes gets it; optional quiz results on certificate.
- **User (learner)** — Account to save progress; no Payload admin access unless also admin.
- **Articles** — Blog-style posts from the initial template; have title, slug, content (layout blocks), categories, and authors.
- **Categories** — Taxonomy for grouping articles (e.g. nested); from the initial template.
- **Authors** — Users linked to articles; an article can have one or more authors (from the initial template).

---

## Specs and requirements

| Doc | Contents |
|-----|----------|
| [Auth and registration](auth.md) | Registration, login, logout, forgot password, roles |
| [User flows](user-flows.md) | Anonymous, with account, admin (step-by-step) |
| [Design](design.md) | Language, theme, tone |
| [Data model](data-model.md) | Entities, relations, tech context |
| [Requirements](requirements.md) | Full checklist (courses, quizzes, progress, certificate, etc.) |

---

## Open questions / to clarify

- **Anonymous access** — Can anonymous users open a course at all (read-only, no progress) or must they log in to open any course? (Currently “either” in user flows.)
- **Email verification** — Require verified email before saving progress, or allow use right after sign-up?
- **File block** — Which presentation formats (e.g. PPTX, ODP)? Max file size?
- **Certificate content** — Which fields on the PDF (name, course name, date, optional quiz score)?
- **Quiz timing** — When can the quiz be taken: only after all blocks are completed, or anytime?
- **Course list** — Sort order (e.g. by date, manual)? Filters or search?
- **SEO** — Should course/certificate pages be indexable by search engines or behind login only?

---

*Last updated: 2025-02-25*

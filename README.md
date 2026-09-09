# Skill Development Institute Platform

A production-ready **Skill Development Education Institute Website + Student LMS + Office/Admin Management Portal** built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, and MongoDB/Mongoose.

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 (CSS-first configuration)
- **Database**: MongoDB with Mongoose
- **Validation**: Zod
- **Fonts**: Geist (via `next/font`)

## Project Structure

```
app/
├── (public)/           # Public website routes (home, courses, about, contact)
├── (auth)/             # Auth routes (login, register) — foundation only
├── api/                # API route handlers (health check, future endpoints)
├── office/             # Office/admin portal shell — foundation only
├── student/            # Student portal shell — foundation only
├── layout.tsx          # Root layout with metadata, fonts, skip link
├── globals.css         # Design system (colors, typography, shadows, radius)
├── loading.tsx         # Route-level loading UI
├── error.tsx           # Route segment error boundary
├── global-error.tsx    # Global error boundary
└── not-found.tsx       # 404 page

components/
├── ui/                 # Reusable design system primitives
│   ├── button.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── textarea.tsx
│   ├── modal.tsx
│   ├── container.tsx
│   ├── section-heading.tsx
│   ├── field.tsx
│   ├── loading.tsx
│   ├── empty-state.tsx
│   └── error-state.tsx
├── layout/             # Shell components
│   ├── header.tsx      # Responsive header with mobile menu
│   ├── footer.tsx      # Footer with navigation, categories, contact
│   └── logo.tsx        # Institute logo (from siteConfig)
└── public/             # Public page sections
    ├── hero-section.tsx
    ├── intro-section.tsx
    ├── category-grid.tsx
    ├── popular-courses-section.tsx
    ├── course-card.tsx
    ├── why-choose-us-section.tsx
    ├── benefits-section.tsx
    ├── career-section.tsx
    └── cta-section.tsx

lib/
├── config/
│   ├── site.ts         # Centralized branding (name, tagline, contact, nav)
│   ├── env.ts          # Server-only env access with validation
│   └── catalog.ts      # Canonical 5 categories × 16 courses (source of truth)
├── db/
│   └── connect.ts      # MongoDB connection with global cache (no hot-reload leaks)
├── mongodb/
│   ├── models.ts       # Central model registry (single import point)
│   └── model-registry.ts # defineModel guard against dev overwrites
├── constants/
│   └── index.ts        # All enums: roles, statuses, levels, priorities
├── validations/
│   ├── common.ts       # Shared Zod primitives (ObjectId, slug, email, phone)
│   ├── user.ts         # User auth/input schemas (foundation)
│   └── course.ts       # Course CRUD schemas (foundation)
└── utils/
    └── cn.ts           # clsx + tailwind-merge helper

models/
├── User.ts             # Student + staff (roles, status, passwordHash placeholder)
├── Category.ts         # Course categories
├── Course.ts           # 16 courses, isDisplayed/isBundleable flags for admin control
├── Module.ts           # Ordered module groups per course
├── Lesson.ts           # Video/text lessons, preview flag, YouTube-ready fields
├── Enrollment.ts       # Student↔Course link, paymentStatus for Razorpay phase
├── Progress.ts         # Per-lesson completion (not_started/in_progress/completed)
├── Assignment.ts       # Foundation schema (instructions, maxScore, dueAt)
├── Quiz.ts             # Foundation schema (questions, passingScore, duration)
├── Certificate.ts      # Issued certificates (unique number, status, revocation)
├── Announcement.ts     # Staff notices (audience targeting, publish/expiry)
└── SupportTicket.ts    # Student↔Staff threads (status, priority, assignment)

types/
├── common.ts           # BaseDocument, ApiResponse, Pagination, MongoId
├── user.ts             # Client-safe User, PublicStudentProfile
├── course.ts           # Category, Course, CourseSummary
└── enrollment.ts       # Enrollment, Progress (serialized shapes)

public/
└── assets/logo.svg     # Placeholder logo (replace with client's)
```

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in real values:

```bash
cp .env.local.example .env.local
```

| Variable | Scope | Required | Description |
|----------|-------|----------|-------------|
| `MONGODB_URI` | Server | Yes | MongoDB connection string |
| `NEXT_PUBLIC_APP_URL` | Public | Yes | Canonical site URL |
| `RAZORPAY_KEY_ID` | Server | Phase 2+ | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Server | Phase 2+ | Razorpay key secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Public | Phase 2+ | Exposed checkout key |
| `RESEND_API_KEY` | Server | Phase 2+ | Resend API key |
| `RESEND_FROM_EMAIL` | Server | Phase 2+ | Sender email address |
| `CLOUDINARY_CLOUD_NAME` | Server | Phase 2+ | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Server | Phase 2+ | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Server | Phase 2+ | Cloudinary API secret |
| `NEXT_PUBLIC_YOUTUBE_ENABLED` | Public | Phase 2+ | Toggle YouTube embeds |

**Security Rules:**
- Only `NEXT_PUBLIC_*` variables are embedded in client bundles
- Never import `lib/config/env.ts` from client components
- `.env.local` is git-ignored; never commit secrets

## Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

## Phase 1 Scope (Complete)

✅ **Completed in Phase 1:**

- Next.js 16 App Router structure with route groups
- MongoDB connection utility with global cache (dev + prod safe)
- All 11 foundational Mongoose models with proper relationships
- Role architecture: `STUDENT`, `SUPER_ADMIN`, `OFFICE_STAFF`, `CONTENT_MANAGER`, `FACULTY`
- Centralized branding config (`lib/config/site.ts`) — no hardcoded institute info
- Professional design system (colors, typography, spacing, radius, shadows)
- Responsive header/footer with mobile menu, skip link, focus-visible states
- Homepage with 8 composed sections (hero, intro, categories, courses, why-us, benefits, career, CTA)
- Reusable UI primitives: Button, Card, Badge, Input, Select, Textarea, Modal, Container, SectionHeading, Field, Loading, EmptyState, ErrorState
- Accessible forms foundation (aria labels, error/hint wiring, focus management)
- 404 page, global error boundary, route error boundary, loading UI
- Zod validation schemas for users and courses (shared primitives)
- Course catalog as source of truth (5 categories, 16 courses — no hardcoded counts)
- Environment config with clear public/secret separation
- ESLint + TypeScript strict mode passing
- Production build successful

## Phase 1 — Intentionally NOT Implemented

These belong to later phases:

- Student registration / login / password reset
- Session management / JWT / cookies
- Student dashboard (courses, progress, assignments, certificates)
- Office/admin dashboard (CRUD, analytics, user management)
- Course enrollment flow
- Razorpay payment integration
- Resend email integration
- Cloudinary upload (images, PDFs, documents)
- Assignment submission / grading
- Quiz engine (attempts, scoring, randomized options)
- Certificate PDF generation / verification
- Full RBAC / permission matrix
- Admin CRUD for courses, categories, modules, lessons
- Announcements / support ticket UI
- YouTube video embeds in lessons

## Architecture Decisions

1. **Models are registered once** via `defineModel` guard — safe under Next.js hot reload
2. **All constants in `lib/constants`** — single source of truth for enums used by models, validations, and UI
3. **Catalog is data-driven** — UI derives counts from arrays, never hardcodes "16 courses"
4. **Server-only env access** — `lib/config/env.ts` throws early with clear messages
5. **Client-safe types** — `types/*` never include password hashes or server secrets
6. **Design system in CSS** — Tailwind v4 `@theme` defines tokens; components use semantic utilities
7. **No dark mode** — light theme only by design for consistent professional appearance
8. **Accessibility first** — semantic HTML, focus-visible, skip links, aria attributes, reduced-motion respect

## Verification Checklist

- [x] `npm run dev` starts without errors
- [x] `npm run build` compiles successfully (static + dynamic routes)
- [x] `npm run lint` passes
- [x] `npx tsc --noEmit` passes
- [x] MongoDB connection utility caches correctly (no duplicate connections on HMR)
- [x] `.env.local` is git-ignored (only `.env.local.example` tracked)
- [x] No secret keys in client bundles (`NEXT_PUBLIC_` only for safe values)
- [x] All UI components compile and render
- [x] Responsive layouts work at 320px, 375px, 768px, 1024px, 1280px, 1440px+

## Next Steps (Phase 2+)

1. **Authentication** — register, login, JWT/session, password reset
2. **Student Portal** — dashboard, my courses, progress tracking, assignments
3. **Office Portal** — CRUD for courses/categories/modules/lessons, user management
4. **Payments** — Razorpay integration, enrollment activation
5. **Content Delivery** — video lessons, Cloudinary uploads, PDF resources
6. **Assessment** — assignment submission, quiz engine, grading
7. **Certificates** — PDF generation, verification page
8. **Communications** — Resend emails, announcements, support tickets
9. **RBAC** — permission matrix, role-based route guards
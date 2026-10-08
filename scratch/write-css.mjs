import { writeFileSync } from 'fs';

const css = `/* ==========================================================================
   PUBLIC THEME — EDUCATIONAL IDENTITY
   Deep academic indigo + warm amber. Inspired by Coursera, upGrad, Simplilearn.
   All rules scoped inside .public-theme to protect internal pages.
   ========================================================================== */

/* ---------- Design tokens ---------- */
.public-theme {
  --edu-900: #0f1f5c;
  --edu-800: #1a2f7a;
  --edu-700: #1e3a96;
  --edu-600: #2346b8;
  --edu-500: #3259d4;
  --edu-400: #5b7de8;
  --edu-300: #93aff4;
  --edu-200: #c5d5fb;
  --edu-100: #e4ebfd;
  --edu-50:  #f0f4ff;
  --amb-600: #c96b00;
  --amb-500: #e07c00;
  --amb-400: #f59e0b;
  --amb-300: #fbbf24;
  --amb-200: #fde68a;
  --amb-100: #fef3c7;
  --amb-50:  #fffbeb;
  --teal-600: #0d7a6b;
  --teal-500: #0f8a78;
  --teal-400: #14b8a6;
  --teal-100: #d5f5f1;
  --surface:        #fafbff;
  --surface-warm:   #fffdf8;
  --surface-muted:  #f4f6fc;
  --surface-inset:  #e9edf9;
  --border:         #dde3f2;
  --border-strong:  #b8c4e8;
  --text-primary:   #0e1b4a;
  --text-body:      #3d4f7c;
  --text-muted:     #6577a8;
  --text-subtle:    #8e9ec8;
  --shadow-sm:   0 2px 8px -2px rgb(14 27 74 / 0.10);
  --shadow-md:   0 8px 24px -8px rgb(14 27 74 / 0.18);
  --shadow-lg:   0 20px 50px -20px rgb(14 27 74 / 0.28);
  --shadow-xl:   0 32px 80px -28px rgb(14 27 74 / 0.38);
  --shadow-card: 0 1px 3px rgb(14 27 74 / 0.08), 0 8px 28px -14px rgb(14 27 74 / 0.18);
  --shadow-card-hover: 0 2px 6px rgb(14 27 74 / 0.06), 0 20px 50px -18px rgb(14 27 74 / 0.32);
  --radius-sm:  0.5rem;
  --radius-md:  0.85rem;
  --radius-lg:  1.25rem;
  --radius-xl:  1.75rem;
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  background: var(--surface);
  color: var(--text-primary);
  min-height: 100%;
  overflow: clip;
}

.public-theme main { background: var(--surface); }
.public-theme ::selection { background: var(--edu-200); color: var(--edu-900); }
.public-theme :focus-visible { outline: 2px solid var(--edu-500); outline-offset: 3px; border-radius: 3px; }

.public-theme h1, .public-theme h2, .public-theme h3,
.public-theme h4, .public-theme h5, .public-theme h6 {
  font-family: var(--font-sans), "Inter", system-ui, sans-serif;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--text-primary);
  line-height: 1.15;
}

/* ---- Shared Primitives ---- */
.education-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--edu-600);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  background: var(--edu-50);
  border: 1px solid var(--edu-200);
  border-radius: 999px;
  padding: 0.35rem 0.85rem;
}

.education-section-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 2rem;
  margin-bottom: 2.5rem;
}

.education-section-heading h2 {
  max-width: 680px;
  margin-top: 0.75rem;
  font-size: clamp(2rem, 3.8vw, 3.2rem);
  font-weight: 800;
  line-height: 1.12;
  color: var(--text-primary);
}

.education-section-heading > p {
  max-width: 360px;
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.7;
  flex-shrink: 0;
}

.education-section-heading-center {
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.9rem;
  max-width: 780px;
  margin-inline: auto;
}

.education-section-heading-center > p { max-width: 580px; }

.education-text-link {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.45rem;
  color: var(--edu-600);
  font-size: 0.82rem;
  font-weight: 800;
  text-decoration: none;
  transition: color 160ms ease, gap 160ms ease;
}

.education-text-link:hover { color: var(--edu-800); gap: 0.65rem; }

/* ---- Buttons ---- */
.education-primary-button,
.education-secondary-button,
.education-outline-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  border-radius: var(--radius-sm);
  font-size: 0.88rem;
  font-weight: 800;
  cursor: pointer;
  transition: transform 180ms var(--ease-out), background 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
  text-decoration: none;
  white-space: nowrap;
  min-height: 3rem;
  padding: 0.7rem 1.4rem;
  border: 2px solid transparent;
}

.education-primary-button {
  background: var(--edu-700);
  color: white;
  box-shadow: 0 4px 16px -6px rgb(30 58 150 / 0.6);
}

.education-primary-button:hover {
  background: var(--edu-800);
  transform: translateY(-2px);
  box-shadow: 0 10px 30px -10px rgb(30 58 150 / 0.65);
}

.education-secondary-button {
  background: white;
  color: var(--edu-700);
  border-color: var(--edu-200);
  box-shadow: var(--shadow-sm);
}

.education-secondary-button:hover {
  border-color: var(--edu-400);
  background: var(--edu-50);
  transform: translateY(-1px);
}

.education-outline-button { background: transparent; color: white; border-color: rgba(255,255,255,0.4); }
.education-outline-button:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.7); }

.education-amber-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  border-radius: var(--radius-sm);
  font-size: 0.88rem;
  font-weight: 800;
  cursor: pointer;
  min-height: 3.2rem;
  padding: 0.75rem 1.5rem;
  background: var(--amb-400);
  color: #1a1200;
  border: 2px solid transparent;
  box-shadow: 0 4px 18px -6px rgb(245 158 11 / 0.55);
  transition: transform 180ms var(--ease-out), background 180ms ease, box-shadow 180ms ease;
  text-decoration: none;
  white-space: nowrap;
}

.education-amber-button:hover {
  background: var(--amb-300);
  transform: translateY(-2px);
  box-shadow: 0 12px 32px -10px rgb(245 158 11 / 0.6);
}

/* ---- Header ---- */
.public-header {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid var(--border);
  background: rgb(250 251 255 / 0.95);
  backdrop-filter: blur(20px) saturate(1.5);
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
}

.public-header-inner {
  display: grid;
  min-height: 4.5rem;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 2rem;
}

.public-nav { justify-self: center; }
.public-nav-list { display: flex; align-items: center; gap: 0.25rem; }

.public-nav-link {
  position: relative;
  padding: 0.55rem 0.85rem;
  color: var(--text-body);
  font-size: 0.82rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  transition: background 160ms ease, color 160ms ease;
  text-decoration: none;
}

.public-nav-link:hover, .public-nav-link[aria-current="page"] { background: var(--edu-50); color: var(--edu-700); }
.public-nav-link[aria-current="page"] { font-weight: 700; }
.public-header-actions { display: flex; align-items: center; gap: 0.55rem; }

.public-login {
  padding: 0.55rem 0.9rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-body);
  border-radius: var(--radius-sm);
  transition: background 160ms ease, color 160ms ease;
  text-decoration: none;
}

.public-login:hover { background: var(--surface-muted); color: var(--edu-700); }

.public-button-dark {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 2.5rem;
  padding: 0.55rem 1.1rem;
  border-radius: var(--radius-sm);
  border: 2px solid var(--edu-700);
  background: var(--edu-700);
  color: white;
  font-size: 0.8rem;
  font-weight: 800;
  transition: background 160ms ease, transform 160ms ease;
  text-decoration: none;
}

.public-button-dark:hover { background: var(--edu-800); border-color: var(--edu-800); transform: translateY(-1px); }
.public-register { border-radius: var(--radius-sm); }

.public-mobile-toggle {
  display: none;
  height: 2.75rem;
  width: 2.75rem;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-body);
  transition: background 160ms ease;
}

.public-mobile-toggle:hover { background: var(--surface-muted); }
.public-mobile-menu { border-top: 1px solid var(--border); background: var(--surface); }

/* ---- HERO — Dark indigo background ---- */
.education-hero {
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, var(--edu-900) 0%, #1a2f8a 40%, #1e3a96 70%, #0e2060 100%);
}

.education-hero::before {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px);
  background-size: 28px 28px;
  content: "";
  pointer-events: none;
  mask-image: linear-gradient(135deg, black 0%, transparent 65%);
}

.education-hero::after {
  position: absolute;
  bottom: -10rem;
  right: -5rem;
  width: 50rem;
  height: 50rem;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 65%);
  content: "";
  pointer-events: none;
}

.education-hero-grid {
  position: relative;
  z-index: 1;
  display: grid;
  min-height: 680px;
  grid-template-columns: 1fr 1fr;
  gap: clamp(3rem, 6vw, 6rem);
  align-items: center;
  padding-block: clamp(4rem, 7vw, 6rem);
}

.education-hero-copy > .education-eyebrow {
  background: rgba(255,255,255,0.12);
  border-color: rgba(255,255,255,0.22);
  color: #fde68a;
}

.education-hero-copy h1 {
  max-width: 640px;
  margin-top: 1.25rem;
  color: white;
  font-size: clamp(2.8rem, 4.8vw, 5rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.education-hero-copy h1 span { color: var(--amb-300); display: block; }

.education-hero-copy > p {
  max-width: 560px;
  margin-top: 1.4rem;
  color: rgba(255,255,255,0.78);
  font-size: clamp(1rem, 1.4vw, 1.12rem);
  line-height: 1.72;
}

.education-search {
  display: grid;
  max-width: 580px;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0;
  margin-top: 2rem;
  border: 2px solid rgba(255,255,255,0.22);
  border-radius: var(--radius-md);
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(12px);
  overflow: hidden;
  transition: border-color 200ms ease, background 200ms ease;
}

.education-search:focus-within { border-color: rgba(255,255,255,0.55); background: rgba(255,255,255,0.16); }
.education-search > svg { color: rgba(255,255,255,0.65); margin-left: 1rem; flex-shrink: 0; }

.education-search input {
  min-width: 0;
  padding: 0.85rem 0.75rem;
  border: 0;
  outline: 0;
  background: transparent;
  color: white;
  font-size: 0.92rem;
  font-family: inherit;
}

.education-search input::placeholder { color: rgba(255,255,255,0.5); }

.education-search button {
  margin: 0.45rem;
  min-height: 2.6rem;
  padding-inline: 1.2rem;
  border-radius: 0.6rem;
  background: var(--amb-400);
  color: #1a1200;
  font-size: 0.82rem;
  font-weight: 800;
  white-space: nowrap;
  transition: background 160ms ease;
  border: none;
  cursor: pointer;
}

.education-search button:hover { background: var(--amb-300); }

.education-hero-categories {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.65rem;
  margin-top: 1.25rem;
  color: rgba(255,255,255,0.6);
  font-size: 0.75rem;
}

.education-hero-categories > span { font-weight: 800; color: rgba(255,255,255,0.55); }

.education-hero-categories a {
  padding: 0.3rem 0.7rem;
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 999px;
  color: rgba(255,255,255,0.85);
  font-weight: 600;
  font-size: 0.72rem;
  transition: background 160ms ease, border-color 160ms ease;
  text-decoration: none;
}

.education-hero-categories a:hover { background: rgba(255,255,255,0.14); border-color: rgba(255,255,255,0.5); color: white; }

.education-hero-stats {
  display: flex;
  gap: 2rem;
  margin-top: 2rem;
  padding-top: 1.75rem;
  border-top: 1px solid rgba(255,255,255,0.16);
}

.education-hero-stat strong { display: block; color: white; font-size: 1.5rem; font-weight: 800; line-height: 1; }
.education-hero-stat span { display: block; margin-top: 0.25rem; color: rgba(255,255,255,0.55); font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; }

.education-hero-visual { position: relative; height: 560px; }

.education-hero-photo {
  position: absolute;
  inset: 1rem 0 0 1rem;
  overflow: hidden;
  border-radius: 1.5rem 1.5rem 1.5rem 4rem;
  box-shadow: var(--shadow-xl), 0 0 0 1px rgba(255,255,255,0.1);
}

.education-hero-photo::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 55%, rgba(14,32,96,0.5));
  content: "";
}

.education-lesson-card {
  position: absolute;
  z-index: 2;
  right: -1.5rem;
  bottom: 3.5rem;
  display: grid;
  width: min(340px, 88%);
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: white;
  box-shadow: var(--shadow-xl);
}

.education-lesson-icon {
  display: grid;
  width: 2.8rem;
  height: 2.8rem;
  place-items: center;
  border-radius: 50%;
  background: var(--edu-50);
  color: var(--edu-700);
  flex-shrink: 0;
}

.education-lesson-card small { display: block; color: var(--text-subtle); font-size: 0.64rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
.education-lesson-card strong { display: block; margin-top: 0.15rem; color: var(--text-primary); font-size: 0.84rem; line-height: 1.3; }

.education-lesson-card > a {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border-radius: 50%;
  background: var(--edu-700);
  color: white;
  flex-shrink: 0;
  transition: background 160ms ease;
  text-decoration: none;
}

.education-lesson-card > a:hover { background: var(--edu-800); }

.education-progress-card {
  position: absolute;
  z-index: 2;
  top: 0;
  left: -1.5rem;
  width: 160px;
  padding: 1rem 1rem 0.85rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: white;
  box-shadow: var(--shadow-lg);
}

.education-progress-card strong { display: block; color: var(--edu-700); font-size: 2rem; font-weight: 800; line-height: 1; }
.education-progress-card > span { display: block; margin-top: 0.2rem; color: var(--text-muted); font-size: 0.7rem; font-weight: 600; }

.education-progress-card > div {
  height: 5px;
  margin-top: 0.75rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--surface-inset);
}

.education-progress-card i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--teal-400), var(--teal-500));
}

.education-progress-card small { display: block; margin-top: 0.5rem; color: var(--text-subtle); font-size: 0.62rem; line-height: 1.4; }

/* ---- Trust Bar ---- */
.education-trust-bar { border-block: 1px solid var(--border); background: white; padding: 0.9rem 0; }

.education-trust-bar-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(1.5rem, 4vw, 4rem);
  flex-wrap: wrap;
}

.education-trust-item { display: inline-flex; align-items: center; gap: 0.55rem; color: var(--text-body); font-size: 0.8rem; font-weight: 600; }
.education-trust-item svg { color: var(--teal-500); }

/* ---- Course Categories ---- */
.education-categories { padding-block: clamp(4.5rem, 8vw, 7rem); background: var(--surface-muted); }

.education-category-list {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
}

.education-category-list li a {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 175px;
  padding: 1.2rem;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  background: white;
  text-decoration: none;
  transition: transform 200ms var(--ease-out), border-color 200ms ease, box-shadow 200ms ease;
}

.education-category-list li a:hover { transform: translateY(-5px); border-color: var(--edu-300); box-shadow: var(--shadow-card-hover); }

.education-category-icon {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  border-radius: 0.75rem;
  background: var(--edu-100);
  color: var(--edu-700);
  flex-shrink: 0;
}

.education-category-list [data-color="teal"] .education-category-icon { background: var(--teal-100); color: var(--teal-600); }
.education-category-list [data-color="orange"] .education-category-icon { background: var(--amb-100); color: var(--amb-600); }
.education-category-list [data-color="violet"] .education-category-icon { background: #f3edff; color: #7655bd; }
.education-category-list [data-color="green"] .education-category-icon { background: #edf7e7; color: #3d7a26; }
.education-category-list li a > span:nth-child(2) { margin-top: auto; padding-top: 1rem; }
.education-category-list strong { display: block; color: var(--text-primary); font-size: 0.88rem; font-weight: 700; line-height: 1.3; }
.education-category-list small { display: block; margin-top: 0.3rem; color: var(--text-subtle); font-size: 0.68rem; font-weight: 600; }
.education-category-arrow { margin-top: 0.7rem; align-self: flex-end; color: var(--text-subtle); transition: transform 180ms ease, color 180ms ease; }
.education-category-list a:hover .education-category-arrow { transform: translateX(4px); color: var(--edu-600); }

/* ---- Popular Courses ---- */
.education-courses { padding-block: clamp(4.5rem, 8vw, 7rem); background: white; }

.education-course-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.education-course-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  background: white;
  box-shadow: var(--shadow-card);
  transition: transform 200ms var(--ease-out), box-shadow 200ms ease, border-color 200ms ease;
}

.education-course-card:hover { transform: translateY(-6px); border-color: var(--edu-200); box-shadow: var(--shadow-card-hover); }

.education-course-image {
  position: relative;
  display: block;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: var(--surface-inset);
  flex-shrink: 0;
}

.education-course-image img { transition: transform 500ms cubic-bezier(0.2, 0.75, 0.2, 1); }
.education-course-card:hover .education-course-image img { transform: scale(1.04); }

.education-course-image > span {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  padding: 0.3rem 0.6rem;
  border-radius: 0.4rem;
  background: rgba(14,27,74,0.84);
  color: white;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  backdrop-filter: blur(4px);
}

.education-course-body { display: flex; flex: 1; flex-direction: column; padding: 1.25rem; }
.education-course-category { display: inline-flex; align-items: center; color: var(--edu-700); font-size: 0.65rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 0.5rem; }
.education-course-body h3 { color: var(--text-primary); font-size: 1rem; font-weight: 700; line-height: 1.4; }
.education-course-body h3 a { text-decoration: none; color: inherit; transition: color 160ms ease; }
.education-course-body h3 a:hover { color: var(--edu-700); }

.education-course-description {
  display: -webkit-box;
  margin-top: 0.5rem;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 0.78rem;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.education-course-facts { display: flex; flex-wrap: wrap; gap: 0.6rem 1rem; margin-top: 0.85rem; color: var(--text-subtle); font-size: 0.7rem; }
.education-course-facts span { display: inline-flex; align-items: center; gap: 0.3rem; }

.education-course-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: auto;
  padding-top: 0.85rem;
  border-top: 1px solid var(--border);
}

.education-course-footer strong { color: var(--edu-800); font-size: 1rem; font-weight: 800; }

.education-course-footer a {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--edu-700);
  font-size: 0.75rem;
  font-weight: 800;
  text-decoration: none;
  transition: color 160ms ease, gap 160ms ease;
}

.education-course-footer a:hover { color: var(--edu-900); gap: 0.5rem; }

.education-empty {
  margin-top: 2rem;
  padding: 2rem;
  border: 1.5px dashed var(--border);
  border-radius: var(--radius-md);
  color: var(--text-muted);
  text-align: center;
  font-size: 0.9rem;
}

/* ---- Platform/Trust Section ---- */
.education-platform { padding-block: clamp(5rem, 9vw, 8.5rem); background: var(--surface-muted); }

.education-platform-grid {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: clamp(3rem, 7vw, 7rem);
  align-items: center;
}

.education-platform-visual {
  position: relative;
  min-height: 520px;
  overflow: hidden;
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
}

.education-platform-visual::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 55%, rgba(14,27,74,0.35));
  content: "";
  pointer-events: none;
}

.education-video-badge {
  position: absolute;
  z-index: 2;
  right: 1rem;
  bottom: 1rem;
  left: 1rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1rem;
  border-radius: var(--radius-md);
  background: rgba(255,255,255,0.95);
  color: var(--edu-700);
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow-md);
}

.education-video-badge small { display: block; color: var(--text-subtle); font-size: 0.65rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; }
.education-video-badge strong { display: block; margin-top: 0.1rem; color: var(--text-primary); font-size: 0.84rem; font-weight: 700; }
.education-platform-copy h2 { max-width: 560px; margin-top: 0.85rem; font-size: clamp(2.2rem, 4vw, 3.6rem); font-weight: 800; line-height: 1.1; }
.education-platform-copy > p { max-width: 540px; margin-top: 1.1rem; color: var(--text-muted); line-height: 1.75; font-size: 0.95rem; }
.education-platform-copy ul { margin-top: 1.75rem; }

.education-platform-copy li {
  display: flex;
  gap: 0.75rem;
  padding-block: 0.75rem;
  border-bottom: 1px solid var(--border);
  color: var(--text-body);
  font-size: 0.88rem;
  line-height: 1.55;
}

.education-platform-copy li:first-child { border-top: 1px solid var(--border); }
.education-platform-copy li svg { flex-shrink: 0; color: var(--teal-500); margin-top: 0.1rem; }

/* ---- Why Choose Us ---- */
.education-benefits { padding-block: clamp(5rem, 8vw, 7.5rem); background: var(--edu-900); }
.education-benefits .education-section-heading-center h2 { color: white; }
.education-benefits .education-eyebrow { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); color: var(--amb-200); }

.education-benefit-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }

.education-benefit-grid li {
  padding: 1.5rem;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: var(--radius-md);
  background: rgba(255,255,255,0.06);
  backdrop-filter: blur(8px);
  transition: background 200ms ease, border-color 200ms ease, transform 200ms var(--ease-out);
  list-style: none;
}

.education-benefit-grid li:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.22); transform: translateY(-3px); }

.education-benefit-grid li > span {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  border-radius: 0.75rem;
  background: rgba(255,255,255,0.12);
  color: var(--amb-300);
}

.education-benefit-grid h3 { margin-top: 1.1rem; color: white; font-size: 0.95rem; font-weight: 700; }
.education-benefit-grid p { margin-top: 0.45rem; color: rgba(255,255,255,0.58); font-size: 0.8rem; line-height: 1.65; }

/* ---- Learning Journey ---- */
.education-journey { padding-block: clamp(5rem, 9vw, 8rem); background: white; }

.education-journey-list {
  position: relative;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0;
}

.education-journey-list::before {
  position: absolute;
  top: 2.1rem;
  left: calc(10% + 1.5rem);
  right: calc(10% + 1.5rem);
  height: 2px;
  background: linear-gradient(90deg, var(--edu-200), var(--amb-200));
  content: "";
}

.education-journey-list li { position: relative; padding: 0 0.75rem; text-align: center; }

.education-step-number {
  position: absolute;
  top: -0.5rem;
  left: calc(50% + 1.4rem);
  z-index: 2;
  display: grid;
  width: 1.2rem;
  height: 1.2rem;
  place-items: center;
  border-radius: 50%;
  background: var(--amb-400);
  color: #1a1200;
  font-size: 0.6rem;
  font-weight: 900;
}

.education-step-icon {
  position: relative;
  z-index: 1;
  display: grid;
  width: 4.2rem;
  height: 4.2rem;
  margin-inline: auto;
  place-items: center;
  border: 2px solid var(--edu-200);
  border-radius: 50%;
  background: white;
  color: var(--edu-700);
  box-shadow: var(--shadow-sm);
  transition: background 200ms ease, border-color 200ms ease, color 200ms ease, box-shadow 200ms ease;
}

.education-journey-list li:hover .education-step-icon {
  background: var(--edu-700);
  border-color: var(--edu-700);
  color: white;
  box-shadow: var(--shadow-md);
}

.education-journey-list h3 { margin-top: 1.1rem; color: var(--text-primary); font-size: 0.9rem; font-weight: 700; line-height: 1.3; }
.education-journey-list p { margin-top: 0.4rem; color: var(--text-muted); font-size: 0.72rem; line-height: 1.55; }

/* ---- CTA Section ---- */
.education-cta { padding-block: clamp(4rem, 8vw, 7rem); background: var(--surface-muted); }

.education-cta-card {
  display: grid;
  min-height: 440px;
  grid-template-columns: 1.1fr 0.9fr;
  overflow: hidden;
  border-radius: var(--radius-xl);
  background: linear-gradient(135deg, var(--edu-900) 0%, var(--edu-800) 60%, #1e3a96 100%);
  color: white;
  box-shadow: var(--shadow-xl);
  position: relative;
}

.education-cta-card::before {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px);
  background-size: 24px 24px;
  content: "";
  pointer-events: none;
  mask-image: linear-gradient(to right, black, transparent 70%);
}

.education-cta-copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(2.5rem, 5vw, 5rem);
}

.education-cta-copy .education-eyebrow { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.22); color: var(--amb-200); }
.education-cta-copy h2 { max-width: 600px; margin-top: 1rem; color: white; font-size: clamp(2.2rem, 4.5vw, 4rem); font-weight: 800; line-height: 1.1; }
.education-cta-copy > p { max-width: 520px; margin-top: 1rem; color: rgba(255,255,255,0.7); line-height: 1.72; font-size: 0.95rem; }
.education-cta-copy > div { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 2rem; }

.education-cta-image { position: relative; min-height: 440px; }
.education-cta-image::after { position: absolute; inset: 0; background: linear-gradient(90deg, var(--edu-900) 0%, transparent 30%); content: ""; }

/* ---- Interior page hero ---- */
.public-page-hero {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(135deg, var(--edu-50) 0%, white 55%, var(--amb-50) 100%);
}

.public-page-hero::after { position: absolute; right: -8vw; bottom: -12vw; width: 35vw; aspect-ratio: 1; border: 1px solid var(--edu-100); border-radius: 50%; content: ""; }
.public-page-hero-grid { display: grid; min-height: 400px; grid-template-columns: 1.2fr 0.8fr; gap: 4rem; align-items: end; padding-block: 4.5rem 3rem; }
.public-page-title { max-width: 900px; font-size: clamp(3.2rem, 7vw, 6.8rem); font-weight: 800; line-height: 0.96; color: var(--text-primary); }
.public-page-title em { color: var(--edu-700); font-style: normal; }
.public-page-intro { align-self: end; padding-bottom: 0.7rem; color: var(--text-muted); line-height: 1.75; font-size: 0.95rem; }

/* ---- Kicker ---- */
.public-kicker { display: inline-flex; align-items: center; gap: 0.65rem; color: var(--edu-700); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.18em; line-height: 1; text-transform: uppercase; }
.public-kicker::before { width: 1.8rem; height: 2px; background: var(--amb-400); content: ""; }
.public-rule { border-top: 1px solid var(--border); }

/* ---- Shared editorial buttons ---- */
.public-button, .public-button-dark, .public-button-line {
  display: inline-flex;
  min-height: 3rem;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.75rem 1.3rem;
  border: 2px solid transparent;
  border-radius: var(--radius-sm);
  font-size: 0.84rem;
  font-weight: 800;
  text-decoration: none;
  transition: transform 180ms ease, background-color 180ms ease, color 180ms ease;
}

.public-button { border-color: var(--edu-700); background: var(--edu-700); color: white; }
.public-button-dark { background: var(--text-primary); color: white; border-color: var(--text-primary); }
.public-button-line { background: transparent; color: var(--text-primary); border-color: var(--border-strong); }
.public-button:hover, .public-button-dark:hover, .public-button-line:hover { transform: translateY(-2px); }
.public-button:hover { background: var(--edu-800); border-color: var(--edu-800); }
.public-button-dark:hover { background: var(--edu-700); border-color: var(--edu-700); }
.public-button-line:hover { background: var(--text-primary); color: white; }

/* ---- About ---- */
.about-story { padding: clamp(5rem, 10vw, 9rem) 0; }
.about-story-grid { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 5rem; align-items: center; }
.about-image-stack { position: relative; min-height: 620px; }
.about-image-main { position: absolute; inset: 0 14% 14% 0; overflow: hidden; border-radius: var(--radius-xl); }
.about-image-secondary { position: absolute; right: 0; bottom: 0; width: 46%; aspect-ratio: 4 / 5; overflow: hidden; border-radius: var(--radius-lg); border: 8px solid white; box-shadow: var(--shadow-md); }
.about-story-copy h2 { max-width: 720px; font-size: clamp(2.7rem, 5vw, 5rem); font-weight: 800; line-height: 0.98; }
.about-story-copy > p { margin-top: 2rem; max-width: 37rem; color: var(--text-muted); line-height: 1.8; }
.about-stats { display: grid; grid-template-columns: repeat(3, 1fr); margin-top: 3rem; border-block: 1px solid var(--border); }
.about-stat { padding: 1.4rem 0; }
.about-stat + .about-stat { padding-left: 1.4rem; border-left: 1px solid var(--border); }
.about-stat strong { display: block; font-size: clamp(2rem, 4vw, 3.5rem); font-weight: 800; color: var(--edu-700); }
.about-stat span { color: var(--text-muted); font-size: 0.72rem; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600; }

/* ---- Catalog ---- */
.catalog-shell { padding: 2.5rem 0 6rem; }
.catalog-toolbar { display: grid; grid-template-columns: 1fr auto; gap: 1rem; align-items: end; margin: 2rem 0; padding-block: 1.25rem; border-block: 1px solid var(--border); }
.catalog-layout { display: grid; grid-template-columns: 250px 1fr; gap: 3.5rem; }
.catalog-sidebar { position: sticky; top: 6.5rem; align-self: start; }
.catalog-sidebar > * { margin-bottom: 1.1rem; }
.catalog-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem; }
.catalog-grid > li { border: 0; }
.catalog-grid .education-course-card { color: var(--text-primary); }

/* ---- Course Detail ---- */
.course-detail-shell { padding-block: 2rem 5rem; }
.course-detail-hero { position: relative; display: grid; grid-template-columns: 1.05fr 0.95fr; min-height: 520px; border-block: 1px solid var(--border); }
.course-detail-copy { display: flex; flex-direction: column; justify-content: space-between; padding: 3rem 3.5rem 3rem 0; }
.course-detail-copy h1 { max-width: 720px; font-size: clamp(2.8rem, 5.5vw, 5.5rem); font-weight: 800; line-height: 0.98; color: var(--text-primary); }
.course-detail-copy p { max-width: 620px; color: var(--text-muted); line-height: 1.75; }
.course-detail-media { position: relative; min-height: 460px; overflow: hidden; }
.course-detail-media::after { position: absolute; inset: 0; box-shadow: inset 0 0 0 1px rgb(14 27 74 / 0.08); content: ""; }
.course-detail-badges { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.course-detail-badges > * { border: 1px solid var(--edu-200); border-radius: 999px; background: var(--edu-50); color: var(--edu-700); font-weight: 600; }
.course-detail-meta { display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 2rem; border-top: 1px solid var(--border); }
.course-detail-meta > div { padding: 1.2rem 1rem 0 0; }
.course-detail-meta strong { display: block; font-size: 0.95rem; color: var(--text-primary); }
.course-detail-meta span { color: var(--text-subtle); font-size: 0.7rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; }
.course-content-grid { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 4rem; margin-top: 4rem; }
.course-content-main > section { padding-block: 2.2rem; border-top: 1px solid var(--border); }
.course-content-main > section:first-child { border-top: 0; padding-top: 0; }
.course-sidebar-card { border: 1.5px solid var(--border); border-radius: var(--radius-md); background: white; box-shadow: var(--shadow-sm); }

/* ---- Legal ---- */
.legal-page { padding-block: clamp(4rem, 9vw, 8rem); }
.legal-article { max-width: 850px; margin-inline: auto; }
.legal-article > h1 { margin-top: 2rem; font-size: clamp(3rem, 7vw, 6rem); font-weight: 800; line-height: 0.95; color: var(--text-primary); }
.legal-article > p:nth-of-type(2) { margin-top: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--border); }
.legal-article > div { margin-top: 0; }
.legal-article section { display: grid; grid-template-columns: minmax(180px, 0.42fr) 1fr; gap: 2rem; padding-block: 2rem; border-bottom: 1px solid var(--border); }
.legal-article section h2 { font-family: var(--font-sans); font-size: 1rem; font-weight: 800; letter-spacing: -0.02em; }
.legal-article section p { margin-top: 0; color: var(--text-muted); }

/* ---- Contact ---- */
.contact-layout { display: grid; grid-template-columns: 0.88fr 1.12fr; gap: 5rem; padding: clamp(4rem, 8vw, 7rem) 0; }
.contact-aside h2 { font-size: clamp(2.8rem, 5vw, 5rem); font-weight: 800; line-height: 0.96; }
.contact-aside > p { margin-top: 1.5rem; max-width: 31rem; color: var(--text-muted); line-height: 1.75; }
.contact-direct { margin-top: 3rem; border-top: 1px solid var(--border); }
.contact-direct a { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.15rem 0; border-bottom: 1px solid var(--border); font-size: 0.9rem; font-weight: 700; color: var(--text-body); transition: color 160ms ease; text-decoration: none; }
.contact-direct a:hover { color: var(--edu-700); }
.contact-form-shell { padding: clamp(1.5rem, 4vw, 3rem); background: var(--edu-900); color: white; border-radius: var(--radius-lg); }
.contact-form-shell input, .contact-form-shell select, .contact-form-shell textarea { border-color: rgba(255,255,255,0.2); background: rgba(255,255,255,0.08); color: white; }
.contact-form-shell label { color: rgba(255,255,255,0.8); }
.contact-form-shell h2 { color: white; }
.contact-form-shell p { color: rgba(255,255,255,0.65); }
.contact-form-shell option { color: var(--text-primary); }

/* ---- Method / Process ---- */
.method-section { background: var(--edu-50); color: var(--text-primary); }
.method-grid { display: grid; grid-template-columns: 0.82fr 1.18fr; gap: 5rem; }
.method-title { max-width: 500px; font-size: clamp(2.8rem, 5.5vw, 5.5rem); font-weight: 800; line-height: 0.94; }
.method-list { border-top: 1px solid var(--border); }
.method-item { display: grid; grid-template-columns: 4.5rem 1fr auto; gap: 1.5rem; align-items: center; padding: 1.8rem 0; border-bottom: 1px solid var(--border); }
.method-number { font-size: 1.7rem; font-weight: 800; color: var(--amb-500); }
.method-item h3 { font-size: clamp(1.1rem, 1.8vw, 1.6rem); }
.method-item p { margin-top: 0.35rem; max-width: 34rem; color: var(--text-muted); font-size: 0.86rem; line-height: 1.65; }
.method-icon { display: grid; width: 3.1rem; height: 3.1rem; place-items: center; border: 1.5px solid var(--edu-200); border-radius: 50%; color: var(--edu-700); background: white; }
.process-section { background: white; }
.process-head { display: grid; grid-template-columns: 0.8fr 1.2fr; gap: 4rem; align-items: end; }
.process-title { font-size: clamp(3rem, 6vw, 6rem); font-weight: 800; line-height: 0.92; }
.process-intro { max-width: 30rem; color: var(--text-muted); line-height: 1.75; }
.process-list { display: grid; grid-template-columns: repeat(4, 1fr); margin-top: 4rem; border-top: 1px solid var(--border); }
.process-item { min-height: 17rem; padding: 1.5rem 1.3rem; border-right: 1px solid var(--border); }
.process-item:last-child { border-right: 0; }
.process-item strong { display: block; color: var(--amb-500); font-size: 2rem; font-weight: 800; }
.process-item h3 { margin-top: 3rem; font-size: 1.2rem; }
.process-item p { margin-top: 0.8rem; color: var(--text-muted); font-size: 0.84rem; line-height: 1.65; }

/* ---- Footer ---- */
.public-footer { background: var(--edu-900); color: white; }
.public-footer-top { display: grid; grid-template-columns: 1.35fr 0.65fr 0.65fr 0.85fr; gap: 3rem; padding-block: 5rem; }
.public-footer-mark { max-width: 25rem; }
.public-footer-mark p { margin-top: 1.5rem; color: rgba(255,255,255,0.55); font-size: 0.86rem; line-height: 1.7; }
.public-footer h3 { color: var(--amb-300); font-size: 0.7rem; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; }
.public-footer ul { margin-top: 1.25rem; }
.public-footer li + li { margin-top: 0.75rem; }
.public-footer a { color: rgba(255,255,255,0.62); font-size: 0.83rem; transition: color 160ms ease; text-decoration: none; }
.public-footer a:hover { color: white; }
.public-footer-bottom { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding-block: 1.3rem; border-top: 1px solid rgba(255,255,255,0.12); color: rgba(255,255,255,0.42); font-size: 0.7rem; }
.public-footer-credits { max-width: 720px; }

/* ---- Reveal ---- */
.public-motion-ready .public-theme [data-reveal] {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 650ms cubic-bezier(0.22,1,0.36,1), transform 650ms cubic-bezier(0.22,1,0.36,1);
}

.public-motion-ready .public-theme [data-reveal].is-revealed { opacity: 1; transform: translateY(0); }

/* ---- Responsive ---- */
@media (max-width: 1200px) {
  .education-category-list { grid-template-columns: repeat(3, 1fr); }
  .education-course-grid { grid-template-columns: repeat(2, 1fr); }
  .education-benefit-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 1023px) {
  .public-nav, .public-header-actions { display: none; }
  .public-header-inner { grid-template-columns: 1fr auto; }
  .public-mobile-toggle { display: inline-flex; }
  .education-hero-grid { grid-template-columns: 1fr; min-height: auto; padding-block: 4rem; }
  .education-hero-visual { height: 500px; }
  .education-hero-photo { inset: 0 0 2.5rem; }
  .education-progress-card { left: 0.75rem; }
  .education-hero-stats { flex-wrap: wrap; gap: 1.5rem; }
  .education-platform-grid, .education-cta-card { grid-template-columns: 1fr; }
  .education-cta-image { min-height: 360px; }
  .education-cta-image::after { background: linear-gradient(180deg, var(--edu-900) 0%, transparent 22%); }
  .education-journey-list { grid-template-columns: repeat(5, minmax(140px, 1fr)); overflow-x: auto; padding-bottom: 1rem; }
  .education-journey-list::before { display: none; }
  .public-page-hero-grid { grid-template-columns: 1fr; min-height: 320px; }
  .about-story-grid, .contact-layout, .method-grid { grid-template-columns: 1fr; gap: 3.5rem; }
  .process-head { grid-template-columns: 1fr; gap: 1.5rem; }
  .catalog-layout { grid-template-columns: 1fr; }
  .catalog-sidebar { position: static; display: none; }
  .course-detail-hero { grid-template-columns: 1fr; min-height: auto; }
  .course-detail-copy { padding-right: 0; }
  .course-content-grid { grid-template-columns: 1fr; }
  .course-content-grid aside { order: -1; }
  .public-footer-top { grid-template-columns: 1.2fr 0.8fr 0.8fr; }
  .public-footer-mark { grid-column: 1 / -1; }
}

@media (max-width: 767px) {
  .education-hero-copy h1 { font-size: clamp(2.4rem, 12vw, 3.8rem); }
  .education-hero-visual { height: 420px; }
  .education-hero-photo { inset: 0 0 2.5rem; border-radius: 1rem 1rem 1rem 3.5rem; }
  .education-progress-card { top: 0.75rem; left: -0.5rem; width: 148px; }
  .education-lesson-card { right: 0.5rem; bottom: 3rem; left: 0.5rem; width: auto; }
  .education-search { grid-template-columns: auto 1fr; }
  .education-search button { grid-column: 1 / -1; width: 100%; margin: 0; border-radius: 0 0 0.6rem 0.6rem; }
  .education-section-heading { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
  .education-category-list { grid-template-columns: 1fr 1fr; }
  .education-category-list li:last-child { grid-column: 1 / -1; }
  .education-course-grid { grid-template-columns: 1fr; }
  .education-platform-visual { min-height: 400px; }
  .education-benefit-grid { grid-template-columns: 1fr; }
  .catalog-grid { grid-template-columns: 1fr; }
  .catalog-toolbar { grid-template-columns: 1fr; }
  .about-image-stack { min-height: 440px; }
  .about-stats { grid-template-columns: 1fr; }
  .about-stat + .about-stat { padding-left: 0; border-top: 1px solid var(--border); border-left: 0; }
  .course-detail-meta { grid-template-columns: 1fr 1fr; }
  .public-footer-top { grid-template-columns: 1fr 1fr; }
  .public-footer-mark { grid-column: 1 / -1; }
  .public-footer-bottom { flex-direction: column; align-items: flex-start; }
  .legal-article section { grid-template-columns: 1fr; gap: 0.75rem; }
  .process-list { grid-template-columns: 1fr 1fr; }
  .process-item:nth-child(2) { border-right: 0; }
  .process-item:nth-child(-n+2) { border-bottom: 1px solid var(--border); }
}

@media (max-width: 480px) {
  .education-category-list { grid-template-columns: 1fr; }
  .education-category-list li:last-child { grid-column: auto; }
  .education-category-list li a { min-height: 130px; }
  .education-benefit-grid { grid-template-columns: 1fr; }
  .education-platform-visual { min-height: 320px; }
  .education-cta-copy { padding: 2rem 1.5rem; }
  .education-trust-bar-inner { gap: 1rem; justify-content: flex-start; overflow-x: auto; flex-wrap: nowrap; padding-inline: 1rem; }
  .public-footer-top { grid-template-columns: 1fr; }
  .process-list { grid-template-columns: 1fr; }
  .process-item { border-right: 0; border-bottom: 1px solid var(--border); min-height: auto; }
}

@media (prefers-reduced-motion: reduce) {
  .public-motion-ready .public-theme [data-reveal] { opacity: 1; transform: none; transition: none; }
}
`;

writeFileSync('app/(public)/public.css', css, 'utf8');
console.log('CSS written. Size:', css.length, 'bytes');

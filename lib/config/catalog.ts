/**
 * Institute course catalog — canonical category & course definitions.
 *
 * This is the SOURCE OF TRUTH for the 5 categories and 16 individual courses.
 * It is reference data only:
 *   - Actual courses live in MongoDB and are managed via the office portal
 *     (admin CRUD arrives in a later phase).
 *   - Nothing in the UI hardcodes "16" — always derive counts from arrays.
 *   - Admins will later control per-course visibility/bundling via flags.
 */

export type CourseLevel = "beginner" | "intermediate" | "advanced" | "all_levels";
export type CourseDuration = "short" | "medium" | "long";
export type CourseStatus = "draft" | "published" | "archived";

export interface CatalogCategory {
  /** Stable slug used in DB seed and URLs. */
  slug: string;
  name: string;
  description: string;
}

export interface CatalogLesson {
  slug: string;
  title: string;
  durationMinutes?: number;
  isPreview: boolean;
  /** YouTube video ID for the lesson */
  videoId?: string;
}

export interface CatalogModule {
  slug: string;
  title: string;
  description?: string;
  lessons: CatalogLesson[];
}

export interface CatalogInstructor {
  id: string;
  name: string;
  designation: string;
  bio: string;
  expertise: string[];
  imageUrl?: string;
}

export interface CatalogFAQ {
  question: string;
  answer: string;
}

export interface CatalogCourse {
  /** Stable slug; unique key for future /courses/[slug] routes. */
  slug: string;
  /** MongoDB _id when loaded from database */
  _id?: string;
  name: string;
  categorySlug: string;
  shortDescription: string;
  /** Full course description */
  description: string;
  /** Course difficulty level */
  level: CourseLevel;
  /** Course status - only published courses are publicly accessible */
  status: CourseStatus;
  /** Duration in weeks */
  durationWeeks: number;
  /** Duration bucket for filtering */
  durationBucket: CourseDuration;
  /** Price in INR */
  price: number;
  /** Compare at price for showing discounts */
  compareAtPrice?: number;
  /** Whether the course is free */
  isFree?: boolean;
  /** Whether the course can be purchased directly */
  isPurchasable?: boolean;
  /** Tags for search filtering */
  tags: string[];
  /** Learning mode */
  learningMode: "online" | "hybrid" | "offline";
  /** Thumbnail image URL (placeholder for now) */
  thumbnailUrl?: string;
  /** Whether this course is featured/popular */
  featured: boolean;
  /** Course curriculum modules */
  syllabus: CatalogModule[];
  /** Learning outcomes */
  learningOutcomes: string[];
  /** Course requirements/prerequisites */
  requirements: string[];
  /** Target audience */
  targetAudience: string[];
  /** Instructor information */
  instructor?: CatalogInstructor;
  /** Frequently asked questions */
  faqs: CatalogFAQ[];
  /** Learning experience features */
  learningFeatures: string[];
}

export const COURSE_CATEGORIES: readonly CatalogCategory[] = [
  {
    slug: "basic-office-skills",
    name: "Basic & Office Skills",
    description:
      "Foundational computer literacy, typing, data entry and accounting skills required in every modern workplace.",
  },
  {
    slug: "web-programming",
    name: "Web & Programming",
    description:
      "Design and build websites and applications with industry-relevant programming stacks.",
  },
  {
    slug: "creative-digital",
    name: "Creative & Digital Skills",
    description:
      "Visual design and digital marketing skills for agencies, businesses and freelance careers.",
  },
  {
    slug: "communication-development",
    name: "Communication & Personal Development",
    description:
      "Spoken English and personality development for confident professional communication.",
  },
  {
    slug: "healthcare-wellness",
    name: "Healthcare & Wellness",
    description:
      "Practical healthcare training and wellness practices including yoga and meditation.",
  },
] as const;

export const CATALOG_COURSES: readonly CatalogCourse[] = [
  // Basic & Office Skills
  {
    slug: "basic-computer-course",
    name: "Basic Computer Course",
    categorySlug: "basic-office-skills",
    shortDescription: "Computer fundamentals, operating systems, internet and everyday office software.",
    description: "This comprehensive course covers computer fundamentals including hardware components, operating systems (Windows), file management, internet basics, email communication, and essential office software (Microsoft Word, Excel, PowerPoint). Designed for absolute beginners, the course builds confidence through hands-on practice sessions and real-world exercises.",
    level: "beginner",
    status: "published",
    durationWeeks: 8,
    durationBucket: "short",
    price: 8000,
    compareAtPrice: 10000,
    isFree: false,
    isPurchasable: true,
    tags: ["computer basics", "office software", "internet", "ms office"],
    learningMode: "online",
    thumbnailUrl: undefined,
    featured: true,
    syllabus: [
      {
        slug: "module-1",
        title: "Introduction to Computers",
        description: "Understanding computer hardware, software, and basic terminology",
        lessons: [
          { slug: "lesson-1", title: "What is a Computer?", durationMinutes: 15, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-2", title: "Computer Hardware Components", durationMinutes: 20, isPreview: false, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-3", title: "Software Types and Operating Systems", durationMinutes: 18, isPreview: false },
          { slug: "lesson-4", title: "Getting Started with Windows", durationMinutes: 25, isPreview: true, videoId: "dQw4w9WgXcQ" },
        ],
      },
      {
        slug: "module-2",
        title: "File Management & Organization",
        description: "Mastering file operations, folders, and data organization",
        lessons: [
          { slug: "lesson-5", title: "Understanding Files and Folders", durationMinutes: 20, isPreview: false },
          { slug: "lesson-6", title: "Creating, Copying, Moving, and Deleting Files", durationMinutes: 22, isPreview: false },
          { slug: "lesson-7", title: "File Extensions and Associations", durationMinutes: 15, isPreview: false },
          { slug: "lesson-8", title: "Using USB Drives and External Storage", durationMinutes: 18, isPreview: false },
        ],
      },
      {
        slug: "module-3",
        title: "Internet & Email Essentials",
        description: "Navigating the web safely and communicating via email",
        lessons: [
          { slug: "lesson-9", title: "Introduction to the Internet and Browsers", durationMinutes: 20, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-10", title: "Search Engines and Effective Searching", durationMinutes: 18, isPreview: false },
          { slug: "lesson-11", title: "Email Basics: Creating and Managing Accounts", durationMinutes: 22, isPreview: false },
          { slug: "lesson-12", title: "Email Etiquette and Safety", durationMinutes: 15, isPreview: false },
        ],
      },
      {
        slug: "module-4",
        title: "Microsoft Word Fundamentals",
        description: "Creating and formatting professional documents",
        lessons: [
          { slug: "lesson-13", title: "Word Interface and Document Creation", durationMinutes: 20, isPreview: false },
          { slug: "lesson-14", title: "Text Formatting and Styles", durationMinutes: 25, isPreview: false },
          { slug: "lesson-15", title: "Working with Tables and Images", durationMinutes: 22, isPreview: false },
          { slug: "lesson-16", title: "Page Layout, Printing, and Saving", durationMinutes: 18, isPreview: false },
        ],
      },
      {
        slug: "module-5",
        title: "Microsoft Excel Basics",
        description: "Spreadsheet fundamentals for data organization and calculation",
        lessons: [
          { slug: "lesson-17", title: "Excel Interface and Workbook Basics", durationMinutes: 20, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-18", title: "Entering Data and Basic Formulas", durationMinutes: 25, isPreview: false },
          { slug: "lesson-19", title: "Formatting Cells and Worksheets", durationMinutes: 20, isPreview: false },
          { slug: "lesson-20", title: "Charts, Printing, and Data Management", durationMinutes: 22, isPreview: false },
        ],
      },
      {
        slug: "module-6",
        title: "Microsoft PowerPoint Essentials",
        description: "Creating effective presentations",
        lessons: [
          { slug: "lesson-21", title: "PowerPoint Interface and Slide Creation", durationMinutes: 18, isPreview: false },
          { slug: "lesson-22", title: "Design Themes, Text, and Multimedia", durationMinutes: 22, isPreview: false },
          { slug: "lesson-23", title: "Animations, Transitions, and Slide Show", durationMinutes: 20, isPreview: false },
          { slug: "lesson-24", title: "Presenting and Sharing Your Work", durationMinutes: 15, isPreview: false },
        ],
      },
    ],
    learningOutcomes: [
      "Operate a computer confidently using Windows OS",
      "Manage files, folders, and external storage devices",
      "Browse the internet safely and search effectively",
      "Create and manage email accounts with proper etiquette",
      "Create professional documents in Microsoft Word",
      "Build functional spreadsheets with basic formulas in Excel",
      "Design and deliver presentations using PowerPoint",
    ],
    requirements: [
      "No prior computer experience required",
      "Access to a computer with Windows OS (for practice)",
      "Basic reading and writing skills in English or Hindi",
    ],
    targetAudience: [
      "Complete beginners with no computer background",
      "Students needing computer literacy for academics",
      "Job seekers requiring basic computer skills",
      "Senior citizens wanting to learn computer basics",
      "Anyone wanting to improve digital literacy",
    ],
    instructor: {
      id: "instructor-1",
      name: "Priya Sharma",
      designation: "Senior Computer Faculty",
      bio: "Priya has over 10 years of experience teaching computer fundamentals to beginners across various age groups. She holds certifications in Microsoft Office and specializes in making technology accessible to non-technical learners.",
      expertise: ["Computer Basics", "MS Office", "Digital Literacy", "Adult Education"],
      imageUrl: undefined,
    },
    faqs: [
      {
        question: "Do I need any prior computer knowledge?",
        answer: "No, this course is designed for absolute beginners with no prior computer experience.",
      },
      {
        question: "What software version is taught?",
        answer: "The course covers Microsoft Office 2019/365, but concepts apply to all recent versions.",
      },
      {
        question: "Is there a certificate upon completion?",
        answer: "Yes, students who complete all modules and assessments receive a course completion certificate.",
      },
      {
        question: "Can I access the course on mobile?",
        answer: "Yes, video lessons are accessible on mobile devices, but a computer is recommended for hands-on practice.",
      },
      {
        question: "How long do I have access to the course?",
        answer: "You get lifetime access to all course materials including future updates.",
      },
    ],
    learningFeatures: [
      "Step-by-step video tutorials",
      "Downloadable practice files",
      "Hands-on exercises with each module",
      "Module-end quizzes for self-assessment",
      "Lifetime access to course materials",
      "Certificate of completion",
    ],
  },
  {
    slug: "typing-course",
    name: "Typing Course",
    categorySlug: "basic-office-skills",
    shortDescription: "Structured speed and accuracy training with regular timed practice tests.",
    description: "Master touch typing with our structured 4-week program. Learn proper finger placement, build muscle memory through progressive exercises, and track your WPM (words per minute) improvement with daily timed tests. Includes custom practice software and personalized feedback.",
    level: "beginner",
    status: "published",
    durationWeeks: 4,
    durationBucket: "short",
    price: 3000,
    compareAtPrice: 4000,
    isFree: false,
    isPurchasable: true,
    tags: ["typing", "speed", "accuracy", "touch typing"],
    learningMode: "online",
    thumbnailUrl: undefined,
    featured: false,
    syllabus: [
      {
        slug: "module-1",
        title: "Touch Typing Fundamentals",
        description: "Learn proper finger positioning and home row keys",
        lessons: [
          { slug: "lesson-1", title: "Introduction to Touch Typing", durationMinutes: 15, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-2", title: "Home Row Keys (ASDF JKL;)", durationMinutes: 25, isPreview: false },
          { slug: "lesson-3", title: "Proper Posture and Hand Position", durationMinutes: 15, isPreview: false },
          { slug: "lesson-4", title: "First Practice Session", durationMinutes: 20, isPreview: false },
        ],
      },
      {
        slug: "module-2",
        title: "Upper Row & Lower Row Keys",
        description: "Expand typing to all letter keys",
        lessons: [
          { slug: "lesson-5", title: "Upper Row Keys (QWERTYUIOP)", durationMinutes: 25, isPreview: false },
          { slug: "lesson-6", title: "Lower Row Keys (ZXCVBNM,./)", durationMinutes: 25, isPreview: false },
          { slug: "lesson-7", title: "Combining All Letter Keys", durationMinutes: 30, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-8", title: "Speed Building Drills", durationMinutes: 20, isPreview: false },
        ],
      },
      {
        slug: "module-3",
        title: "Numbers, Symbols & Punctuation",
        description: "Master the complete keyboard including special characters",
        lessons: [
          { slug: "lesson-9", title: "Number Row (1-0) and Symbols", durationMinutes: 25, isPreview: false },
          { slug: "lesson-10", title: "Shift Key and Capitalization", durationMinutes: 20, isPreview: false },
          { slug: "lesson-11", title: "Punctuation Marks and Special Characters", durationMinutes: 22, isPreview: false },
          { slug: "lesson-12", title: "Full Keyboard Practice", durationMinutes: 30, isPreview: false },
        ],
      },
      {
        slug: "module-4",
        title: "Speed & Accuracy Development",
        description: "Timed tests and advanced techniques for professional typing speeds",
        lessons: [
          { slug: "lesson-13", title: "Timed Practice Tests (1, 3, 5 minutes)", durationMinutes: 30, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-14", title: "Accuracy-Focused Drills", durationMinutes: 25, isPreview: false },
          { slug: "lesson-15", title: "Rhythm and Flow Techniques", durationMinutes: 20, isPreview: false },
          { slug: "lesson-16", title: "Final Assessment and Certification", durationMinutes: 30, isPreview: false },
        ],
      },
    ],
    learningOutcomes: [
      "Type without looking at the keyboard (touch typing)",
      "Achieve 40+ WPM with 95%+ accuracy",
      "Master all keyboard keys including numbers and symbols",
      "Develop proper typing posture and ergonomics",
      "Build speed through structured daily practice",
    ],
    requirements: [
      "No prior typing experience needed",
      "Access to a standard QWERTY keyboard",
      "Commitment to 30 minutes daily practice",
    ],
    targetAudience: [
      "Students preparing for competitive exams",
      "Job seekers in data entry, admin, clerical roles",
      "Professionals wanting to improve productivity",
      "Anyone wanting to learn proper typing technique",
    ],
    instructor: {
      id: "instructor-2",
      name: "Rajesh Kumar",
      designation: "Typing & Data Entry Specialist",
      bio: "Rajesh has trained over 5,000 students in touch typing with a 90% success rate in government typing tests. He developed the institute's proprietary typing practice methodology.",
      expertise: ["Touch Typing", "Speed Building", "Competitive Exam Preparation", "Ergonomics"],
      imageUrl: undefined,
    },
    faqs: [
      {
        question: "How long will it take to reach 40 WPM?",
        answer: "With consistent daily practice of 30 minutes, most students reach 40 WPM within 4-6 weeks.",
      },
      {
        question: "Is this course suitable for government job typing tests?",
        answer: "Yes, the course curriculum aligns with standard government typing test requirements (SSC, banking, state PSC).",
      },
      {
        question: "Do I need special software?",
        answer: "No, practice can be done in any text editor. We provide links to free online typing tutors for additional practice.",
      },
    ],
    learningFeatures: [
      "Progressive lesson structure (beginner to advanced)",
      "Daily timed practice tests with WPM tracking",
      "Video demonstrations of finger movements",
      "Printable practice sheets",
      "Personalized improvement tips",
      "Final certification test",
    ],
  },
  {
    slug: "data-entry-course",
    name: "Data Entry Course",
    categorySlug: "basic-office-skills",
    shortDescription: "Accurate, fast data entry workflows, spreadsheets and office documentation.",
    description: "Develop professional data entry skills with focus on speed, accuracy, and industry-standard tools. Learn Excel for data management, keyboard shortcuts for efficiency, data validation techniques, and real-world project simulations. Prepares you for data entry operator roles across sectors.",
    level: "beginner",
    status: "published",
    durationWeeks: 6,
    durationBucket: "short",
    price: 0,
    compareAtPrice: 5000,
    isFree: true,
    isPurchasable: true,
    tags: ["data entry", "excel", "spreadsheets", "office work"],
    learningMode: "online",
    thumbnailUrl: undefined,
    featured: false,
    syllabus: [
      {
        slug: "module-1",
        title: "Data Entry Fundamentals",
        description: "Core concepts, accuracy standards, and workspace setup",
        lessons: [
          { slug: "lesson-1", title: "What is Data Entry? Roles and Opportunities", durationMinutes: 15, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-2", title: "Accuracy vs Speed: Industry Standards", durationMinutes: 18, isPreview: false },
          { slug: "lesson-3", title: "Ergonomic Workstation Setup", durationMinutes: 15, isPreview: false },
          { slug: "lesson-4", title: "Keyboard Shortcuts for Efficiency", durationMinutes: 22, isPreview: false },
        ],
      },
      {
        slug: "module-2",
        title: "Excel for Data Entry",
        description: "Master spreadsheet tools for professional data management",
        lessons: [
          { slug: "lesson-5", title: "Excel Interface for Data Entry Workflows", durationMinutes: 20, isPreview: false },
          { slug: "lesson-6", title: "Data Types, Validation, and Formatting", durationMinutes: 25, isPreview: false },
          { slug: "lesson-7", title: "Flash Fill, AutoFill, and Data Cleaning", durationMinutes: 25, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-8", title: "Working with Large Datasets", durationMinutes: 22, isPreview: false },
        ],
      },
      {
        slug: "module-3",
        title: "Advanced Data Techniques",
        description: "Pivot tables, lookup functions, and automation basics",
        lessons: [
          { slug: "lesson-9", title: "VLOOKUP, HLOOKUP, and XLOOKUP", durationMinutes: 30, isPreview: false },
          { slug: "lesson-10", title: "Pivot Tables for Data Summarization", durationMinutes: 28, isPreview: false },
          { slug: "lesson-11", title: "Conditional Formatting and Data Bars", durationMinutes: 20, isPreview: false },
          { slug: "lesson-12", title: "Introduction to Macros and Automation", durationMinutes: 25, isPreview: false },
        ],
      },
      {
        slug: "module-4",
        title: "Real-World Projects & Assessment",
        description: "Simulated workplace projects and final evaluation",
        lessons: [
          { slug: "lesson-13", title: "Project: Customer Database Management", durationMinutes: 35, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-14", title: "Project: Inventory Tracking System", durationMinutes: 35, isPreview: false },
          { slug: "lesson-15", title: "Project: Sales Data Analysis", durationMinutes: 35, isPreview: false },
          { slug: "lesson-16", title: "Final Speed & Accuracy Assessment", durationMinutes: 30, isPreview: false },
        ],
      },
    ],
    learningOutcomes: [
      "Perform data entry with 98%+ accuracy",
      "Use Excel efficiently for data management tasks",
      "Apply keyboard shortcuts to maximize speed",
      "Validate and clean data using built-in tools",
      "Create basic reports with pivot tables",
      "Complete simulated workplace data projects",
    ],
    requirements: [
      "Basic computer operation skills",
      "Microsoft Excel installed (2016 or later recommended)",
      "Typing speed of 25+ WPM recommended (not required)",
    ],
    targetAudience: [
      "Aspiring data entry operators",
      "Office assistants seeking skill upgrade",
      "Freelancers offering data services",
      "Students targeting clerical government jobs",
    ],
    instructor: {
      id: "instructor-3",
      name: "Anita Desai",
      designation: "Data Analytics & Office Automation Trainer",
      bio: "Anita brings 8 years of corporate data management experience and 5 years of training expertise. She has designed data workflows for SMEs and specializes in Excel automation.",
      expertise: ["Advanced Excel", "Data Entry Operations", "Office Automation", "Data Quality"],
      imageUrl: undefined,
    },
    faqs: [
      {
        question: "Is this course enough for a data entry job?",
        answer: "Yes, the course covers all core skills employers look for. The project portfolio demonstrates practical ability.",
      },
      {
        question: "Do I need to know Excel before starting?",
        answer: "No, Module 2 covers Excel from basics. Basic computer familiarity is sufficient.",
      },
      {
        question: "What version of Excel is used?",
        answer: "Course uses Excel 365/2019. Most features work in 2016+ versions.",
      },
    ],
    learningFeatures: [
      "Hands-on practice with real datasets",
      "Downloadable project templates",
      "Speed and accuracy tracking dashboard",
      "Industry-standard workflow training",
      "Mock tests for job interviews",
      "Certificate upon completion",
    ],
  },
  {
    slug: "tally-accounting",
    name: "Tally + Accounting",
    categorySlug: "basic-office-skills",
    shortDescription: "Accounting fundamentals with hands-on Tally practice for bookkeeping roles.",
    description: "Learn accounting principles from the ground up and master TallyPrime for professional bookkeeping. Covers double-entry system, GST compliance, inventory management, payroll, and financial reporting. Includes company creation, voucher entry, and real-world case studies.",
    level: "beginner",
    status: "published",
    durationWeeks: 10,
    durationBucket: "medium",
    price: 12000,
    compareAtPrice: 15000,
    isFree: false,
    isPurchasable: true,
    tags: ["tally", "accounting", "bookkeeping", "gst"],
    learningMode: "hybrid",
    thumbnailUrl: undefined,
    featured: true,
    syllabus: [
      {
        slug: "module-1",
        title: "Accounting Fundamentals",
        description: "Core accounting principles and the double-entry system",
        lessons: [
          { slug: "lesson-1", title: "Introduction to Accounting & Bookkeeping", durationMinutes: 20, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-2", title: "Accounting Equation & Double Entry System", durationMinutes: 25, isPreview: false },
          { slug: "lesson-3", title: "Golden Rules of Accounting", durationMinutes: 22, isPreview: false },
          { slug: "lesson-4", title: "Journal Entries & Ledger Posting", durationMinutes: 30, isPreview: false },
        ],
      },
      {
        slug: "module-2",
        title: "TallyPrime Basics",
        description: "Getting started with TallyPrime interface and company setup",
        lessons: [
          { slug: "lesson-5", title: "TallyPrime Interface & Navigation", durationMinutes: 20, isPreview: false },
          { slug: "lesson-6", title: "Company Creation & Configuration", durationMinutes: 25, isPreview: false },
          { slug: "lesson-7", title: "Groups, Ledgers & Chart of Accounts", durationMinutes: 28, isPreview: false },
          { slug: "lesson-8", title: "Voucher Types & Entry Basics", durationMinutes: 25, isPreview: true, videoId: "dQw4w9WgXcQ" },
        ],
      },
      {
        slug: "module-3",
        title: "GST & Taxation in Tally",
        description: "GST compliance, returns, and e-way bills",
        lessons: [
          { slug: "lesson-9", title: "GST Basics: CGST, SGST, IGST", durationMinutes: 25, isPreview: false },
          { slug: "lesson-10", title: "GST Setup in TallyPrime", durationMinutes: 22, isPreview: false },
          { slug: "lesson-11", title: "GST Invoice Creation & HSN/SAC Codes", durationMinutes: 30, isPreview: false },
          { slug: "lesson-12", title: "GSTR-1, GSTR-3B & E-Way Bills", durationMinutes: 30, isPreview: false },
        ],
      },
      {
        slug: "module-4",
        title: "Inventory & Payroll",
        description: "Stock management, godowns, and payroll processing",
        lessons: [
          { slug: "lesson-13", title: "Inventory Masters: Stock Groups, Categories, Items", durationMinutes: 25, isPreview: false },
          { slug: "lesson-14", title: "Godowns, Units of Measure & Batches", durationMinutes: 22, isPreview: false },
          { slug: "lesson-15", title: "Purchase & Sales Cycle with Inventory", durationMinutes: 28, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-16", title: "Payroll Setup & Statutory Compliance", durationMinutes: 30, isPreview: false },
        ],
      },
      {
        slug: "module-5",
        title: "Reports, Finalization & Project",
        description: "Financial statements, ratio analysis, and capstone project",
        lessons: [
          { slug: "lesson-17", title: "Financial Reports: Trial Balance, P&L, Balance Sheet", durationMinutes: 25, isPreview: false },
          { slug: "lesson-18", title: "Ratio Analysis & Cash Flow", durationMinutes: 22, isPreview: false },
          { slug: "lesson-19", title: "Year-End Closing & Audit Preparation", durationMinutes: 20, isPreview: false },
          { slug: "lesson-20", title: "Capstone Project: Complete Company Books", durationMinutes: 45, isPreview: false },
        ],
      },
    ],
    learningOutcomes: [
      "Apply double-entry bookkeeping principles",
      "Create and manage companies in TallyPrime",
      "Record all voucher types accurately",
      "Generate GST-compliant invoices and returns",
      "Manage inventory with stock tracking",
      "Process payroll with statutory deductions",
      "Generate and interpret financial reports",
    ],
    requirements: [
      "Basic understanding of commerce/accounting terms helpful",
      "No prior Tally experience required",
      "TallyPrime Educational Version (download link provided)",
    ],
    targetAudience: [
      "Commerce students and graduates",
      "Aspiring accountants and bookkeepers",
      "Small business owners managing own accounts",
      "Job seekers in accounting firms",
    ],
    instructor: {
      id: "instructor-4",
      name: "CA Vikram Singh",
      designation: "Chartered Accountant & Tally Certified Trainer",
      bio: "Vikram is a practicing CA with 12 years of experience in taxation and audit. He is a Tally Certified Trainer and has helped 3,000+ students clear Tally certification exams.",
      expertise: ["Financial Accounting", "GST Compliance", "TallyPrime", "Audit & Taxation"],
      imageUrl: undefined,
    },
    faqs: [
      {
        question: "Is Tally software provided with the course?",
        answer: "We provide the TallyPrime Educational Version download link and installation guidance. The educational version is free for learning.",
      },
      {
        question: "Does this cover GST return filing?",
        answer: "Yes, Module 3 covers GSTR-1, GSTR-3B generation and e-way bill creation in detail.",
      },
      {
        question: "Can I take this course online?",
        answer: "Yes, this is a hybrid course - available both online and at our center.",
      },
    ],
    learningFeatures: [
      "TallyPrime Educational Version setup guide",
      "Practice company data files",
      "GST invoice templates",
      "Payroll compliance checklists",
      "Mock certification tests",
      "Industry-recognized certificate",
    ],
  },

  // Web & Programming
  {
    slug: "web-design",
    name: "Web Design",
    categorySlug: "web-programming",
    shortDescription: "HTML, CSS, responsive layouts and design fundamentals for modern websites.",
    description: "Master the art of creating beautiful, responsive websites from scratch. Learn HTML5 semantic markup, CSS3 styling including Flexbox and Grid, design principles, typography, color theory, and Figma for prototyping. Build a portfolio of 3 complete responsive websites.",
    level: "beginner",
    status: "published",
    durationWeeks: 12,
    durationBucket: "medium",
    price: 15000,
    compareAtPrice: 18000,
    isFree: false,
    isPurchasable: true,
    tags: ["html", "css", "responsive design", "ui", "figma"],
    learningMode: "online",
    thumbnailUrl: undefined,
    featured: true,
    syllabus: [
      {
        slug: "module-1",
        title: "HTML5 Foundations",
        description: "Semantic markup, accessibility, and document structure",
        lessons: [
          { slug: "lesson-1", title: "How the Web Works: Clients, Servers, DNS", durationMinutes: 18, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-2", title: "HTML5 Document Structure & Semantic Elements", durationMinutes: 25, isPreview: false },
          { slug: "lesson-3", title: "Forms, Input Types & Validation", durationMinutes: 22, isPreview: false },
          { slug: "lesson-4", title: "Accessibility (ARIA, Semantic HTML, WCAG)", durationMinutes: 20, isPreview: false },
        ],
      },
      {
        slug: "module-2",
        title: "CSS3 Styling & Layout",
        description: "Modern CSS techniques for beautiful interfaces",
        lessons: [
          { slug: "lesson-5", title: "CSS Box Model, Selectors & Specificity", durationMinutes: 25, isPreview: false },
          { slug: "lesson-6", title: "Typography, Colors & Custom Properties", durationMinutes: 22, isPreview: false },
          { slug: "lesson-7", title: "Flexbox: One-Dimensional Layouts", durationMinutes: 30, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-8", title: "CSS Grid: Two-Dimensional Layouts", durationMinutes: 30, isPreview: false },
        ],
      },
      {
        slug: "module-3",
        title: "Responsive Design & Mobile-First",
        description: "Fluid layouts that work on every device",
        lessons: [
          { slug: "lesson-9", title: "Media Queries & Breakpoints", durationMinutes: 22, isPreview: false },
          { slug: "lesson-10", title: "Mobile-First Methodology", durationMinutes: 20, isPreview: false },
          { slug: "lesson-11", title: "Responsive Images & Picture Element", durationMinutes: 18, isPreview: false },
          { slug: "lesson-12", title: "Container Queries & Modern Responsive CSS", durationMinutes: 25, isPreview: false },
        ],
      },
      {
        slug: "module-4",
        title: "Design Fundamentals & Figma",
        description: "Visual design principles and prototyping workflow",
        lessons: [
          { slug: "lesson-13", title: "Design Principles: Hierarchy, Contrast, Alignment", durationMinutes: 20, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-14", title: "Color Theory & Palette Creation", durationMinutes: 18, isPreview: false },
          { slug: "lesson-15", title: "Typography Systems & Pairing", durationMinutes: 20, isPreview: false },
          { slug: "lesson-16", title: "Figma Basics: Wireframes to Prototypes", durationMinutes: 30, isPreview: false },
        ],
      },
      {
        slug: "module-5",
        title: "Portfolio Projects",
        description: "Build 3 complete responsive websites",
        lessons: [
          { slug: "lesson-17", title: "Project 1: Personal Portfolio Website", durationMinutes: 60, isPreview: false },
          { slug: "lesson-18", title: "Project 2: Business Landing Page", durationMinutes: 60, isPreview: false },
          { slug: "lesson-19", title: "Project 3: Blog/Article Layout", durationMinutes: 45, isPreview: false },
          { slug: "lesson-20", title: "Deployment: Netlify, Vercel & GitHub Pages", durationMinutes: 25, isPreview: false },
        ],
      },
    ],
    learningOutcomes: [
      "Write semantic, accessible HTML5 markup",
      "Style complex layouts with modern CSS (Flexbox, Grid)",
      "Build fully responsive, mobile-first websites",
      "Apply design principles for visual hierarchy",
      "Prototype in Figma before coding",
      "Deploy websites to production platforms",
      "Create a 3-project design portfolio",
    ],
    requirements: [
      "No prior coding experience required",
      "Computer with VS Code (free) installed",
      "Modern browser (Chrome/Firefox/Edge)",
    ],
    targetAudience: [
      "Complete beginners to web development",
      "Graphic designers wanting to code designs",
      "Marketing professionals building landing pages",
      "Entrepreneurs creating their own websites",
    ],
    instructor: {
      id: "instructor-5",
      name: "Meera Nair",
      designation: "Senior UI/UX Designer & Frontend Developer",
      bio: "Meera has 7 years of experience designing and building websites for startups and agencies. She specializes in design systems, accessibility, and bridging the gap between design and development.",
      expertise: ["HTML/CSS", "Responsive Design", "Figma", "Design Systems", "Accessibility"],
      imageUrl: undefined,
    },
    faqs: [
      {
        question: "Do I need to know programming?",
        answer: "No, this course teaches HTML and CSS which are markup and styling languages, not programming languages.",
      },
      {
        question: "Is JavaScript covered?",
        answer: "This course focuses on HTML/CSS design. JavaScript is covered in our Web Development and MERN Stack courses.",
      },
      {
        question: "What tools do I need?",
        answer: "VS Code (free), a modern browser, and Figma (free tier). All tools are free to use.",
      },
    ],
    learningFeatures: [
      "Code-along video tutorials",
      "Starter templates for each project",
      "Design assets and Figma files provided",
      "Code review checkpoints",
      "Portfolio-ready project templates",
      "Lifetime access to updates",
    ],
  },
  {
    slug: "web-development",
    name: "Web Development",
    categorySlug: "web-programming",
    shortDescription: "Front-end and back-end foundations to build complete web applications.",
    description: "Build full-stack web applications from scratch. Master JavaScript (ES6+), React for dynamic frontends, Node.js/Express for backend APIs, and MongoDB for data persistence. Includes authentication, REST APIs, deployment, and a capstone project.",
    level: "intermediate",
    status: "published",
    durationWeeks: 16,
    durationBucket: "long",
    price: 25000,
    compareAtPrice: 30000,
    isFree: false,
    isPurchasable: true,
    tags: ["javascript", "react", "node", "backend", "frontend", "full stack"],
    learningMode: "online",
    thumbnailUrl: undefined,
    featured: true,
    syllabus: [
      {
        slug: "module-1",
        title: "JavaScript Essentials (ES6+)",
        description: "Modern JavaScript fundamentals for web development",
        lessons: [
          { slug: "lesson-1", title: "Variables, Data Types & Operators", durationMinutes: 25, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-2", title: "Functions, Scope & Closures", durationMinutes: 30, isPreview: false },
          { slug: "lesson-3", title: "Arrays, Objects & Destructuring", durationMinutes: 25, isPreview: false },
          { slug: "lesson-4", title: "Async JS: Promises, Async/Await, Fetch API", durationMinutes: 35, isPreview: false },
        ],
      },
      {
        slug: "module-2",
        title: "React Fundamentals",
        description: "Component-based UI development with React",
        lessons: [
          { slug: "lesson-5", title: "React Setup, JSX & Components", durationMinutes: 30, isPreview: false },
          { slug: "lesson-6", title: "Props, State & Event Handling", durationMinutes: 28, isPreview: false },
          { slug: "lesson-7", title: "Hooks: useState, useEffect, useContext", durationMinutes: 35, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-8", title: "Forms, Controlled Components & Validation", durationMinutes: 30, isPreview: false },
        ],
      },
      {
        slug: "module-3",
        title: "State Management & Routing",
        description: "Complex state and navigation in React apps",
        lessons: [
          { slug: "lesson-9", title: "React Router: SPA Navigation", durationMinutes: 25, isPreview: false },
          { slug: "lesson-10", title: "Context API & useReducer for Global State", durationMinutes: 30, isPreview: false },
          { slug: "lesson-11", title: "Introduction to Redux Toolkit", durationMinutes: 35, isPreview: false },
          { slug: "lesson-12", title: "Performance: Memo, useCallback, useMemo", durationMinutes: 28, isPreview: false },
        ],
      },
      {
        slug: "module-4",
        title: "Backend with Node.js & Express",
        description: "RESTful API development and server-side logic",
        lessons: [
          { slug: "lesson-13", title: "Node.js Runtime & NPM Ecosystem", durationMinutes: 25, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-14", title: "Express: Routing, Middleware & Error Handling", durationMinutes: 30, isPreview: false },
          { slug: "lesson-15", title: "MongoDB & Mongoose: Data Modeling", durationMinutes: 35, isPreview: false },
          { slug: "lesson-16", title: "Authentication: JWT, Bcrypt, Protected Routes", durationMinutes: 40, isPreview: false },
        ],
      },
      {
        slug: "module-5",
        title: "Full-Stack Integration & Deployment",
        description: "Connect frontend to backend and deploy to production",
        lessons: [
          { slug: "lesson-17", title: "Connecting React to Express API", durationMinutes: 35, isPreview: false },
          { slug: "lesson-18", title: "File Uploads, Email & Third-Party APIs", durationMinutes: 30, isPreview: false },
          { slug: "lesson-19", title: "Deployment: Docker, Vercel, Railway, MongoDB Atlas", durationMinutes: 40, isPreview: false },
          { slug: "lesson-20", title: "Capstone: Full-Stack Project", durationMinutes: 60, isPreview: false },
        ],
      },
    ],
    learningOutcomes: [
      "Write modern JavaScript (ES6+) confidently",
      "Build interactive UIs with React hooks and components",
      "Manage complex state with Context API and Redux",
      "Design and implement RESTful APIs with Express",
      "Model data and query with MongoDB/Mongoose",
      "Implement JWT authentication and authorization",
      "Deploy full-stack applications to cloud platforms",
    ],
    requirements: [
      "HTML & CSS proficiency (Web Design course or equivalent)",
      "Basic programming concepts (variables, loops, functions)",
      "Computer with Node.js 18+ and VS Code installed",
    ],
    targetAudience: [
      "Frontend developers learning backend",
      "Bootcamp graduates seeking full-stack skills",
      "Career changers entering web development",
      "Entrepreneurs building their own SaaS products",
    ],
    instructor: {
      id: "instructor-6",
      name: "Arjun Patel",
      designation: "Full-Stack Engineer & React Specialist",
      bio: "Arjun has built production applications for fintech and ed-tech startups. He contributes to open-source React libraries and mentors developers transitioning to full-stack roles.",
      expertise: ["React", "Node.js", "MongoDB", "TypeScript", "System Design"],
      imageUrl: undefined,
    },
    faqs: [
      {
        question: "Is TypeScript covered?",
        answer: "TypeScript fundamentals are introduced in Module 3. Advanced TypeScript is covered in the MERN Stack course.",
      },
      {
        question: "What's the difference from MERN Stack?",
        answer: "Web Development covers the fundamentals. MERN Stack goes deeper into advanced patterns, testing, CI/CD, and production architecture.",
      },
      {
        question: "Do I need a powerful computer?",
        answer: "Any modern laptop (8GB+ RAM) can run the development tools. We provide cloud-based alternatives for heavier tasks.",
      },
    ],
    learningFeatures: [
      "Live coding sessions with explanations",
      "GitHub repository for each module",
      "Code review assignments",
      "Production deployment walkthrough",
      "Access to alumni Discord community",
      "Certificate with project verification",
    ],
  },
  {
    slug: "php-web-development",
    name: "PHP Web Development",
    categorySlug: "web-programming",
    shortDescription: "Server-side development with PHP and MySQL for dynamic websites.",
    description: "Learn server-side web development with PHP 8 and MySQL. Build dynamic websites, content management systems, and REST APIs. Covers PHP fundamentals, PDO for database security, Laravel basics, authentication, and deployment on shared hosting and VPS.",
    level: "intermediate",
    status: "published",
    durationWeeks: 12,
    durationBucket: "medium",
    price: 18000,
    tags: ["php", "mysql", "laravel", "backend", "cms"],
    learningMode: "online",
    thumbnailUrl: undefined,
    featured: false,
    syllabus: [
      {
        slug: "module-1",
        title: "PHP 8 Fundamentals",
        description: "Modern PHP syntax, types, and best practices",
        lessons: [
          { slug: "lesson-1", title: "PHP Setup, Syntax & Variables", durationMinutes: 25, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-2", title: "Control Structures, Functions & Type Declarations", durationMinutes: 30, isPreview: false },
          { slug: "lesson-3", title: "Arrays, Superglobals & Request Handling", durationMinutes: 25, isPreview: false },
          { slug: "lesson-4", title: "Error Handling, Exceptions & Logging", durationMinutes: 28, isPreview: false },
        ],
      },
      {
        slug: "module-2",
        title: "MySQL & Database Integration",
        description: "Secure database operations with PDO",
        lessons: [
          { slug: "lesson-5", title: "MySQL Basics: Tables, Queries, Joins", durationMinutes: 30, isPreview: false },
          { slug: "lesson-6", title: "PDO: Prepared Statements & Transactions", durationMinutes: 35, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-7", title: "CRUD Operations & Data Validation", durationMinutes: 30, isPreview: false },
          { slug: "lesson-8", title: "Database Design & Normalization", durationMinutes: 25, isPreview: false },
        ],
      },
      {
        slug: "module-3",
        title: "Building Dynamic Web Applications",
        description: "Session management, authentication, and MVC patterns",
        lessons: [
          { slug: "lesson-9", title: "Sessions, Cookies & Flash Messages", durationMinutes: 25, isPreview: false },
          { slug: "lesson-10", title: "User Registration, Login & Password Hashing", durationMinutes: 35, isPreview: false },
          { slug: "lesson-11", title: "Role-Based Access Control (RBAC)", durationMinutes: 28, isPreview: false },
          { slug: "lesson-12", title: "MVC Architecture & Custom Router", durationMinutes: 35, isPreview: false },
        ],
      },
      {
        slug: "module-4",
        title: "Laravel Framework Basics",
        description: "Rapid development with PHP's most popular framework",
        lessons: [
          { slug: "lesson-13", title: "Laravel Installation & Project Structure", durationMinutes: 25, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-14", title: "Eloquent ORM: Models & Relationships", durationMinutes: 35, isPreview: false },
          { slug: "lesson-15", title: "Blade Templates, Controllers & Validation", durationMinutes: 30, isPreview: false },
          { slug: "lesson-16", title: "Laravel Auth, Gates & Policies", durationMinutes: 35, isPreview: false },
        ],
      },
      {
        slug: "module-5",
        title: "Deployment & Real-World Project",
        description: "Production deployment and capstone project",
        lessons: [
          { slug: "lesson-17", title: "Shared Hosting vs VPS Deployment", durationMinutes: 25, isPreview: false },
          { slug: "lesson-18", title: "Composer, Environment Config & Optimization", durationMinutes: 28, isPreview: false },
          { slug: "lesson-19", title: "Project: Custom CMS with Admin Panel", durationMinutes: 60, isPreview: false },
          { slug: "lesson-20", title: "Testing, Debugging & Maintenance", durationMinutes: 30, isPreview: false },
        ],
      },
    ],
    learningOutcomes: [
      "Write secure, modern PHP 8 code",
      "Design and query MySQL databases with PDO",
      "Build authenticated web applications",
      "Implement MVC architecture from scratch",
      "Develop with Laravel framework basics",
      "Deploy PHP applications to production servers",
    ],
    requirements: [
      "HTML, CSS, and basic JavaScript knowledge",
      "Understanding of programming concepts",
      "Local development environment (XAMPP/Laragon/Docker)",
    ],
    targetAudience: [
      "Developers learning server-side programming",
      "WordPress developers wanting custom PHP skills",
      "Freelancers building client websites on shared hosting",
      "Students learning backend fundamentals",
    ],
    instructor: {
      id: "instructor-7",
      name: "Suresh Reddy",
      designation: "Senior PHP/Laravel Developer",
      bio: "Suresh has 10 years of experience building PHP applications for e-commerce, healthcare, and education sectors. He is a Laravel certified developer and contributes to PHP community initiatives.",
      expertise: ["PHP 8", "Laravel", "MySQL", "API Development", "Legacy Modernization"],
      imageUrl: undefined,
    },
    faqs: [
      {
        question: "Is PHP still relevant in 2024?",
        answer: "Yes, PHP powers ~77% of websites with known server-side language (W3Techs). Laravel is one of the most popular backend frameworks globally.",
      },
      {
        question: "Do I need to know Linux for deployment?",
        answer: "Basic Linux commands are covered in the deployment module. Shared hosting requires no Linux knowledge.",
      },
      {
        question: "Is Laravel covered in depth?",
        answer: "Module 4 covers Laravel fundamentals. Advanced Laravel (queues, events, broadcasting) is beyond this course scope.",
      },
    ],
    learningFeatures: [
      "Step-by-step local environment setup",
      "Security-focused coding practices",
      "Pre-configured Laravel starter kit",
      "Deployment scripts for common hosts",
      "Code snippets library",
      "Industry-aligned certificate",
    ],
  },
  {
    slug: "mern-stack-development",
    name: "MERN Stack Development",
    categorySlug: "web-programming",
    shortDescription: "MongoDB, Express, React and Node.js full-stack application development.",
    description: "Master the complete MERN stack for production-grade applications. Advanced React patterns, TypeScript, Redux Toolkit, Express API design, MongoDB aggregation, testing, CI/CD, Docker, and cloud deployment. Build a production-ready SaaS application.",
    level: "advanced",
    status: "published",
    durationWeeks: 20,
    durationBucket: "long",
    price: 35000,
    tags: ["mongodb", "express", "react", "node", "mern", "full stack"],
    learningMode: "online",
    thumbnailUrl: undefined,
    featured: true,
    syllabus: [
      {
        slug: "module-1",
        title: "TypeScript & Advanced React Patterns",
        description: "Type-safe React development with modern patterns",
        lessons: [
          { slug: "lesson-1", title: "TypeScript Fundamentals for React", durationMinutes: 35, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-2", title: "Advanced Hooks: Custom Hooks, useReducer Patterns", durationMinutes: 40, isPreview: false },
          { slug: "lesson-3", title: "Compound Components, Render Props & HOCs", durationMinutes: 35, isPreview: false },
          { slug: "lesson-4", title: "React Query / TanStack Query for Server State", durationMinutes: 45, isPreview: false },
        ],
      },
      {
        slug: "module-2",
        title: "State Management & Architecture",
        description: "Scalable state management and project architecture",
        lessons: [
          { slug: "lesson-5", title: "Redux Toolkit: Slices, Thunks, RTK Query", durationMinutes: 45, isPreview: false },
          { slug: "lesson-6", title: "Zustand/Jotai for Lightweight State", durationMinutes: 30, isPreview: false },
          { slug: "lesson-7", title: "Project Structure: Feature-Based Architecture", durationMinutes: 35, isPreview: false },
          { slug: "lesson-8", title: "Component Library & Design System Basics", durationMinutes: 35, isPreview: true, videoId: "dQw4w9WgXcQ" },
        ],
      },
      {
        slug: "module-3",
        title: "Production-Grade Backend with Express",
        description: "Robust API design, validation, and security",
        lessons: [
          { slug: "lesson-9", title: "Express Project Structure & Middleware Design", durationMinutes: 35, isPreview: false },
          { slug: "lesson-10", title: "Zod Validation, Error Handling & Logging", durationMinutes: 40, isPreview: false },
          { slug: "lesson-11", title: "Authentication: JWT, Refresh Tokens, OAuth2", durationMinutes: 50, isPreview: false },
          { slug: "lesson-12", title: "Rate Limiting, Helmet, CORS & Security Headers", durationMinutes: 35, isPreview: false },
        ],
      },
      {
        slug: "module-4",
        title: "MongoDB Advanced & Data Modeling",
        description: "Complex queries, aggregation, and performance",
        lessons: [
          { slug: "lesson-13", title: "Advanced Mongoose: Discriminators, Virtuals, Middleware", durationMinutes: 40, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-14", title: "Aggregation Pipeline for Analytics", durationMinutes: 45, isPreview: false },
          { slug: "lesson-15", title: "Indexes, Performance Tuning & Sharding Basics", durationMinutes: 35, isPreview: false },
          { slug: "lesson-16", title: "Data Migration & Seeding Strategies", durationMinutes: 30, isPreview: false },
        ],
      },
      {
        slug: "module-5",
        title: "Testing, CI/CD & Cloud Deployment",
        description: "Quality assurance and production deployment",
        lessons: [
          { slug: "lesson-17", title: "Unit & Integration Testing: Vitest, React Testing Library", durationMinutes: 45, isPreview: false },
          { slug: "lesson-18", title: "E2E Testing: Playwright/Cypress", durationMinutes: 40, isPreview: false },
          { slug: "lesson-19", title: "CI/CD: GitHub Actions, Docker, Kubernetes Basics", durationMinutes: 50, isPreview: false },
          { slug: "lesson-20", title: "Capstone: Production SaaS Application", durationMinutes: 90, isPreview: false },
        ],
      },
    ],
    learningOutcomes: [
      "Build type-safe React applications with TypeScript",
      "Implement advanced state management patterns",
      "Design secure, scalable REST APIs with Express",
      "Model complex data relationships in MongoDB",
      "Write comprehensive test suites (unit, integration, E2E)",
      "Configure CI/CD pipelines with GitHub Actions",
      "Deploy containerized applications to cloud platforms",
      "Architect maintainable, production-ready systems",
    ],
    requirements: [
      "Strong JavaScript/React fundamentals (Web Development course or equivalent)",
      "Node.js, Git, and VS Code proficiency",
      "Basic understanding of databases and APIs",
      "16+ GB RAM recommended for Docker/local Kubernetes",
    ],
    targetAudience: [
      "Senior frontend developers going full-stack",
      "Bootcamp graduates targeting senior roles",
      "Engineers building SaaS products",
      "Developers preparing for system design interviews",
    ],
    instructor: {
      id: "instructor-8",
      name: "Dr. Kavya Iyer",
      designation: "Principal Engineer & MERN Architect",
      bio: "Kavya has architected MERN applications serving millions of users at unicorn startups. PhD in Computer Science with focus on distributed systems. Regular conference speaker on React and Node.js performance.",
      expertise: ["MERN Stack", "System Design", "TypeScript", "Cloud Architecture", "Performance Engineering"],
      imageUrl: undefined,
    },
    faqs: [
      {
        question: "How is this different from the Web Development course?",
        answer: "MERN Stack is advanced: TypeScript, testing, CI/CD, Docker, Kubernetes, advanced patterns. Web Development covers fundamentals.",
      },
      {
        question: "Do I need to know TypeScript beforehand?",
        answer: "Module 1 teaches TypeScript from basics. Prior exposure helps but isn't required.",
      },
      {
        question: "Is this course updated for React 18/Next.js 14?",
        answer: "Yes, curriculum is reviewed quarterly. Current version covers React 18, Next.js App Router, and modern tooling.",
      },
    ],
    learningFeatures: [
      "Production-grade codebase access",
      "Architecture decision records (ADRs)",
      "Performance profiling workshops",
      "System design interview prep",
      "Alumni network with referral program",
      "Verified certificate with GitHub portfolio link",
    ],
  },
  {
    slug: "wordpress",
    name: "WordPress",
    categorySlug: "web-programming",
    shortDescription: "Build and manage professional websites with WordPress, themes and plugins.",
    description: "Master WordPress from installation to advanced customization. Build business sites, blogs, and e-commerce stores without coding. Covers Gutenberg editor, theme customization, essential plugins, WooCommerce, SEO, security, and multisite management.",
    level: "beginner",
    status: "published",
    durationWeeks: 8,
    durationBucket: "short",
    price: 10000,
    tags: ["wordpress", "cms", "themes", "plugins", "website"],
    learningMode: "online",
    thumbnailUrl: undefined,
    featured: false,
    syllabus: [
      {
        slug: "module-1",
        title: "WordPress Fundamentals",
        description: "Installation, dashboard, and content management",
        lessons: [
          { slug: "lesson-1", title: "WordPress.org vs .com, Installation & Setup", durationMinutes: 25, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-2", title: "Dashboard Tour: Posts, Pages, Media, Comments", durationMinutes: 22, isPreview: false },
          { slug: "lesson-3", title: "Gutenberg Block Editor Mastery", durationMinutes: 30, isPreview: false },
          { slug: "lesson-4", title: "Categories, Tags & Content Organization", durationMinutes: 20, isPreview: false },
        ],
      },
      {
        slug: "module-2",
        title: "Themes & Customization",
        description: "Visual design without coding",
        lessons: [
          { slug: "lesson-5", title: "Theme Selection, Installation & Customizer", durationMinutes: 25, isPreview: false },
          { slug: "lesson-6", title: "Full Site Editing (FSE) & Block Themes", durationMinutes: 30, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-7", title: "Child Themes & CSS Customization", durationMinutes: 25, isPreview: false },
          { slug: "lesson-8", title: "Page Builders: Elementor, Bricks, Spectra", durationMinutes: 35, isPreview: false },
        ],
      },
      {
        slug: "module-3",
        title: "Essential Plugins & Functionality",
        description: "Extend WordPress with the right plugins",
        lessons: [
          { slug: "lesson-9", title: "SEO: Yoast/RankMath Setup & Optimization", durationMinutes: 28, isPreview: false },
          { slug: "lesson-10", title: "Security: Wordfence, 2FA, Backups", durationMinutes: 25, isPreview: false },
          { slug: "lesson-11", title: "Performance: Caching, Image Optimization, CDN", durationMinutes: 30, isPreview: false },
          { slug: "lesson-12", title: "Forms, Analytics & Email Marketing Integration", durationMinutes: 28, isPreview: false },
        ],
      },
      {
        slug: "module-4",
        title: "WooCommerce & E-Commerce",
        description: "Build online stores with WordPress",
        lessons: [
          { slug: "lesson-13", title: "WooCommerce Setup: Products, Payments, Shipping", durationMinutes: 35, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-14", title: "Product Variations, Attributes & Inventory", durationMinutes: 25, isPreview: false },
          { slug: "lesson-15", title: "Orders, Coupons, Tax & Reports", durationMinutes: 25, isPreview: false },
          { slug: "lesson-16", title: "Extensions: Subscriptions, Bookings, Memberships", durationMinutes: 28, isPreview: false },
        ],
      },
      {
        slug: "module-5",
        title: "Advanced Topics & Project",
        description: "Multisite, migration, and capstone project",
        lessons: [
          { slug: "lesson-17", title: "WordPress Multisite Network Setup", durationMinutes: 25, isPreview: false },
          { slug: "lesson-18", title: "Migration, Staging & Version Control", durationMinutes: 30, isPreview: false },
          { slug: "lesson-19", title: "Project: Complete Business Website + Store", durationMinutes: 60, isPreview: false },
          { slug: "lesson-20", title: "Maintenance, Updates & Client Handoff", durationMinutes: 25, isPreview: false },
        ],
      },
    ],
    learningOutcomes: [
      "Install, configure, and secure WordPress sites",
      "Create content with Gutenberg and page builders",
      "Customize themes using Full Site Editing",
      "Select and configure essential plugins",
      "Build and manage WooCommerce stores",
      "Optimize for SEO, speed, and security",
      "Migrate and maintain WordPress sites professionally",
    ],
    requirements: [
      "Basic computer and internet skills",
      "Domain name and hosting (guidance provided for purchase)",
      "No coding experience required",
    ],
    targetAudience: [
      "Small business owners building own websites",
      "Freelancers offering WordPress services",
      "Bloggers and content creators",
      "Marketing professionals managing company sites",
    ],
    instructor: {
      id: "instructor-9",
      name: "Neha Gupta",
      designation: "WordPress Specialist & Digital Consultant",
      bio: "Neha has built 200+ WordPress sites for clients across industries. She specializes in performance optimization, WooCommerce, and training non-technical users to manage their own sites.",
      expertise: ["WordPress", "WooCommerce", "Elementor", "Site Performance", "Client Training"],
      imageUrl: undefined,
    },
    faqs: [
      {
        question: "Do I need to buy hosting before the course?",
        answer: "No, we provide a free temporary hosting sandbox for practice. Production hosting guidance is given in Module 5.",
      },
      {
        question: "Is coding (PHP/HTML/CSS) required?",
        answer: "No, this is a no-code WordPress course. Basic CSS customization is optional and taught in Module 2.",
      },
      {
        question: "Can I build an e-commerce site?",
        answer: "Yes, Module 4 covers WooCommerce in depth for building complete online stores.",
      },
    ],
    learningFeatures: [
      "Free practice hosting sandbox",
      "Curated plugin recommendation list",
      "Theme comparison guide (free vs premium)",
      "WooCommerce setup checklist",
      "Security hardening checklist",
      "Client handoff documentation template",
    ],
  },
  {
    slug: "java-advanced-java",
    name: "Java & Advanced Java",
    categorySlug: "web-programming",
    shortDescription: "Core Java programming concepts through advanced application development.",
    description: "Comprehensive Java training from fundamentals to enterprise development. Covers OOP, collections, streams, JDBC, Servlets, JSP, Spring Framework, Spring Boot, Hibernate/JPA, and REST API development. Build a complete Spring Boot application with database integration.",
    level: "intermediate",
    status: "published",
    durationWeeks: 16,
    durationBucket: "long",
    price: 22000,
    tags: ["java", "spring", "hibernate", "backend", "oop"],
    learningMode: "hybrid",
    thumbnailUrl: undefined,
    featured: false,
    syllabus: [
      {
        slug: "module-1",
        title: "Core Java Foundations",
        description: "Object-oriented programming and Java syntax",
        lessons: [
          { slug: "lesson-1", title: "Java Setup, JVM, JDK & IDE (IntelliJ/Eclipse)", durationMinutes: 25, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-2", title: "OOP: Classes, Objects, Inheritance, Polymorphism", durationMinutes: 35, isPreview: false },
          { slug: "lesson-3", title: "Interfaces, Abstract Classes & Design Principles", durationMinutes: 30, isPreview: false },
          { slug: "lesson-4", title: "Exceptions, Generics & Annotations", durationMinutes: 28, isPreview: false },
        ],
      },
      {
        slug: "module-2",
        title: "Collections, Streams & Concurrency",
        description: "Data structures, functional programming, and multithreading",
        lessons: [
          { slug: "lesson-5", title: "Collections Framework: List, Set, Map, Queue", durationMinutes: 35, isPreview: false },
          { slug: "lesson-6", title: "Streams API: Filter, Map, Reduce, Collectors", durationMinutes: 40, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-7", title: "Multithreading: Thread, ExecutorService, CompletableFuture", durationMinutes: 40, isPreview: false },
          { slug: "lesson-8", title: "Concurrency Utilities & Thread Safety", durationMinutes: 35, isPreview: false },
        ],
      },
      {
        slug: "module-3",
        title: "Database Connectivity & JDBC",
        description: "Relational database access from Java",
        lessons: [
          { slug: "lesson-9", title: "JDBC: Connection, Statements, PreparedStatement", durationMinutes: 30, isPreview: false },
          { slug: "lesson-10", title: "Connection Pooling (HikariCP) & Transactions", durationMinutes: 28, isPreview: false },
          { slug: "lesson-11", title: "DAO Pattern & Repository Design", durationMinutes: 30, isPreview: false },
          { slug: "lesson-12", title: "Project: Console-based CRUD Application", durationMinutes: 45, isPreview: false },
        ],
      },
      {
        slug: "module-4",
        title: "Spring Framework & Spring Boot",
        description: "Dependency injection, Spring MVC, and Boot auto-configuration",
        lessons: [
          { slug: "lesson-13", title: "Spring Core: IoC, DI, Bean Lifecycle", durationMinutes: 35, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-14", title: "Spring Boot: Starters, Auto-config, Profiles", durationMinutes: 35, isPreview: false },
          { slug: "lesson-15", title: "Spring MVC: Controllers, Validation, Exception Handling", durationMinutes: 40, isPreview: false },
          { slug: "lesson-16", title: "Spring Data JPA: Repositories, Query Methods, Specifications", durationMinutes: 45, isPreview: false },
        ],
      },
      {
        slug: "module-5",
        title: "REST APIs, Security & Deployment",
        description: "Production-ready Spring Boot applications",
        lessons: [
          { slug: "lesson-17", title: "REST API Design: Richardson Maturity, HATEOAS", durationMinutes: 35, isPreview: false },
          { slug: "lesson-18", title: "Spring Security: JWT, OAuth2, Method Security", durationMinutes: 50, isPreview: false },
          { slug: "lesson-19", title: "Testing: JUnit 5, Mockito, Testcontainers", durationMinutes: 40, isPreview: false },
          { slug: "lesson-20", title: "Capstone: Spring Boot REST API + Docker Deploy", durationMinutes: 60, isPreview: false },
        ],
      },
    ],
    learningOutcomes: [
      "Write clean, object-oriented Java code",
      "Use Collections, Streams, and Concurrency APIs effectively",
      "Connect Java applications to databases with JDBC/JPA",
      "Build Spring Boot applications with dependency injection",
      "Develop RESTful APIs with proper design principles",
      "Implement authentication and authorization with Spring Security",
      "Write unit and integration tests",
      "Containerize and deploy Spring Boot applications",
    ],
    requirements: [
      "Basic programming knowledge (any language)",
      "Understanding of OOP concepts helpful",
      "IntelliJ IDEA (Community) or Eclipse installed",
      "Java 17+ and Maven/Gradle",
    ],
    targetAudience: [
      "Computer science students and graduates",
      "Developers switching to Java ecosystem",
      "Backend developers learning Spring Boot",
      "Engineers preparing for Java interviews",
    ],
    instructor: {
      id: "instructor-10",
      name: "Prof. Amit Joshi",
      designation: "Java Architect & Spring Certified Professional",
      bio: "Amit has 15 years of enterprise Java experience in banking and telecom. He is a Spring Certified Professional and Oracle Certified Java Developer. Author of 'Spring Boot in Practice' (Manning).",
      expertise: ["Core Java", "Spring Ecosystem", "Microservices", "Performance Tuning", "Technical Writing"],
      imageUrl: undefined,
    },
    faqs: [
      {
        question: "Is this course suitable for complete beginners?",
        answer: "The course moves at an intermediate pace. Basic programming knowledge is required. Complete beginners should consider Python Programming first.",
      },
      {
        question: "Which Java version is used?",
        answer: "Java 17 LTS (current long-term support). Concepts apply to Java 21+.",
      },
      {
        question: "Is Hibernate covered separately?",
        answer: "Spring Data JPA (which uses Hibernate) is covered in Module 4. Native Hibernate is not separately taught.",
      },
    ],
    learningFeatures: [
      "IntelliJ/Eclipse setup guides",
      "Git repository with starter code per module",
      "Spring Boot best practices cheat sheet",
      "Interview question bank (Java + Spring)",
      "Docker deployment templates",
      "Oracle/Java certification alignment guide",
    ],
  },
  {
    slug: "python-programming",
    name: "Python Programming",
    categorySlug: "web-programming",
    shortDescription: "Python from basics to practical scripting and application building.",
    description: "Learn Python from zero to building real applications. Covers fundamentals, OOP, file handling, databases, web scraping, automation, data analysis with pandas, visualization, and web development with Flask/Django. Includes 4 portfolio projects.",
    level: "beginner",
    status: "published",
    durationWeeks: 12,
    durationBucket: "medium",
    price: 16000,
    tags: ["python", "scripting", "data science", "automation", "django"],
    learningMode: "online",
    thumbnailUrl: undefined,
    featured: true,
    syllabus: [
      {
        slug: "module-1",
        title: "Python Fundamentals",
        description: "Syntax, data types, control flow, and functions",
        lessons: [
          { slug: "lesson-1", title: "Python Setup, VS Code & First Program", durationMinutes: 20, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-2", title: "Variables, Data Types & Operators", durationMinutes: 25, isPreview: false },
          { slug: "lesson-3", title: "Control Flow: If, Loops, Comprehensions", durationMinutes: 30, isPreview: false },
          { slug: "lesson-4", title: "Functions, Scope, Lambda & Type Hints", durationMinutes: 30, isPreview: false },
        ],
      },
      {
        slug: "module-2",
        title: "Data Structures & OOP",
        description: "Collections, classes, and object-oriented design",
        lessons: [
          { slug: "lesson-5", title: "Lists, Tuples, Sets, Dictionaries Deep Dive", durationMinutes: 35, isPreview: false },
          { slug: "lesson-6", title: "Classes, Inheritance, Dataclasses, Protocols", durationMinutes: 35, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-7", title: "Modules, Packages & Virtual Environments", durationMinutes: 25, isPreview: false },
          { slug: "lesson-8", title: "Error Handling, Logging & Debugging", durationMinutes: 28, isPreview: false },
        ],
      },
      {
        slug: "module-3",
        title: "File I/O, Databases & Automation",
        description: "Practical scripting for real-world tasks",
        lessons: [
          { slug: "lesson-9", title: "File Operations: JSON, CSV, Excel (openpyxl)", durationMinutes: 30, isPreview: false },
          { slug: "lesson-10", title: "SQLite & SQLAlchemy ORM Basics", durationMinutes: 35, isPreview: false },
          { slug: "lesson-11", title: "Web Scraping: Requests, BeautifulSoup, Selenium", durationMinutes: 40, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-12", title: "Automation: Email, Scheduling, CLI Tools (Click)", durationMinutes: 35, isPreview: false },
        ],
      },
      {
        slug: "module-4",
        title: "Data Analysis & Visualization",
        description: "Pandas, NumPy, Matplotlib for data insights",
        lessons: [
          { slug: "lesson-13", title: "NumPy Arrays & Vectorized Operations", durationMinutes: 30, isPreview: false },
          { slug: "lesson-14", title: "Pandas: DataFrames, Cleaning, GroupBy, Merge", durationMinutes: 45, isPreview: false },
          { slug: "lesson-15", title: "Visualization: Matplotlib, Seaborn, Plotly", durationMinutes: 35, isPreview: false },
          { slug: "lesson-16", title: "Project: Exploratory Data Analysis", durationMinutes: 50, isPreview: false },
        ],
      },
      {
        slug: "module-5",
        title: "Web Development & Capstone",
        description: "Flask/Django basics and final portfolio project",
        lessons: [
          { slug: "lesson-17", title: "Flask: Routing, Templates, Forms, Deployment", durationMinutes: 40, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-18", title: "Django: Models, Admin, Auth, DRF Basics", durationMinutes: 50, isPreview: false },
          { slug: "lesson-19", title: "API Development with FastAPI", durationMinutes: 35, isPreview: false },
          { slug: "lesson-20", title: "Capstone: Full Portfolio Project", durationMinutes: 60, isPreview: false },
        ],
      },
    ],
    learningOutcomes: [
      "Write clean, Pythonic code with modern syntax",
      "Apply OOP principles and design patterns",
      "Automate repetitive tasks with scripts",
      "Work with files, databases, and APIs",
      "Perform data analysis and visualization",
      "Build web applications with Flask/Django/FastAPI",
      "Deploy Python applications to cloud platforms",
    ],
    requirements: [
      "No programming experience required",
      "Computer with Python 3.11+ and VS Code",
      "Basic math and logical thinking",
    ],
    targetAudience: [
      "Complete beginners to programming",
      "Data analysts adding Python to toolkit",
      "Automation engineers and QA testers",
      "Career changers entering tech",
      "Students preparing for data science",
    ],
    instructor: {
      id: "instructor-11",
      name: "Rohit Agarwal",
      designation: "Python Developer & Data Engineer",
      bio: "Rohit builds data pipelines and ML infrastructure at a leading fintech company. He contributes to open-source Python libraries and has mentored 500+ students in Python and data engineering.",
      expertise: ["Python", "Data Engineering", "FastAPI", "AWS", "Open Source"],
      imageUrl: undefined,
    },
    faqs: [
      {
        question: "Is this a data science course?",
        answer: "It covers data analysis fundamentals (Module 4) but is primarily a general Python programming course. For full data science/ML, see our advanced tracks.",
      },
      {
        question: "Which Python version?",
        answer: "Python 3.11+. All code compatible with 3.12/3.13.",
      },
      {
        question: "Are external libraries used?",
        answer: "Yes: requests, beautifulsoup4, pandas, numpy, matplotlib, flask, django, fastapi, sqlalchemy, pytest, and more. All installed via pip.",
      },
    ],
    learningFeatures: [
      "Interactive Jupyter notebooks for data modules",
      "Pre-configured VS Code workspace",
      "Automation script templates library",
      "Data project datasets provided",
      "Deployment guides for Render, Railway, Fly.io",
      "GitHub portfolio template included",
    ],
  },

  // Creative & Digital Skills
  {
    slug: "graphic-design",
    name: "Graphic Design",
    categorySlug: "creative-digital",
    shortDescription: "Design principles, branding and industry-standard design tools.",
    description: "Master visual communication through design theory and hands-on tool mastery. Learn design principles, typography, color theory, brand identity, and professional workflows in Photoshop, Illustrator, and InDesign. Build a portfolio of logos, brochures, social media graphics, and brand guidelines.",
    level: "beginner",
    status: "published",
    durationWeeks: 12,
    durationBucket: "medium",
    price: 18000,
    tags: ["photoshop", "illustrator", "branding", "logo", "print design"],
    learningMode: "hybrid",
    thumbnailUrl: undefined,
    featured: true,
    syllabus: [
      {
        slug: "module-1",
        title: "Design Foundations",
        description: "Visual principles, theory, and design thinking",
        lessons: [
          { slug: "lesson-1", title: "Design Principles: Balance, Contrast, Hierarchy, Rhythm", durationMinutes: 25, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-2", title: "Color Theory: Psychology, Harmony, Palettes", durationMinutes: 28, isPreview: false },
          { slug: "lesson-3", title: "Typography: Classification, Pairing, Systems", durationMinutes: 30, isPreview: false },
          { slug: "lesson-4", title: "Composition, Grids & Visual Hierarchy", durationMinutes: 25, isPreview: false },
        ],
      },
      {
        slug: "module-2",
        title: "Adobe Photoshop Mastery",
        description: "Raster editing, photo manipulation, and digital art",
        lessons: [
          { slug: "lesson-5", title: "Photoshop Interface, Layers & Selections", durationMinutes: 30, isPreview: false },
          { slug: "lesson-6", title: "Masking, Channels & Non-Destructive Editing", durationMinutes: 35, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-7", title: "Photo Retouching, Color Correction & Compositing", durationMinutes: 40, isPreview: false },
          { slug: "lesson-8", title: "Digital Painting, Brushes & Effects", durationMinutes: 35, isPreview: false },
        ],
      },
      {
        slug: "module-3",
        title: "Adobe Illustrator Mastery",
        description: "Vector graphics, logos, and illustrations",
        lessons: [
          { slug: "lesson-9", title: "Illustrator Interface, Paths & Shape Builder", durationMinutes: 30, isPreview: false },
          { slug: "lesson-10", title: "Pen Tool Mastery & Vector Illustration", durationMinutes: 40, isPreview: false },
          { slug: "lesson-11", title: "Typography Tools, Text Effects & Logo Design", durationMinutes: 35, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-12", title: "Patterns, Brushes & Export for Print/Web", durationMinutes: 30, isPreview: false },
        ],
      },
      {
        slug: "module-4",
        title: "Brand Identity & Print Design",
        description: "Complete branding systems and print production",
        lessons: [
          { slug: "lesson-13", title: "Brand Strategy: Research, Positioning, Voice", durationMinutes: 25, isPreview: false },
          { slug: "lesson-14", title: "Logo Design Process: Brief to Brand Guidelines", durationMinutes: 45, isPreview: false },
          { slug: "lesson-15", title: "Business Cards, Letterheads & Stationery Systems", durationMinutes: 30, isPreview: false },
          { slug: "lesson-16", title: "Brochures, Flyers & Print Production (Bleed, CMYK, PDF/X)", durationMinutes: 35, isPreview: false },
        ],
      },
      {
        slug: "module-5",
        title: "Digital Design & Portfolio",
        description: "Social media, UI basics, and portfolio presentation",
        lessons: [
          { slug: "lesson-17", title: "Social Media Graphics: Templates, Sizes, Animation", durationMinutes: 30, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-18", title: "UI Design Basics: Wireframes, Components, Figma Handoff", durationMinutes: 35, isPreview: false },
          { slug: "lesson-19", title: "Portfolio Curation & Presentation (Behance, PDF, Website)", durationMinutes: 30, isPreview: false },
          { slug: "lesson-20", title: "Capstone: Complete Brand Identity Project", durationMinutes: 60, isPreview: false },
        ],
      },
    ],
    learningOutcomes: [
      "Apply design principles to create visually balanced compositions",
      "Master Photoshop for photo editing and digital art",
      "Create scalable vector graphics and logos in Illustrator",
      "Design complete brand identity systems",
      "Prepare print-ready files with correct specifications",
      "Create engaging social media and digital graphics",
      "Build a professional design portfolio",
    ],
    requirements: [
      "Creative interest and visual aptitude",
      "Adobe Creative Cloud subscription (student pricing available)",
      "Computer meeting Adobe system requirements (16GB RAM recommended)",
      "No prior design experience needed",
    ],
    targetAudience: [
      "Aspiring graphic designers",
      "Marketing professionals creating visual content",
      "Entrepreneurs designing their own brand",
      "Artists transitioning to digital design",
    ],
    instructor: {
      id: "instructor-12",
      name: "Kavita Menon",
      designation: "Senior Brand Designer & Creative Director",
      bio: "Kavita has led branding for 50+ startups and established brands. Her work has been featured in Communication Arts and Brand New. She previously served as Creative Director at a Mumbai-based design agency.",
      expertise: ["Brand Identity", "Typography", "Photoshop", "Illustrator", "Design Strategy"],
      imageUrl: undefined,
    },
    faqs: [
      {
        question: "Do I need to buy Adobe software?",
        answer: "Yes, Adobe Creative Cloud is required. Student/teacher discount (60% off) is available with institute enrollment verification.",
      },
      {
        question: "Is this course only for print design?",
        answer: "No, it covers both print and digital design including social media, UI basics, and web-ready exports.",
      },
      {
        question: "Can I take this on a Mac or Windows?",
        answer: "Both platforms are supported. Adobe CC works identically on macOS and Windows.",
      },
    ],
    learningFeatures: [
      "Adobe CC student discount verification letter",
      "Design asset library (fonts, textures, mockups)",
      "Brand guideline template (InDesign/Figma)",
      "Print specification cheat sheets",
      "Portfolio review session with instructor",
      "Industry-standard certificate",
    ],
  },
  {
    slug: "digital-marketing",
    name: "Digital Marketing",
    categorySlug: "creative-digital",
    shortDescription: "SEO, social media, content and paid campaigns with measurable outcomes.",
    description: "Comprehensive digital marketing training covering SEO, social media marketing, content strategy, Google Ads, Meta Ads, email marketing, and analytics. Learn to build integrated campaigns, measure ROI, and optimize for conversions. Includes live campaign management practice.",
    level: "beginner",
    status: "published",
    durationWeeks: 10,
    durationBucket: "medium",
    price: 15000,
    tags: ["seo", "social media", "google ads", "content marketing", "analytics"],
    learningMode: "online",
    thumbnailUrl: undefined,
    featured: true,
    syllabus: [
      {
        slug: "module-1",
        title: "Digital Marketing Foundations",
        description: "Strategy, customer journey, and channel overview",
        lessons: [
          { slug: "lesson-1", title: "Digital Marketing Landscape & Customer Journey", durationMinutes: 25, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-2", title: "Brand Positioning, Value Props & Target Audiences", durationMinutes: 30, isPreview: false },
          { slug: "lesson-3", title: "Marketing Funnel: Awareness to Advocacy", durationMinutes: 25, isPreview: false },
          { slug: "lesson-4", title: "KPIs, OKRs & Measurement Frameworks", durationMinutes: 28, isPreview: false },
        ],
      },
      {
        slug: "module-2",
        title: "Search Engine Optimization (SEO)",
        description: "Organic search visibility and technical SEO",
        lessons: [
          { slug: "lesson-5", title: "How Search Works: Crawling, Indexing, Ranking", durationMinutes: 25, isPreview: false },
          { slug: "lesson-6", title: "Keyword Research, Intent & Content Planning", durationMinutes: 35, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-7", title: "On-Page SEO: Content, HTML, Site Structure", durationMinutes: 35, isPreview: false },
          { slug: "lesson-8", title: "Technical SEO: Speed, Schema, Core Web Vitals", durationMinutes: 35, isPreview: false },
          { slug: "lesson-9", title: "Off-Page SEO: Link Building, E-E-A-T, Local SEO", durationMinutes: 30, isPreview: false },
        ],
      },
      {
        slug: "module-3",
        title: "Social Media & Content Marketing",
        description: "Organic social strategy and content creation",
        lessons: [
          { slug: "lesson-10", title: "Platform Strategy: Meta, Instagram, LinkedIn, YouTube", durationMinutes: 30, isPreview: false },
          { slug: "lesson-11", title: "Content Pillars, Calendar & Creation Workflow", durationMinutes: 35, isPreview: false },
          { slug: "lesson-12", title: "Community Management & Influencer Collaboration", durationMinutes: 25, isPreview: false },
          { slug: "lesson-13", title: "Social Analytics & Reporting", durationMinutes: 25, isPreview: false },
        ],
      },
      {
        slug: "module-4",
        title: "Paid Advertising (PPC)",
        description: "Google Ads and Meta Ads campaign management",
        lessons: [
          { slug: "lesson-14", title: "Google Ads: Search, Display, Shopping, YouTube", durationMinutes: 40, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-15", title: "Meta Ads: Campaign Structure, Targeting, Creatives", durationMinutes: 40, isPreview: false },
          { slug: "lesson-16", title: "Conversion Tracking, Pixel & Attribution", durationMinutes: 30, isPreview: false },
          { slug: "lesson-17", title: "Optimization: A/B Testing, Bid Strategies, ROAS", durationMinutes: 35, isPreview: false },
        ],
      },
      {
        slug: "module-5",
        title: "Email, Analytics & Capstone",
        description: "Retention channels and integrated campaign project",
        lessons: [
          { slug: "lesson-18", title: "Email Marketing: List Building, Automation, Deliverability", durationMinutes: 30, isPreview: false },
          { slug: "lesson-19", title: "Google Analytics 4: Events, Funnels, Audiences", durationMinutes: 35, isPreview: false },
          { slug: "lesson-20", title: "Capstone: Integrated Campaign Plan & Live Demo", durationMinutes: 60, isPreview: false },
        ],
      },
    ],
    learningOutcomes: [
      "Develop data-driven digital marketing strategies",
      "Execute technical and content SEO for organic growth",
      "Manage organic social media across major platforms",
      "Create and optimize Google Ads and Meta Ads campaigns",
      "Set up conversion tracking and attribution",
      "Analyze performance with GA4 and platform analytics",
      "Build integrated multi-channel campaigns",
    ],
    requirements: [
      "Basic computer and internet skills",
      "No marketing experience required",
      "Google/Gmail account for Ads and Analytics practice",
      "Meta Business Manager access (guidance provided)",
    ],
    targetAudience: [
      "Marketing beginners and career switchers",
      "Business owners managing their own marketing",
      "Freelancers offering digital marketing services",
      "Traditional marketers upskilling to digital",
    ],
    instructor: {
      id: "instructor-13",
      name: "Sanjay Verma",
      designation: "Digital Marketing Strategist & Growth Consultant",
      bio: "Sanjay has managed ₹10Cr+ in ad spend across e-commerce, ed-tech, and B2B SaaS. Google Ads and Meta Blueprint certified. He runs a growth consultancy helping startups scale from 0 to 1.",
      expertise: ["Performance Marketing", "SEO", "Analytics", "Growth Strategy", "Marketing Automation"],
      imageUrl: undefined,
    },
    faqs: [
      {
        question: "Do I need to spend real money on ads during the course?",
        answer: "No, we use demo/sandbox accounts for practice. Live campaign management is optional with your own budget.",
      },
      {
        question: "Is this course updated for GA4?",
        answer: "Yes, Module 5 covers GA4 exclusively. Universal Analytics is not taught.",
      },
      {
        question: "Can I get Google/Meta certifications after this?",
        answer: "This course prepares you for certifications. Exam fees and certification are managed directly by Google/Meta.",
      },
    ],
    learningFeatures: [
      "Sandbox ad accounts for risk-free practice",
      "Keyword research and content calendar templates",
      "Ad copy frameworks and creative checklists",
      "GA4 setup and audit checklist",
      "Monthly strategy template for clients",
      "Performance marketing certificate",
    ],
  },

  // Communication & Personal Development
  {
    slug: "spoken-english-personality-development",
    name: "Spoken English + Personality Development",
    categorySlug: "communication-development",
    shortDescription: "Fluent spoken English with confidence, grooming and interview skills.",
    description: "Transform your communication skills with structured spoken English practice and personality development. Covers grammar for speech, vocabulary building, pronunciation, public speaking, interview preparation, body language, and professional etiquette. Includes daily speaking practice with feedback.",
    level: "all_levels",
    status: "published",
    durationWeeks: 8,
    durationBucket: "short",
    price: 12000,
    tags: ["english", "speaking", "personality", "interview", "communication"],
    learningMode: "hybrid",
    thumbnailUrl: undefined,
    featured: false,
    syllabus: [
      {
        slug: "module-1",
        title: "English Foundations for Speaking",
        description: "Grammar, vocabulary, and pronunciation essentials",
        lessons: [
          { slug: "lesson-1", title: "Parts of Speech & Sentence Structure for Speech", durationMinutes: 25, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-2", title: "Tenses in Spoken English: Practical Usage", durationMinutes: 30, isPreview: false },
          { slug: "lesson-3", title: "Vocabulary Building: Collocations, Phrasal Verbs, Idioms", durationMinutes: 30, isPreview: false },
          { slug: "lesson-4", title: "Pronunciation: Sounds, Stress, Intonation & Connected Speech", durationMinutes: 35, isPreview: false },
        ],
      },
      {
        slug: "module-2",
        title: "Daily Conversation Practice",
        description: "Real-life scenarios and fluency building",
        lessons: [
          { slug: "lesson-5", title: "Greetings, Introductions & Small Talk", durationMinutes: 25, isPreview: false },
          { slug: "lesson-6", title: "Describing Experiences, Opinions & Feelings", durationMinutes: 28, isPreview: false },
          { slug: "lesson-7", title: "Handling Situations: Shopping, Travel, Appointments", durationMinutes: 30, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-8", title: "Phone & Video Call Etiquette", durationMinutes: 22, isPreview: false },
        ],
      },
      {
        slug: "module-3",
        title: "Public Speaking & Presentation Skills",
        description: "Confidence, structure, and delivery techniques",
        lessons: [
          { slug: "lesson-9", title: "Overcoming Stage Fear & Building Confidence", durationMinutes: 25, isPreview: false },
          { slug: "lesson-10", title: "Speech Structure: Opening, Body, Conclusion", durationMinutes: 30, isPreview: false },
          { slug: "lesson-11", title: "Voice Modulation, Pace & Body Language", durationMinutes: 28, isPreview: false },
          { slug: "lesson-12", title: "Impromptu Speaking & Handling Questions", durationMinutes: 25, isPreview: false },
        ],
      },
      {
        slug: "module-4",
        title: "Interview & Professional Communication",
        description: "Job interviews, workplace communication, and soft skills",
        lessons: [
          { slug: "lesson-13", title: "Resume Review & Personal Branding", durationMinutes: 25, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-14", title: "Common Interview Questions & STAR Method", durationMinutes: 35, isPreview: false },
          { slug: "lesson-15", title: "Group Discussions & Case Studies", durationMinutes: 30, isPreview: false },
          { slug: "lesson-16", title: "Email Writing, Meetings & Professional Etiquette", durationMinutes: 28, isPreview: false },
        ],
      },
      {
        slug: "module-5",
        title: "Personality Development & Grooming",
        description: "Holistic professional presence",
        lessons: [
          { slug: "lesson-17", title: "Self-Awareness, Goal Setting & Time Management", durationMinutes: 25, isPreview: false },
          { slug: "lesson-18", title: "Corporate Grooming: Dress Code, Hygiene, Posture", durationMinutes: 22, isPreview: false },
          { slug: "lesson-19", title: "Emotional Intelligence & Interpersonal Skills", durationMinutes: 28, isPreview: false },
          { slug: "lesson-20", title: "Mock Interview & Final Assessment", durationMinutes: 40, isPreview: false },
        ],
      },
    ],
    learningOutcomes: [
      "Speak English fluently in daily and professional situations",
      "Use correct grammar, vocabulary, and pronunciation",
      "Deliver confident presentations and speeches",
      "Ace job interviews with structured responses",
      "Communicate professionally in workplace settings",
      "Develop positive body language and grooming habits",
      "Build emotional intelligence for better relationships",
    ],
    requirements: [
      "Basic English reading/writing ability (any level)",
      "Willingness to practice speaking daily",
      "Quiet space for speaking exercises",
      "Microphone/headset for online sessions",
    ],
    targetAudience: [
      "Students and fresh graduates preparing for placements",
      "Working professionals seeking career growth",
      "Job seekers facing interviews",
      "Anyone wanting to improve English fluency and confidence",
    ],
    instructor: {
      id: "instructor-14",
      name: "Dr. Sunita Rao",
      designation: "Communication Coach & Soft Skills Trainer",
      bio: "Sunita holds a PhD in English Literature and has 12 years of corporate training experience with MNCs. She is a certified NLP practitioner and has coached 10,000+ professionals in communication and interview skills.",
      expertise: ["Spoken English", "Interview Coaching", "Public Speaking", "Corporate Etiquette", "NLP"],
      imageUrl: undefined,
    },
    faqs: [
      {
        question: "What if I'm very weak in English?",
        answer: "The course starts from basics. Module 1 builds foundation. All levels welcome - content adapts to your pace.",
      },
      {
        question: "Is this only for job interviews?",
        answer: "No, it covers daily conversation, public speaking, and overall personality development. Interview prep is one module.",
      },
      {
        question: "How is speaking practiced online?",
        answer: "Live sessions include breakout rooms for pair practice. Recorded submissions get instructor feedback. WhatsApp group for daily voice note practice.",
      },
    ],
    learningFeatures: [
      "Daily speaking practice prompts (WhatsApp/Telegram)",
      "Personalized pronunciation feedback",
      "Mock interview sessions with industry experts",
      "Vocabulary flashcards (Anki/Quizlet)",
      "Interview question bank with model answers",
      "Confidence-building exercise library",
    ],
  },

  // Healthcare & Wellness
  {
    slug: "healthcare-medical-training",
    name: "Healthcare & Medical Training",
    categorySlug: "healthcare-wellness",
    shortDescription: "Foundation-level healthcare training for entry-level support roles.",
    description: "Comprehensive foundation course for healthcare support roles. Covers medical terminology, anatomy basics, patient care fundamentals, infection control, vital signs monitoring, first aid/CPR, medical documentation, and hospital protocols. Includes practical lab sessions and clinical observation.",
    level: "beginner",
    status: "published",
    durationWeeks: 14,
    durationBucket: "medium",
    price: 20000,
    tags: ["healthcare", "medical", "patient care", "first aid", "hospital"],
    learningMode: "offline",
    thumbnailUrl: undefined,
    featured: false,
    syllabus: [
      {
        slug: "module-1",
        title: "Healthcare Foundations",
        description: "Industry overview, terminology, and professional standards",
        lessons: [
          { slug: "lesson-1", title: "Healthcare System Overview & Career Pathways", durationMinutes: 25, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-2", title: "Medical Terminology: Prefixes, Roots, Suffixes", durationMinutes: 35, isPreview: false },
          { slug: "lesson-3", title: "Anatomy & Physiology Basics: Body Systems", durationMinutes: 40, isPreview: false },
          { slug: "lesson-4", title: "Professional Ethics, HIPAA & Patient Rights", durationMinutes: 30, isPreview: false },
        ],
      },
      {
        slug: "module-2",
        title: "Patient Care Fundamentals",
        description: "Essential skills for direct patient interaction",
        lessons: [
          { slug: "lesson-5", title: "Infection Control: Hand Hygiene, PPE, Isolation", durationMinutes: 35, isPreview: false },
          { slug: "lesson-6", title: "Vital Signs: Temperature, Pulse, Respiration, BP", durationMinutes: 40, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-7", title: "Patient Positioning, Transfers & Mobility Aid", durationMinutes: 35, isPreview: false },
          { slug: "lesson-8", title: "Basic Nutrition, Hydration & Elimination Care", durationMinutes: 30, isPreview: false },
        ],
      },
      {
        slug: "module-3",
        title: "Emergency Response & First Aid",
        description: "Life-saving skills and emergency protocols",
        lessons: [
          { slug: "lesson-9", title: "BLS/CPR: Adult, Child, Infant (AHA Guidelines)", durationMinutes: 50, isPreview: false },
          { slug: "lesson-10", title: "Choking, Bleeding, Burns & Fracture Management", durationMinutes: 40, isPreview: false },
          { slug: "lesson-11", title: "Medical Emergencies: Stroke, Heart Attack, Seizure", durationMinutes: 35, isPreview: false },
          { slug: "lesson-12", title: "Emergency Codes, Triage & Disaster Preparedness", durationMinutes: 30, isPreview: false },
        ],
      },
      {
        slug: "module-4",
        title: "Clinical Skills & Documentation",
        description: "Technical procedures and medical recording",
        lessons: [
          { slug: "lesson-13", title: "Specimen Collection: Urine, Stool, Sputum", durationMinutes: 25, isPreview: false },
          { slug: "lesson-14", title: "Glucose Monitoring, Nebulization & Oxygen Therapy", durationMinutes: 35, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-15", title: "Medical Documentation: Charts, EMR, Reporting", durationMinutes: 30, isPreview: false },
          { slug: "lesson-16", title: "Medication Safety: Rights, Routes, Documentation", durationMinutes: 35, isPreview: false },
        ],
      },
      {
        slug: "module-5",
        title: "Specialized Care & Capstone",
        description: "Geriatric, pediatric, and palliative care basics",
        lessons: [
          { slug: "lesson-17", title: "Geriatric Care: Fall Prevention, Dementia, Mobility", durationMinutes: 30, isPreview: false },
          { slug: "lesson-18", title: "Pediatric Basics: Growth, Immunization, Common Illnesses", durationMinutes: 30, isPreview: false },
          { slug: "lesson-19", title: "Palliative & End-of-Life Care Principles", durationMinutes: 25, isPreview: false },
          { slug: "lesson-20", title: "Clinical Observation & Final Practical Assessment", durationMinutes: 120, isPreview: false },
        ],
      },
    ],
    learningOutcomes: [
      "Use medical terminology accurately in clinical settings",
      "Perform infection control and safety protocols",
      "Measure and record vital signs correctly",
      "Provide basic patient care and assistance",
      "Respond to medical emergencies with BLS/CPR",
      "Document clinical observations professionally",
      "Understand hospital workflows and team roles",
    ],
    requirements: [
      "10+2 (any stream) or equivalent",
      "Medical fitness certificate",
      "No prior healthcare experience required",
      "Offline attendance mandatory for practical sessions",
    ],
    targetAudience: [
      "Aspiring nursing assistants, patient care technicians",
      "Students exploring healthcare careers",
      "Caregivers seeking formal training",
      "Career changers entering healthcare",
    ],
    instructor: {
      id: "instructor-15",
      name: "Dr. Meena Krishnan",
      designation: "RN, MSc Nursing & Clinical Educator",
      bio: "Dr. Meena has 20 years of clinical nursing experience in multispecialty hospitals and 8 years as a nursing educator. She is a certified BLS/ACLS instructor and has developed curriculum for paramedical programs.",
      expertise: ["Clinical Nursing", "Patient Care", "BLS/ACLS", "Nursing Education", "Healthcare Simulation"],
      imageUrl: undefined,
    },
    faqs: [
      {
        question: "Is this a nursing degree?",
        answer: "No, this is a foundation certificate course for healthcare support roles. It does not qualify you as a registered nurse.",
      },
      {
        question: "Can I take this course online?",
        answer: "No, this course requires offline attendance for practical labs, clinical observation, and BLS certification.",
      },
      {
        question: "Is BLS certification included?",
        answer: "Yes, Module 3 includes AHA-aligned BLS training. Successful completion provides institute BLS certification.",
      },
    ],
    learningFeatures: [
      "Hands-on practice in simulation lab",
      "Clinical observation at partner hospitals",
      "AHA-aligned BLS certification",
      "Medical terminology quick-reference guide",
      "Clinical skills checklist for competency",
      "Placement guidance for healthcare roles",
    ],
  },
  {
    slug: "yoga-meditation",
    name: "Yoga & Meditation",
    categorySlug: "healthcare-wellness",
    shortDescription: "Guided yoga practice, breathing techniques and meditation for wellbeing.",
    description: "Holistic wellness program combining traditional yoga asanas, pranayama (breathing techniques), and meditation practices. Suitable for all levels. Covers foundational poses, sun salutations, stress reduction techniques, mindfulness, and building a sustainable daily practice. Includes guided sessions for morning energy and evening relaxation.",
    level: "all_levels",
    status: "published",
    durationWeeks: 6,
    durationBucket: "short",
    price: 5000,
    tags: ["yoga", "meditation", "wellness", "breathing", "mindfulness"],
    learningMode: "online",
    thumbnailUrl: undefined,
    featured: false,
    syllabus: [
      {
        slug: "module-1",
        title: "Yoga Foundations",
        description: "Philosophy, preparation, and basic poses",
        lessons: [
          { slug: "lesson-1", title: "What is Yoga? History, Philosophy & Eight Limbs", durationMinutes: 20, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-2", title: "Setting Up: Space, Props, Clothing & Safety", durationMinutes: 15, isPreview: false },
          { slug: "lesson-3", title: "Breath Awareness & Basic Pranayama (Dirga, Ujjayi)", durationMinutes: 25, isPreview: false },
          { slug: "lesson-4", title: "Foundational Asanas: Standing, Seated, Supine", durationMinutes: 35, isPreview: false },
        ],
      },
      {
        slug: "module-2",
        title: "Sun Salutations & Flow",
        description: "Dynamic sequences for strength and flexibility",
        lessons: [
          { slug: "lesson-5", title: "Surya Namaskar A: Step-by-Step Breakdown", durationMinutes: 30, isPreview: false },
          { slug: "lesson-6", title: "Surya Namaskar B & Variations", durationMinutes: 30, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-7", title: "Vinyasa Flow: Linking Breath with Movement", durationMinutes: 35, isPreview: false },
          { slug: "lesson-8", title: "Building Your Personal Morning Sequence", durationMinutes: 25, isPreview: false },
        ],
      },
      {
        slug: "module-3",
        title: "Targeted Practice for Common Needs",
        description: "Therapeutic sequences for specific goals",
        lessons: [
          { slug: "lesson-9", title: "Yoga for Back Health & Core Strength", durationMinutes: 35, isPreview: false },
          { slug: "lesson-10", title: "Yoga for Stress Relief & Anxiety Reduction", durationMinutes: 30, isPreview: false },
          { slug: "lesson-11", title: "Yoga for Better Sleep & Evening Relaxation", durationMinutes: 28, isPreview: true, videoId: "dQw4w9WgXcQ" },
          { slug: "lesson-12", title: "Yoga for Energy, Focus & Productivity", durationMinutes: 30, isPreview: false },
        ],
      },
      {
        slug: "module-4",
        title: "Meditation & Mindfulness",
        description: "Cultivating inner stillness and awareness",
        lessons: [
          { slug: "lesson-13", title: "Meditation Basics: Posture, Anchor, Gentle Return", durationMinutes: 20, isPreview: false },
          { slug: "lesson-14", title: "Guided Meditations: Body Scan, Loving-Kindness, Mantra", durationMinutes: 30, isPreview: false },
          { slug: "lesson-15", title: "Mindfulness in Daily Life: Eating, Walking, Working", durationMinutes: 25, isPreview: false },
          { slug: "lesson-16", title: "Overcoming Obstacles: Restlessness, Sleepiness, Doubt", durationMinutes: 20, isPreview: false },
        ],
      },
      {
        slug: "module-5",
        title: "Integration & Sustainable Practice",
        description: "Building a lifelong yoga and meditation habit",
        lessons: [
          { slug: "lesson-17", title: "Creating Your Weekly Practice Schedule", durationMinutes: 20, isPreview: false },
          { slug: "lesson-18", title: "Journaling, Intention Setting & Progress Tracking", durationMinutes: 18, isPreview: false },
          { slug: "lesson-19", title: "Adapting Practice for Life Changes: Travel, Injury, Busy Periods", durationMinutes: 20, isPreview: false },
          { slug: "lesson-20", title: "Final Guided Session & Continuing Your Journey", durationMinutes: 40, isPreview: false },
        ],
      },
    ],
    learningOutcomes: [
      "Practice foundational yoga asanas with correct alignment",
      "Perform Sun Salutations A & B fluidly",
      "Use pranayama techniques for energy and calm",
      "Meditate independently for 10-20 minutes",
      "Apply mindfulness to daily activities",
      "Design personalized sequences for your needs",
      "Maintain a sustainable home practice",
    ],
    requirements: [
      "No prior yoga experience needed",
      "Yoga mat, comfortable clothing, quiet space",
      "Yoga blocks and strap recommended (not required)",
      "Consult physician if you have medical conditions",
    ],
    targetAudience: [
      "Beginners starting a wellness journey",
      "Stressed professionals seeking balance",
      "Anyone wanting to improve flexibility and strength",
      "People exploring meditation and mindfulness",
    ],
    instructor: {
      id: "instructor-16",
      name: "Anjali Deshpande",
      designation: "RYT-500 Yoga Teacher & Meditation Guide",
      bio: "Anjali has 15 years of yoga practice and 8 years teaching experience. Certified in Hatha, Vinyasa, Yin, and Restorative yoga. Trained in MBSR (Mindfulness-Based Stress Reduction) at UMass Medical School. Leads retreats internationally.",
      expertise: ["Hatha Yoga", "Vinyasa Flow", "Meditation", "Pranayama", "Yoga Therapy"],
      imageUrl: undefined,
    },
    faqs: [
      {
        question: "I'm not flexible - can I still do yoga?",
        answer: "Absolutely. Yoga improves flexibility over time. All poses include modifications for different body types and abilities.",
      },
      {
        question: "Is this a certification to teach yoga?",
        answer: "No, this is a personal practice course. For teacher training (RYT-200), a separate comprehensive program is required.",
      },
      {
        question: "Can I practice if I have back/knee issues?",
        answer: "Many students with joint issues benefit from yoga. Consult your doctor first. The course includes modifications and therapeutic sequences.",
      },
    ],
    learningFeatures: [
      "Guided video sessions (follow-along format)",
      "Audio-only meditation tracks for offline use",
      "Printable pose library with alignment cues",
      "Practice calendar and habit tracker",
      "Modifications for common limitations",
      "Lifetime access to all guided sessions",
    ],
  },
] as const;

/** Derive counts from data — never hardcode numbers anywhere in the app. */
export function getCategoryBySlug(slug: string): CatalogCategory | undefined {
  return COURSE_CATEGORIES.find((category) => category.slug === slug);
}

export function getCoursesByCategorySlug(slug: string): CatalogCourse[] {
  return CATALOG_COURSES.filter((course) => course.categorySlug === slug);
}

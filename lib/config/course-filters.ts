import { CATALOG_COURSES, COURSE_CATEGORIES, type CatalogCourse, type CatalogCategory } from "./catalog";
import type { CatalogCourseData, CourseStatus } from "@/types/course";

/** URL query parameter keys */
export const COURSE_FILTER_PARAMS = {
  search: "search",
  category: "category",
  level: "level",
  duration: "duration",
  sort: "sort",
} as const;

/** Sort options */
export type CourseSortOption = "recommended" | "a-z" | "z-a" | "popular";

export const COURSE_SORT_OPTIONS: readonly {
  value: CourseSortOption;
  label: string;
}[] = [
  { value: "recommended", label: "Recommended" },
  { value: "a-z", label: "A–Z" },
  { value: "z-a", label: "Z–A" },
  { value: "popular", label: "Popular" },
] as const;

/** Level filter options */
export const COURSE_LEVEL_OPTIONS: readonly {
  value: CatalogCourse["level"];
  label: string;
}[] = [
  { value: "all_levels", label: "All Levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

/** Duration filter options */
export const COURSE_DURATION_OPTIONS: readonly {
  value: CatalogCourse["durationBucket"];
  label: string;
}[] = [
  { value: "short", label: "Short Courses (≤8 weeks)" },
  { value: "medium", label: "Medium Duration (9–16 weeks)" },
  { value: "long", label: "Long Duration (17+ weeks)" },
] as const;

/** Category filter options (includes "All Courses") */
export const COURSE_CATEGORY_OPTIONS: readonly {
  value: string;
  label: string;
}[] = [
  { value: "", label: "All Courses" },
  ...COURSE_CATEGORIES.map((cat) => ({ value: cat.slug, label: cat.name })),
] as const;

/**
 * Convert CatalogCourse to CourseSummary for UI components.
 */
export function toCourseSummary(course: CatalogCourse): CatalogCourseData {
  const category = getCategoryBySlug(course.categorySlug);
  return {
    id: `catalog-${course.slug}`,
    name: course.name,
    slug: course.slug,
    shortDescription: course.shortDescription,
    categoryName: category?.name,
    level: course.level,
    status: course.status as CourseStatus,
    thumbnailUrl: course.thumbnailUrl,
    durationWeeks: course.durationWeeks,
    price: course.price,
    currency: "INR",
    featured: course.featured,
  };
}

/**
 * Filter courses based on search query and active filters.
 * All filtering is case-insensitive.
 */
export function filterCourses(
  courses: readonly CatalogCourse[],
  filters: {
    search?: string;
    category?: string;
    level?: string;
    duration?: string;
  }
): CatalogCourse[] {
  const { search, category, level, duration } = filters;

  return courses.filter((course) => {
    // Search filter: matches title, category, description, or tags
    if (search && search.trim()) {
      const query = search.trim().toLowerCase();
      const categoryName = getCategoryBySlug(course.categorySlug)?.name.toLowerCase() ?? "";
      const matchesSearch =
        course.name.toLowerCase().includes(query) ||
        course.shortDescription.toLowerCase().includes(query) ||
        categoryName.includes(query) ||
        course.tags.some((tag) => tag.toLowerCase().includes(query));

      if (!matchesSearch) return false;
    }

    // Category filter
    if (category && category !== "") {
      if (course.categorySlug !== category) return false;
    }

    // Level filter
    if (level && level !== "all_levels") {
      if (course.level !== level) return false;
    }

    // Duration filter
    if (duration) {
      if (course.durationBucket !== duration) return false;
    }

    return true;
  });
}

/**
 * Sort courses based on the selected sort option.
 */
export function sortCourses(
  courses: readonly CatalogCourse[],
  sort: CourseSortOption
): CatalogCourse[] {
  const sorted = [...courses];

  switch (sort) {
    case "a-z":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "z-a":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case "popular":
      return sorted.sort((a, b) => {
        // Featured courses first, then by name
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return a.name.localeCompare(b.name);
      });
    case "recommended":
    default:
      // Recommended uses the original catalog order (which is the configured sortOrder)
      return sorted;
  }
}

/**
 * Get a course by its slug.
 */
export function getCourseBySlug(slug: string): CatalogCourse | undefined {
  return CATALOG_COURSES.find((course) => course.slug === slug);
}

/**
 * Get a category by its slug.
 */
export function getCategoryBySlug(slug: string): CatalogCategory | undefined {
  return COURSE_CATEGORIES.find((category) => category.slug === slug);
}

/**
 * Get all courses for a category.
 */
export function getCoursesByCategorySlug(slug: string): CatalogCourse[] {
  return CATALOG_COURSES.filter((course) => course.categorySlug === slug);
}

/**
 * Parse URL search params into filter object.
 */
export function parseFilterParams(searchParams: {
  search?: string;
  category?: string;
  level?: string;
  duration?: string;
  sort?: string;
}): {
  search: string;
  category: string;
  level: string;
  duration: string;
  sort: CourseSortOption;
} {
  return {
    search: searchParams.search ?? "",
    category: searchParams.category ?? "",
    level: searchParams.level ?? "all_levels",
    duration: searchParams.duration ?? "",
    sort: (searchParams.sort as CourseSortOption) ?? "recommended",
  };
}

/**
 * Build URL search params from filter object.
 */
export function buildFilterParams(filters: {
  search?: string;
  category?: string;
  level?: string;
  duration?: string;
  sort?: CourseSortOption;
}): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.search?.trim()) params.set(COURSE_FILTER_PARAMS.search, filters.search.trim());
  if (filters.category) params.set(COURSE_FILTER_PARAMS.category, filters.category);
  if (filters.level && filters.level !== "all_levels") params.set(COURSE_FILTER_PARAMS.level, filters.level);
  if (filters.duration) params.set(COURSE_FILTER_PARAMS.duration, filters.duration);
  if (filters.sort && filters.sort !== "recommended") params.set(COURSE_FILTER_PARAMS.sort, filters.sort);

  return params;
}

/**
 * Check if any filters are active (excluding default values).
 */
export function hasActiveFilters(filters: {
  search?: string;
  category?: string;
  level?: string;
  duration?: string;
  sort?: CourseSortOption;
}): boolean {
  return !!(
    filters.search?.trim() ||
    filters.category ||
    (filters.level && filters.level !== "all_levels") ||
    filters.duration ||
    (filters.sort && filters.sort !== "recommended")
  );
}

/**
 * Get active filter labels for display.
 */
export function getActiveFilterLabels(filters: {
  search?: string;
  category?: string;
  level?: string;
  duration?: string;
}): Array<{ label: string; param: keyof typeof COURSE_FILTER_PARAMS; value: string }> {
  const labels: Array<{ label: string; param: keyof typeof COURSE_FILTER_PARAMS; value: string }> = [];

  if (filters.search?.trim()) {
    labels.push({ label: `Search: "${filters.search.trim()}"`, param: "search", value: filters.search.trim() });
  }
  if (filters.category) {
    const cat = getCategoryBySlug(filters.category);
    labels.push({ label: `Category: ${cat?.name ?? filters.category}`, param: "category", value: filters.category });
  }
  if (filters.level && filters.level !== "all_levels") {
    const levelOpt = COURSE_LEVEL_OPTIONS.find((o) => o.value === filters.level);
    labels.push({ label: `Level: ${levelOpt?.label ?? filters.level}`, param: "level", value: filters.level });
  }
  if (filters.duration) {
    const durOpt = COURSE_DURATION_OPTIONS.find((o) => o.value === filters.duration);
    labels.push({ label: `Duration: ${durOpt?.label ?? filters.duration}`, param: "duration", value: filters.duration });
  }

  return labels;
}
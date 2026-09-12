/**
 * Returns a high-quality relevant institute course cover image based on course slug and category.
 */
export function getCourseImage(
  slug?: string,
  categorySlug?: string,
  categoryName?: string
): string {
  const s = (slug || "").toLowerCase();
  const c = (categorySlug || "").toLowerCase();
  const cn = (categoryName || "").toLowerCase();

  // Web & Programming
  if (
    s.includes("web") ||
    s.includes("program") ||
    s.includes("mern") ||
    s.includes("python") ||
    s.includes("code") ||
    s.includes("react") ||
    s.includes("javascript") ||
    c.includes("web") ||
    c.includes("program") ||
    cn.includes("programming")
  ) {
    return "/images/course-web-dev.jpg";
  }

  // Tally & Accounting
  if (
    s.includes("tally") ||
    s.includes("account") ||
    s.includes("gst") ||
    s.includes("tax") ||
    s.includes("finance") ||
    c.includes("account") ||
    cn.includes("account")
  ) {
    return "/images/course-tally-accounting.jpg";
  }

  // Graphic Design & Creative Digital
  if (
    s.includes("design") ||
    s.includes("graphic") ||
    s.includes("creative") ||
    s.includes("digital-market") ||
    s.includes("marketing") ||
    s.includes("photoshop") ||
    s.includes("figma") ||
    c.includes("creative") ||
    cn.includes("creative")
  ) {
    return "/images/course-graphic-design.jpg";
  }

  // Basic & Office Skills (Computer basics, typing, data entry)
  if (
    s.includes("basic") ||
    s.includes("computer") ||
    s.includes("typing") ||
    s.includes("data-entry") ||
    s.includes("office") ||
    s.includes("excel") ||
    c.includes("basic") ||
    cn.includes("basic")
  ) {
    return "/images/course-basic-computer.jpg";
  }

  // Communication & Personal Development
  if (
    s.includes("english") ||
    s.includes("spoken") ||
    s.includes("communication") ||
    s.includes("personality") ||
    c.includes("communication") ||
    cn.includes("communication")
  ) {
    return "/images/guidance.jpg";
  }

  // Healthcare & Wellness
  if (
    s.includes("health") ||
    s.includes("yoga") ||
    s.includes("wellness") ||
    c.includes("health") ||
    cn.includes("health")
  ) {
    return "/images/learning.jpg";
  }

  // General Institute Fallback
  return "/images/classroom.jpg";
}

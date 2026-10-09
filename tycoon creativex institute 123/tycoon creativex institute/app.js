const $ = (selector) => document.querySelector(selector);
const byId = (id) => document.getElementById(id);

function categoryById(id) {
  return categories.find((category) => category.id === id);
}
function courseById(id) {
  return courses.find((course) => course.id === id);
}
function courseCard(course) {
  const category = categoryById(course.category);
  return `<article class="course-card"><img src="${course.image}" alt="${course.name} course"><div class="course-card-body"><span class="course-category">${category.name}</span><h3>${course.name}</h3><p>${course.description}</p><ul class="skill-pills">${course.skills.map((skill) => `<li>${skill}</li>`).join("")}</ul><div class="course-meta"><span><small>Duration</small>${course.duration}</span><span><small>Fees</small>${course.fee}${course.suggested ? "<em>Suggested · confirm</em>" : ""}</span></div><div class="card-actions"><a class="btn btn-small btn-outline" href="course-details.html?course=${course.id}">View Details</a><a class="btn btn-small btn-primary" href="admission.html?course=${course.id}">Apply Now</a></div></div></article>`;
}
function categoryCards(target, links = true) {
  target.innerHTML = categories
    .map(
      (category) =>
        `<a class="category-card" href="${links ? `courses.html?category=${category.id}` : "#"}"><span class="category-icon">${category.icon}</span><strong>${category.name}</strong><small>${category.description}</small></a>`,
    )
    .join("");
}
function renderHeader() {
  byId("site-header").innerHTML =
    // `<header class="site-header"><div class="container nav-wrap"><a class="brand" href="index.html"><img src="logo.jpeg" alt="Tycoon CreativeX Institute logo"><span>Tycoon CreativeX<br><small>Institute</small></span></a><button class="menu-toggle" aria-label="Open navigation" aria-expanded="false">☰</button><nav class="main-nav"><a href="index.html">Home</a><a href="about.html">About Us</a><a href="courses.html">Courses</a><a href="internship.html">Internship</a><a href="faq.html">FAQ</a><a href="admission.html">Admission</a><a href="contact.html">Contact Us</a><a class="nav-apply" href="admission.html">Apply Now <span>→</span></a></nav></div></header>`;
    `<header class="site-header"><div class="container nav-wrap"><a class="brand" href="index.html"><img src="logo.jpeg" alt="Tycoon CreativeX Institute logo"></a><button class="menu-toggle" aria-label="Open navigation" aria-expanded="false">☰</button><nav class="main-nav"><a href="index.html">Home</a><a href="about.html">About Us</a><a href="courses.html">Courses</a><a href="internship.html">Internship</a><a href="faq.html">FAQ</a><a href="admission.html">Admission</a><a href="contact.html">Contact Us</a><a class="nav-apply" href="admission.html">Apply Now <span>→</span></a></nav></div></header>`;

  const toggle = $(".menu-toggle");
  const nav = $(".main-nav");
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}
function renderFooter() {
  byId("site-footer").innerHTML =
    `<footer class="site-footer"><div class="container footer-grid"><div><a class="brand footer-brand" href="index.html"><img src="logo.jpeg" alt="Tycoon CreativeX Institute logo"><span>Tycoon CreativeX<br><small>Institute</small></span></a><p>Practical skills, clear direction, and a supportive place to grow.</p></div><div><h4>Explore</h4><a href="about.html">About Us</a><a href="courses.html">Courses</a><a href="internship.html">Internship</a><a href="faq.html">FAQ</a></div><div><h4>Get started</h4><a href="admission.html">Admission enquiry</a><a href="contact.html">Contact Us</a><a href="courses.html">All course categories</a></div><div><h4>Contact</h4><p>Phone :  9501013548, 
    <br>
    email : simmainc.ca@gmail.com, 
    <br>
    address :  Main Road, Opp. MGM Mall, A.P. Enclave, Dhuri, Punjab – 148024, 
    <br>
    and social links will be added when officially confirmed.</p></div></div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} Tycoon CreativeX Institute</span><span>Learn today. Build your future.</span></div></footer>`;
}
function renderWhatsappButton() {
  const link = document.createElement("a");
  const message =
    "Hello Tycoon CreativeX Institute, I would like to know more about your courses and admission.";
  link.className = "whatsapp-float";
  link.href = `https://wa.me/919501013548?text=${encodeURIComponent(message)}`;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.setAttribute(
    "aria-label",
    "Chat with Tycoon CreativeX Institute on WhatsApp",
  );
  link.title = "Chat with us on WhatsApp";
  link.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.52 3.48A11.9 11.9 0 0 0 12.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.15 1.6 5.96L0 24l6.3-1.65a11.9 11.9 0 0 0 5.76 1.47h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.17-3.45-8.44ZM12.06 21.8a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.38a9.85 9.85 0 0 1-1.52-5.26c0-5.45 4.44-9.89 9.9-9.89a9.82 9.82 0 0 1 7 2.9 9.82 9.82 0 0 1 2.9 7c0 5.45-4.45 9.89-9.9 9.89Zm5.43-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.47-2.4-1.48-.9-.8-1.5-1.78-1.68-2.08-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.08-.15-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z"/></svg>';
  document.body.append(link);
}
function setupCourses() {
  categoryCards(byId("course-category-row"));
  const filter = byId("category-filter");
  categories.forEach((category) =>
    filter.insertAdjacentHTML(
      "beforeend",
      `<option value="${category.id}">${category.name}</option>`,
    ),
  );
  const search = byId("course-search");
  const grid = byId("all-courses");
  const noCourses = byId("no-courses");
  const params = new URLSearchParams(location.search);
  const initialCategory = params.get("category") || "all";
  filter.value = initialCategory;
  function update() {
    const term = search.value.toLowerCase().trim();
    const selected = filter.value;
    const list = courses.filter(
      (course) =>
        (selected === "all" || course.category === selected) &&
        (!term ||
          `${course.name} ${course.description} ${course.skills.join(" ")}`
            .toLowerCase()
            .includes(term)),
    );
    grid.innerHTML = list.map(courseCard).join("");
    noCourses.hidden = list.length > 0;
  }
  search.addEventListener("input", update);
  filter.addEventListener("change", update);
  update();
}
function setupDetails() {
  const course =
    courseById(new URLSearchParams(location.search).get("course")) ||
    courses[0];
  document.title = `${course.name} | Tycoon CreativeX Institute`;
  const programNote = ["php", "python", "javascript"].includes(course.id)
    ? `<div class="detail-note"><strong>Programming internship pathway</strong><p>Ask about the available 6-week and 6-month internship options related to this course.</p></div>`
    : "";
  byId("course-detail").innerHTML =
    `<section class="detail-hero"><div class="container"><a class="back-link" href="courses.html">← Back to all courses</a><div class="detail-grid"><img src="${course.image}" alt="${course.name} course"><div><span class="course-category">${categoryById(course.category).name}</span><h1>${course.name}</h1><p>${course.description}</p><div class="detail-meta"><span><small>Duration</small>${course.duration}</span><span><small>Fees</small>${course.fee}${course.suggested ? "<em>Suggested · confirm with institute</em>" : ""}</span></div><a class="btn btn-primary" href="admission.html?course=${course.id}">Apply for this course →</a></div></div></div></section><section class="section"><div class="container detail-content"><div><p class="eyebrow">Course overview</p><h2>What you will learn</h2><p>${course.description} The learning journey is designed to be clear, practical, and easy to follow.</p><ul class="large-check-list">${course.skills.map((skill) => `<li>✓ ${skill}</li>`).join("")}</ul>${programNote}</div><aside class="join-card"><h3>Who can join?</h3><p>Students, beginners, and learners looking to build a practical foundation can enquire. We will help you understand the best starting point.</p><h3>Career direction</h3><p>Use these skills for study, personal projects, office tasks, or to explore related opportunities. No job or placement guarantee is implied.</p><a class="text-link" href="contact.html">Ask a question →</a></aside></div></section>`;
}
function setupFaq() {
  byId("faq-list").innerHTML = faqs
    .map(
      ([question, answer], index) =>
        `<div class="faq-item"><button aria-expanded="${index === 0}">${question}<span>+</span></button><div class="faq-answer" ${index === 0 ? "" : "hidden"}><p>${answer}</p></div></div>`,
    )
    .join("");
  document.querySelectorAll(".faq-item button").forEach((button) =>
    button.addEventListener("click", () => {
      const answer = button.nextElementSibling;
      const open = !answer.hidden;
      answer.hidden = open;
      button.setAttribute("aria-expanded", String(!open));
      button.querySelector("span").textContent = open ? "+" : "−";
    }),
  );
}
function setupAdmission() {
  const categorySelect = byId("admission-category");
  const courseSelect = byId("admission-course");
  const durationSelect = byId("admission-duration");
  categorySelect.innerHTML =
    '<option value="">Choose a category</option>' +
    categories
      .map(
        (category) =>
          `<option value="${category.id}">${category.name}</option>`,
      )
      .join("");
  function updateCourses() {
    const selected = categorySelect.value;
    const list = courses.filter(
      (course) => !selected || course.category === selected,
    );
    courseSelect.innerHTML =
      '<option value="">Choose a course</option>' +
      list
        .map((course) => `<option value="${course.id}">${course.name}</option>`)
        .join("");
  }
  categorySelect.addEventListener("change", updateCourses);
  courseSelect.addEventListener("change", () => {
    const course = courseById(courseSelect.value);
    if (course) {
      categorySelect.value = course.category;
      durationSelect.value = course.duration;
    }
  });
  durationSelect.innerHTML =
    '<option value="">Choose preferred duration</option>' +
    [
      "1 Month",
      "2 Months",
      "3 Months",
      "4 Months",
      "6 Months",
      "Flexible / discuss",
    ]
      .map((duration) => `<option>${duration}</option>`)
      .join("");
  updateCourses();
  const params = new URLSearchParams(location.search);
  const selectedCourse = courseById(params.get("course"));
  if (selectedCourse) {
    categorySelect.value = selectedCourse.category;
    updateCourses();
    courseSelect.value = selectedCourse.id;
    durationSelect.value = selectedCourse.duration;
  }
}
function setupForms() {
  document.querySelectorAll("form").forEach((form) =>
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const status = form.querySelector(".form-status");
      status.className = "form-status success";
      status.textContent =
        "Your enquiry is ready, but this demo has no backend connection yet. Please contact the institute to submit it.";
    }),
  );
}
renderHeader();
renderFooter();
const page = document.body.dataset.page;
if (page === "home") {
  categoryCards(byId("category-row"));
  byId("popular-courses").innerHTML = courses
    .slice(0, 6)
    .map(courseCard)
    .join("");
}
if (page === "courses") setupCourses();
if (page === "details") setupDetails();
if (page === "faq") setupFaq();
if (page === "admission") setupAdmission();
setupForms();
renderWhatsappButton();

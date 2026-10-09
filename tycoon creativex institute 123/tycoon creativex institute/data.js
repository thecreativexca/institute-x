const institute = {
  name: "Tycoon CreativeX Institute",
  tagline: "Practical skills. Clear direction.",
  contact: { phone: "", email: "", address: "", whatsapp: "", socials: [] }
};

const categories = [
  { id: "basic-office", name: "Basic & Office Skills", icon: "▦", description: "Build everyday digital confidence." },
  { id: "web", name: "Web Design & Development", icon: "</>", description: "Create for the connected world." },
  { id: "programming", name: "Programming", icon: "{ }", description: "Think logically and build tools." },
  { id: "creative", name: "Creative & Digital Marketing", icon: "✦", description: "Make ideas visible and useful." },
  { id: "communication", name: "Communication Skills", icon: "◌", description: "Speak with clarity and confidence." },
  { id: "wellness", name: "Health & Wellness", icon: "♡", description: "Support a healthier routine." },
  { id: "other", name: "Other", icon: "⋯", description: "Explore additional courses." }
];

const courses = [
  { id:"basic-computer", name:"Basic Computer", category:"basic-office", duration:"3 Months", fee:"₹3,500", suggested:true, description:"Learn the essential computer skills you need for study, work, and everyday tasks.", skills:["Computer basics","Files and internet","Word and presentations"], image:"https://plus.unsplash.com/premium_photo-1663045638674-89dc9ff0ba02?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8YmFzaWMlMjBjb21wdXRlciUyMGNvdXJzZXxlbnwwfHwwfHx8MA%3D%3D" },
  { id:"typing", name:"Typing", category:"basic-office", duration:"1 Month", fee:"₹1,000",suggested:true, description:"Improve typing accuracy and speed with structured keyboard practice.", skills:["Keyboard confidence","Accuracy drills","Speed practice"], image:"https://plus.unsplash.com/premium_photo-1661628794051-c390f1b1e716?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8dHlwaW5nfGVufDB8fDB8fHww" },
  { id:"data-entry", name:"Data Entry", category:"basic-office", duration:"3 Months", fee:"₹3,500", suggested:true, description:"Build careful, organised data entry habits for office and online work.", skills:["Data accuracy","Spreadsheets","Document handling"], image:"https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=82" },
  { id:"tally-accounting", name:"Tally + Accounting", category:"basic-office", duration:"3 Months", fee:"₹4,500", suggested:true, description:"Understand practical bookkeeping, accounts, and Tally workflows.", skills:["Ledger basics","Tally workflow","Reports and calculations"], image:"https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=82" },
  { id:"web-development", name:"Web Development", category:"web", duration:"6 Months", fee:"₹18,500", suggested:true, description:"Learn how websites work and build responsive pages with modern foundations.", skills:["HTML and CSS","JavaScript basics","Responsive layouts"], image:"https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=82" },
  { id:"web-designing", name:"Web Designing", category:"web", duration:"4 Months", fee:"₹16,500", suggested:true, description:"Plan and design clear, attractive website experiences for real audiences.", skills:["Layout and typography","UI principles","Design tools"], image:"https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=800&q=82" },
  // { id:"php", name:"PHP", category:"programming", duration:"6 Months", fee:"₹18,000 - 20,000", suggested:true, description:"Understand server-side programming and build practical PHP web features.", skills:["PHP syntax","Forms and sessions","Database foundations"], image:"https://images.unsplash.com/photo-1599507593499-a3f7d7d97667?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGhwfGVufDB8fDB8fHww" },
  { id:"python", name:"Python", category:"programming", duration:"6 Months", fee:"₹18,500", suggested:true, description:"Start programming with Python through clear concepts and useful exercises.", skills:["Programming logic","Python syntax","Small projects"], image:"https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=800&q=82" },
  { id:"wordpress", name:"Wordpress", category:"web", duration:"3 Months", fee:"₹12,500", suggested:true, description:"A powerful platform for creating and managing professional websites without extensive coding.", skills:["Website Development","Custom Theme Design","WooCommerce"], image:"https://images.unsplash.com/photo-1616469832301-ffaeadc68cf3?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8d29yZHByZXNzJTIwaW1hZ2V8ZW58MHx8MHx8fDA%3D" },
  { id:"graphics-designing", name:"Graphics Designing", category:"creative", duration:"4 Months", fee:"₹16,500", suggested:true, description:"Turn ideas into visual designs for digital and print communication.", skills:["Design principles","Creative tools","Brand visuals"], image:"https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=82" },
  { id:"digital-marketing", name:"Digital Marketing", category:"creative", duration:"6 Months", fee:"₹18,500", suggested:true, description:"Explore the channels, content, and thinking behind digital campaigns.", skills:["Content planning","Social media","Campaign basics"], image:"https://images.unsplash.com/photo-1557838923-2985c318be48?auto=format&fit=crop&w=800&q=82" },
  { id:"spoken-english", name:"Spoken English & Personality Development", category:"communication", duration:"3 Months", fee:"₹8,000", suggested:true, description:"Practise everyday English and develop confident, professional communication.", skills:["Conversation practice","Presentation skills","Personal confidence"], image:"https://images.unsplash.com/photo-1529390079861-591de354faf5?auto=format&fit=crop&w=800&q=82" },
  { id:"yoga-meditation", name:"Yoga & Meditation", category:"wellness", duration:"3 Months", fee:"₹10,000", suggested:true, description:"Learn accessible practices that support mindful movement and calm routines.", skills:["Breathing practice","Mindful movement","Relaxation habits"], image:"https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=82" },
  { id:"health-wellness", name:"Health & Medical Training", category:"wellness", duration:"3-6 Months", fee:"₹10,000", suggested:true, description:"Build an informed, practical understanding of everyday health and wellbeing.", skills:["Healthy routines","Wellness awareness","Lifestyle planning"], image:"https://plus.unsplash.com/premium_photo-1698421947098-d68176a8f5b2?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8SGVhbHRoJTIwJTI2JTIwTWVkaWNhbCUyMFRyYWluaW5nfGVufDB8fDB8fHww" },
  { id:"other-courses", name:"For Only Other Courses", category:"other", suggested:true, description:"If you are looking for a course that is not currently listed, you can choose this option. Share your preferred course or training requirement with us, and our team will help you with the available options, course details, duration, and guidance.", skills:["Other courses"],image:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRMNvR3ILpGJg6cSZt3Zq9mIQEz4JiPYijOWxYyoOtS3Q&s=10" }
];

const faqs = [
  ["What courses are available?","There are 14 courses across basic and office skills, web, programming, creative and marketing, communication, and wellness."],
  ["Can beginners join?","Yes. Many courses are designed to start with foundations, and you can enquire about the best fit for your current level."],
  ["How can I apply for admission?","Complete the admission enquiry form on this website. The institute can then confirm availability and next steps."],
  ["What are the course durations and fees?","Every course has a suggested duration and fee shown on the Courses page. Typing is confirmed at 1 Month and ₹1,000; other values should be confirmed with the institute."],
  ["What is the 6-week internship?","It is a focused, six-week practical experience with guided activities and project work."],
  ["What is the 6-month internship?","It is a deeper six-month learning journey with more time for consistent practice and larger projects."],
  ["Can programming students enquire about internships?","Yes. Programming learners can ask about course-related internship pathways and which option fits their goals."],
  ["How can I contact the institute?","Use the Contact page or admission enquiry form. Official phone, email, and address details can be added in data.js once confirmed."]
];

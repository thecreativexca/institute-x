"use client";

import { Accordion } from "@/components/ui/accordion";
import type { CatalogFAQ } from "@/lib/config/catalog";

interface CourseFAQProps {
  faqs: CatalogFAQ[];
}

export function CourseFAQ({ faqs }: CourseFAQProps) {
  if (!faqs || faqs.length === 0) {
    return null;
  }

  const items = faqs.map((faq, index) => ({
    value: `faq-${index}`,
    trigger: (
      <h3 className="font-medium text-slate-900">{faq.question}</h3>
    ),
    content: (
      <div className="text-slate-700 leading-relaxed">
        <p>{faq.answer}</p>
      </div>
    ),
  }));

  return (
    <section aria-labelledby="faq-heading" className="space-y-4">
      <h2 id="faq-heading" className="text-2xl font-semibold text-slate-900">
        Frequently Asked Questions
      </h2>
      <Accordion type="multiple" items={items} />
    </section>
  );
}
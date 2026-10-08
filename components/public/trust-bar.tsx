import { Award, BookOpen, CheckCircle2, ShieldCheck, Users } from "lucide-react";

import { Container } from "@/components/ui/container";

const trustPoints = [
  { icon: CheckCircle2, label: "Structured syllabus for every course" },
  { icon: BookOpen,     label: "Video lessons in a student portal" },
  { icon: Users,        label: "Real instructor-designed content" },
  { icon: ShieldCheck,  label: "Progress tracking built in" },
  { icon: Award,        label: "Certificate on completion" },
];

export function TrustBar() {
  return (
    <div className="education-trust-bar" aria-label="Platform highlights">
      <Container>
        <ul className="education-trust-bar-inner">
          {trustPoints.map(({ icon: Icon, label }) => (
            <li key={label} className="education-trust-item">
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
}

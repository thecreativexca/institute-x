import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PlaceholderPanelProps {
  title: string;
  description: string;
}

/**
 * Neutral placeholder for office modules that are scheduled for later phases.
 * Shows an access-safe "coming soon" state — no fake data, no dead actions.
 */
export function PlaceholderPanel({ title, description }: PlaceholderPanelProps) {
  return (
    <Card className="mx-auto mt-10 max-w-lg">
      <CardHeader className="items-center text-center">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-center text-sm text-slate-500">
        This module is planned for a later phase of the office portal.
      </CardContent>
    </Card>
  );
}

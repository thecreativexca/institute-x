"use client";

import { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, ChevronUp, ChevronDown } from "lucide-react";

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn("border-b border-slate-200", className)}>
      <nav className="flex gap-1 overflow-x-auto pb-px" role="tablist" aria-label="Student profile sections">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            id={`${tab.id}-tab`}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
            className={cn(
              "flex items-center gap-2 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors rounded-t-lg border-b-2 -mb-px",
              activeTab === tab.id
                ? "border-primary-600 text-primary-600 bg-primary-50"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50",
              tab.disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

interface TabPanelProps {
  id: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ id, activeTab, children, className }: TabPanelProps) {
  if (activeTab !== id) return null;
  return (
    <div
      role="tabpanel"
      id={`${id}-panel`}
      aria-labelledby={`${id}-tab`}
      className={cn("py-4", className)}
    >
      {children}
    </div>
  );
}

/**
 * Client-side tab state shared between the tab bar and panels. Server
 * Components can render ProfileTabsShell and ProfileTabPanel with server
 * children while interactivity stays client-side.
 */
const ProfileTabsContext = createContext<{ active: string; setActive: (id: string) => void }>({
  active: "overview",
  setActive: () => {},
});

export function ProfileTabsShell({
  tabs,
  defaultTab = "overview",
  children,
  className,
}: {
  tabs: Tab[];
  defaultTab?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [active, setActive] = useState(defaultTab);
  return (
    <ProfileTabsContext.Provider value={{ active: active, setActive: setActive }}>
      <div className={className}>{children}</div>
    </ProfileTabsContext.Provider>
  );
}

export function ProfileTabsBar({ tabs, className }: { tabs: Tab[]; className?: string }) {
  const { active, setActive } = useContext(ProfileTabsContext);
  return <Tabs tabs={tabs} activeTab={active} onChange={setActive} className={className} />;
}

export function ProfileTabPanel({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { active } = useContext(ProfileTabsContext);
  return (
    <TabPanel id={id} activeTab={active} className={className}>
      {children}
    </TabPanel>
  );
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export function CollapsibleSection({ title, children, defaultOpen = true, icon, className }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={cn("border border-slate-200 rounded-xl bg-white overflow-hidden", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors",
          !open && "border-b border-slate-200"
        )}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          {icon}
          <h3 className="font-semibold text-slate-900">{title}</h3>
        </div>
        {open ? (
          <ChevronUp className="h-5 w-5 text-slate-400 transition-transform" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-5 w-5 text-slate-400 transition-transform" aria-hidden="true" />
        )}
      </button>
      {open && <div className="p-4 border-t border-slate-200">{children}</div>}
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("text-center py-12", className)}>
      <div className="mx-auto h-12 w-12 text-slate-300" aria-hidden="true">{icon}</div>
      <h3 className="mt-4 text-lg font-medium text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface DataTableProps<T> {
  columns: Array<{
    key: string;
    header: string;
    render: (row: T) => React.ReactNode;
    className?: string;
  }>;
  data: T[];
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  keyExtractor: (row: T) => string;
  className?: string;
}

export function DataTable<T>({ columns, data, emptyMessage = "No data available", emptyIcon, keyExtractor, className }: DataTableProps<T>) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      {data.length > 0 ? (
        <table className="w-full" role="table">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {columns.map((col) => (
                <th key={col.key} className={cn("px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider", col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.map((row) => (
              <tr key={keyExtractor(row)} className="hover:bg-slate-50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-4", col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <EmptyState
          icon={emptyIcon}
          title="No records"
          description={emptyMessage}
        />
      )}
    </div>
  );
}

interface StatusBadgeProps {
  status: string;
  variants?: Record<string, BadgeVariant>;
  labels?: Record<string, string>;
}

export function StatusBadge({ status, variants = {}, labels = {} }: StatusBadgeProps) {
  const variant = variants[status] || "neutral";
  const label = labels[status] || status;

  return (
    <Badge variant={variant} className="px-2.5 py-0.5 rounded-full text-xs font-medium">
      {label}
    </Badge>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export function ProgressBar({ value, max = 100, label, showPercentage = true, className }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">{label}</span>
          {showPercentage && <span className="font-medium text-slate-900">{percentage}%</span>}
        </div>
      )}
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-600 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label ? `${label}: ${percentage}%` : `${percentage}%`}
        />
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 id="dialog-title" className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant === "danger" ? "danger" : "primary"} onClick={onConfirm} disabled={loading}>
            {loading ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
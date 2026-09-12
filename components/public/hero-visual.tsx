import Image from "next/image";
import { Award, CheckCircle2, Sparkles, Users, Star } from "lucide-react";

/**
 * Enhanced Hero visual — displays authentic institute campus reception,
 * students in practical computer training, and floating achievement badges.
 */
export function HeroVisual() {
  return (
    <div className="relative mx-auto max-w-xl lg:max-w-none">
      {/* Decorative gradient aura */}
      <div
        aria-hidden="true"
        className="absolute -inset-2 rounded-[2.5rem] bg-gradient-to-tr from-primary-400/20 via-accent-300/30 to-primary-600/20 blur-xl -z-10"
      />

      {/* Main Image Frame */}
      <div className="relative overflow-hidden rounded-[2rem] border-2 border-white/80 bg-white p-2 shadow-[0_20px_50px_rgba(113,63,18,0.14)]">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.5rem]">
          <Image
            src="/images/campus-reception.jpg"
            alt="Creative X Tycoon Institute Campus & Learning Center"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-950/80 via-transparent to-black/10" />

          {/* Top Live Badge */}
          <div className="absolute top-3.5 left-3.5 flex items-center gap-2 rounded-full bg-primary-950/85 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>Admissions Open • Daily Practical Batches</span>
          </div>

          {/* Bottom Overlay Label */}
          <div className="absolute bottom-3.5 inset-x-3.5 text-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-300">
              Central Campus & Practical Lab
            </p>
            <p className="text-sm sm:text-base font-bold drop-shadow">
              State-of-the-Art Computer & Skill Development Center
            </p>
          </div>
        </div>
      </div>

      {/* Floating Badge 1: 10k+ Alumni & 4.9 Rating (Bottom Left / Overlap) */}
      <div className="absolute -bottom-6 -left-4 sm:-left-6 rounded-2xl border border-primary-200 bg-white/95 p-3.5 shadow-[0_12px_32px_rgba(113,63,18,0.11)] backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-100 text-primary-900">
            <Users className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
              <span>4.9 / 5.0</span>
              <span className="text-slate-400 font-normal">(1,200+ Reviews)</span>
            </div>
            <p className="text-sm font-bold text-primary-950">10,000+ Students Trained</p>
            <p className="text-[11px] text-slate-500">Industry-recognized diplomas</p>
          </div>
        </div>
      </div>

      {/* Floating Badge 2: ISO & Practical Labs (Top Right / Overlap) */}
      <div className="hidden sm:flex absolute -top-5 -right-4 rounded-2xl border border-primary-200 bg-white/95 p-3.5 shadow-[0_12px_32px_rgba(113,63,18,0.11)] backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-800">
            <Award className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Verified Institute
            </span>
            <p className="text-xs font-bold text-primary-950">100% Practical Training</p>
          </div>
        </div>
      </div>
    </div>
  );
}

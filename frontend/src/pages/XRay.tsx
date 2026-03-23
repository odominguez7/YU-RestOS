import { useEffect, useState, useRef } from "react";
import { Skeleton } from "@/components/Skeleton";
import { api } from "@/lib/api";
import {
  Shield,
  ShieldCheck,
  Cloud,
  X,
  Check,
  Lock,
  Wifi,
  Eye,
  Heart,
  Brain,
  Activity,
  Moon,
  AlertTriangle,
  Server,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Animated counter hook                                               */
/* ------------------------------------------------------------------ */
function useAnimatedCounter(target: number, duration = 1400) {
  const [value, setValue] = useState(0);
  const ref = useRef<number>();
  useEffect(() => {
    if (!target) return;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [target, duration]);
  return value;
}

/* ------------------------------------------------------------------ */
/* Data-exposure items                                                 */
/* ------------------------------------------------------------------ */
const CLOUD_DATA_SENT = [
  { label: "Sleep score history (14 days)", icon: Moon },
  { label: "HRV measurements", icon: Activity },
  { label: "Heart rate data", icon: Heart },
  { label: "Mood, energy, stress scores", icon: Brain },
  { label: "Behavioral patterns", icon: Eye },
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */
const XRay = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    api
      .get("/api/coaching/xray")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  // Staggered entrance after data loads
  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setVisible(true), 80);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const localLatency = useAnimatedCounter(
    data?.local?.latency_ms ?? 0,
    1600
  );
  const cloudLatency = useAnimatedCounter(
    data?.cloud?.latency_ms ?? 0,
    1600
  );

  /* ---- Loading state ---- */
  if (loading) {
    return (
      <div className="min-h-screen" style={bgStyle}>
        <div className="max-w-6xl mx-auto px-6 py-16 space-y-10">
          {/* Header skeleton */}
          <div className="text-center space-y-4">
            <Skeleton className="h-12 w-72 mx-auto rounded-xl bg-white/5" />
            <Skeleton className="h-5 w-96 mx-auto rounded-lg bg-white/5" />
          </div>

          {/* Split-screen skeleton */}
          <div className="relative">
            <p className="text-center text-sm text-slate-400 mb-6 animate-pulse tracking-wide">
              Generating coaching from both sources...
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="rounded-2xl border border-emerald-500/20 bg-white/[0.03] p-8 space-y-5">
                <Skeleton className="h-8 w-32 rounded-lg bg-emerald-500/10" />
                <Skeleton className="h-4 w-48 rounded bg-white/5" />
                <Skeleton className="h-4 w-40 rounded bg-white/5" />
                <Skeleton className="h-32 w-full rounded-xl bg-white/5" />
              </div>
              <div className="rounded-2xl border border-red-500/20 bg-white/[0.03] p-8 space-y-5">
                <Skeleton className="h-8 w-32 rounded-lg bg-red-500/10" />
                <Skeleton className="h-4 w-48 rounded bg-white/5" />
                <Skeleton className="h-4 w-40 rounded bg-white/5" />
                <Skeleton className="h-32 w-full rounded-xl bg-white/5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={bgStyle}>
      <div className="max-w-6xl mx-auto px-6 py-16 space-y-14">
        {/* ========== HEADER ========== */}
        <header
          className="text-center space-y-3 transition-all duration-700"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(-20px)",
          }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs tracking-[0.25em] uppercase text-slate-400 mb-4">
            <Eye className="w-3.5 h-3.5" />
            Transparency Mode
          </div>
          <h1
            className="text-5xl md:text-6xl font-black tracking-tight"
            style={{
              background: "linear-gradient(135deg, #fff 40%, #94a3b8 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            X-RAY MODE
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto">
            Where Does Your Data Go?
          </p>
        </header>

        {/* ========== TWO-COLUMN COMPARISON ========== */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* ---------- LOCAL AI (GREEN) ---------- */}
          <div
            className="relative rounded-2xl overflow-hidden transition-all duration-700"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(30px)",
              transitionDelay: "200ms",
            }}
          >
            {/* Glow */}
            <div
              className="absolute -inset-px rounded-2xl pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(16,185,129,0.35) 0%, rgba(16,185,129,0.05) 100%)",
              }}
            />
            <div
              className="relative rounded-2xl border border-emerald-500/30 p-8 space-y-6"
              style={{
                background:
                  "linear-gradient(160deg, rgba(16,185,129,0.06) 0%, rgba(15,23,42,0.85) 50%)",
                backdropFilter: "blur(24px)",
              }}
            >
              {/* Label */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/25">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-emerald-400 tracking-wide">
                    LOCAL AI
                  </h2>
                  <p className="text-xs text-slate-500">
                    {data?.local?.model || "Granite 3.3 (8B)"}
                  </p>
                </div>
              </div>

              {/* Latency */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white tabular-nums">
                  {localLatency}
                </span>
                <span className="text-sm text-slate-500">ms latency</span>
              </div>

              {/* Data sent */}
              <div className="rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 px-5 py-4 text-center">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">
                  Data sent
                </p>
                <p className="text-2xl font-black text-emerald-400">NONE</p>
              </div>

              {/* Privacy badge */}
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">
                  Private — on-device
                </span>
              </div>

              {/* Response */}
              {data?.local?.response && (
                <div className="rounded-xl bg-white/[0.03] border border-white/5 p-5 max-h-56 overflow-y-auto scrollbar-thin">
                  <p className="text-[11px] text-slate-600 uppercase tracking-widest mb-2">
                    AI Coaching Response
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {data.local.response}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ---------- CLOUD AI (RED) ---------- */}
          <div
            className="relative rounded-2xl overflow-hidden transition-all duration-700"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(30px)",
              transitionDelay: "400ms",
            }}
          >
            {/* Glow */}
            <div
              className="absolute -inset-px rounded-2xl pointer-events-none"
              style={{
                background:
                  "linear-gradient(135deg, rgba(239,68,68,0.3) 0%, rgba(239,68,68,0.04) 100%)",
              }}
            />
            <div
              className="relative rounded-2xl border border-red-500/30 p-8 space-y-6"
              style={{
                background:
                  "linear-gradient(160deg, rgba(239,68,68,0.06) 0%, rgba(15,23,42,0.85) 50%)",
                backdropFilter: "blur(24px)",
              }}
            >
              {/* Label */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/25">
                  <Cloud className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-400 tracking-wide">
                    CLOUD AI
                  </h2>
                  <p className="text-xs text-slate-500">
                    {data?.cloud?.model || "Claude Sonnet"}
                  </p>
                </div>
              </div>

              {/* Latency */}
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white tabular-nums">
                  {cloudLatency}
                </span>
                <span className="text-sm text-slate-500">ms latency</span>
              </div>

              {/* Data sent */}
              <div className="rounded-xl bg-red-500/[0.08] border border-red-500/20 px-5 py-4">
                <p className="text-xs text-slate-500 uppercase tracking-widest mb-3">
                  Data sent to cloud
                </p>
                <ul className="space-y-2">
                  {CLOUD_DATA_SENT.map(({ label, icon: Icon }) => (
                    <li
                      key={label}
                      className="flex items-center gap-2 text-sm text-red-300"
                    >
                      <Icon className="w-3.5 h-3.5 text-red-400/70 shrink-0" />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Privacy warning */}
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-500/10 border border-red-500/20 w-fit">
                <X className="w-4 h-4 text-red-400" />
                <span className="text-sm font-semibold text-red-400">
                  Sent to external servers
                </span>
              </div>

              {/* Response */}
              {data?.cloud?.response && (
                <div className="rounded-xl bg-white/[0.03] border border-white/5 p-5 max-h-56 overflow-y-auto scrollbar-thin">
                  <p className="text-[11px] text-slate-600 uppercase tracking-widest mb-2">
                    AI Coaching Response
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {data.cloud.response}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========== DRAMATIC QUOTE ========== */}
        <div
          className="relative rounded-2xl overflow-hidden transition-all duration-700"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "600ms",
          }}
        >
          <div
            className="rounded-2xl border border-white/10 px-8 py-10 text-center"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
              backdropFilter: "blur(24px)",
            }}
          >
            <p className="text-lg md:text-xl text-slate-300 italic leading-relaxed max-w-3xl mx-auto">
              "Same quality coaching. Same data analysis.
              <br />
              <span className="text-emerald-400 font-semibold not-italic">
                One keeps your data on your device.
              </span>{" "}
              <span className="text-red-400 font-semibold not-italic">
                One sends it to external servers.
              </span>
              "
            </p>
          </div>
        </div>

        {/* ========== DATA EXPOSURE SUMMARY ========== */}
        <div
          className="transition-all duration-700"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transitionDelay: "800ms",
          }}
        >
          <div
            className="rounded-2xl border border-white/10 px-8 py-8"
            style={{
              background:
                "linear-gradient(160deg, rgba(239,68,68,0.04) 0%, rgba(15,23,42,0.7) 50%)",
              backdropFilter: "blur(24px)",
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <Server className="w-4 h-4 text-slate-500" />
              <p className="text-xs text-slate-500 uppercase tracking-[0.2em] font-medium">
                What bytes would leave your device with cloud AI
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {CLOUD_DATA_SENT.map(({ label, icon: Icon }, i) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-2 rounded-xl bg-red-500/[0.06] border border-red-500/15 px-4 py-4 text-center transition-all duration-500"
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible
                      ? "translateY(0)"
                      : "translateY(12px)",
                    transitionDelay: `${900 + i * 100}ms`,
                  }}
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-red-500/10">
                    <Icon className="w-4 h-4 text-red-400/80" />
                  </div>
                  <span className="text-[11px] text-red-300/80 leading-tight">
                    {label}
                  </span>
                  <Wifi className="w-3 h-3 text-red-500/40" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ========== FINAL LINE ========== */}
        <div
          className="text-center transition-all duration-700"
          style={{
            opacity: visible ? 1 : 0,
            transitionDelay: "1200ms",
          }}
        >
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Lock className="w-4 h-4 text-emerald-400" />
            <p className="text-sm font-semibold text-emerald-400">
              With YU RestOS: Zero bytes sent. Granite 3.3 on-device.
            </p>
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---- Background style ---- */
const bgStyle: React.CSSProperties = {
  background:
    "linear-gradient(165deg, #0b1120 0%, #0f172a 40%, #0b1a2e 70%, #0f172a 100%)",
  minHeight: "100vh",
};

export default XRay;

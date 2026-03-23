import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/Skeleton";
import { api } from "@/lib/api";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceArea, ReferenceLine
} from "recharts";
import { AlertTriangle, TrendingDown, ArrowDown, ArrowUp, Calendar, Flame } from "lucide-react";

/* ── inline keyframes injected once ── */
const styleId = "drift-keyframes";
if (typeof document !== "undefined" && !document.getElementById(styleId)) {
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `
    @keyframes drift-pulse { 0%,100%{opacity:1} 50%{opacity:.55} }
    @keyframes drift-shake { 0%,100%{transform:translateX(0)} 10%,30%,50%,70%,90%{transform:translateX(-3px)} 20%,40%,60%,80%{transform:translateX(3px)} }
    @keyframes drift-fill { from{width:0%} }
    @keyframes drift-glow { 0%,100%{box-shadow:0 0 8px rgba(239,68,68,.4)} 50%{box-shadow:0 0 24px rgba(239,68,68,.8)} }
    @keyframes drift-fade-up { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
    @keyframes drift-cta-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.5)} 50%{box-shadow:0 0 0 12px rgba(34,197,94,0)} }
    @keyframes drift-icon-spin { 0%{transform:rotate(0deg)} 25%{transform:rotate(-12deg)} 75%{transform:rotate(12deg)} 100%{transform:rotate(0deg)} }
  `;
  document.head.appendChild(style);
}

const labelMap: Record<string, string> = {
  sleepScore: "Sleep Score",
  hrv: "HRV",
  mood: "Mood",
  energy: "Energy",
};

const Drift = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [barWidth, setBarWidth] = useState(0);
  const mounted = useRef(false);

  useEffect(() => {
    api.get("/api/drift/analyze")
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  /* animate severity bar on mount */
  useEffect(() => {
    if (data && !mounted.current) {
      mounted.current = true;
      requestAnimationFrame(() => {
        setTimeout(() => {
          const pct = Math.min(100, (data.severity_score / 50) * 100);
          setBarWidth(pct);
        }, 300);
      });
    }
  }, [data]);

  /* ── loading skeleton ── */
  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: "linear-gradient(180deg,#0b1120 0%,#111827 100%)" }}>
        <div className="max-w-4xl mx-auto px-6 py-16 space-y-6">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data || !data.drift_detected) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0b1120" }}>
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold text-green-400">No drift detected.</p>
          <p className="text-slate-400">Your vitals are holding steady.</p>
          <Link to="/dashboard"><Button variant="ghost" size="lg">Back to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  const severityLabel = data.severity ?? "none";
  const severityScore = data.severity_score ?? 0;
  const signals = data.signals ?? [];
  const baseline = data.baseline ?? {};

  /* compute latest values from last signal */
  const latest = signals.length > 0 ? signals[signals.length - 1] : baseline;

  const severityColor =
    severityLabel === "high" ? "#ef4444"
    : severityLabel === "medium" ? "#f59e0b"
    : "#22c55e";

  const severityBg =
    severityLabel === "high" ? "rgba(239,68,68,.15)"
    : severityLabel === "medium" ? "rgba(245,158,11,.15)"
    : "rgba(34,197,94,.15)";

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg,#0b1120 0%,#111827 100%)" }}>
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">

        {/* ═══════ WARNING HEADER ═══════ */}
        <div
          className="rounded-2xl border p-8 text-center relative overflow-hidden"
          style={{
            background: severityBg,
            borderColor: severityColor,
            animation: "drift-glow 2s ease-in-out infinite",
          }}
        >
          {/* pulsing bg overlay */}
          <div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: `radial-gradient(ellipse at center, ${severityColor}22 0%, transparent 70%)`,
              animation: "drift-pulse 2s ease-in-out infinite",
            }}
          />

          <div className="relative z-10 space-y-5">
            {/* alert icon */}
            <div className="flex justify-center">
              <div
                className="rounded-full p-3"
                style={{
                  background: `${severityColor}33`,
                  animation: "drift-icon-spin 1s ease-in-out",
                }}
              >
                <AlertTriangle className="w-10 h-10" style={{ color: severityColor }} />
              </div>
            </div>

            {/* title with shake */}
            <h1
              className="text-4xl md:text-5xl font-black tracking-tight"
              style={{
                color: severityColor,
                animation: "drift-shake 0.6s ease-in-out",
                textShadow: `0 0 30px ${severityColor}66`,
              }}
            >
              BURNOUT DRIFT DETECTED
            </h1>

            {/* severity score badge */}
            <div className="flex justify-center">
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider"
                style={{ background: `${severityColor}33`, color: severityColor }}
              >
                <Flame className="w-4 h-4" />
                {severityLabel} severity — {severityScore.toFixed(1)} / 50
              </span>
            </div>

            {/* severity bar */}
            <div className="max-w-md mx-auto">
              <div className="w-full h-4 rounded-full overflow-hidden" style={{ background: "#1e293b" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${barWidth}%`,
                    background: `linear-gradient(90deg, ${severityColor}99, ${severityColor})`,
                    transition: "width 1.5s cubic-bezier(.4,0,.2,1)",
                    boxShadow: `0 0 12px ${severityColor}88`,
                  }}
                />
              </div>
            </div>

            {/* summary */}
            <p
              className="text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed"
              style={{ color: "#e2e8f0" }}
            >
              {data.summary}
            </p>

            {/* key stats */}
            <div className="flex flex-wrap justify-center gap-8 pt-2">
              <div className="flex items-center gap-2" style={{ animation: "drift-fade-up 0.8s ease-out 0.2s both" }}>
                <TrendingDown className="w-5 h-5" style={{ color: severityColor }} />
                <span className="text-slate-400 text-sm">Consecutive days</span>
                <span className="text-2xl font-black" style={{ color: severityColor }}>{data.consecutive_days}</span>
              </div>
              <div className="flex items-center gap-2" style={{ animation: "drift-fade-up 0.8s ease-out 0.4s both" }}>
                <Calendar className="w-5 h-5" style={{ color: severityColor }} />
                <span className="text-slate-400 text-sm">Drift started</span>
                <span className="text-2xl font-black" style={{ color: severityColor }}>{data.drift_start_date}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════ DRIFT TIMELINE CHART ═══════ */}
        <div
          className="rounded-2xl border border-slate-700/50 p-6"
          style={{ background: "rgba(15,23,42,.7)", backdropFilter: "blur(12px)", animation: "drift-fade-up 0.8s ease-out 0.5s both" }}
        >
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[.2em] mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: severityColor }} />
            Drift Timeline
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={signals} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="dangerFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "#334155" }}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: "#334155" }}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 12,
                  boxShadow: "0 8px 32px rgba(0,0,0,.5)",
                }}
                labelStyle={{ color: "#94a3b8", fontWeight: 600 }}
              />
              {/* danger zone below 60 */}
              <ReferenceArea y1={0} y2={60} fill="url(#dangerFill)" />
              {/* baseline reference lines */}
              {baseline.sleepScore && (
                <ReferenceLine
                  y={baseline.sleepScore}
                  stroke="#3b82f6"
                  strokeDasharray="6 4"
                  strokeOpacity={0.5}
                  label={{ value: `Baseline Sleep: ${baseline.sleepScore}`, fill: "#3b82f688", fontSize: 10, position: "insideTopRight" }}
                />
              )}
              {baseline.mood && (
                <ReferenceLine
                  y={baseline.mood}
                  stroke="#10b981"
                  strokeDasharray="6 4"
                  strokeOpacity={0.5}
                  label={{ value: `Baseline Mood: ${baseline.mood}`, fill: "#10b98188", fontSize: 10, position: "insideBottomRight" }}
                />
              )}
              <Line
                type="monotone"
                dataKey="sleepScore"
                stroke="#3b82f6"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#3b82f6", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#3b82f6", stroke: "#0f172a", strokeWidth: 2 }}
                name="Sleep Score"
              />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "#10b981", stroke: "#0f172a", strokeWidth: 2 }}
                name="Mood"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* ═══════ BASELINE COMPARISON ═══════ */}
        {baseline && (
          <div
            className="rounded-2xl border border-slate-700/50 p-6"
            style={{ background: "rgba(15,23,42,.7)", backdropFilter: "blur(12px)", animation: "drift-fade-up 0.8s ease-out 0.7s both" }}
          >
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[.2em] mb-5">
              Baseline vs Current
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(["sleepScore", "hrv", "mood", "energy"] as const).map((key) => {
                const base = baseline[key];
                const curr = latest?.[key];
                if (base == null) return null;
                const diff = curr != null ? curr - base : 0;
                const isDown = diff < 0;
                const color = isDown ? "#ef4444" : "#22c55e";
                const Arrow = isDown ? ArrowDown : ArrowUp;

                return (
                  <div
                    key={key}
                    className="rounded-xl p-4 text-center space-y-2"
                    style={{ background: "#0f172a", border: "1px solid #1e293b" }}
                  >
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                      {labelMap[key] ?? key}
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <div>
                        <p className="text-xs text-slate-500">Baseline</p>
                        <p className="text-lg font-bold text-slate-300">{base}</p>
                      </div>
                      <Arrow className="w-5 h-5" style={{ color }} />
                      <div>
                        <p className="text-xs text-slate-500">Current</p>
                        <p className="text-lg font-bold" style={{ color }}>
                          {curr != null ? (typeof curr === "number" ? curr.toFixed(1) : curr) : "—"}
                        </p>
                      </div>
                    </div>
                    {curr != null && (
                      <p className="text-xs font-bold" style={{ color }}>
                        {isDown ? "" : "+"}{diff.toFixed(1)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════ CTA ═══════ */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          style={{ animation: "drift-fade-up 0.8s ease-out 0.9s both" }}
        >
          <Link to="/recovery">
            <button
              className="px-10 py-4 rounded-2xl text-lg font-extrabold text-white cursor-pointer border-0"
              style={{
                background: "linear-gradient(135deg, #16a34a, #22c55e)",
                animation: "drift-cta-pulse 2s ease-in-out infinite",
                boxShadow: "0 4px 24px rgba(34,197,94,.3)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(34,197,94,.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 24px rgba(34,197,94,.3)";
              }}
            >
              View Recovery Plan &rarr;
            </button>
          </Link>
          <Link to="/xray">
            <Button variant="outline" size="lg" className="border-slate-600 text-slate-300 hover:border-slate-400">
              X-Ray Mode
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost" size="lg" className="text-slate-500 hover:text-slate-300">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Drift;

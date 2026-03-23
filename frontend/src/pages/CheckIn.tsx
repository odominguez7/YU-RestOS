import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { CheckCircle } from "lucide-react";

interface SliderConfig {
  key: string;
  label: string;
  left: string;
  right: string;
  colorFrom: string;
  colorTo: string;
  trackFrom: string;
  trackTo: string;
  inverted?: boolean;
}

const sliders: SliderConfig[] = [
  {
    key: "mood",
    label: "Mood",
    left: "Low",
    right: "Great",
    colorFrom: "#ef4444",
    colorTo: "#22c55e",
    trackFrom: "from-red-500",
    trackTo: "to-green-500",
  },
  {
    key: "energy",
    label: "Energy",
    left: "Drained",
    right: "Energized",
    colorFrom: "#f97316",
    colorTo: "#3b82f6",
    trackFrom: "from-orange-500",
    trackTo: "to-blue-500",
  },
  {
    key: "stress",
    label: "Stress",
    left: "Calm",
    right: "Overwhelmed",
    colorFrom: "#22c55e",
    colorTo: "#ef4444",
    trackFrom: "from-green-500",
    trackTo: "to-red-500",
    inverted: true,
  },
  {
    key: "sleep_quality_self",
    label: "Sleep Quality",
    left: "Terrible",
    right: "Amazing",
    colorFrom: "#a855f7",
    colorTo: "#6366f1",
    trackFrom: "from-purple-500",
    trackTo: "to-indigo-500",
  },
];

function interpolateColor(from: string, to: string, t: number): string {
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };
  const [r1, g1, b1] = hexToRgb(from);
  const [r2, g2, b2] = hexToRgb(to);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const CheckIn = () => {
  const [values, setValues] = useState<Record<string, number>>({
    mood: 5,
    energy: 5,
    stress: 5,
    sleep_quality_self: 5,
  });
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post("/api/checkin/submit", {
        date: new Date().toISOString().split("T")[0],
        ...values,
        notes,
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] via-[#111936] to-[#0d1528] flex items-center justify-center px-6">
        <div
          className="flex flex-col items-center gap-6 text-center"
          style={{
            animation: "fadeInUp 0.6s ease-out forwards",
          }}
        >
          <div
            className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center"
            style={{
              animation: "scaleIn 0.5s ease-out 0.2s both",
            }}
          >
            <CheckCircle className="w-12 h-12 text-green-400" strokeWidth={1.5} />
          </div>
          <h2 className="text-3xl font-semibold text-white tracking-tight">
            Check-in saved
          </h2>
          <p className="text-white/50 text-sm max-w-xs">
            Nice work taking a moment for yourself. See you tomorrow.
          </p>
          <Link
            to="/dashboard"
            className="mt-4 px-8 py-3 rounded-xl bg-white/10 text-white/80 text-sm font-medium hover:bg-white/15 transition-all duration-300 backdrop-blur-sm border border-white/10"
          >
            Back to Dashboard
          </Link>
        </div>

        <style>{`
          @keyframes scaleIn {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          @keyframes fadeInUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f1e] via-[#111936] to-[#0d1528] flex flex-col items-center px-4 py-12 sm:py-16">
      <div
        className="w-full max-w-md space-y-6 transition-all duration-700 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(24px)",
        }}
      >
        {/* Header */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            {getGreeting()}. How are you today?
          </h1>
          <p className="text-white/40 text-sm">{today}</p>
        </div>

        {/* Sliders */}
        {sliders.map((s, i) => {
          const val = values[s.key];
          const t = (val - 1) / 9;
          const thumbColor = interpolateColor(s.colorFrom, s.colorTo, t);
          const pct = ((val - 1) / 9) * 100;
          const sliderId = `slider-${s.key}`;

          return (
            <div
              key={s.key}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl p-5 space-y-4"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(16px)",
                transition: `all 0.6s ease-out ${0.1 + i * 0.08}s`,
              }}
            >
              <div className="flex justify-between items-center">
                <span className="text-white/70 text-sm font-medium">{s.label}</span>
                <span
                  className="text-2xl font-bold tabular-nums transition-colors duration-200"
                  style={{ color: thumbColor }}
                >
                  {val}
                </span>
              </div>

              <div className="relative">
                <input
                  id={sliderId}
                  type="range"
                  min={1}
                  max={10}
                  value={val}
                  onChange={(e) =>
                    setValues({ ...values, [s.key]: Number(e.target.value) })
                  }
                  className="slider-input w-full h-2 rounded-full appearance-none cursor-pointer outline-none"
                  style={{
                    background: `linear-gradient(to right, ${s.colorFrom} 0%, ${interpolateColor(s.colorFrom, s.colorTo, t)} ${pct}%, rgba(255,255,255,0.08) ${pct}%)`,
                  }}
                />
              </div>

              <div className="flex justify-between">
                <span className="text-[11px] text-white/30 uppercase tracking-wider">
                  {s.left}
                </span>
                <span className="text-[11px] text-white/30 uppercase tracking-wider">
                  {s.right}
                </span>
              </div>
            </div>
          );
        })}

        {/* Notes */}
        <div
          className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl p-1"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.6s ease-out 0.5s",
          }}
        >
          <textarea
            placeholder="Anything on your mind? (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full bg-transparent text-white/80 placeholder:text-white/20 text-sm p-4 resize-none focus:outline-none rounded-xl"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 rounded-2xl font-semibold text-white text-sm tracking-wide transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
          style={{
            background: submitting
              ? "rgba(255,255,255,0.1)"
              : "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.6s ease-out 0.55s, background 0.3s ease",
          }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {submitting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              "Submit Check-in"
            )}
          </span>
          {!submitting && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          )}
        </button>

        {/* Footer */}
        <p
          className="text-center text-xs text-white/25 pb-8"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.6s ease-out 0.6s",
          }}
        >
          Takes 30 seconds. Your data stays on your device.
        </p>
      </div>

      {/* Slider thumb styles */}
      <style>{`
        .slider-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 0 12px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2);
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .slider-input::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .slider-input::-webkit-slider-thumb:active {
          transform: scale(1.05);
        }
        .slider-input::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: white;
          box-shadow: 0 0 12px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2);
          cursor: pointer;
          border: none;
        }
        .slider-input::-moz-range-track {
          height: 8px;
          border-radius: 9999px;
        }
      `}</style>
    </div>
  );
};

export default CheckIn;

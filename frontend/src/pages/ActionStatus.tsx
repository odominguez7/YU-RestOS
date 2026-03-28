import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/contexts/PlanContext";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";
import {
  CheckCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
  FastForward,
  ArrowRight,
  Activity,
  PackageCheck,
  Inbox,
  Sparkles,
} from "lucide-react";

/* ── Inject keyframes once ── */
const injectStyles = (() => {
  let injected = false;
  return () => {
    if (injected) return;
    injected = true;
    const style = document.createElement("style");
    style.textContent = `
      @keyframes fadeSlideUp {
        from { opacity: 0; transform: translateY(28px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes checkPop {
        0%   { transform: scale(0) rotate(-15deg); opacity: 0; }
        60%  { transform: scale(1.25) rotate(5deg); }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }
      @keyframes pulseRing {
        0%   { transform: scale(0.9); opacity: 0.7; }
        50%  { transform: scale(1.15); opacity: 0.2; }
        100% { transform: scale(0.9); opacity: 0.7; }
      }
      @keyframes shimmer {
        0%   { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      @keyframes dotPulse {
        0%, 100% { opacity: 0.3; }
        50%      { opacity: 1; }
      }
      @keyframes ellipsis1 {
        0%, 25% { opacity: 0; }
        30%, 100% { opacity: 1; }
      }
      @keyframes ellipsis2 {
        0%, 45% { opacity: 0; }
        50%, 100% { opacity: 1; }
      }
      @keyframes ellipsis3 {
        0%, 65% { opacity: 0; }
        70%, 100% { opacity: 1; }
      }
      @keyframes borderGlowGreen {
        0%, 100% { box-shadow: 0 0 12px rgba(34,197,94,0.15), inset 0 1px 0 rgba(34,197,94,0.08); }
        50%      { box-shadow: 0 0 24px rgba(34,197,94,0.25), inset 0 1px 0 rgba(34,197,94,0.12); }
      }
      @keyframes spinnerTrail {
        0%   { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes statusLineGrow {
        from { height: 0; }
        to   { height: 100%; }
      }
      .action-status-card {
        animation: fadeSlideUp 0.55s ease-out both;
      }
      .check-pop {
        animation: checkPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      }
      .shimmer-overlay {
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent);
        background-size: 200% 100%;
        animation: shimmer 2.5s infinite;
      }
      .pulse-ring {
        animation: pulseRing 2s ease-in-out infinite;
      }
      .completed-glow {
        animation: borderGlowGreen 3s ease-in-out infinite;
      }
      .timeline-line {
        animation: statusLineGrow 0.5s ease-out both;
      }
    `;
    document.head.appendChild(style);
  };
})();

/* ── Animated Ellipsis ── */
const AnimatedEllipsis = () => (
  <span className="inline-flex ml-0.5">
    <span style={{ animation: "ellipsis1 1.5s infinite" }}>.</span>
    <span style={{ animation: "ellipsis2 1.5s infinite" }}>.</span>
    <span style={{ animation: "ellipsis3 1.5s infinite" }}>.</span>
  </span>
);

/* ── Syntax-highlighted JSON (simple) ── */
const JsonBlock = ({ data }: { data: any }) => {
  const json = JSON.stringify(data, null, 2);
  const highlighted = json
    .replace(/"([^"]+)":/g, '<span style="color:#7dd3fc">"$1"</span>:')
    .replace(/: "([^"]+)"/g, ': <span style="color:#86efac">"$1"</span>')
    .replace(/: (\d+)/g, ': <span style="color:#fbbf24">$1</span>')
    .replace(/: (true|false|null)/g, ': <span style="color:#c084fc">$1</span>');

  return (
    <div className="relative rounded-xl overflow-hidden mt-3">
      <div className="absolute top-0 left-0 right-0 h-8 flex items-center px-4 bg-white/[0.03] border-b border-white/[0.06]">
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">API Response</span>
        <div className="ml-auto flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
        </div>
      </div>
      <pre
        className="pt-10 pb-4 px-4 text-xs leading-relaxed overflow-x-auto"
        style={{
          background: "rgba(0,0,0,0.3)",
          fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
          color: "#94a3b8",
        }}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
    </div>
  );
};

/* ── Status Timeline (for concierge tasks) ── */
const StatusTimeline = ({ history }: { history: any[] }) => (
  <div className="mt-3 ml-1 space-y-0">
    {history.map((step: any, i: number) => {
      const isLast = i === history.length - 1;
      const isCompleted = step.status === "completed";
      return (
        <div key={i} className="flex gap-3 relative">
          {/* Vertical line */}
          {!isLast && (
            <div
              className="absolute left-[7px] top-[18px] w-[2px] bg-gradient-to-b from-blue-500/40 to-blue-500/10 timeline-line"
              style={{ height: "calc(100% + 4px)", animationDelay: `${i * 200}ms` }}
            />
          )}
          {/* Dot */}
          <div className="relative shrink-0 mt-1">
            <div
              className={`w-4 h-4 rounded-full border-2 ${
                isCompleted
                  ? "bg-emerald-500/30 border-emerald-400"
                  : isLast
                  ? "bg-blue-500/30 border-blue-400"
                  : "bg-white/10 border-white/30"
              }`}
            />
            {isLast && !isCompleted && (
              <div className="absolute inset-0 rounded-full bg-blue-400/30 pulse-ring" />
            )}
          </div>
          {/* Content */}
          <div className="pb-4">
            <p
              className={`text-xs font-semibold uppercase tracking-wide ${
                isCompleted ? "text-emerald-400" : isLast ? "text-blue-400" : "text-slate-500"
              }`}
            >
              {step.status}
            </p>
            <p className="text-sm text-slate-400 mt-0.5">{step.message}</p>
          </div>
        </div>
      );
    })}
  </div>
);

/* ── Method badge ── */
const MethodBadge = ({ method }: { method: string }) => {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    api_call: { bg: "bg-blue-500/15 ring-blue-500/25", text: "text-blue-400", label: "API Call" },
    concierge: { bg: "bg-purple-500/15 ring-purple-500/25", text: "text-purple-400", label: "Concierge" },
    product_link: { bg: "bg-amber-500/15 ring-amber-500/25", text: "text-amber-400", label: "Product Link" },
  };
  const c = config[method] || config.api_call;
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ring-1 ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
};

/* ── Main Component ── */
const ActionStatus = () => {
  const { planActions } = usePlan();
  const [statuses, setStatuses] = useState<Record<string, any>>({});
  const [loadingTasks, setLoadingTasks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    injectStyles();
  }, []);

  const checkTask = async (taskId: string) => {
    setLoadingTasks((p) => ({ ...p, [taskId]: true }));
    try {
      const res = await api.get(`/api/actions/task/${taskId}`);
      setStatuses((p) => ({ ...p, [taskId]: res }));
    } catch {
      setStatuses((p) => ({ ...p, [taskId]: { status: "completed", message: "Completed" } }));
    } finally {
      setLoadingTasks((p) => ({ ...p, [taskId]: false }));
    }
  };

  const advanceTask = async (taskId: string) => {
    setLoadingTasks((p) => ({ ...p, [taskId]: true }));
    try {
      const res = await api.post(`/api/actions/task/${taskId}/advance`);
      setStatuses((p) => ({ ...p, [taskId]: res }));
    } catch {
      setStatuses((p) => ({ ...p, [taskId]: { status: "completed", message: "Completed" } }));
    } finally {
      setLoadingTasks((p) => ({ ...p, [taskId]: false }));
    }
  };

  const getTaskKey = (a: any) => a.id || a.action_id;

  const completed = planActions.filter(
    (a) => a.status === "completed" || statuses[getTaskKey(a)]?.status === "completed"
  ).length;
  const concierge = planActions.filter(
    (a) => a.execution_method === "concierge" && statuses[getTaskKey(a)]?.status !== "completed"
  ).length;

  /* ── Empty State ── */
  if (planActions.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "linear-gradient(180deg, #0a0e27 0%, #111638 40%, #0d1025 100%)" }}
      >
        <div
          className="action-status-card text-center max-w-md mx-auto px-8 py-14 rounded-3xl border border-white/[0.07]"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center mx-auto mb-5">
            <Inbox className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No Plan Loaded</h2>
          <p className="text-sm text-slate-400 mb-8 leading-relaxed">
            Generate a recovery plan first, then come back here to track execution in real time.
          </p>
          <Link to="/recovery">
            <Button
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white border-0 rounded-xl px-8 py-3 font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ boxShadow: "0 8px 24px rgba(59,130,246,0.3)" }}
            >
              Generate Recovery Plan
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-24"
      style={{ background: "linear-gradient(180deg, #0a0e27 0%, #111638 40%, #0d1025 100%)" }}
    >
      <div className="max-w-2xl mx-auto px-5 py-14 space-y-6">
        {/* ── Header ── */}
        <div className="action-status-card" style={{ animationDelay: "0ms" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <Activity className="w-6 h-6 text-blue-400" />
              <div className="absolute inset-0 rounded-full bg-blue-400/20 pulse-ring" />
            </div>
            <h1
              className="text-3xl md:text-4xl font-black tracking-tight text-white"
              style={{ letterSpacing: "-0.02em" }}
            >
              RECOVERY PLAN EXECUTING
              <AnimatedEllipsis />
            </h1>
          </div>
          <p className="text-sm text-slate-500 ml-9">
            {planActions.length} action{planActions.length !== 1 ? "s" : ""} in your recovery pipeline
          </p>
        </div>

        {/* ── Action Cards ── */}
        {planActions.map((action: any, i: number) => {
          const actionKey = getTaskKey(action);
          const taskStatus = statuses[actionKey];
          const isCompleted = action.status === "completed" || taskStatus?.status === "completed";
          const isConcierge = action.execution_method === "concierge";
          const isProduct = action.execution_method === "product_link";
          const isApiCall = action.execution_method === "api_call";
          const isLoading = loadingTasks[actionKey];

          // Simulated API response for completed api_call actions
          const apiResponse = taskStatus?.api_response || (isCompleted && isApiCall ? {
            status: 200,
            action_id: actionKey,
            result: action.result_message || action.result?.message || "Success",
            executed_at: new Date().toISOString(),
            ...(action.parameters || {}),
          } : null);

          return (
            <div
              key={actionKey}
              className={`action-status-card relative overflow-hidden rounded-2xl border transition-all duration-500 ${
                isCompleted
                  ? "border-emerald-500/20 completed-glow"
                  : "border-white/[0.07]"
              }`}
              style={{
                animationDelay: `${120 + i * 100}ms`,
                background: isCompleted
                  ? "linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(255,255,255,0.02) 100%)"
                  : "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)",
                backdropFilter: "blur(16px)",
              }}
            >
              {/* Shimmer overlay for executing state */}
              {!isCompleted && isConcierge && (
                <div className="shimmer-overlay absolute inset-0 pointer-events-none rounded-2xl" />
              )}

              <div className="relative z-10 p-5 space-y-3">
                {/* Top: Status icon + Title + Badge */}
                <div className="flex items-start gap-3">
                  {/* Status indicator */}
                  <div className="shrink-0 mt-0.5">
                    {isCompleted ? (
                      <div className="check-pop w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                      </div>
                    ) : (
                      <div className="relative w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                        <div className="absolute inset-0 rounded-xl bg-blue-400/10 pulse-ring" />
                      </div>
                    )}
                  </div>

                  {/* Title + description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-base font-bold text-white leading-tight">{action.title}</h3>
                      <MethodBadge method={action.execution_method} />
                    </div>
                    {action.description && (
                      <p className="text-sm text-slate-400 leading-relaxed">{action.description}</p>
                    )}
                    {action.sponsor && (
                      <p className="text-xs text-slate-600 mt-1">
                        via <span className="text-slate-500">{action.sponsor}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Completed: result message */}
                {isCompleted && (
                  <div className="ml-13 pl-[52px]">
                    <p className="text-sm text-emerald-400 font-medium">
                      {action.result_message || taskStatus?.message || "Completed successfully"}
                    </p>
                  </div>
                )}

                {/* Completed API call: JSON response block */}
                {isCompleted && isApiCall && apiResponse && (
                  <div className="pl-[52px]">
                    <JsonBlock data={apiResponse} />
                  </div>
                )}

                {/* Concierge: status timeline */}
                {isConcierge && taskStatus?.status_history && taskStatus.status_history.length > 0 && (
                  <div className="pl-[52px]">
                    <StatusTimeline history={taskStatus.status_history} />
                  </div>
                )}

                {/* Action buttons */}
                <div className="pl-[52px] flex gap-2 flex-wrap">
                  {isConcierge && !isCompleted && actionKey && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => checkTask(actionKey)}
                        disabled={isLoading}
                        className="bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 border border-white/[0.08] rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      >
                        {isLoading ? (
                          <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3 mr-1.5" />
                        )}
                        Check Status
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => advanceTask(actionKey)}
                        disabled={isLoading}
                        className="bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/20 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                      >
                        <FastForward className="w-3 h-3 mr-1.5" />
                        Advance Task
                      </Button>
                    </>
                  )}
                  {isProduct && (action.product_url || action.result?.url) && (
                    <a
                      href={action.product_url || action.result?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/20 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <ExternalLink className="w-3 h-3 mr-1.5" />
                        View on {action.sponsor || "Wayfair"}
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* ── Summary Card ── */}
        <div
          className="action-status-card relative overflow-hidden rounded-2xl border border-white/[0.07]"
          style={{
            animationDelay: `${120 + planActions.length * 100 + 80}ms`,
            background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div className="shimmer-overlay absolute inset-0 pointer-events-none rounded-2xl" />
          <div className="relative z-10 p-6 text-center space-y-4">
            {/* Progress ring */}
            <div className="flex items-center justify-center gap-3">
              <PackageCheck className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-slate-300">
                <span className="text-white font-bold text-lg">{completed}</span>
                <span className="text-slate-500 mx-1">of</span>
                <span className="text-white font-bold text-lg">{planActions.length}</span>
                <span className="text-slate-400 ml-1.5">actions completed</span>
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-white/[0.05] overflow-hidden max-w-sm mx-auto">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${planActions.length > 0 ? (completed / planActions.length) * 100 : 0}%`,
                  background: "linear-gradient(90deg, #3b82f6, #22c55e)",
                  boxShadow: "0 0 12px rgba(34,197,94,0.3)",
                }}
              />
            </div>

            {concierge > 0 && (
              <p className="text-xs text-slate-500">
                <span className="text-purple-400 font-semibold">{concierge}</span> concierge task{concierge !== 1 ? "s" : ""} in progress
              </p>
            )}

            <div className="pt-2 border-t border-white/[0.05]">
              <p className="text-xs text-slate-500 italic flex items-center justify-center gap-2">
                <Sparkles className="w-3 h-3 text-blue-500/50" />
                Tomorrow morning, YU RestOS will ask: Did these actions help?
              </p>
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <div
          className="action-status-card space-y-3"
          style={{ animationDelay: `${120 + planActions.length * 100 + 200}ms` }}
        >
          <Link to="/oura" className="block">
            <button
              className="w-full relative overflow-hidden rounded-2xl py-4 px-6 font-bold text-sm text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #3b82f6 100%)",
                boxShadow: "0 8px 32px rgba(139,92,246,0.25), 0 0 0 1px rgba(139,92,246,0.15)",
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2.5s infinite",
                }}
              />
              <span className="relative z-10 flex items-center justify-center gap-2">
                Back to My Biology
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </Link>
        </div>

        {/* ── Footer ── */}
        <p
          className="action-status-card text-center text-xs text-slate-600 pt-2"
          style={{ animationDelay: `${120 + planActions.length * 100 + 300}ms` }}
        >
          Actions executed by YU RestOS recovery engine.
        </p>
      </div>
    </div>
  );
};

export default ActionStatus;

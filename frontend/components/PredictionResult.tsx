import React from "react";
import { PredictionResponse } from "../services/api";
import {
  CheckCircle,
  TrendingUp,
  Lightbulb,
  HeartPulse,
  AlertTriangle,
  Stethoscope,
} from "lucide-react";

interface PredictionResultProps {
  result: PredictionResponse;
}

const SEVERITY_COLORS = [
  { bg: "bg-emerald-400", label: "Normal",   textColor: "text-emerald-400" },
  { bg: "bg-lime-400",    label: "Doubtful", textColor: "text-lime-400" },
  { bg: "bg-yellow-400",  label: "Mild",     textColor: "text-yellow-400" },
  { bg: "bg-orange-500",  label: "Moderate", textColor: "text-orange-500" },
  { bg: "bg-red-500",     label: "Severe",   textColor: "text-red-500" },
];

const URGENCY_STYLES: Record<string, string> = {
  "Low": "bg-emerald-500/10 text-emerald-400",
  "Low – Monitor": "bg-lime-500/10 text-lime-400",
  "Moderate": "bg-yellow-500/10 text-yellow-400",
  "High": "bg-orange-500/10 text-orange-400",
  "Critical – Immediate Attention": "bg-red-500/10 text-red-400",
};

export default function PredictionResult({ result }: PredictionResultProps) {
  const gradeMatch = result.predicted_class.match(/\d/);
  const gradeIndex = gradeMatch ? parseInt(gradeMatch[0]) : 0;
  const confidencePercent = (result.confidence * 100).toFixed(1);

  const severityInfo = SEVERITY_COLORS[gradeIndex] ?? SEVERITY_COLORS[0];
  const suggestions = result.suggestions;
  const urgencyStyle = suggestions?.urgency
    ? URGENCY_STYLES[suggestions.urgency] || URGENCY_STYLES["Low"]
    : URGENCY_STYLES["Low"];

  return (
    <div
      className="w-full bg-surface-container rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700 ease-out relative"
    >
      <div className="absolute -top-20 -right-20 w-64 h-64 serenity-blur opacity-30" />
      
      {/* Header */}
      <div className="px-8 py-6 cta-gradient flex items-center gap-4 relative z-10">
        <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/5">
          <TrendingUp className="text-white" size={24} />
        </div>
        <div>
          <h2 className="text-xs font-bold text-white/70 uppercase tracking-[0.2em] mb-1">
            Clinical Insight
          </h2>
          <p className="text-xl font-headline font-extrabold text-white tracking-tight">
            EfficientNet Analysis Complete
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-8 space-y-8 relative z-10">
        {/* Results grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-2">
            <h3 className="text-[10px] text-on-surface-variant font-bold uppercase tracking-[0.25em]">
              Predicted Stage
            </h3>
            <p className="text-4xl md:text-5xl font-headline font-black text-on-surface tracking-tighter">
              {result.predicted_class.split(' ')[0]}
              <span className="text-primary ml-2">{result.predicted_class.split(' ').slice(1).join(' ')}</span>
            </p>
          </div>
          <div className="md:text-right space-y-2">
            <h3 className="text-[10px] text-on-surface-variant font-bold uppercase tracking-[0.25em]">
              Detection Confidence
            </h3>
            <div className="inline-flex items-baseline gap-1">
              <span className="text-4xl md:text-5xl font-headline font-black text-primary tracking-tighter">
                {confidencePercent}
              </span>
              <span className="text-2xl font-bold text-primary/60">%</span>
            </div>
          </div>
        </div>

        {/* Visual severity bar */}
        <div>
          <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden flex">
            {SEVERITY_COLORS.map((color, idx) => {
              const isActive = gradeIndex >= idx;
              return (
                <div
                  key={idx}
                  className={`h-full flex-1 transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) ${
                    isActive ? color.bg : "bg-transparent"
                  }`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-on-surface-variant/50 mt-4 font-bold px-0.5 uppercase tracking-widest">
            {SEVERITY_COLORS.map((color, idx) => (
              <span
                key={idx}
                className={`${idx === gradeIndex ? `${color.textColor} text-[11px] font-black` : ""}`}
              >
                {color.label}
              </span>
            ))}
          </div>
        </div>

        {/* ═══════════ AI SUGGESTIONS PANEL ═══════════ */}
        {suggestions && (
          <div className="bg-surface-container-low rounded-3xl p-8 space-y-8">
            {/* AI Header */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary-container/30 rounded-2xl text-secondary shadow-lg">
                <Stethoscope size={24} />
              </div>
              <div>
                <h3 className="text-lg font-headline font-black text-on-surface tracking-tight">
                  AI Clinical Recommendations
                </h3>
                <div className="flex items-center gap-2 mt-1">
                   <div className={`w-2 h-2 rounded-full ${urgencyStyle.split(' ')[0].replace('/10', '')}`} />
                   <span className={`text-[11px] font-bold uppercase tracking-wider ${urgencyStyle.split(' ')[1]}`}>
                     {suggestions.urgency} Priority
                   </span>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-primary-container/10 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/40" />
              <div className="flex items-start gap-4">
                <Lightbulb
                  size={20}
                  className="text-primary shrink-0 mt-0.5"
                />
                <p className="text-base font-medium text-on-surface leading-relaxed">
                  {suggestions.summary}
                </p>
              </div>
            </div>

            {/* Recommendations grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-[10px] text-on-surface-variant font-bold uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
                  <CheckCircle size={14} className="text-primary" />
                  Treatment Path
                </h4>
                <ul className="space-y-3">
                  {suggestions.recommendations?.map(
                    (rec: string, idx: number) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-sm text-on-surface-variant leading-relaxed hover:text-on-surface transition-colors duration-300"
                      >
                        <span className="text-primary font-black mt-0.5">•</span>
                        {rec}
                      </li>
                    )
                  )}
                </ul>
              </div>

              <div className="bg-surface-container-high rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                    <HeartPulse size={20} className="text-secondary" />
                    <h4 className="text-[10px] text-on-surface-variant font-bold uppercase tracking-[0.2em]">
                      Lifestyle & Wellness
                    </h4>
                </div>
                <p className="text-sm text-on-surface font-medium leading-relaxed italic">
                  "{suggestions.lifestyle}"
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { DropZone } from "@/components/drop-zone";
import type { ToolUIProps } from "@/components/tool-registry";

export default function PdfPasswordCheckerTool({ onProcessing, onError }: ToolUIProps) {
  const [password, setPassword] = useState("");
  const [strength, setStrength] = useState<{ score: number; label: string; color: string; suggestions: string[] } | null>(null);

  const checkStrength = useCallback((pwd: string) => {
    if (!pwd) { setStrength(null); return; }

    let score = 0;
    const suggestions: string[] = [];

    if (pwd.length >= 8) score += 1; else suggestions.push("Use at least 8 characters");
    if (pwd.length >= 12) score += 1;
    if (pwd.length >= 16) score += 1;
    if (/[a-z]/.test(pwd)) score += 1; else suggestions.push("Add lowercase letters");
    if (/[A-Z]/.test(pwd)) score += 1; else suggestions.push("Add uppercase letters");
    if (/[0-9]/.test(pwd)) score += 1; else suggestions.push("Add numbers");
    if (/[^a-zA-Z0-9]/.test(pwd)) score += 1; else suggestions.push("Add special characters (!@#$...)");
    if (!/(.)\1{2,}/.test(pwd)) score += 1; else suggestions.push("Avoid repeated characters");

    // Penalize common patterns
    if (/^(password|123456|qwerty|admin)/i.test(pwd)) score = Math.max(0, score - 3);
    if (/^[a-z]+$/.test(pwd) || /^[0-9]+$/.test(pwd)) score = Math.max(0, score - 1);

    const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong", "Very Strong", "Excellent", "Maximum"];
    const colors = ["#dc2626", "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#16a34a", "#059669", "#059669"];
    const idx = Math.min(score, labels.length - 1);

    setStrength({ score: idx + 1, label: labels[idx], color: colors[idx], suggestions });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm text-text-secondary mb-2">Enter a password to check</label>
        <input type="text" value={password} onChange={(e) => { setPassword(e.target.value); checkStrength(e.target.value); }} placeholder="Type a password..." className="w-full px-4 py-3 rounded-lg bg-bg-elevated border border-border-base text-text-primary text-sm font-mono focus:border-accent focus:outline-none transition-colors" />
      </div>

      {strength && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-secondary">Strength</span>
            <span className="text-sm font-semibold" style={{ color: strength.color }}>{strength.label}</span>
          </div>
          <div className="h-2 rounded-full bg-bg-elevated overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(strength.score / 8) * 100}%`, backgroundColor: strength.color }} />
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 8 }, (_, i) => (
              <div key={i} className="h-1.5 flex-1 rounded-full transition-colors" style={{ backgroundColor: i < strength.score ? strength.color : "var(--bg-elevated)" }} />
            ))}
          </div>
          {strength.suggestions.length > 0 && (
            <div className="p-3 rounded-lg bg-bg-elevated border border-border-base">
              <p className="text-xs font-semibold text-text-secondary mb-2">Suggestions:</p>
              <ul className="space-y-1">
                {strength.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-text-tertiary flex items-center gap-2"><span className="text-warning">•</span>{s}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!password && (
        <div className="p-3 rounded-lg bg-bg-elevated border border-border-base">
          <p className="text-xs text-text-secondary">ℹ Check the strength of your PDF password before protecting documents. A strong password is essential for document security.</p>
        </div>
      )}
    </div>
  );
}

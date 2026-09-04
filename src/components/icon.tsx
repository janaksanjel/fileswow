"use client";

import type { JSX } from "react";

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

const icons: Record<string, (props: { size: number; className: string }) => JSX.Element> = {
  // ─── Merge / Organize ────────────────────────────
  "merge-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="6" width="16" height="22" rx="3" fill="#4A90D9" />
      <rect x="28" y="6" width="16" height="22" rx="3" fill="#5BA3EC" />
      <rect x="8" y="10" width="8" height="2" rx="1" fill="#fff" opacity="0.7" />
      <rect x="8" y="14" width="6" height="2" rx="1" fill="#fff" opacity="0.5" />
      <rect x="32" y="10" width="8" height="2" rx="1" fill="#fff" opacity="0.7" />
      <rect x="32" y="14" width="6" height="2" rx="1" fill="#fff" opacity="0.5" />
      <path d="M24 34l-5-5h10l-5 5z" fill="#F5A623" />
      <path d="M24 28v6" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "split-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="10" y="4" width="28" height="40" rx="4" fill="#7C3AED" />
      <rect x="14" y="8" width="20" height="32" rx="2" fill="#A78BFA" />
      <rect x="16" y="12" width="16" height="2" rx="1" fill="#fff" opacity="0.6" />
      <rect x="16" y="17" width="12" height="2" rx="1" fill="#fff" opacity="0.4" />
      <rect x="16" y="22" width="16" height="2" rx="1" fill="#fff" opacity="0.6" />
      <line x1="24" y1="28" x2="24" y2="36" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 2" />
      <circle cx="24" cy="28" r="2" fill="#F59E0B" />
      <circle cx="24" cy="36" r="2" fill="#F59E0B" />
    </svg>
  ),
  "rotate-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <path d="M36 18a12 12 0 1 1-3.5-8.5" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
      <path d="M36 5l-3 5h6l-3-5z" fill="#22C55E" />
      <rect x="12" y="16" width="20" height="26" rx="3" fill="#3B82F6" />
      <rect x="15" y="20" width="14" height="2" rx="1" fill="#fff" opacity="0.5" />
      <rect x="15" y="25" width="10" height="2" rx="1" fill="#fff" opacity="0.4" />
      <rect x="15" y="30" width="14" height="2" rx="1" fill="#fff" opacity="0.5" />
    </svg>
  ),
  "compress-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#06B6D4" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#67E8F9" />
      <rect x="16" y="14" width="16" height="2" rx="1" fill="#0E7490" opacity="0.6" />
      <path d="M20 30l4 4 4-4" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="24" y1="34" x2="24" y2="24" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  "delete-pdf-pages": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#EF4444" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#FCA5A5" />
      <line x1="18" y1="18" x2="30" y2="30" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <line x1="30" y1="18" x2="18" y2="30" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  "extract-pdf-pages": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="6" width="24" height="34" rx="3" fill="#8B5CF6" />
      <rect x="12" y="10" width="16" height="26" rx="2" fill="#C4B5FD" />
      <rect x="16" y="16" width="8" height="2" rx="1" fill="#fff" opacity="0.6" />
      <rect x="16" y="20" width="6" height="2" rx="1" fill="#fff" opacity="0.4" />
      <path d="M30 14l8-8v12h-8" fill="#22C55E" opacity="0.8" />
      <path d="M34 18v-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M30 14l4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  "reorder-pdf-pages": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="6" y="6" width="36" height="12" rx="3" fill="#3B82F6" />
      <rect x="6" y="22" width="36" height="12" rx="3" fill="#60A5FA" />
      <rect x="10" y="10" width="12" height="2" rx="1" fill="#fff" opacity="0.6" />
      <rect x="10" y="26" width="12" height="2" rx="1" fill="#fff" opacity="0.6" />
      <path d="M38 12l4 3-4 3" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 28l-4 3 4 3" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "organize-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="20" height="26" rx="3" fill="#4A90D9" />
      <rect x="24" y="4" width="20" height="26" rx="3" fill="#5BA3EC" />
      <rect x="4" y="18" width="20" height="26" rx="3" fill="#6BB8F5" />
      <rect x="8" y="8" width="12" height="2" rx="1" fill="#fff" opacity="0.6" />
      <rect x="8" y="12" width="8" height="2" rx="1" fill="#fff" opacity="0.4" />
      <rect x="28" y="8" width="12" height="2" rx="1" fill="#fff" opacity="0.6" />
    </svg>
  ),
  "add-blank-page-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#10B981" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#A7F3D0" />
      <line x1="24" y1="18" x2="24" y2="30" stroke="#065F46" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="18" y1="24" x2="30" y2="24" stroke="#065F46" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  "insert-pdf-pages": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="6" width="24" height="34" rx="3" fill="#6366F1" />
      <rect x="12" y="10" width="16" height="26" rx="2" fill="#A5B4FC" />
      <rect x="16" y="16" width="8" height="2" rx="1" fill="#fff" opacity="0.6" />
      <path d="M24 32v-8m-3 3l3-3 3 3" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  // ─── Edit ────────────────────────────
  "crop-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <path d="M12 4v30a4 4 0 0 0 4 4h28" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
      <path d="M36 44V14a4 4 0 0 0-4-4H4" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
      <rect x="14" y="14" width="18" height="18" rx="2" fill="#BBF7D0" opacity="0.4" />
    </svg>
  ),
  "resize-pdf-page": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="6" y="6" width="36" height="36" rx="4" fill="none" stroke="#A78BFA" strokeWidth="2.5" strokeDasharray="5 3" />
      <rect x="12" y="12" width="24" height="24" rx="3" fill="#8B5CF6" />
      <rect x="16" y="18" width="16" height="2" rx="1" fill="#fff" opacity="0.5" />
      <rect x="16" y="23" width="12" height="2" rx="1" fill="#fff" opacity="0.4" />
    </svg>
  ),
  "pdf-to-grayscale": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#6B7280" />
      <circle cx="24" cy="22" r="8" fill="#D1D5DB" />
      <path d="M24 14a8 8 0 0 1 0 16" fill="#374151" />
      <rect x="14" y="34" width="20" height="2" rx="1" fill="#D1D5DB" opacity="0.5" />
      <rect x="18" y="38" width="12" height="2" rx="1" fill="#D1D5DB" opacity="0.3" />
    </svg>
  ),
  "edit-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#3B82F6" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#BFDBFE" />
      <rect x="16" y="14" width="16" height="2" rx="1" fill="#1E40AF" opacity="0.5" />
      <rect x="16" y="19" width="12" height="2" rx="1" fill="#1E40AF" opacity="0.4" />
      <path d="M30 28l4 4-8 8-4-4z" fill="#F59E0B" />
      <path d="M26 32l4 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  "sign-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <path d="M4 34c4-8 8-12 16-12s8 6 14-2" fill="none" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" />
      <path d="M36 20l6-6 4 4-6 6" fill="#F59E0B" />
      <line x1="4" y1="42" x2="44" y2="42" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "watermark-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#0EA5E9" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#BAE6FD" />
      <text x="24" y="28" textAnchor="middle" fontSize="12" fill="#0369A1" opacity="0.5" fontFamily="sans-serif" fontWeight="bold">WM</text>
      <rect x="16" y="32" width="16" height="2" rx="1" fill="#0369A1" opacity="0.3" />
    </svg>
  ),
  "add-page-numbers-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#22C55E" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#BBF7D0" />
      <text x="24" y="28" textAnchor="middle" fontSize="14" fill="#065F46" fontFamily="sans-serif" fontWeight="bold">1</text>
      <rect x="16" y="32" width="16" height="2" rx="1" fill="#065F46" opacity="0.3" />
    </svg>
  ),
  "pdf-header-footer": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#6366F1" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#C7D2FE" />
      <line x1="14" y1="12" x2="34" y2="12" stroke="#4338CA" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="36" x2="34" y2="36" stroke="#4338CA" strokeWidth="2" strokeLinecap="round" />
      <rect x="16" y="18" width="16" height="2" rx="1" fill="#4338CA" opacity="0.3" />
      <rect x="16" y="23" width="12" height="2" rx="1" fill="#4338CA" opacity="0.2" />
    </svg>
  ),
  "pdf-stamp": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="16" r="10" fill="#F97316" />
      <circle cx="24" cy="16" r="6" fill="#FDBA74" />
      <path d="M14 26l-4 14h28l-4-14" fill="#F97316" />
      <line x1="24" y1="26" x2="24" y2="36" stroke="#FDBA74" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "edit-pdf-metadata": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#8B5CF6" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#DDD6FE" />
      <rect x="16" y="12" width="16" height="2" rx="1" fill="#6D28D9" opacity="0.5" />
      <rect x="16" y="18" width="12" height="2" rx="1" fill="#6D28D9" opacity="0.4" />
      <rect x="16" y="24" width="14" height="2" rx="1" fill="#6D28D9" opacity="0.3" />
      <rect x="16" y="30" width="10" height="2" rx="1" fill="#6D28D9" opacity="0.3" />
    </svg>
  ),
  "pdf-bookmarks-editor": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <path d="M12 6h24a4 4 0 0 1 4 4v28l-16-8-16 8V10a4 4 0 0 1 4-4z" fill="#F59E0B" />
      <path d="M12 6h24a4 4 0 0 1 4 4v28l-16-8-16 8V10a4 4 0 0 1 4-4z" fill="none" stroke="#D97706" strokeWidth="2" />
      <rect x="18" y="14" width="12" height="2" rx="1" fill="#fff" opacity="0.6" />
      <rect x="18" y="19" width="8" height="2" rx="1" fill="#fff" opacity="0.4" />
    </svg>
  ),

  // ─── Security ────────────────────────────
  "protect-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <path d="M24 4L6 12v12c0 11 8 18 18 22 10-4 18-11 18-22V12L24 4z" fill="#22C55E" />
      <path d="M24 4L6 12v12c0 11 8 18 18 22 10-4 18-11 18-22V12L24 4z" fill="none" stroke="#16A34A" strokeWidth="2" />
      <rect x="16" y="20" width="16" height="14" rx="3" fill="#fff" />
      <path d="M20 20v-4a4 4 0 0 1 8 0v4" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="28" r="2" fill="#16A34A" />
    </svg>
  ),
  "unlock-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <path d="M24 4L6 12v12c0 11 8 18 18 22 10-4 18-11 18-22V12L24 4z" fill="#F97316" />
      <path d="M24 4L6 12v12c0 11 8 18 18 22 10-4 18-11 18-22V12L24 4z" fill="none" stroke="#EA580C" strokeWidth="2" />
      <rect x="16" y="20" width="16" height="14" rx="3" fill="#fff" />
      <path d="M20 20v-4a4 4 0 0 1 8 0" fill="none" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="28" r="2" fill="#EA580C" />
    </svg>
  ),
  "redact-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#1F2937" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#374151" />
      <rect x="14" y="16" width="20" height="4" rx="1" fill="#000" />
      <rect x="14" y="24" width="14" height="4" rx="1" fill="#000" />
      <rect x="14" y="32" width="18" height="4" rx="1" fill="#000" />
    </svg>
  ),
  "repair-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#06B6D4" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#A5F3FC" />
      <path d="M30 14l4 4a1 1 0 0 1 0 1.4l-4.6 4.6a8 8 0 0 1-10.6 10.6l-8.3 8.3a2.8 2.8 0 0 1-4-4l8.3-8.3a8 8 0 0 1 10.6-10.6l3.2 3.2z" fill="#F97316" />
      <circle cx="18" cy="30" r="2" fill="#fff" />
    </svg>
  ),
  "pdf-password-checker": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="6" y="18" width="36" height="24" rx="4" fill="#EF4444" />
      <path d="M14 18v-6a10 10 0 0 1 20 0v6" fill="none" stroke="#DC2626" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="30" r="3" fill="#fff" />
      <line x1="24" y1="33" x2="24" y2="37" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),

  // ─── Convert ────────────────────────────
  "pdf-to-pdfa": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#059669" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#A7F3D0" />
      <circle cx="24" cy="22" r="8" fill="none" stroke="#065F46" strokeWidth="2" strokeDasharray="4 3" />
      <line x1="20" y1="22" x2="28" y2="22" stroke="#065F46" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="18" x2="24" y2="26" stroke="#065F46" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "optimize-pdf-web": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <polygon points="26,4 6,24 20,24 18,44 42,20 26,20 28,4" fill="#F59E0B" />
      <polygon points="26,4 6,24 20,24 18,44 42,20 26,20 28,4" fill="none" stroke="#D97706" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  "compare-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="2" y="6" width="18" height="36" rx="3" fill="#3B82F6" />
      <rect x="28" y="6" width="18" height="36" rx="3" fill="#60A5FA" />
      <rect x="5" y="10" width="12" height="2" rx="1" fill="#fff" opacity="0.6" />
      <rect x="5" y="15" width="8" height="2" rx="1" fill="#fff" opacity="0.4" />
      <rect x="31" y="10" width="12" height="2" rx="1" fill="#fff" opacity="0.6" />
      <rect x="31" y="15" width="8" height="2" rx="1" fill="#fff" opacity="0.4" />
      <line x1="24" y1="10" x2="24" y2="38" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 2" />
    </svg>
  ),
  "ocr-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#6366F1" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#C7D2FE" />
      <circle cx="24" cy="22" r="6" fill="#4338CA" />
      <circle cx="24" cy="22" r="3" fill="#C7D2FE" />
      <circle cx="24" cy="22" r="1" fill="#4338CA" />
    </svg>
  ),
  "text-to-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#22C55E" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#BBF7D0" />
      <rect x="16" y="14" width="16" height="2" rx="1" fill="#065F46" opacity="0.5" />
      <rect x="16" y="19" width="12" height="2" rx="1" fill="#065F46" opacity="0.4" />
      <rect x="16" y="24" width="14" height="2" rx="1" fill="#065F46" opacity="0.5" />
      <rect x="16" y="29" width="10" height="2" rx="1" fill="#065F46" opacity="0.3" />
    </svg>
  ),
  "pdf-to-text": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#0EA5E9" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#BAE6FD" />
      <rect x="16" y="14" width="16" height="2" rx="1" fill="#0369A1" opacity="0.5" />
      <rect x="16" y="19" width="12" height="2" rx="1" fill="#0369A1" opacity="0.4" />
      <polyline points="16,28 20,32 28,24" fill="none" stroke="#065F46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "html-to-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <polyline points="14,12 6,24 14,36" fill="none" stroke="#F97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="34,36 42,24 34,12" fill="none" stroke="#F97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="28" y1="8" x2="20" y2="40" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  "pdf-to-html": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#F97316" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#FED7AA" />
      <polyline points="18,20 14,24 18,28" fill="none" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="30,20 34,24 30,28" fill="none" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="26" y1="16" x2="22" y2="32" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "markdown-to-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#7C3AED" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#DDD6FE" />
      <text x="24" y="28" textAnchor="middle" fontSize="12" fill="#5B21B6" fontFamily="monospace" fontWeight="bold">M↓</text>
    </svg>
  ),
  "pdf-to-markdown": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#0EA5E9" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#BAE6FD" />
      <text x="24" y="28" textAnchor="middle" fontSize="12" fill="#0369A1" fontFamily="monospace" fontWeight="bold">↓M</text>
    </svg>
  ),
  "pdf-to-csv": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="6" y="6" width="36" height="36" rx="4" fill="#22C55E" />
      <rect x="10" y="10" width="28" height="28" rx="2" fill="#BBF7D0" />
      <line x1="10" y1="18" x2="38" y2="18" stroke="#065F46" strokeWidth="1.5" />
      <line x1="10" y1="26" x2="38" y2="26" stroke="#065F46" strokeWidth="1.5" />
      <line x1="20" y1="10" x2="20" y2="38" stroke="#065F46" strokeWidth="1.5" />
      <line x1="30" y1="10" x2="30" y2="38" stroke="#065F46" strokeWidth="1.5" />
    </svg>
  ),
  "pdf-to-epub": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <path d="M8 42V8a4 4 0 0 1 4-4h24v36H12a4 4 0 0 0-4 4z" fill="#8B5CF6" />
      <path d="M12 4h24a4 4 0 0 1 4 4v36" fill="none" stroke="#6D28D9" strokeWidth="2" />
      <path d="M8 42a4 4 0 0 1-4-4V8" fill="#7C3AED" />
      <rect x="14" y="12" width="14" height="2" rx="1" fill="#fff" opacity="0.6" />
      <rect x="14" y="17" width="10" height="2" rx="1" fill="#fff" opacity="0.4" />
    </svg>
  ),
  "epub-to-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <path d="M8 8h32v36H8z" fill="#F97316" />
      <path d="M8 8c0 0 8 4 16 0s16 0 16 0" fill="none" stroke="#C2410C" strokeWidth="2" />
      <rect x="14" y="16" width="20" height="2" rx="1" fill="#fff" opacity="0.6" />
      <rect x="14" y="22" width="14" height="2" rx="1" fill="#fff" opacity="0.4" />
    </svg>
  ),
  "pdf-to-word": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="6" width="22" height="36" rx="3" fill="#3B82F6" />
      <rect x="22" y="12" width="22" height="30" rx="3" fill="#1D4ED8" />
      <rect x="8" y="10" width="14" height="2" rx="1" fill="#fff" opacity="0.6" />
      <rect x="8" y="15" width="10" height="2" rx="1" fill="#fff" opacity="0.4" />
      <path d="M30 22l4 6-4 6" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "pdf-to-powerpoint": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="6" width="40" height="26" rx="4" fill="#F97316" />
      <rect x="8" y="10" width="32" height="18" rx="2" fill="#FDBA74" />
      <path d="M18 42h12" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 32v10" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="18" r="4" fill="#C2410C" />
    </svg>
  ),
  "pdf-to-excel": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="6" y="6" width="36" height="36" rx="4" fill="#22C55E" />
      <rect x="10" y="10" width="28" height="28" rx="2" fill="#BBF7D0" />
      <line x1="10" y1="18" x2="38" y2="18" stroke="#065F46" strokeWidth="1.5" />
      <line x1="10" y1="26" x2="38" y2="26" stroke="#065F46" strokeWidth="1.5" />
      <line x1="20" y1="10" x2="20" y2="38" stroke="#065F46" strokeWidth="1.5" />
      <line x1="30" y1="10" x2="30" y2="38" stroke="#065F46" strokeWidth="1.5" />
      <path d="M32 28l4 4m0-4l-4 4" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "word-to-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="22" y="4" width="22" height="36" rx="3" fill="#3B82F6" />
      <rect x="4" y="10" width="22" height="30" rx="3" fill="#1D4ED8" />
      <rect x="8" y="14" width="14" height="2" rx="1" fill="#fff" opacity="0.6" />
      <path d="M12 24l-4 4 4 4" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "powerpoint-to-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="6" width="40" height="26" rx="4" fill="#F97316" />
      <rect x="8" y="10" width="32" height="18" rx="2" fill="#FDBA74" />
      <path d="M18 42h12M24 32v10" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />
      <line x1="20" y1="18" x2="28" y2="18" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="14" x2="24" y2="22" stroke="#C2410C" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "excel-to-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#22C55E" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#BBF7D0" />
      <path d="M20 22l4 6 4-6" fill="none" stroke="#065F46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  // ─── Image ────────────────────────────
  "jpg-to-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="6" width="32" height="36" rx="4" fill="#F59E0B" />
      <rect x="8" y="10" width="24" height="28" rx="2" fill="#FEF3C7" />
      <circle cx="14" cy="18" r="3" fill="#F97316" />
      <polyline points="32,30 24,22 14,34" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "png-to-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="6" width="32" height="36" rx="4" fill="#8B5CF6" />
      <rect x="8" y="10" width="24" height="28" rx="2" fill="#DDD6FE" />
      <circle cx="14" cy="18" r="3" fill="#7C3AED" />
      <polyline points="32,30 24,22 14,34" fill="none" stroke="#6D28D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="34" y="14" fontSize="8" fill="#6D28D9" fontFamily="sans-serif" fontWeight="bold">P</text>
    </svg>
  ),
  "images-to-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="2" y="8" width="28" height="28" rx="4" fill="#F59E0B" />
      <rect x="18" y="12" width="28" height="28" rx="4" fill="#F97316" />
      <circle cx="12" cy="18" r="3" fill="#FDBA74" />
      <polyline points="38,34 30,26 20,38" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "pdf-to-jpg": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#F59E0B" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#FEF3C7" />
      <path d="M28 18l-8 8" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />
      <polyline points="18,18 18,26 26,26" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "pdf-to-png": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#8B5CF6" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#DDD6FE" />
      <path d="M28 18l-8 8" fill="none" stroke="#6D28D9" strokeWidth="2.5" strokeLinecap="round" />
      <polyline points="18,18 18,26 26,26" fill="none" stroke="#6D28D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="34" y="14" fontSize="8" fill="#6D28D9" fontFamily="sans-serif" fontWeight="bold">P</text>
    </svg>
  ),
  "pdf-to-tiff": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#06B6D4" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#A5F3FC" />
      <line x1="16" y1="22" x2="32" y2="22" stroke="#0E7490" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="14" x2="24" y2="30" stroke="#0E7490" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "extract-images-from-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="2" y="8" width="26" height="28" rx="4" fill="#3B82F6" />
      <circle cx="10" cy="18" r="3" fill="#BFDBFE" />
      <polyline points="22,26 16,20 8,30" fill="none" fillRule="evenodd" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <path d="M28 16l12-12v20h-12" fill="#22C55E" opacity="0.85" />
      <polyline points="32,20 40,12 40,24 32,24" fill="#fff" opacity="0.4" />
    </svg>
  ),
  "scan-to-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="10" width="40" height="28" rx="4" fill="#6366F1" />
      <circle cx="24" cy="24" r="8" fill="#A5B4FC" />
      <circle cx="24" cy="24" r="3" fill="#4338CA" />
      <rect x="34" y="12" width="6" height="4" rx="1" fill="#C7D2FE" />
    </svg>
  ),

  // ─── Form ────────────────────────────
  "fill-pdf-form": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#06B6D4" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#A5F3FC" />
      <rect x="16" y="14" width="16" height="6" rx="2" fill="#fff" stroke="#0E7490" strokeWidth="1.5" />
      <rect x="16" y="24" width="16" height="6" rx="2" fill="#fff" stroke="#0E7490" strokeWidth="1.5" />
      <rect x="18" y="16" width="6" height="2" rx="0.5" fill="#0E7490" opacity="0.5" />
    </svg>
  ),
  "create-pdf-form": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#06B6D4" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#A5F3FC" />
      <line x1="16" y1="16" x2="32" y2="16" stroke="#0E7490" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="12" x2="24" y2="20" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="16" y="24" width="16" height="6" rx="2" fill="none" stroke="#0E7490" strokeWidth="1.5" strokeDasharray="3 2" />
    </svg>
  ),
  "flatten-pdf-form": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#06B6D4" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#A5F3FC" />
      <path d="M16 34l8-8 8 8" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="24" y1="26" x2="24" y2="16" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),

  // ─── Info / Utility ────────────────────────────
  "pdf-info-viewer": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="20" fill="#3B82F6" />
      <circle cx="24" cy="24" r="16" fill="#BFDBFE" />
      <line x1="24" y1="22" x2="24" y2="34" stroke="#1E40AF" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="16" r="2" fill="#1E40AF" />
    </svg>
  ),
  "verify-pdf-signature": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="20" fill="#22C55E" />
      <circle cx="24" cy="24" r="16" fill="#BBF7D0" />
      <polyline points="16,24 22,30 34,18" fill="none" stroke="#065F46" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  // ─── Image (PDF to image) ────────────────────────────
  "image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="6" width="40" height="36" rx="4" fill="#F59E0B" />
      <rect x="8" y="10" width="32" height="28" rx="2" fill="#FEF3C7" />
      <circle cx="16" cy="20" r="4" fill="#F97316" />
      <polyline points="40,32 30,22 14,38" fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  // ─── Section icons (homepage) ────────────────────────────
  "organize": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="18" height="18" rx="4" fill="#3B82F6" />
      <rect x="26" y="4" width="18" height="18" rx="4" fill="#60A5FA" />
      <rect x="4" y="26" width="18" height="18" rx="4" fill="#93C5FD" />
      <rect x="26" y="26" width="18" height="18" rx="4" fill="#BFDBFE" />
    </svg>
  ),
  "convert": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <path d="M14 8l8 8-8 8" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M34 40l-8-8 8-8" fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="6" y1="16" x2="28" y2="16" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
      <line x1="20" y1="32" x2="42" y2="32" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  "edit": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <path d="M12 4H8a4 4 0 0 0-4 4v28a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4v-4" fill="none" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" />
      <path d="M38 4l4 4-24 24H14v-8L38 4z" fill="#F59E0B" />
    </svg>
  ),
  "security": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <path d="M24 4L6 12v12c0 11 8 18 18 22 10-4 18-11 18-22V12L24 4z" fill="#22C55E" />
      <path d="M24 4L6 12v12c0 11 8 18 18 22 10-4 18-11 18-22V12L24 4z" fill="none" stroke="#16A34A" strokeWidth="2" />
      <polyline points="18,24 22,28 32,18" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "sign": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <path d="M4 34c6-10 12-16 22-16s10 8 18-4" fill="none" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" />
      <path d="M38 18l6-6 4 4-6 6" fill="#F59E0B" />
    </svg>
  ),
  "form": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="6" fill="#06B6D4" />
      <rect x="10" y="12" width="28" height="6" rx="2" fill="#fff" opacity="0.8" />
      <rect x="10" y="22" width="28" height="6" rx="2" fill="#fff" opacity="0.6" />
      <rect x="10" y="32" width="18" height="6" rx="2" fill="#fff" opacity="0.4" />
    </svg>
  ),
  "info": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="20" fill="#3B82F6" />
      <circle cx="24" cy="24" r="16" fill="#BFDBFE" />
      <line x1="24" y1="22" x2="24" y2="34" stroke="#1E40AF" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="16" r="2" fill="#1E40AF" />
    </svg>
  ),
  "utility": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <polygon points="26,4 6,24 20,24 18,44 42,20 26,20 28,4" fill="#F59E0B" />
      <polygon points="26,4 6,24 20,24 18,44 42,20 26,20 28,4" fill="none" stroke="#D97706" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  ),
  "batch": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="12" width="30" height="28" rx="4" fill="#6366F1" />
      <rect x="14" y="4" width="30" height="28" rx="4" fill="#818CF8" />
      <rect x="18" y="8" width="22" height="2" rx="1" fill="#fff" opacity="0.5" />
      <rect x="18" y="13" width="16" height="2" rx="1" fill="#fff" opacity="0.3" />
    </svg>
  ),

  // ─── Split-by-size / by-bookmarks (fallback) ────────
  "split-pdf-by-size": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="10" y="4" width="28" height="40" rx="4" fill="#7C3AED" />
      <rect x="14" y="8" width="20" height="32" rx="2" fill="#A78BFA" />
      <path d="M18 20h12M18 24h8" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <rect x="16" y="30" width="16" height="4" rx="2" fill="#F59E0B" opacity="0.8" />
    </svg>
  ),
  "split-pdf-by-bookmarks": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="10" y="4" width="28" height="40" rx="4" fill="#7C3AED" />
      <rect x="14" y="8" width="20" height="32" rx="2" fill="#A78BFA" />
      <path d="M18 12h12M18 18h8M18 24h12M18 30h6" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <circle cx="34" cy="24" r="6" fill="#F59E0B" />
      <path d="M32 24l2 2 4-4" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  // ─── Word-specific ────────
  "merge-word": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="6" width="16" height="22" rx="3" fill="#3B82F6" />
      <rect x="28" y="6" width="16" height="22" rx="3" fill="#60A5FA" />
      <path d="M24 34l-5-5h10l-5 5z" fill="#F59E0B" />
      <line x1="24" y1="28" x2="24" y2="32" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "split-word": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="10" y="4" width="28" height="40" rx="4" fill="#3B82F6" />
      <rect x="14" y="8" width="20" height="32" rx="2" fill="#BFDBFE" />
      <line x1="24" y1="14" x2="24" y2="34" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 2" />
    </svg>
  ),
  "word-to-text": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#3B82F6" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#BFDBFE" />
      <rect x="16" y="14" width="16" height="2" rx="1" fill="#1E40AF" opacity="0.5" />
      <polyline points="16,26 20,30 28,22" fill="none" stroke="#065F46" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "text-to-word": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#3B82F6" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#BFDBFE" />
      <rect x="16" y="14" width="16" height="2" rx="1" fill="#1E40AF" opacity="0.5" />
      <rect x="16" y="19" width="12" height="2" rx="1" fill="#1E40AF" opacity="0.4" />
      <rect x="16" y="24" width="14" height="2" rx="1" fill="#1E40AF" opacity="0.5" />
    </svg>
  ),
  "word-to-html": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#3B82F6" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#BFDBFE" />
      <polyline points="18,20 14,24 18,28" fill="none" stroke="#1E40AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="30,20 34,24 30,28" fill="none" stroke="#1E40AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="26" y1="16" x2="22" y2="32" stroke="#1E40AF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "html-to-word": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <polyline points="18,12 10,24 18,36" fill="none" stroke="#F97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="30,36 38,24 30,12" fill="none" stroke="#F97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="8" y="6" width="32" height="36" rx="4" fill="#3B82F6" opacity="0.15" />
      <rect x="12" y="10" width="24" height="28" rx="2" fill="#BFDBFE" opacity="0.3" />
    </svg>
  ),
  "word-to-markdown": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#3B82F6" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#BFDBFE" />
      <text x="24" y="28" textAnchor="middle" fontSize="12" fill="#1E40AF" fontFamily="monospace" fontWeight="bold">M↓</text>
    </svg>
  ),
  "markdown-to-word": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#7C3AED" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#DDD6FE" />
      <rect x="16" y="14" width="16" height="2" rx="1" fill="#5B21B6" opacity="0.5" />
      <rect x="16" y="19" width="12" height="2" rx="1" fill="#5B21B6" opacity="0.4" />
      <rect x="16" y="24" width="14" height="2" rx="1" fill="#5B21B6" opacity="0.3" />
    </svg>
  ),
  "word-to-epub": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <path d="M8 42V8a4 4 0 0 1 4-4h24v36H12a4 4 0 0 0-4 4z" fill="#3B82F6" />
      <path d="M12 4h24a4 4 0 0 1 4 4v36" fill="none" stroke="#1D4ED8" strokeWidth="2" />
      <rect x="14" y="12" width="14" height="2" rx="1" fill="#fff" opacity="0.6" />
      <rect x="14" y="17" width="10" height="2" rx="1" fill="#fff" opacity="0.4" />
    </svg>
  ),
  "word-to-odt": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#06B6D4" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#A5F3FC" />
      <rect x="16" y="14" width="16" height="2" rx="1" fill="#0E7490" opacity="0.5" />
      <rect x="16" y="19" width="12" height="2" rx="1" fill="#0E7490" opacity="0.4" />
    </svg>
  ),
  "odt-to-word": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#06B6D4" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#A5F3FC" />
      <rect x="16" y="14" width="16" height="2" rx="1" fill="#0E7490" opacity="0.5" />
      <polyline points="28,28 32,24 36,28" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "word-to-images": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="2" y="8" width="28" height="28" rx="4" fill="#3B82F6" />
      <rect x="18" y="12" width="28" height="28" rx="4" fill="#F59E0B" />
      <circle cx="10" cy="18" r="3" fill="#BFDBFE" />
      <polyline points="38,34 30,26 20,38" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "word-to-powerpoint": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="6" width="26" height="26" rx="4" fill="#3B82F6" />
      <rect x="18" y="16" width="26" height="26" rx="4" fill="#F97316" />
      <path d="M24 38h8M28 32v6" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "watermark-word": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#3B82F6" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#BFDBFE" />
      <text x="24" y="28" textAnchor="middle" fontSize="10" fill="#1E40AF" opacity="0.4" fontFamily="sans-serif" fontWeight="bold" transform="rotate(-20 24 28)">WM</text>
    </svg>
  ),
  "word-page-numbers": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#3B82F6" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#BFDBFE" />
      <text x="24" y="36" textAnchor="middle" fontSize="10" fill="#1E40AF" fontFamily="sans-serif" fontWeight="bold">1</text>
    </svg>
  ),
  "word-header-footer": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#3B82F6" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#BFDBFE" />
      <line x1="14" y1="12" x2="34" y2="12" stroke="#1E40AF" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="36" x2="34" y2="36" stroke="#1E40AF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "word-find-replace": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="20" cy="20" r="12" fill="none" stroke="#3B82F6" strokeWidth="3" />
      <line x1="29" y1="29" x2="40" y2="40" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
      <line x1="16" y1="20" x2="24" y2="20" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "word-track-changes": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#3B82F6" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#BFDBFE" />
      <rect x="16" y="14" width="16" height="3" rx="1" fill="#22C55E" opacity="0.5" />
      <rect x="16" y="20" width="12" height="3" rx="1" fill="#EF4444" opacity="0.5" />
      <rect x="16" y="26" width="14" height="3" rx="1" fill="#22C55E" opacity="0.5" />
    </svg>
  ),
  "word-comments-extractor": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="6" width="30" height="36" rx="4" fill="#3B82F6" />
      <path d="M38 18h6a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4h-4l-8 8v-8h-2" fill="#F59E0B" />
      <rect x="10" y="14" width="16" height="2" rx="1" fill="#fff" opacity="0.5" />
      <rect x="10" y="19" width="12" height="2" rx="1" fill="#fff" opacity="0.3" />
    </svg>
  ),
  "word-metadata-editor": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#3B82F6" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#BFDBFE" />
      <rect x="16" y="12" width="16" height="2" rx="1" fill="#1E40AF" opacity="0.5" />
      <rect x="16" y="17" width="12" height="2" rx="1" fill="#1E40AF" opacity="0.4" />
      <rect x="16" y="22" width="14" height="2" rx="1" fill="#1E40AF" opacity="0.3" />
      <rect x="16" y="27" width="10" height="2" rx="1" fill="#1E40AF" opacity="0.3" />
    </svg>
  ),
  "compare-word": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="2" y="6" width="18" height="36" rx="3" fill="#3B82F6" />
      <rect x="28" y="6" width="18" height="36" rx="3" fill="#60A5FA" />
      <line x1="24" y1="10" x2="24" y2="38" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 2" />
    </svg>
  ),
  "redact-word": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#1F2937" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#374151" />
      <rect x="14" y="16" width="20" height="4" rx="1" fill="#000" />
      <rect x="14" y="24" width="14" height="4" rx="1" fill="#000" />
    </svg>
  ),
  "protect-word": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <path d="M24 4L6 12v12c0 11 8 18 18 22 10-4 18-11 18-22V12L24 4z" fill="#22C55E" />
      <rect x="16" y="20" width="16" height="14" rx="3" fill="#fff" />
      <path d="M20 20v-4a4 4 0 0 1 8 0v4" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="28" r="2" fill="#16A34A" />
    </svg>
  ),
  "unlock-word": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <path d="M24 4L6 12v12c0 11 8 18 18 22 10-4 18-11 18-22V12L24 4z" fill="#F97316" />
      <rect x="16" y="20" width="16" height="14" rx="3" fill="#fff" />
      <path d="M20 20v-4a4 4 0 0 1 8 0" fill="none" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="28" r="2" fill="#EA580C" />
    </svg>
  ),
  "word-template-filler": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#3B82F6" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#BFDBFE" />
      <rect x="16" y="14" width="16" height="6" rx="2" fill="#fff" stroke="#1E40AF" strokeWidth="1.5" />
      <rect x="16" y="24" width="16" height="6" rx="2" fill="#fff" stroke="#1E40AF" strokeWidth="1.5" />
      <rect x="18" y="16" width="6" height="2" rx="0.5" fill="#F59E0B" opacity="0.7" />
    </svg>
  ),
  "word-tables-to-excel": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="6" y="6" width="36" height="36" rx="4" fill="#22C55E" />
      <rect x="10" y="10" width="28" height="28" rx="2" fill="#BBF7D0" />
      <line x1="10" y1="18" x2="38" y2="18" stroke="#065F46" strokeWidth="1.5" />
      <line x1="10" y1="26" x2="38" y2="26" stroke="#065F46" strokeWidth="1.5" />
      <line x1="20" y1="10" x2="20" y2="38" stroke="#065F46" strokeWidth="1.5" />
      <line x1="30" y1="10" x2="30" y2="38" stroke="#065F46" strokeWidth="1.5" />
    </svg>
  ),
  "word-style-cleaner": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#3B82F6" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#BFDBFE" />
      <path d="M24 18c-3 0-6 2-6 5s3 5 6 5 6-2 6-5-3-5-6-5z" fill="none" stroke="#F59E0B" strokeWidth="2" />
      <path d="M20 34l4-4 4 4" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "word-toc-generator": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <path d="M12 6h24a4 4 0 0 1 4 4v28l-16-8-16 8V10a4 4 0 0 1 4-4z" fill="#F59E0B" />
      <rect x="18" y="14" width="12" height="2" rx="1" fill="#fff" opacity="0.6" />
      <rect x="18" y="19" width="8" height="2" rx="1" fill="#fff" opacity="0.4" />
      <rect x="18" y="24" width="12" height="2" rx="1" fill="#fff" opacity="0.5" />
    </svg>
  ),
  "word-font-checker": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#3B82F6" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#BFDBFE" />
      <text x="24" y="28" textAnchor="middle" fontSize="14" fill="#1E40AF" fontFamily="serif" fontWeight="bold">Aa</text>
    </svg>
  ),
  "word-page-setup": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#3B82F6" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#BFDBFE" />
      <rect x="14" y="10" width="20" height="28" rx="1" fill="none" stroke="#1E40AF" strokeWidth="1.5" strokeDasharray="4 2" />
    </svg>
  ),

  // ─── Cross-format ────────
  "universal-converter": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <path d="M14 8l8 8-8 8" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M34 40l-8-8 8-8" fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="6" y1="16" x2="28" y2="16" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
      <line x1="20" y1="32" x2="42" y2="32" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  "compress-word": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#06B6D4" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#A5F3FC" />
      <path d="M20 30l4 4 4-4" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="24" y1="34" x2="24" y2="24" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  "file-info": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="20" fill="#3B82F6" />
      <circle cx="24" cy="24" r="16" fill="#BFDBFE" />
      <line x1="24" y1="22" x2="24" y2="34" stroke="#1E40AF" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="16" r="2" fill="#1E40AF" />
    </svg>
  ),
  "batch-rename-export": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="12" width="30" height="28" rx="4" fill="#6366F1" />
      <rect x="14" y="4" width="30" height="28" rx="4" fill="#818CF8" />
      <rect x="18" y="8" width="22" height="2" rx="1" fill="#fff" opacity="0.5" />
      <rect x="18" y="13" width="16" height="2" rx="1" fill="#fff" opacity="0.3" />
    </svg>
  ),
  "qr-to-pdf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="6" fill="#1F2937" />
      <rect x="8" y="8" width="14" height="14" rx="2" fill="#fff" />
      <rect x="26" y="8" width="14" height="14" rx="2" fill="#fff" />
      <rect x="8" y="26" width="14" height="14" rx="2" fill="#fff" />
      <rect x="11" y="11" width="8" height="8" rx="1" fill="#1F2937" />
      <rect x="29" y="11" width="8" height="8" rx="1" fill="#1F2937" />
      <rect x="11" y="29" width="8" height="8" rx="1" fill="#1F2937" />
      <rect x="13" y="13" width="4" height="4" fill="#22C55E" />
      <rect x="31" y="13" width="4" height="4" fill="#3B82F6" />
      <rect x="13" y="31" width="4" height="4" fill="#F59E0B" />
      <rect x="26" y="26" width="4" height="4" fill="#fff" opacity="0.6" />
      <rect x="34" y="26" width="4" height="4" fill="#fff" opacity="0.4" />
      <rect x="30" y="34" width="4" height="4" fill="#fff" opacity="0.6" />
    </svg>
  ),
  "side-by-side-diff": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="2" y="4" width="20" height="40" rx="3" fill="#3B82F6" />
      <rect x="26" y="4" width="20" height="40" rx="3" fill="#60A5FA" />
      <line x1="26" y1="4" x2="26" y2="44" stroke="#F59E0B" strokeWidth="2" />
      <rect x="6" y="10" width="12" height="2" rx="1" fill="#fff" opacity="0.5" />
      <rect x="6" y="15" width="8" height="2" rx="1" fill="#fff" opacity="0.3" />
      <rect x="30" y="10" width="12" height="2" rx="1" fill="#fff" opacity="0.5" />
      <rect x="30" y="15" width="10" height="2" rx="1" fill="#fff" opacity="0.3" />
    </svg>
  ),
  "bulk-images-to-doc": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="2" y="8" width="28" height="28" rx="4" fill="#F59E0B" />
      <rect x="18" y="12" width="28" height="28" rx="4" fill="#3B82F6" />
      <circle cx="10" cy="18" r="3" fill="#FDBA74" />
      <rect x="22" y="16" width="16" height="2" rx="1" fill="#fff" opacity="0.5" />
      <rect x="22" y="21" width="12" height="2" rx="1" fill="#fff" opacity="0.3" />
    </svg>
  ),

  // ─── New PDF tools (2024) ────────────────────────────
  "split-pdf-by-page-count": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="10" y="4" width="28" height="40" rx="4" fill="#7C3AED" />
      <rect x="14" y="8" width="20" height="32" rx="2" fill="#A78BFA" />
      <line x1="14" y1="20" x2="34" y2="20" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4 2" />
      <text x="24" y="16" textAnchor="middle" fontSize="8" fill="#fff" fontFamily="sans-serif" fontWeight="bold">5</text>
    </svg>
  ),
  "pdf-duplicate-pages": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="6" y="6" width="22" height="30" rx="3" fill="#3B82F6" />
      <rect x="16" y="12" width="22" height="30" rx="3" fill="#60A5FA" />
      <rect x="10" y="10" width="14" height="2" rx="1" fill="#fff" opacity="0.5" />
      <text x="35" y="14" fontSize="10" fill="#F59E0B" fontFamily="sans-serif" fontWeight="bold">×2</text>
    </svg>
  ),
  "pdf-interleave": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="16" height="16" rx="3" fill="#3B82F6" />
      <rect x="4" y="24" width="16" height="16" rx="3" fill="#60A5FA" />
      <rect x="28" y="4" width="16" height="16" rx="3" fill="#60A5FA" />
      <rect x="28" y="24" width="16" height="16" rx="3" fill="#3B82F6" />
      <path d="M20 12h8M20 36h8" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 2" />
    </svg>
  ),
  "pdf-scale-pages": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="8" width="20" height="20" rx="3" fill="#A78BFA" stroke="#7C3AED" strokeWidth="2" />
      <rect x="20" y="20" width="20" height="20" rx="3" fill="#8B5CF6" stroke="#6D28D9" strokeWidth="2" />
      <path d="M26 18l4-4m0 0v4m0-4h-4" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "pdf-invert-colors": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="18" fill="#1F2937" />
      <path d="M24 6a18 18 0 0 1 0 36" fill="#F9FAFB" />
    </svg>
  ),
  "pdf-metadata-stripper": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#6B7280" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#E5E7EB" />
      <path d="M18 18l6-4v8z" fill="#EF4444" />
      <rect x="16" y="28" width="16" height="2" rx="1" fill="#9CA3AF" />
      <rect x="20" y="33" width="8" height="2" rx="1" fill="#9CA3AF" />
    </svg>
  ),
  "pdf-page-labels": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#F59E0B" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#FEF3C7" />
      <text x="24" y="26" textAnchor="middle" fontSize="9" fill="#92400E" fontFamily="sans-serif" fontWeight="bold">Ch.1</text>
    </svg>
  ),
  "pdf-transparent-bg": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#E5E7EB" />
      <path d="M8 4h8v8H8zM24 4h8v8h-8zM16 12h8v8h-8zM32 12h8v8h-8zM8 20h8v8H8zM24 20h8v8h-8zM16 28h8v8h-8zM32 28h8v8h-8z" fill="#D1D5DB" opacity="0.5" />
      <path d="M16 12h8v8h-8z" fill="#9CA3AF" opacity="0.3" />
    </svg>
  ),
  "pdf-page-crop-marks": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="10" y="10" width="28" height="28" rx="2" fill="#F9FAFB" stroke="#D1D5DB" strokeWidth="1" />
      <line x1="4" y1="10" x2="10" y2="10" stroke="#000" strokeWidth="1.5" />
      <line x1="10" y1="4" x2="10" y2="10" stroke="#000" strokeWidth="1.5" />
      <line x1="38" y1="4" x2="38" y2="10" stroke="#000" strokeWidth="1.5" />
      <line x1="38" y1="10" x2="44" y2="10" stroke="#000" strokeWidth="1.5" />
      <line x1="4" y1="38" x2="10" y2="38" stroke="#000" strokeWidth="1.5" />
      <line x1="10" y1="38" x2="10" y2="44" stroke="#000" strokeWidth="1.5" />
      <line x1="38" y1="38" x2="44" y2="38" stroke="#000" strokeWidth="1.5" />
      <line x1="38" y1="38" x2="38" y2="44" stroke="#000" strokeWidth="1.5" />
    </svg>
  ),
  "pdf-bates-numbering": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#22C55E" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#BBF7D0" />
      <text x="24" y="36" textAnchor="middle" fontSize="7" fill="#065F46" fontFamily="monospace" fontWeight="bold">001234</text>
    </svg>
  ),
  "pdf-to-svg": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#8B5CF6" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#DDD6FE" />
      <circle cx="20" cy="22" r="6" fill="none" stroke="#6D28D9" strokeWidth="2" />
      <rect x="28" y="18" width="6" height="12" rx="2" fill="#6D28D9" opacity="0.6" />
    </svg>
  ),
  "pdf-create-from-url": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="18" fill="#3B82F6" />
      <circle cx="24" cy="24" r="14" fill="#BFDBFE" />
      <path d="M14 20h20M14 28h20" stroke="#1E40AF" strokeWidth="2" strokeLinecap="round" />
      <circle cx="18" cy="20" r="2" fill="#1E40AF" />
      <circle cx="30" cy="28" r="2" fill="#1E40AF" />
    </svg>
  ),
  "pdf-to-rtf": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#06B6D4" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#A5F3FC" />
      <text x="24" y="26" textAnchor="middle" fontSize="10" fill="#0E7490" fontFamily="serif" fontWeight="bold">R</text>
    </svg>
  ),
  "pdf-encrypt-check": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="20" fill="#22C55E" />
      <circle cx="24" cy="24" r="16" fill="#BBF7D0" />
      <rect x="16" y="20" width="16" height="14" rx="3" fill="#065F46" />
      <path d="M20 20v-4a4 4 0 0 1 8 0v4" fill="none" stroke="#065F46" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  "pdf-page-counter": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#0EA5E9" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#BAE6FD" />
      <text x="24" y="30" textAnchor="middle" fontSize="16" fill="#0369A1" fontFamily="sans-serif" fontWeight="bold">42</text>
    </svg>
  ),
  "pdf-to-json": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#7C3AED" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#DDD6FE" />
      <text x="24" y="28" textAnchor="middle" fontSize="10" fill="#5B21B6" fontFamily="monospace" fontWeight="bold">{ }</text>
    </svg>
  ),
  "pdf-image-watermark": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#0EA5E9" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#BAE6FD" />
      <rect x="18" y="18" width="12" height="12" rx="2" fill="#0369A1" opacity="0.3" />
      <circle cx="22" cy="22" r="2" fill="#0369A1" opacity="0.5" />
    </svg>
  ),
  "pdf-merge-single-page": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="18" height="18" rx="2" fill="#3B82F6" />
      <rect x="26" y="4" width="18" height="18" rx="2" fill="#60A5FA" />
      <rect x="4" y="26" width="18" height="18" rx="2" fill="#93C5FD" />
      <rect x="26" y="26" width="18" height="18" rx="2" fill="#BFDBFE" />
    </svg>
  ),
  "pdf-digital-stamp": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#DC2626" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#FCA5A5" />
      <text x="24" y="26" textAnchor="middle" fontSize="7" fill="#991B1B" fontFamily="sans-serif" fontWeight="bold">RECEIVED</text>
    </svg>
  ),
  "pdf-page-transition": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="4" width="32" height="40" rx="4" fill="#8B5CF6" />
      <rect x="12" y="8" width="24" height="32" rx="2" fill="#DDD6FE" />
      <path d="M20 24l8-6v12z" fill="#6D28D9" opacity="0.6" />
    </svg>
  ),
  "batch-converter": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="12" width="24" height="24" rx="3" fill="#6366F1" />
      <rect x="18" y="6" width="24" height="24" rx="3" fill="#818CF8" />
      <rect x="22" y="10" width="16" height="2" rx="1" fill="#fff" opacity="0.5" />
      <rect x="22" y="15" width="12" height="2" rx="1" fill="#fff" opacity="0.3" />
      <path d="M30 28l-4 4 4 4" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "word-to-pdf-2": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="6" width="22" height="36" rx="3" fill="#3B82F6" />
      <rect x="22" y="12" width="22" height="30" rx="3" fill="#1D4ED8" />
      <rect x="8" y="14" width="14" height="2" rx="1" fill="#fff" opacity="0.6" />
      <path d="M30 22l4 6-4 6" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "pdf-to-word-2": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="22" y="4" width="22" height="36" rx="3" fill="#3B82F6" />
      <rect x="4" y="10" width="22" height="30" rx="3" fill="#1D4ED8" />
      <rect x="8" y="14" width="14" height="2" rx="1" fill="#fff" opacity="0.6" />
      <path d="M12 24l-4 4 4 4" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "signature-manager": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <path d="M4 36c6-10 12-16 20-16s8 6 16-2" fill="none" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" />
      <path d="M38 18l6-6 4 4-6 6" fill="#F59E0B" />
      <rect x="6" y="38" width="36" height="2" rx="1" fill="#D1D5DB" />
    </svg>
  ),
  "recent-tools": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="18" fill="#3B82F6" />
      <circle cx="24" cy="24" r="14" fill="#BFDBFE" />
      <line x1="24" y1="14" x2="24" y2="24" stroke="#1E40AF" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="24" x2="30" y2="28" stroke="#1E40AF" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  "command-palette": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="10" width="40" height="28" rx="6" fill="#1F2937" />
      <rect x="8" y="14" width="32" height="20" rx="4" fill="#374151" />
      <text x="14" y="28" fontSize="12" fill="#F59E0B" fontFamily="monospace" fontWeight="bold">⌘K</text>
    </svg>
  ),

  // ─── Image Tools — Convert ────────────────────────────
  "jpg-to-png": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="6" width="32" height="36" rx="4" fill="#F59E0B" />
      <rect x="8" y="10" width="24" height="28" rx="2" fill="#FEF3C7" />
      <circle cx="14" cy="18" r="3" fill="#F97316" />
      <polyline points="32,30 24,22 14,34" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 14l8 8m0-8l-8 8" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="36" y="18" width="8" height="18" rx="2" fill="#8B5CF6" />
      <text x="40" y="30" textAnchor="middle" fontSize="7" fill="#fff" fontFamily="sans-serif" fontWeight="bold">P</text>
    </svg>
  ),
  "png-to-jpg": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="6" width="32" height="36" rx="4" fill="#8B5CF6" />
      <rect x="8" y="10" width="24" height="28" rx="2" fill="#DDD6FE" />
      <circle cx="14" cy="18" r="3" fill="#7C3AED" />
      <polyline points="32,30 24,22 14,34" fill="none" stroke="#6D28D9" strokeWidth="2" strokeLinecap="round" />
      <path d="M36 14l8 8m0-8l-8 8" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="36" y="18" width="8" height="18" rx="2" fill="#F59E0B" />
      <text x="40" y="30" textAnchor="middle" fontSize="7" fill="#fff" fontFamily="sans-serif" fontWeight="bold">J</text>
    </svg>
  ),
  "webp-to-jpg": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="8" width="32" height="32" rx="4" fill="#06B6D4" />
      <rect x="8" y="12" width="24" height="24" rx="2" fill="#A5F3FC" />
      <text x="20" y="28" fontSize="8" fill="#0E7490" fontFamily="monospace" fontWeight="bold">W</text>
      <path d="M36 16l8 8m0-8l-8 8" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="36" y="20" width="8" height="14" rx="2" fill="#F59E0B" />
      <text x="40" y="30" textAnchor="middle" fontSize="7" fill="#fff" fontFamily="sans-serif" fontWeight="bold">J</text>
    </svg>
  ),
  "jpg-to-webp": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="8" width="32" height="32" rx="4" fill="#F59E0B" />
      <rect x="8" y="12" width="24" height="24" rx="2" fill="#FEF3C7" />
      <circle cx="14" cy="20" r="3" fill="#F97316" />
      <path d="M36 16l8 8m0-8l-8 8" fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="36" y="20" width="8" height="14" rx="2" fill="#06B6D4" />
      <text x="40" y="30" textAnchor="middle" fontSize="7" fill="#fff" fontFamily="sans-serif" fontWeight="bold">W</text>
    </svg>
  ),
  "png-to-webp": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="8" width="32" height="32" rx="4" fill="#8B5CF6" />
      <rect x="8" y="12" width="24" height="24" rx="2" fill="#DDD6FE" />
      <path d="M36 16l8 8m0-8l-8 8" fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="36" y="20" width="8" height="14" rx="2" fill="#06B6D4" />
      <text x="40" y="30" textAnchor="middle" fontSize="7" fill="#fff" fontFamily="sans-serif" fontWeight="bold">W</text>
    </svg>
  ),
  "webp-to-png": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="8" width="32" height="32" rx="4" fill="#06B6D4" />
      <rect x="8" y="12" width="24" height="24" rx="2" fill="#A5F3FC" />
      <text x="20" y="28" fontSize="8" fill="#0E7490" fontFamily="monospace" fontWeight="bold">W</text>
      <path d="M36 16l8 8m0-8l-8 8" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="36" y="20" width="8" height="14" rx="2" fill="#8B5CF6" />
      <text x="40" y="30" textAnchor="middle" fontSize="7" fill="#fff" fontFamily="sans-serif" fontWeight="bold">P</text>
    </svg>
  ),
  "heic-to-jpg": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="6" width="32" height="36" rx="6" fill="#6366F1" />
      <rect x="8" y="10" width="24" height="28" rx="3" fill="#C7D2FE" />
      <text x="20" y="28" fontSize="7" fill="#4338CA" fontFamily="monospace" fontWeight="bold">HEIC</text>
      <path d="M36 14l8 8m0-8l-8 8" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="36" y="18" width="8" height="18" rx="2" fill="#F59E0B" />
      <text x="40" y="30" textAnchor="middle" fontSize="7" fill="#fff" fontFamily="sans-serif" fontWeight="bold">J</text>
    </svg>
  ),
  "heic-to-png": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="6" width="32" height="36" rx="6" fill="#6366F1" />
      <rect x="8" y="10" width="24" height="28" rx="3" fill="#C7D2FE" />
      <text x="20" y="28" fontSize="7" fill="#4338CA" fontFamily="monospace" fontWeight="bold">HEIC</text>
      <path d="M36 14l8 8m0-8l-8 8" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="36" y="18" width="8" height="18" rx="2" fill="#8B5CF6" />
      <text x="40" y="30" textAnchor="middle" fontSize="7" fill="#fff" fontFamily="sans-serif" fontWeight="bold">P</text>
    </svg>
  ),
  "tiff-to-jpg": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="8" width="32" height="32" rx="4" fill="#EC4899" />
      <rect x="8" y="12" width="24" height="24" rx="2" fill="#FBCFE8" />
      <text x="20" y="28" fontSize="8" fill="#BE185D" fontFamily="monospace" fontWeight="bold">TIFF</text>
      <path d="M36 16l8 8m0-8l-8 8" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="36" y="20" width="8" height="14" rx="2" fill="#F59E0B" />
      <text x="40" y="30" textAnchor="middle" fontSize="7" fill="#fff" fontFamily="sans-serif" fontWeight="bold">J</text>
    </svg>
  ),
  "bmp-to-jpg": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="8" width="32" height="32" rx="4" fill="#78716C" />
      <rect x="8" y="12" width="24" height="24" rx="2" fill="#D6D3D1" />
      <text x="20" y="28" fontSize="9" fill="#44403C" fontFamily="monospace" fontWeight="bold">BMP</text>
      <path d="M36 16l8 8m0-8l-8 8" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="36" y="20" width="8" height="14" rx="2" fill="#F59E0B" />
      <text x="40" y="30" textAnchor="middle" fontSize="7" fill="#fff" fontFamily="sans-serif" fontWeight="bold">J</text>
    </svg>
  ),
  "gif-to-png": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="8" width="32" height="32" rx="4" fill="#14B8A6" />
      <rect x="8" y="12" width="24" height="24" rx="2" fill="#CCFBF1" />
      <text x="20" y="28" fontSize="9" fill="#0D9488" fontFamily="monospace" fontWeight="bold">GIF</text>
      <path d="M36 16l8 8m0-8l-8 8" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="36" y="20" width="8" height="14" rx="2" fill="#8B5CF6" />
      <text x="40" y="30" textAnchor="middle" fontSize="7" fill="#fff" fontFamily="sans-serif" fontWeight="bold">P</text>
    </svg>
  ),
  "gif-to-jpg": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="8" width="32" height="32" rx="4" fill="#14B8A6" />
      <rect x="8" y="12" width="24" height="24" rx="2" fill="#CCFBF1" />
      <text x="20" y="28" fontSize="9" fill="#0D9488" fontFamily="monospace" fontWeight="bold">GIF</text>
      <path d="M36 16l8 8m0-8l-8 8" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="36" y="20" width="8" height="14" rx="2" fill="#F59E0B" />
      <text x="40" y="30" textAnchor="middle" fontSize="7" fill="#fff" fontFamily="sans-serif" fontWeight="bold">J</text>
    </svg>
  ),
  "svg-to-png": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="8" width="32" height="32" rx="4" fill="#F97316" />
      <rect x="8" y="12" width="24" height="24" rx="2" fill="#FED7AA" />
      <text x="20" y="28" fontSize="8" fill="#C2410C" fontFamily="monospace" fontWeight="bold">SVG</text>
      <path d="M36 16l8 8m0-8l-8 8" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="36" y="20" width="8" height="14" rx="2" fill="#8B5CF6" />
      <text x="40" y="30" textAnchor="middle" fontSize="7" fill="#fff" fontFamily="sans-serif" fontWeight="bold">P</text>
    </svg>
  ),
  "svg-to-jpg": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="8" width="32" height="32" rx="4" fill="#F97316" />
      <rect x="8" y="12" width="24" height="24" rx="2" fill="#FED7AA" />
      <text x="20" y="28" fontSize="8" fill="#C2410C" fontFamily="monospace" fontWeight="bold">SVG</text>
      <path d="M36 16l8 8m0-8l-8 8" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="36" y="20" width="8" height="14" rx="2" fill="#F59E0B" />
      <text x="40" y="30" textAnchor="middle" fontSize="7" fill="#fff" fontFamily="sans-serif" fontWeight="bold">J</text>
    </svg>
  ),
  "png-to-svg": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="8" width="32" height="32" rx="4" fill="#8B5CF6" />
      <rect x="8" y="12" width="24" height="24" rx="2" fill="#DDD6FE" />
      <circle cx="20" cy="24" r="6" fill="none" stroke="#6D28D9" strokeWidth="2" />
      <path d="M36 16l8 8m0-8l-8 8" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="36" y="20" width="8" height="14" rx="2" fill="#F97316" />
      <text x="40" y="30" textAnchor="middle" fontSize="5" fill="#fff" fontFamily="sans-serif" fontWeight="bold">SVG</text>
    </svg>
  ),
  "ico-to-png": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="6" y="6" width="20" height="20" rx="3" fill="#6366F1" />
      <rect x="22" y="22" width="20" height="20" rx="3" fill="#8B5CF6" />
      <rect x="9" y="9" width="14" height="14" rx="2" fill="#C7D2FE" />
      <path d="M30 26l6 6m0-6l-6 6" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "png-to-ico": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="22" y="22" width="20" height="20" rx="3" fill="#8B5CF6" />
      <rect x="25" y="25" width="14" height="14" rx="2" fill="#DDD6FE" />
      <rect x="6" y="6" width="20" height="20" rx="3" fill="#6366F1" />
      <path d="M20 20l-6-6m6 6l-6 6" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "avif-to-jpg": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="8" width="32" height="32" rx="4" fill="#10B981" />
      <rect x="8" y="12" width="24" height="24" rx="2" fill="#A7F3D0" />
      <text x="20" y="28" fontSize="8" fill="#065F46" fontFamily="monospace" fontWeight="bold">AVIF</text>
      <path d="M36 16l8 8m0-8l-8 8" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="36" y="20" width="8" height="14" rx="2" fill="#F59E0B" />
      <text x="40" y="30" textAnchor="middle" fontSize="7" fill="#fff" fontFamily="sans-serif" fontWeight="bold">J</text>
    </svg>
  ),
  "raw-to-jpg": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="8" width="32" height="32" rx="4" fill="#1F2937" />
      <rect x="8" y="12" width="24" height="24" rx="2" fill="#374151" />
      <circle cx="20" cy="24" r="6" fill="#4B5563" stroke="#9CA3AF" strokeWidth="1.5" />
      <circle cx="20" cy="24" r="2" fill="#9CA3AF" />
      <path d="M36 16l8 8m0-8l-8 8" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="36" y="20" width="8" height="14" rx="2" fill="#F59E0B" />
      <text x="40" y="30" textAnchor="middle" fontSize="7" fill="#fff" fontFamily="sans-serif" fontWeight="bold">J</text>
    </svg>
  ),

  // ─── Image Tools — Crop & Resize ────────────────────────────
  "resize-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="6" y="6" width="36" height="36" rx="4" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeDasharray="5 3" />
      <rect x="12" y="12" width="24" height="24" rx="3" fill="#3B82F6" />
      <rect x="16" y="18" width="16" height="2" rx="1" fill="#fff" opacity="0.6" />
      <rect x="16" y="23" width="12" height="2" rx="1" fill="#fff" opacity="0.4" />
      <rect x="16" y="28" width="14" height="2" rx="1" fill="#fff" opacity="0.5" />
    </svg>
  ),
  "crop-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <path d="M12 4v30a4 4 0 0 0 4 4h28" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
      <path d="M36 44V14a4 4 0 0 0-4-4H4" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
      <rect x="14" y="14" width="18" height="18" rx="2" fill="#BBF7D0" opacity="0.5" />
    </svg>
  ),
  "scale-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="8" width="32" height="32" rx="4" fill="none" stroke="#A78BFA" strokeWidth="2.5" />
      <rect x="14" y="14" width="20" height="20" rx="3" fill="#8B5CF6" />
      <path d="M32 32l8 8" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M36 32l4 4m0-4l-4 4" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "smart-crop": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="6" y="10" width="36" height="28" rx="3" fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeDasharray="4 3" />
      <rect x="12" y="14" width="24" height="20" rx="2" fill="#06B6D4" opacity="0.3" />
      <polyline points="18,24 22,28 30,20" fill="none" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  // ─── Image Tools — Rotate & Flip ────────────────────────────
  "rotate-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <path d="M36 18a12 12 0 1 1-3.5-8.5" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
      <path d="M36 5l-3 5h6l-3-5z" fill="#22C55E" />
      <rect x="12" y="16" width="20" height="26" rx="3" fill="#3B82F6" />
      <rect x="16" y="22" width="12" height="2" rx="1" fill="#fff" opacity="0.5" />
      <rect x="16" y="27" width="8" height="2" rx="1" fill="#fff" opacity="0.4" />
    </svg>
  ),
  "flip-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="8" width="32" height="32" rx="4" fill="#EC4899" />
      <rect x="12" y="12" width="24" height="24" rx="2" fill="#FBCFE8" />
      <line x1="24" y1="8" x2="24" y2="40" stroke="#BE185D" strokeWidth="2" strokeDasharray="3 2" />
      <path d="M18 20l-6 4 6 4" fill="none" stroke="#BE185D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 20l6 4-6 4" fill="none" stroke="#BE185D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "mirror-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="8" width="18" height="32" rx="3" fill="#A78BFA" />
      <rect x="26" y="8" width="18" height="32" rx="3" fill="#C4B5FD" />
      <circle cx="13" cy="20" r="3" fill="#fff" opacity="0.6" />
      <circle cx="35" cy="20" r="3" fill="#fff" opacity="0.6" />
      <line x1="24" y1="8" x2="24" y2="40" stroke="#7C3AED" strokeWidth="2" />
    </svg>
  ),
  "straighten-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="8" y="12" width="32" height="24" rx="3" fill="#06B6D4" opacity="0.3" stroke="#06B6D4" strokeWidth="2" />
      <line x1="4" y1="24" x2="44" y2="24" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4 2" />
      <rect x="12" y="16" width="24" height="16" rx="2" fill="#06B6D4" transform="rotate(-5 24 24)" />
    </svg>
  ),

  // ─── Image Tools — Filters ────────────────────────────
  "blur-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="18" fill="#94A3B8" opacity="0.4" />
      <circle cx="24" cy="24" r="14" fill="#94A3B8" opacity="0.3" />
      <circle cx="24" cy="24" r="10" fill="#94A3B8" opacity="0.2" />
      <text x="24" y="28" textAnchor="middle" fontSize="12" fill="#475569" fontFamily="sans-serif" fontWeight="bold">BLUR</text>
    </svg>
  ),
  "sharpen-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <polygon points="24,4 28,20 44,20 32,30 36,46 24,36 12,46 16,30 4,20 20,20" fill="#F59E0B" />
      <polygon points="24,4 28,20 44,20 32,30 36,46 24,36 12,46 16,30 4,20 20,20" fill="none" stroke="#D97706" strokeWidth="2" />
    </svg>
  ),
  "grayscale-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="6" width="40" height="36" rx="4" fill="url(#gray-grad)" />
      <defs><linearGradient id="gray-grad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#374151" /><stop offset="50%" stopColor="#9CA3AF" /><stop offset="100%" stopColor="#D1D5DB" />
      </linearGradient></defs>
      <circle cx="16" cy="20" r="4" fill="#1F2937" />
      <polyline points="40,30 30,22 14,36" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  "sepia-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="6" width="40" height="36" rx="4" fill="#92400E" />
      <rect x="8" y="10" width="32" height="28" rx="2" fill="#B45309" opacity="0.6" />
      <circle cx="16" cy="20" r="4" fill="#D97706" />
      <polyline points="40,30 30,22 14,36" fill="none" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  ),
  "invert-colors-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="20" fill="#1F2937" />
      <path d="M24 4a20 20 0 0 1 0 40" fill="#F9FAFB" />
      <circle cx="18" cy="18" r="4" fill="#F9FAFB" />
      <circle cx="30" cy="30" r="4" fill="#1F2937" />
    </svg>
  ),
  "threshold-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#000" />
      <rect x="4" y="4" width="40" height="20" rx="4" fill="#fff" />
      <circle cx="16" cy="14" r="4" fill="#000" />
      <polyline points="38,28 30,22 14,34" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "emboss-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="6" y="6" width="36" height="36" rx="4" fill="#9CA3AF" />
      <rect x="6" y="6" width="36" height="36" rx="4" fill="none" stroke="#6B7280" strokeWidth="2" />
      <path d="M12 36V12h24" fill="none" stroke="#D1D5DB" strokeWidth="3" strokeLinecap="round" />
      <path d="M12 36h24V12" fill="none" stroke="#4B5563" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  "edge-detect-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#000" />
      <polygon points="12,12 36,12 36,36 12,36" fill="none" stroke="#22C55E" strokeWidth="2" />
      <polygon points="18,18 30,18 30,30 18,30" fill="none" stroke="#22C55E" strokeWidth="2" />
      <line x1="12" y1="12" x2="18" y2="18" stroke="#22C55E" strokeWidth="1.5" />
      <line x1="36" y1="12" x2="30" y2="18" stroke="#22C55E" strokeWidth="1.5" />
    </svg>
  ),
  "oil-paint-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="20" fill="#F59E0B" />
      <circle cx="18" cy="18" r="6" fill="#EF4444" opacity="0.7" />
      <circle cx="30" cy="18" r="6" fill="#3B82F6" opacity="0.7" />
      <circle cx="24" cy="30" r="6" fill="#22C55E" opacity="0.7" />
      <circle cx="24" cy="22" r="3" fill="#FDE68A" />
    </svg>
  ),
  "cartoon-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="22" r="16" fill="#FDE68A" />
      <circle cx="18" cy="18" r="3" fill="#1F2937" />
      <circle cx="30" cy="18" r="3" fill="#1F2937" />
      <path d="M18 28c3 4 9 4 12 0" fill="none" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="22" r="16" fill="none" stroke="#1F2937" strokeWidth="3" />
    </svg>
  ),
  "sketch-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#F5F5F4" />
      <circle cx="24" cy="20" r="10" fill="none" stroke="#44403C" strokeWidth="2" />
      <path d="M16 36c3-6 7-8 8-8s5 2 8 8" fill="none" stroke="#44403C" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="42" x2="34" y2="42" stroke="#A8A29E" strokeWidth="1.5" />
    </svg>
  ),

  // ─── Image Tools — Adjust ────────────────────────────
  "brightness-contrast": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="18" fill="#F59E0B" />
      <path d="M24 6v8M24 34v8M6 24h8M34 24h8" stroke="#FDE68A" strokeWidth="3" strokeLinecap="round" />
      <path d="M11.5 11.5l5.6 5.6M30.9 30.9l5.6 5.6M11.5 36.5l5.6-5.6M30.9 17.1l5.6-5.6" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="24" r="8" fill="#FDE68A" />
    </svg>
  ),
  "saturation-adjust": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="16" cy="24" r="10" fill="#EF4444" opacity="0.7" />
      <circle cx="24" cy="16" r="10" fill="#22C55E" opacity="0.7" />
      <circle cx="32" cy="24" r="10" fill="#3B82F6" opacity="0.7" />
      <circle cx="24" cy="32" r="10" fill="#F59E0B" opacity="0.7" />
    </svg>
  ),
  "hue-shift": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="18" fill="none" stroke="#A78BFA" strokeWidth="3" />
      <path d="M24 6a18 18 0 0 1 0 36" fill="#EF4444" opacity="0.4" />
      <path d="M24 6a18 18 0 0 0 0 36" fill="#3B82F6" opacity="0.4" />
      <path d="M24 10l4 8h-8z" fill="#F59E0B" />
    </svg>
  ),
  "exposure-adjust": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="12" fill="#F59E0B" />
      <path d="M24 4v6M24 38v6M4 24h6M38 24h6M9.9 9.9l4.2 4.2M33.9 33.9l4.2 4.2M9.9 38.1l4.2-4.2M33.9 14.1l4.2-4.2" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  "color-temperature": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="18" y="6" width="12" height="30" rx="6" fill="none" stroke="#6B7280" strokeWidth="2.5" />
      <rect x="20" y="20" width="8" height="14" rx="4" fill="url(#temp-grad)" />
      <defs><linearGradient id="temp-grad" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#EF4444" />
      </linearGradient></defs>
      <circle cx="24" cy="18" r="4" fill="#F59E0B" />
      <text x="12" y="42" fontSize="8" fill="#3B82F6" fontFamily="sans-serif">❄</text>
      <text x="32" y="42" fontSize="8" fill="#EF4444" fontFamily="sans-serif">🔥</text>
    </svg>
  ),
  "vignette-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#D1D5DB" />
      <circle cx="24" cy="24" r="18" fill="#F5F5F4" />
      <circle cx="24" cy="24" r="12" fill="none" stroke="#6B7280" strokeWidth="8" opacity="0.3" />
    </svg>
  ),
  "gamma-adjust": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#1F2937" />
      <path d="M8 40 C8 20 20 8 40 8" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
      <path d="M8 40 C8 32 16 24 40 8" fill="none" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 2" />
      <circle cx="24" cy="24" r="3" fill="#22C55E" />
    </svg>
  ),

  // ─── Image Tools — Effects ────────────────────────────
  "watermark-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#0EA5E9" />
      <rect x="8" y="8" width="32" height="32" rx="2" fill="#BAE6FD" />
      <text x="24" y="30" textAnchor="middle" fontSize="10" fill="#0369A1" opacity="0.4" fontFamily="sans-serif" fontWeight="bold" transform="rotate(-30 24 24)">WM</text>
    </svg>
  ),
  "opacity-adjust": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#D1D5DB" />
      <rect x="4" y="4" width="40" height="20" rx="4" fill="#6B7280" />
      <rect x="10" y="14" width="8" height="8" rx="1" fill="#3B82F6" opacity="0.3" />
      <rect x="20" y="14" width="8" height="8" rx="1" fill="#3B82F6" opacity="0.6" />
      <rect x="30" y="14" width="8" height="8" rx="1" fill="#3B82F6" />
    </svg>
  ),
  "pixelate-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="12" height="12" fill="#3B82F6" />
      <rect x="16" y="4" width="12" height="12" fill="#60A5FA" />
      <rect x="28" y="4" width="12" height="12" fill="#93C5FD" />
      <rect x="4" y="16" width="12" height="12" fill="#22C55E" />
      <rect x="16" y="16" width="12" height="12" fill="#4ADE80" />
      <rect x="28" y="16" width="12" height="12" fill="#86EFAC" />
      <rect x="4" y="28" width="12" height="12" fill="#F59E0B" />
      <rect x="16" y="28" width="12" height="12" fill="#FBBF24" />
      <rect x="28" y="28" width="12" height="12" fill="#FDE68A" />
    </svg>
  ),
  "mosaic-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="2" fill="#6366F1" />
      <rect x="6" y="6" width="8" height="8" rx="1" fill="#A5B4FC" />
      <rect x="16" y="6" width="8" height="8" rx="1" fill="#818CF8" />
      <rect x="26" y="6" width="8" height="8" rx="1" fill="#C7D2FE" />
      <rect x="36" y="6" width="6" height="8" rx="1" fill="#A5B4FC" />
      <rect x="6" y="16" width="8" height="8" rx="1" fill="#818CF8" />
      <rect x="16" y="16" width="8" height="8" rx="1" fill="#C7D2FE" />
      <rect x="26" y="16" width="8" height="8" rx="1" fill="#A5B4FC" />
    </svg>
  ),
  "duotone-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#1a0533" />
      <circle cx="16" cy="18" r="6" fill="#FF6B35" opacity="0.8" />
      <circle cx="32" cy="30" r="8" fill="#FF6B35" opacity="0.5" />
      <rect x="8" y="34" width="32" height="2" rx="1" fill="#FF6B35" opacity="0.3" />
    </svg>
  ),
  "vintage-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#92400E" />
      <rect x="8" y="8" width="32" height="32" rx="2" fill="#B45309" opacity="0.5" />
      <circle cx="16" cy="18" r="4" fill="#D97706" opacity="0.6" />
      <polyline points="40,30 30,22 14,36" fill="none" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
      <rect x="4" y="4" width="40" height="40" rx="4" fill="none" stroke="#78350F" strokeWidth="3" />
    </svg>
  ),
  "fade-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <defs><linearGradient id="fade-g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3B82F6" /><stop offset="100%" stopColor="#D1D5DB" />
      </linearGradient></defs>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="url(#fade-g)" />
      <text x="24" y="28" textAnchor="middle" fontSize="10" fill="#fff" fontFamily="sans-serif" fontWeight="bold" opacity="0.6">FADE</text>
    </svg>
  ),
  "background-remove-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#D1D5DB" />
      <rect x="4" y="4" width="40" height="40" rx="4" fill="url(#check-bg)" />
      <defs><pattern id="check-bg" width="8" height="8" patternUnits="userSpaceOnUse">
        <rect width="8" height="8" fill="#fff" /><rect width="4" height="4" fill="#e5e7eb" /><rect x="4" y="4" width="4" height="4" fill="#e5e7eb" />
      </pattern></defs>
      <circle cx="24" cy="20" r="8" fill="#3B82F6" />
      <path d="M14 40c0-6 4-10 10-10s10 4 10 10" fill="#3B82F6" />
      <path d="M36 10l-4 4m0-4l4 4" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  "change-bg-color": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#F59E0B" />
      <circle cx="24" cy="22" r="10" fill="#3B82F6" />
      <path d="M30 16l6-6" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M34 12l2 4 4 2" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

  // ─── Image Tools — Annotate ────────────────────────────
  "text-on-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#6366F1" />
      <rect x="8" y="8" width="32" height="32" rx="2" fill="#C7D2FE" />
      <text x="24" y="30" textAnchor="middle" fontSize="16" fill="#4338CA" fontFamily="sans-serif" fontWeight="bold">T</text>
    </svg>
  ),
  "border-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="2" y="2" width="44" height="44" rx="4" fill="#F59E0B" />
      <rect x="6" y="6" width="36" height="36" rx="2" fill="#FEF3C7" />
      <circle cx="14" cy="16" r="3" fill="#F97316" />
      <polyline points="38,30 28,22 14,34" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "rounded-corners-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="12" fill="#8B5CF6" />
      <rect x="8" y="8" width="32" height="32" rx="8" fill="#DDD6FE" />
      <circle cx="16" cy="18" r="3" fill="#7C3AED" />
      <polyline points="38,30 28,22 16,34" fill="none" stroke="#6D28D9" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "circle-crop-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="20" fill="#22C55E" />
      <circle cx="24" cy="24" r="16" fill="#BBF7D0" />
      <circle cx="18" cy="20" r="3" fill="#065F46" />
      <polyline points="36,30 28,22 18,34" fill="none" stroke="#065F46" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  "shadow-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="10" y="6" width="28" height="28" rx="4" fill="#9CA3AF" />
      <rect x="14" y="10" width="28" height="28" rx="4" fill="#6B7280" opacity="0.3" />
      <rect x="14" y="10" width="28" height="28" rx="4" fill="none" stroke="#6B7280" strokeWidth="2" />
    </svg>
  ),
  "meme-generator": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#1F2937" />
      <rect x="8" y="8" width="32" height="32" rx="2" fill="#374151" />
      <text x="24" y="18" textAnchor="middle" fontSize="8" fill="#fff" fontFamily="Impact, sans-serif" fontWeight="bold">TOP</text>
      <text x="24" y="38" textAnchor="middle" fontSize="8" fill="#fff" fontFamily="Impact, sans-serif" fontWeight="bold">BOTTOM</text>
    </svg>
  ),
  "draw-on-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#D1D5DB" />
      <path d="M10 38c4-8 8-12 14-12s6 4 10-2" fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
      <circle cx="10" cy="38" r="2" fill="#EF4444" />
    </svg>
  ),
  "arrow-on-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#D1D5DB" />
      <line x1="10" y1="38" x2="38" y2="10" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 8l8 0 0 8" fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "sticker-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="20" fill="#FDE68A" />
      <circle cx="18" cy="20" r="2" fill="#1F2937" />
      <circle cx="30" cy="20" r="2" fill="#1F2937" />
      <path d="M18 30c3 4 9 4 12 0" fill="none" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),

  // ─── Image Tools — Info ────────────────────────────
  "image-info": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#3B82F6" />
      <rect x="8" y="8" width="32" height="32" rx="2" fill="#BFDBFE" />
      <circle cx="24" cy="24" r="10" fill="#1E40AF" />
      <line x1="24" y1="20" x2="24" y2="32" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="16" r="2" fill="#fff" />
    </svg>
  ),
  "exif-viewer": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#6366F1" />
      <rect x="8" y="8" width="32" height="32" rx="2" fill="#C7D2FE" />
      <circle cx="24" cy="22" r="8" fill="#4338CA" />
      <circle cx="24" cy="22" r="4" fill="#A5B4FC" />
      <circle cx="24" cy="22" r="1.5" fill="#4338CA" />
      <rect x="12" y="34" width="24" height="2" rx="1" fill="#4338CA" opacity="0.4" />
    </svg>
  ),
  "strip-metadata-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#22C55E" />
      <rect x="8" y="8" width="32" height="32" rx="2" fill="#BBF7D0" />
      <path d="M16 16l16 16M32 16L16 32" fill="none" stroke="#065F46" strokeWidth="2.5" strokeLinecap="round" />
      <text x="24" y="40" textAnchor="middle" fontSize="6" fill="#065F46" fontFamily="sans-serif">NO EXIF</text>
    </svg>
  ),
  "image-histogram": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#1F2937" />
      <rect x="8" y="28" width="4" height="12" fill="#EF4444" />
      <rect x="14" y="20" width="4" height="20" fill="#EF4444" />
      <rect x="20" y="12" width="4" height="28" fill="#22C55E" />
      <rect x="26" y="16" width="4" height="24" fill="#22C55E" />
      <rect x="32" y="24" width="4" height="16" fill="#3B82F6" />
      <rect x="38" y="30" width="4" height="10" fill="#3B82F6" />
    </svg>
  ),
  "color-picker-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="24" cy="24" r="20" fill="#D1D5DB" />
      <circle cx="24" cy="24" r="12" fill="#3B82F6" />
      <circle cx="20" cy="20" r="3" fill="#EF4444" />
      <circle cx="28" cy="20" r="3" fill="#22C55E" />
      <circle cx="24" cy="28" r="3" fill="#F59E0B" />
      <circle cx="24" cy="24" r="2" fill="#fff" />
    </svg>
  ),
  "image-compare": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="2" y="6" width="20" height="36" rx="3" fill="#3B82F6" />
      <rect x="26" y="6" width="20" height="36" rx="3" fill="#60A5FA" />
      <line x1="24" y1="6" x2="24" y2="42" stroke="#F59E0B" strokeWidth="2" strokeDasharray="3 2" />
      <rect x="5" y="10" width="14" height="2" rx="1" fill="#fff" opacity="0.6" />
      <rect x="29" y="10" width="14" height="2" rx="1" fill="#fff" opacity="0.6" />
    </svg>
  ),

  // ─── Image Tools — Utility ────────────────────────────
  "compress-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#06B6D4" />
      <rect x="8" y="8" width="32" height="32" rx="2" fill="#A5F3FC" />
      <path d="M18 28l6-6 6 6" fill="none" stroke="#0E7490" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="24" y1="22" x2="24" y2="14" stroke="#0E7490" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  "image-to-pdf-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="6" width="32" height="36" rx="4" fill="#F59E0B" />
      <rect x="8" y="10" width="24" height="28" rx="2" fill="#FEF3C7" />
      <circle cx="14" cy="18" r="3" fill="#F97316" />
      <path d="M34 16l8 8m0-8l-8 8" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="36" y="20" width="8" height="18" rx="2" fill="#3B82F6" />
      <rect x="38" y="24" width="4" height="2" rx="0.5" fill="#fff" opacity="0.5" />
    </svg>
  ),
  "svg-to-pdf-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="8" width="32" height="32" rx="4" fill="#F97316" />
      <rect x="8" y="12" width="24" height="24" rx="2" fill="#FED7AA" />
      <text x="20" y="28" fontSize="7" fill="#C2410C" fontFamily="monospace" fontWeight="bold">SVG</text>
      <path d="M36 16l8 8m0-8l-8 8" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="36" y="20" width="8" height="14" rx="2" fill="#3B82F6" />
      <rect x="38" y="24" width="4" height="2" rx="0.5" fill="#fff" opacity="0.5" />
    </svg>
  ),
  "image-to-base64": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#7C3AED" />
      <rect x="8" y="8" width="32" height="32" rx="2" fill="#DDD6FE" />
      <text x="24" y="26" textAnchor="middle" fontSize="7" fill="#5B21B6" fontFamily="monospace" fontWeight="bold">B64</text>
      <rect x="12" y="30" width="24" height="2" rx="1" fill="#5B21B6" opacity="0.3" />
    </svg>
  ),
  "base64-to-image": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#7C3AED" />
      <rect x="8" y="8" width="32" height="32" rx="2" fill="#DDD6FE" />
      <text x="24" y="22" textAnchor="middle" fontSize="6" fill="#5B21B6" fontFamily="monospace" fontWeight="bold">B64</text>
      <path d="M24 28v8m-3-3l3 3 3-3" fill="none" stroke="#5B21B6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "image-qr-generator": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#1F2937" />
      <rect x="8" y="8" width="12" height="12" rx="2" fill="#fff" />
      <rect x="28" y="8" width="12" height="12" rx="2" fill="#fff" />
      <rect x="8" y="28" width="12" height="12" rx="2" fill="#fff" />
      <rect x="10" y="10" width="8" height="8" rx="1" fill="#1F2937" />
      <rect x="30" y="10" width="8" height="8" rx="1" fill="#1F2937" />
      <rect x="10" y="30" width="8" height="8" rx="1" fill="#1F2937" />
      <rect x="12" y="12" width="4" height="4" fill="#fff" />
      <rect x="32" y="12" width="4" height="4" fill="#fff" />
      <rect x="12" y="32" width="4" height="4" fill="#fff" />
      <rect x="24" y="24" width="4" height="4" fill="#fff" />
      <rect x="32" y="28" width="4" height="4" fill="#fff" />
      <rect x="28" y="32" width="4" height="4" fill="#fff" />
      <rect x="36" y="32" width="4" height="4" fill="#fff" />
    </svg>
  ),
  "barcode-generator": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#1F2937" />
      <rect x="8" y="12" width="2" height="24" fill="#fff" />
      <rect x="12" y="12" width="3" height="24" fill="#fff" />
      <rect x="17" y="12" width="1" height="24" fill="#fff" />
      <rect x="20" y="12" width="4" height="24" fill="#fff" />
      <rect x="26" y="12" width="2" height="24" fill="#fff" />
      <rect x="30" y="12" width="1" height="24" fill="#fff" />
      <rect x="33" y="12" width="3" height="24" fill="#fff" />
      <rect x="38" y="12" width="2" height="24" fill="#fff" />
    </svg>
  ),
  "favicon-generator": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#F97316" />
      <rect x="8" y="8" width="32" height="32" rx="2" fill="#FED7AA" />
      <rect x="12" y="12" width="24" height="24" rx="4" fill="#C2410C" />
      <text x="24" y="28" textAnchor="middle" fontSize="10" fill="#FED7AA" fontFamily="sans-serif" fontWeight="bold">F</text>
    </svg>
  ),
  "image-collage": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="18" height="18" rx="3" fill="#3B82F6" />
      <rect x="26" y="4" width="18" height="18" rx="3" fill="#22C55E" />
      <rect x="4" y="26" width="18" height="18" rx="3" fill="#F59E0B" />
      <rect x="26" y="26" width="18" height="18" rx="3" fill="#EF4444" />
    </svg>
  ),
  "images-to-grid": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="18" height="18" rx="2" fill="#6366F1" />
      <rect x="26" y="4" width="18" height="18" rx="2" fill="#818CF8" />
      <rect x="4" y="26" width="18" height="18" rx="2" fill="#A5B4FC" />
      <rect x="26" y="26" width="18" height="18" rx="2" fill="#C7D2FE" />
    </svg>
  ),
  "photo-grid": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="14" height="20" rx="2" fill="#EC4899" />
      <rect x="20" y="4" width="24" height="12" rx="2" fill="#F472B6" />
      <rect x="20" y="18" width="12" height="26" rx="2" fill="#F9A8D4" />
      <rect x="34" y="18" width="10" height="12" rx="2" fill="#FBCFE8" />
      <rect x="4" y="26" width="14" height="18" rx="2" fill="#F472B6" />
    </svg>
  ),
  "image-strip": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="2" y="12" width="12" height="24" rx="2" fill="#06B6D4" />
      <rect x="16" y="12" width="12" height="24" rx="2" fill="#22D3EE" />
      <rect x="30" y="12" width="12" height="24" rx="2" fill="#67E8F9" />
    </svg>
  ),
  "before-after-slider": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#6B7280" />
      <rect x="4" y="4" width="20" height="40" rx="4" fill="#374151" />
      <line x1="24" y1="4" x2="24" y2="44" stroke="#fff" strokeWidth="2" />
      <circle cx="24" cy="24" r="4" fill="#fff" />
      <path d="M21 24l3-3 3 3" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M21 24l3 3 3-3" fill="none" stroke="#374151" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  "image-tile": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="2" y="2" width="12" height="12" fill="#F59E0B" />
      <rect x="14" y="2" width="12" height="12" fill="#F59E0B" />
      <rect x="26" y="2" width="12" height="12" fill="#F59E0B" />
      <rect x="38" y="2" width="8" height="12" fill="#F59E0B" />
      <rect x="2" y="14" width="12" height="12" fill="#F59E0B" />
      <rect x="14" y="14" width="12" height="12" fill="#F59E0B" />
      <rect x="26" y="14" width="12" height="12" fill="#F59E0B" />
      <rect x="38" y="14" width="8" height="12" fill="#F59E0B" />
      <rect x="2" y="26" width="12" height="12" fill="#F59E0B" />
      <rect x="14" y="26" width="12" height="12" fill="#F59E0B" />
      <rect x="26" y="26" width="12" height="12" fill="#F59E0B" />
      <rect x="38" y="26" width="8" height="12" fill="#F59E0B" />
      <rect x="2" y="38" width="12" height="8" fill="#F59E0B" />
      <rect x="14" y="38" width="12" height="8" fill="#F59E0B" />
      <rect x="26" y="38" width="12" height="8" fill="#F59E0B" />
      <rect x="38" y="38" width="8" height="8" fill="#F59E0B" />
    </svg>
  ),
  "color-palette": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="14" cy="14" r="8" fill="#EF4444" />
      <circle cx="34" cy="14" r="8" fill="#3B82F6" />
      <circle cx="14" cy="34" r="8" fill="#22C55E" />
      <circle cx="34" cy="34" r="8" fill="#F59E0B" />
      <circle cx="24" cy="24" r="8" fill="#8B5CF6" />
    </svg>
  ),
  "placeholder-generator": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="#6B7280" />
      <rect x="8" y="8" width="32" height="32" rx="2" fill="#9CA3AF" />
      <text x="24" y="26" textAnchor="middle" fontSize="8" fill="#fff" fontFamily="sans-serif" opacity="0.7">400×300</text>
    </svg>
  ),
  "gradient-generator": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <defs><linearGradient id="icon-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#667EEA" /><stop offset="100%" stopColor="#764BA2" />
      </linearGradient></defs>
      <rect x="4" y="4" width="40" height="40" rx="4" fill="url(#icon-grad)" />
    </svg>
  ),

  // ─── Additional section icons for image sub-categories ────────
  "crop": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <path d="M12 4v30a4 4 0 0 0 4 4h28" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
      <path d="M36 44V14a4 4 0 0 0-4-4H4" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  "rotate": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <path d="M36 18a12 12 0 1 1-3.5-8.5" fill="none" stroke="#EC4899" strokeWidth="3" strokeLinecap="round" />
      <path d="M36 5l-3 5h6l-3-5z" fill="#EC4899" />
    </svg>
  ),
  "filters": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <circle cx="16" cy="24" r="10" fill="#3B82F6" opacity="0.6" />
      <circle cx="24" cy="16" r="10" fill="#22C55E" opacity="0.6" />
      <circle cx="32" cy="24" r="10" fill="#F59E0B" opacity="0.6" />
    </svg>
  ),
  "adjust": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <line x1="12" y1="16" x2="12" y2="36" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="10" x2="24" y2="42" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
      <line x1="36" y1="20" x2="36" y2="32" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="22" r="3" fill="#F59E0B" />
      <circle cx="24" cy="30" r="3" fill="#3B82F6" />
      <circle cx="36" cy="26" r="3" fill="#22C55E" />
    </svg>
  ),
  "effects": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <polygon points="24,4 28,18 44,18 32,28 36,44 24,34 12,44 16,28 4,18 20,18" fill="#F59E0B" />
      <polygon points="24,4 28,18 44,18 32,28 36,44 24,34 12,44 16,28 4,18 20,18" fill="none" stroke="#D97706" strokeWidth="2" />
    </svg>
  ),
  "annotate": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <path d="M12 4H8a4 4 0 0 0-4 4v28a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4v-4" fill="none" stroke="#8B5CF6" strokeWidth="3" strokeLinecap="round" />
      <path d="M38 4l4 4-24 24H14v-8L38 4z" fill="#F59E0B" />
    </svg>
  ),
  "p2p-text": ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
      <rect x="4" y="6" width="14" height="36" rx="3" fill="#8B5CF6" />
      <rect x="30" y="6" width="14" height="36" rx="3" fill="#06B6D4" />
      <rect x="7" y="10" width="8" height="2" rx="1" fill="#fff" opacity="0.6" />
      <rect x="33" y="10" width="8" height="2" rx="1" fill="#fff" opacity="0.6" />
      <rect x="7" y="15" width="8" height="2" rx="1" fill="#fff" opacity="0.4" />
      <rect x="33" y="15" width="8" height="2" rx="1" fill="#fff" opacity="0.4" />
      <path d="M18 22h8" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M23 17l6 5-6 5" fill="none" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M30 30h-8" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M25 25l-6 5 6 5" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),

};

// Fallback icon for unknown names
const fallbackIcon = ({ size, className }: { size: number; className: string }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" className={className}>
    <rect x="8" y="4" width="32" height="40" rx="4" fill="#6B7280" />
    <rect x="12" y="8" width="24" height="32" rx="2" fill="#D1D5DB" />
    <rect x="16" y="14" width="16" height="2" rx="1" fill="#6B7280" opacity="0.5" />
    <rect x="16" y="19" width="12" height="2" rx="1" fill="#6B7280" opacity="0.4" />
    <rect x="16" y="24" width="14" height="2" rx="1" fill="#6B7280" opacity="0.3" />
  </svg>
);

export function ToolIcon({ name, size = 18, className = "" }: IconProps) {
  const iconFn = icons[name] || fallbackIcon;
  return iconFn({ size, className });
}

export function SectionIcon({ name, size = 16, className = "" }: IconProps) {
  const iconFn = icons[name] || fallbackIcon;
  return iconFn({ size, className });
}

"use client";

import React, { useState, useMemo } from "react";
import type { WorkflowOperation, WorkflowCategory } from "@/lib/workflow-config";
import { ToolIcon } from "@/components/icon";
import { categoryTile } from "@/lib/category-style";

interface OperationCardProps {
  operation: WorkflowOperation;
  category: WorkflowCategory;
  isSelected: boolean;
  onSelect: (operation: WorkflowOperation) => void;
}

export function OperationCard({
  operation,
  category,
  isSelected,
  onSelect,
}: OperationCardProps) {
  const tileStyle = categoryTile(category);

  return (
    <button
      type="button"
      onClick={() => onSelect(operation)}
      className={`group relative text-left p-4.5 rounded-2xl border transition-all duration-200 outline-none cursor-pointer flex flex-col justify-between ${
        isSelected
          ? "border-accent bg-accent-subtle/30 ring-2 ring-accent/25 shadow-md scale-[1.01]"
          : "border-border-base bg-bg-surface hover:border-accent/40 hover:bg-bg-hover/60 hover:shadow-xs"
      }`}
      aria-pressed={isSelected}
    >
      <div>
        {/* Top row: Icon tile + Badge + Checkmark */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div
            className={`w-11 h-11 rounded-xl ring-1 ring-inset flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${tileStyle}`}
          >
            <ToolIcon name={operation.slug} size={22} />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {operation.badge && (
              <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20">
                {operation.badge}
              </span>
            )}

            {/* Selection Checkmark Indicator */}
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
                isSelected
                  ? "bg-accent text-white scale-100 shadow-xs"
                  : "border border-border-strong opacity-40 group-hover:opacity-100"
              }`}
            >
              {isSelected ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-border-strong group-hover:bg-accent" />
              )}
            </div>
          </div>
        </div>

        {/* Operation Name */}
        <h4
          className={`text-[14.5px] font-bold mb-1 transition-colors leading-snug ${
            isSelected ? "text-accent" : "text-text-primary group-hover:text-accent"
          }`}
        >
          {operation.name}
        </h4>

        {/* Short Description */}
        <p className="text-[12px] text-text-secondary leading-relaxed line-clamp-2">
          {operation.shortDesc}
        </p>
      </div>

      {/* Subtle selection prompt */}
      <div className="mt-3 pt-2.5 border-t border-border-base/70 flex items-center justify-between text-[11px] font-semibold">
        <span className={isSelected ? "text-accent" : "text-text-tertiary group-hover:text-text-secondary"}>
          {isSelected ? "Selected ✓" : "Click to choose"}
        </span>
        <span className="text-text-tertiary group-hover:translate-x-0.5 transition-transform">
          →
        </span>
      </div>
    </button>
  );
}

interface OperationSelectorProps {
  category: WorkflowCategory;
  operations: WorkflowOperation[];
  selectedOperation: WorkflowOperation | null;
  onSelectOperation: (operation: WorkflowOperation) => void;
}

export function OperationSelector({
  category,
  operations,
  selectedOperation,
  onSelectOperation,
}: OperationSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOperations = useMemo(() => {
    if (!searchQuery.trim()) return operations;
    const query = searchQuery.toLowerCase();
    return operations.filter(
      (op) =>
        op.name.toLowerCase().includes(query) ||
        op.shortDesc.toLowerCase().includes(query) ||
        op.description.toLowerCase().includes(query)
    );
  }, [operations, searchQuery]);

  return (
    <div className="w-full space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-bg-surface border border-border-base rounded-2xl p-2.5 sm:px-4 shadow-xs">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-tertiary shrink-0">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${operations.length} ${category.toUpperCase()} operations (e.g. merge, compress, convert)...`}
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-text-tertiary hover:text-text-primary text-xs px-1.5 py-0.5"
            >
              Clear
            </button>
          )}
        </div>

        <span className="text-[11px] font-bold text-text-tertiary px-2 py-0.5 rounded-full bg-bg-elevated shrink-0 self-end sm:self-auto">
          {filteredOperations.length} of {operations.length} available
        </span>
      </div>

      {/* Grid of Operation Cards */}
      {filteredOperations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredOperations.map((op) => (
            <OperationCard
              key={op.id}
              operation={op}
              category={category}
              isSelected={selectedOperation?.id === op.id}
              onSelect={onSelectOperation}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center rounded-2xl bg-bg-surface border border-border-base text-text-secondary">
          <p className="text-sm font-semibold mb-1">No operations found matching "{searchQuery}"</p>
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="text-xs text-accent font-bold hover:underline"
          >
            Show all operations
          </button>
        </div>
      )}
    </div>
  );
}


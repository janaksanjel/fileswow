"use client";

import React from "react";

export type StepState = "upcoming" | "active" | "completed";

export interface PipelineStepDef {
  number: string;
  title: string;
  shortDesc: string;
  icon: React.ReactNode;
}

interface WorkflowStepProps {
  step: PipelineStepDef;
  state: StepState;
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  onClick?: () => void;
  clickable?: boolean;
}

export function WorkflowStep({
  step,
  state,
  isActive,
  isCompleted,
  onClick,
  clickable = false,
}: WorkflowStepProps) {
  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      className={`group relative flex items-center gap-3.5 sm:gap-4 text-left transition-all duration-300 outline-none select-none rounded-2xl p-2 -m-2 ${
        clickable ? "cursor-pointer hover:bg-bg-elevated/50" : "cursor-default"
      }`}
      aria-current={isActive ? "step" : undefined}
    >
      {/* Icon & Number Container */}
      <div className="relative shrink-0">
        <div
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            isActive
              ? "bg-accent text-white shadow-lg ring-4 ring-accent/20 scale-105"
              : isCompleted
              ? "bg-accent/15 text-accent border border-accent/40 shadow-sm"
              : "bg-bg-elevated text-text-tertiary border border-border-base opacity-75"
          }`}
        >
          {isCompleted ? (
            // Completed checkmark with scale & draw animation
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-fade-in"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <div className={`transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>
              {step.icon}
            </div>
          )}
        </div>

        {/* Step Number Badge */}
        <span
          className={`absolute -top-1.5 -left-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider border shadow-xs transition-all duration-200 ${
            isActive
              ? "bg-text-primary text-bg-surface border-transparent"
              : isCompleted
              ? "bg-accent text-white border-accent"
              : "bg-bg-surface text-text-tertiary border-border-base"
          }`}
        >
          {step.number}
        </span>

        {/* Subtle pulsing beacon for active step */}
        {isActive && (
          <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-accent" />
          </span>
        )}
      </div>

      {/* Label and description */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-[14px] sm:text-[15px] font-bold tracking-tight transition-colors duration-200 ${
              isActive
                ? "text-text-primary"
                : isCompleted
                ? "text-text-primary"
                : "text-text-tertiary"
            }`}
          >
            {step.title}
          </span>

          {isCompleted && (
            <span className="hidden sm:inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-1.5 py-0.5 rounded-md">
              Done
            </span>
          )}
          {isActive && (
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-1.5 py-0.5 rounded-md">
              Active
            </span>
          )}
        </div>
        <p
          className={`text-[12px] sm:text-[12.5px] leading-tight transition-colors duration-200 truncate ${
            isActive
              ? "text-text-secondary font-medium"
              : isCompleted
              ? "text-text-tertiary"
              : "text-text-tertiary/70"
          }`}
        >
          {step.shortDesc}
        </p>
      </div>
    </button>
  );
}

interface WorkflowPipelineProps {
  currentStep: 1 | 2 | 3;
  onStepClick?: (step: 1 | 2 | 3) => void;
  maxAccessibleStep?: 1 | 2 | 3;
}

export function WorkflowPipeline({
  currentStep,
  onStepClick,
  maxAccessibleStep = 3,
}: WorkflowPipelineProps) {
  const steps: PipelineStepDef[] = [
    {
      number: "01",
      title: "Add / Upload",
      shortDesc: "Drop your files here",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      ),
    },
    {
      number: "02",
      title: "Choose Operation",
      shortDesc: "Select tool & options",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
          <circle cx="8" cy="10" r="1.5" />
          <line x1="12" y1="10" x2="18" y2="10" />
        </svg>
      ),
    },
    {
      number: "03",
      title: "Process & Result",
      shortDesc: "Get processed file",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full">
      {/* ─── Desktop / Tablet: Connected Horizontal Pipeline ─── */}
      <div className="hidden md:block relative bg-bg-surface border border-border-base rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between relative">
          {steps.map((step, idx) => {
            const stepNum = (idx + 1) as 1 | 2 | 3;
            const isActive = currentStep === stepNum;
            const isCompleted = currentStep > stepNum;
            const state: StepState = isActive ? "active" : isCompleted ? "completed" : "upcoming";
            const isClickable = Boolean(onStepClick && stepNum <= maxAccessibleStep);

            return (
              <React.Fragment key={step.number}>
                {/* Step Item */}
                <div className="relative z-10 flex-1 max-w-[260px]">
                  <WorkflowStep
                    step={step}
                    state={state}
                    index={idx}
                    isActive={isActive}
                    isCompleted={isCompleted}
                    clickable={isClickable}
                    onClick={() => onStepClick?.(stepNum)}
                  />
                </div>

                {/* Animated Connecting Line between Steps */}
                {idx < steps.length - 1 && (
                  <div className="flex-1 mx-3 sm:mx-6 h-1 relative rounded-full bg-border-base overflow-hidden">
                    <div
                      className="absolute top-0 left-0 bottom-0 bg-accent transition-all duration-500 ease-out rounded-full"
                      style={{
                        width: currentStep > idx + 1 ? "100%" : currentStep === idx + 1 ? "50%" : "0%",
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ─── Mobile: Connected Vertical Pipeline ─── */}
      <div className="block md:hidden bg-bg-surface border border-border-base rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col space-y-3 relative">
          {steps.map((step, idx) => {
            const stepNum = (idx + 1) as 1 | 2 | 3;
            const isActive = currentStep === stepNum;
            const isCompleted = currentStep > stepNum;
            const state: StepState = isActive ? "active" : isCompleted ? "completed" : "upcoming";
            const isClickable = Boolean(onStepClick && stepNum <= maxAccessibleStep);

            return (
              <div key={step.number} className="relative">
                <WorkflowStep
                  step={step}
                  state={state}
                  index={idx}
                  isActive={isActive}
                  isCompleted={isCompleted}
                  clickable={isClickable}
                  onClick={() => onStepClick?.(stepNum)}
                />

                {/* Vertical connecting line on mobile */}
                {idx < steps.length - 1 && (
                  <div className="ml-6 sm:ml-7 w-0.5 h-4 bg-border-base relative my-1 overflow-hidden">
                    <div
                      className="absolute top-0 left-0 right-0 bg-accent transition-all duration-300"
                      style={{
                        height: currentStep > idx + 1 ? "100%" : currentStep === idx + 1 ? "40%" : "0%",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


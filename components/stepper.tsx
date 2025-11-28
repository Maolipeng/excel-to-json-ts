"use client"

import { Check } from "lucide-react"

interface Step {
  id: number
  name: string
  description: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  onStepClick: (step: number) => void
}

export function Stepper({ steps, currentStep, onStepClick }: StepperProps) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => (
          <li key={step.id} className="relative flex flex-1 items-center">
            <button
              onClick={() => step.id < currentStep && onStepClick(step.id)}
              disabled={step.id > currentStep}
              className="group flex flex-col items-center"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors ${
                  step.id < currentStep
                    ? "border-primary bg-primary text-primary-foreground"
                    : step.id === currentStep
                      ? "border-primary bg-background text-primary"
                      : "border-border bg-background text-muted-foreground"
                }`}
              >
                {step.id < currentStep ? <Check className="h-5 w-5" /> : step.id}
              </span>
              <span className="mt-2 text-xs font-medium text-foreground">{step.name}</span>
              <span className="text-xs text-muted-foreground">{step.description}</span>
            </button>
            {index < steps.length - 1 && (
              <div className={`mx-4 h-0.5 flex-1 ${step.id < currentStep ? "bg-primary" : "bg-border"}`} />
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

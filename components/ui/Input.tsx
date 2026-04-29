import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, prefix, suffix, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-cream-700 font-display">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-sm text-cream-500 font-mono pointer-events-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            className={clsx(
              "w-full bg-white border border-cream-300 rounded-xl px-3 py-2.5 text-sm text-cream-900",
              "placeholder:text-cream-400 font-sans",
              "focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent",
              "transition-all duration-150",
              { "pl-8": prefix, "pr-12": suffix },
              error && "border-coral-400 focus:ring-coral-400",
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 text-sm text-cream-500 font-mono pointer-events-none">
              {suffix}
            </span>
          )}
        </div>
        {hint && !error && <p className="text-xs text-cream-500">{hint}</p>}
        {error && <p className="text-xs text-coral-600">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

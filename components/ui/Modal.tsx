"use client";
import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { clsx } from "clsx";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-cream-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={clsx(
          "relative bg-white rounded-2xl shadow-xl border border-cream-200 mx-4 w-full animate-slide-up",
          {
            "max-w-sm": size === "sm",
            "max-w-lg": size === "md",
            "max-w-2xl": size === "lg",
          }
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-100">
          <h2 className="text-base font-display font-semibold text-cream-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-cream-100 transition-colors text-cream-500 hover:text-cream-800"
          >
            <X size={16} />
          </button>
        </div>
        {/* Content */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

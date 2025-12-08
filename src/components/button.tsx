// Componente de botón personalizado
import * as React from "react";
import { cn } from "../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost";
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = "default",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-blue-600 text-blue-600 hover:bg-blue-50",
    ghost: "text-blue-600 hover:bg-blue-50",
  };

  return (
    <button className={cn(baseStyles, variants[variant], className)} {...props} />
  );
};

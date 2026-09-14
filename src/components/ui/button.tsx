import * as React from "react"

export function Button({ className, variant, size, children, ...props }: any) { 
  const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50"; 
  
  let variants = "bg-slate-900 text-slate-50 hover:bg-slate-900/90"; // default
  if (variant === "outline") variants = "border border-slate-200 bg-white hover:bg-slate-100 text-slate-900";
  if (variant === "ghost") variants = "hover:bg-slate-100 hover:text-slate-900 bg-transparent";

  let sizes = "h-10 px-4 py-2"; // default
  if (size === "sm") sizes = "h-9 rounded-md px-3";
  if (size === "lg") sizes = "h-11 rounded-md px-8";
  if (size === "icon") sizes = "h-10 w-10"; // Không có padding để icon hiển thị đúng

  return <button className={`${base} ${variants} ${sizes} ${className || ""}`} {...props}>{children}</button>; 
}
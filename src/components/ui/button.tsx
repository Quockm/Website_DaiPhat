import * as React from "react"

export function Button({ className, variant, ...props }: any) { 
  const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2"; 
  const variants = variant === "outline" ? "border border-slate-200 bg-white hover:bg-slate-100 text-slate-900" : "bg-slate-900 text-slate-50 hover:bg-slate-900/90"; 
  return <button className={`${base} ${variants} ${className || ""}`} {...props} />; 
}
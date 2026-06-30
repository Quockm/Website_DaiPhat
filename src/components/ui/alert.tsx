import * as React from "react"

export function Alert({ className, children }: any) { 
  return <div className={`p-4 rounded-lg flex gap-3 border ${className || ""}`}>{children}</div>; 
}

export function AlertDescription({ className, children }: any) { 
  return <div className={`text-sm ${className || ""}`}>{children}</div>; 
}
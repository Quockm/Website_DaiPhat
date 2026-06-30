import * as React from "react"

export function Select({ value, onValueChange, children }: any) { 
  return (
    <select value={value} onChange={e => onValueChange(e.target.value)} className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
      {children}
    </select>
  ); 
}
export function SelectTrigger({ children }: any) { return <>{children}</>; }
export function SelectValue({ children }: any) { return <></>; }
export function SelectContent({ children }: any) { return <>{children}</>; }
export function SelectItem({ value, children }: any) { return <option value={value}>{children}</option>; }
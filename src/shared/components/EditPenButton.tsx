import { Edit, Edit2 } from "lucide-react"
import React from "react"

export interface EditPenButtonProps {
  [key: string]: any
}

export function EditPenButton({
  className = "flex items-center justify-center rounded-lg font-medium text-primary",
  svgClassName = "",
  ...rest
}: EditPenButtonProps) {
  return (
    <button aria-label="Edit pen" {...rest}>
      <Edit2 className="w-4 h-4 text-muted-foreground" />
    </button>
  )
}

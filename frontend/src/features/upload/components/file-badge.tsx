import { Loader2, Check, AlertCircle, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface FileBadgeProps {
  text: string
  icon?: 'loading' | 'success' | 'error' | React.ReactNode
  onClose?: () => void
}

export function FileBadge({
  text,
  icon,
  onClose,
}: FileBadgeProps) {
  const closeButton = onClose ? (
    <button
      type="button"
      onClick={onClose}
      className="rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer pointer-events-auto"
    >
      <X className="w-3 h-3 text-foreground" />
    </button>
  ) : null

  let iconComponent = null
  if (icon === 'loading') {
    iconComponent = <Loader2 className="w-3 h-3 animate-spin" />
  } else if (icon === 'success') {
    iconComponent = <Check className="w-3 h-3 text-green-500" />
  } else if (icon === 'error') {
    iconComponent = <AlertCircle className="w-3 h-3 text-red-500" />
  } else {
    iconComponent = icon
  }

  return (
    <Badge variant="outline" className="flex items-center gap-2">
      <span className="max-w-[200px] truncate">{text}</span>
      {iconComponent}
      {closeButton}
    </Badge>
  )
}

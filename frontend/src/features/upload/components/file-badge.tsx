import { useState } from 'react'
import { Loader2, Check, AlertCircle, RotateCw, X, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export interface FileBadgeProps {
  text: string
  status: 'ready' | 'uploading' | 'success' | 'error'
  onRetry?: () => void
  onCancel?: () => void
  onClear?: () => void
}

export function FileBadge({
  text,
  status,
  onRetry,
  onCancel,
  onClear,
}: FileBadgeProps) {
  const [isHovered, setIsHovered] = useState(false)

  const cancelButton = (
    <button
      type="button"
      onClick={onCancel}
      className="rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer pointer-events-auto"
      title="取消"
    >
      <X className="w-3 h-3 text-foreground" />
    </button>
  )

  const uploadingIcon = <Loader2 className="w-3 h-3 animate-spin" />

  const successIcon = <Check className="w-3 h-3 text-green-500" />

  const clearButton = (
    <button
      type="button"
      onClick={onClear}
      className="rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer pointer-events-auto"
      title="清理"
    >
      <Trash2 className="w-3 h-3 text-foreground" />
    </button>
  )

  const errorIcon = <AlertCircle className="w-3 h-3 text-red-500" />

  const retryButton = (
    <button
      type="button"
      onClick={onRetry}
      className="rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer pointer-events-auto"
      title="点击重试"
    >
      <RotateCw className="w-3 h-3 text-foreground" />
    </button>
  )

  return (
    <Badge
      variant="outline"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="max-w-[200px] truncate">{text}</span>

      {status === 'ready' && cancelButton}
      {status === 'uploading' && uploadingIcon}
      {status === 'success' &&
        (onClear && isHovered ? clearButton : successIcon)}
      {status === 'error' && (onRetry && isHovered ? retryButton : errorIcon)}
    </Badge>
  )
}

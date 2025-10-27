import type { FileState } from '../hooks/use-file-uploader'
import { FileBadge } from './file-badge'

export interface FileBadgeListProps {
  files: FileState[]
  onRetry?: (id: string) => void
  onCancel?: (id: string) => void
  onClear?: (id: string) => void
}

export function FileBadgeList({
  files,
  onRetry,
  onCancel,
  onClear,
}: FileBadgeListProps) {
  return (
    <div className="flex gap-2 flex-wrap items-center">
      {files.map((file) => (
        <FileBadge
          key={file.id}
          text={file.file.name}
          status={file.status}
          onRetry={onRetry ? () => onRetry(file.id) : undefined}
          onCancel={onCancel ? () => onCancel(file.id) : undefined}
          onClear={onClear ? () => onClear(file.id) : undefined}
        />
      ))}
    </div>
  )
}

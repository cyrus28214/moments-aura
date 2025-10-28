'use client'

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FileUploaderProps {
  onAddFiles: (files: FileList) => void
  name?: string
  accept?: string
  disabled?: boolean
  labelText?: string
  className?: string
  id?: string
}

export function FileUploader({
  onAddFiles,
  name,
  accept,
  disabled = false,
  labelText = '点击或拖拽文件到这里上传',
  className,
  id: propId,
}: FileUploaderProps) {
  const autoId = React.useId()
  const id = propId || autoId

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(e.target.files)
    }
    e.target.value = ''
  }

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (disabled) return

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddFiles(e.dataTransfer.files)
    }
  }

  return (
    <div className="w-full">
      <Label
        htmlFor={id}
        className={cn(
          'flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg border-input bg-background',
          disabled
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer hover:bg-accent',
          className,
        )}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <Upload className="w-10 h-10 text-muted-foreground" />
        <span className="mt-2 text-sm text-muted-foreground">{labelText}</span>
      </Label>

      <Input
        id={id}
        name={name}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept={accept}
        disabled={disabled}
      />
    </div>
  )
}

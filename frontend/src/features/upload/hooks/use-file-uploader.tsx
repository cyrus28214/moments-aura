import { useCallback, useEffect, useState } from 'react'
import { uploadFile as uploadFileApi } from '../api'

export type FileStatus = 'ready' | 'uploading' | 'success' | 'error'

export interface FileState {
  id: string
  file: File
  status: FileStatus
}

export function useFileUploader() {
  const [files, setFiles] = useState<FileState[]>([])

  const addFile = useCallback((file: File) => {
    const id = crypto.randomUUID()
    setFiles((files) => [...files, { id, file, status: 'ready' }])
    return id
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles((files) => files.filter((file) => file.id !== id))
  }, [])

  const uploadFile = useCallback(async (id: string) => {
    const uploadTask = async (file: File) => {
      try {
        const result = await uploadFileApi(file)
        const status = result.code === 0 ? 'success' : 'error'
        setFiles((files) =>
          files.map((file) => (file.id === id ? { ...file, status } : file)),
        )
      } catch {
        setFiles((files) =>
          files.map((file) =>
            file.id === id ? { ...file, status: 'error' } : file,
          ),
        )
      }
    }

    setFiles((files) => {
      const fileToUpdate = files.find((file) => file.id === id)
      if (!fileToUpdate) {
        return files
      }

      uploadTask(fileToUpdate.file)

      return files.map((file) =>
        file.id === id ? { ...file, status: 'uploading' } : file,
      )
    })
  }, [])

  return {
    files,
    addFile,
    removeFile,
    uploadFile,
  }
}

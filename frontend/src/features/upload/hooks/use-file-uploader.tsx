import { useState } from 'react'
import { uploadFile as uploadFileApi } from '../api'

export type FileUploadStatus = 'idle' | 'loading' | 'success' | 'error'

export interface UploadingFile {
  id: string
  status: FileUploadStatus
  file: File
}

export function useFileUploader() {
  const [files, setFiles] = useState<UploadingFile[]>([])

  const addFile = (file: File) => {
    const fileId = crypto.randomUUID()
    setFiles((files) => [...files, { id: fileId, file, status: 'idle' }])
    return fileId
  }

  const removeFile = (id: string) => {
    setFiles((files) => files.filter((file) => file.id !== id))
  }

  const uploadFile = async (id: string) => {
    setFiles((files) => {
      return files.map((file) =>
        file.id === id ? { ...file, status: 'loading' } : file,
      )
    })

    const fileToUpload = files.find((file) => file.id === id)

    if (!fileToUpload) {
      return
    }

    try {
      const result = await uploadFileApi(fileToUpload.file)
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

  return {
    files,
    addFile,
    removeFile,
    uploadFile,
  }
}

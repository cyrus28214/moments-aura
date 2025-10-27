import { useCallback, useState } from 'react'
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
    setFiles((prevFiles) => [...prevFiles, { id, file, status: 'ready' }])
    return id
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id))
  }, [])

  const uploadFile = useCallback(
    async (id: string) => {
      const fileToUpload = files.find((file) => file.id === id)
      if (!fileToUpload || fileToUpload.status !== 'ready') {
        return
      }

      setFiles(
        files.map((file) =>
          file.id === id ? { ...file, status: 'uploading' } : file,
        ),
      )

      const result = await uploadFileApi(fileToUpload.file)
      console.log('uploadFile result', result)
      const status = result.code === 0 ? 'success' : 'error'
      setFiles(
        files.map((file) => (file.id === id ? { ...file, status } : file)),
      )
    },
    [setFiles, files],
  )

  return {
    files,
    addFile,
    removeFile,
    uploadFile,
  }
}

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

  const setStatus = useCallback((id: string, status: FileStatus) => {
    setFiles((prevFiles) =>
      prevFiles.map((file) => (file.id === id ? { ...file, status } : file)),
    )
  }, [])

  const uploadFile = useCallback(
    async (id: string) => {
      let fileToUpload: FileState | undefined
      setFiles((prevFiles) => {
        fileToUpload = prevFiles.find((file) => file.id === id)
        if (fileToUpload) {
          return prevFiles.map((file) =>
            file.id === id ? { ...file, status: 'uploading' } : file,
          )
        }
        return prevFiles
      })

      if (!fileToUpload) {
        console.error(`File with id ${id} not found`)
        return
      }

      try {
        const response = await uploadFileApi(fileToUpload.file)
        if (response.code === 0) {
          setStatus(id, 'success')
        } else {
          setStatus(id, 'error')
        }
      } catch (error) {
        console.error('Upload failed:', error)
        setStatus(id, 'error')
      }
    },
    [setStatus],
  )

  return {
    files,
    addFile,
    removeFile,
    uploadFile,
  }
}

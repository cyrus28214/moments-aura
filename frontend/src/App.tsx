import { FileUploader } from '@/features/upload/components/file-uploader'
import { useFileUploader } from './features/upload/hooks/use-file-uploader'
import { FileBadgeList } from './features/upload/components/file-badge-list'
import { useEffect } from 'react'

function App() {
  const { files, addFile, removeFile, uploadFile } = useFileUploader()

  const handleAddFile = (file: File | null) => {
    if (!file) return
    addFile(file)
  }

  useEffect(() => {
    files.forEach((file) => {
      if (file.status !== 'ready') return
      uploadFile(file.id)
    })
  }, [files, uploadFile])

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <FileUploader onFileChange={handleAddFile} />
      <FileBadgeList
        files={files}
        onRetry={uploadFile}
        onCancel={removeFile}
        onClear={removeFile}
      />
    </div>
  )
}

export default App

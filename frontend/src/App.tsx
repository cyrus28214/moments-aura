import { FileUploader } from '@/features/upload/components/file-uploader'
import { useFileUploader } from './features/upload/hooks/use-file-uploader'
import { FileBadgeList } from './features/upload/components/file-badge-list'
import { useEffect } from 'react'

function App() {
  const { files, addFile, removeFile, uploadFile } = useFileUploader()

  const handleAddFiles = async (files: FileList) => {
    for (const file of files) {
      addFile(file)
      // 不能直接在此处调用 uploadFile(fileId)，因为 addFile 是异步的，会找不到fileId
    }
  }

  useEffect(() => {
    for (const file of files) {
      if (file.status === 'idle') {
        uploadFile(file.id)
      }
    }
  }, [files])

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <FileUploader onAddFiles={handleAddFiles} />
      <FileBadgeList files={files} onCancel={removeFile} onClear={removeFile} />
    </div>
  )
}

export default App

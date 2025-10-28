import { FileUploader } from '@/features/upload/components/file-uploader'
import { useFileUploader } from './features/upload/hooks/use-file-uploader'
import { FileBadgeList } from './features/upload/components/file-badge-list'

function App() {
  const { files, addFile, removeFile, uploadFile } = useFileUploader()

  const handleAddFiles = async (files: FileList) => {
    for (const file of files) {
      const fileId = addFile(file)
      await uploadFile(fileId)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <FileUploader onAddFiles={handleAddFiles} />
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

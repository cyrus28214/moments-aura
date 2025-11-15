import { FileUploader } from '@/features/upload/components/file-uploader'
import { FileBadge } from './features/upload/components/file-badge'
import { useEffect, useState } from 'react'
import { uploadFile } from './features/upload/api'
import { ImageList } from './features/image/components/image-list'
import { getImages, type Image } from './features/image/api'

interface FileInfo {
  id: string
  file: File
  status: 'idle' | 'loading' | 'success' | 'error'
}

function App() {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [images, setImages] = useState<Image[]>([])
  useEffect(() => {
    getImages().then(setImages)
  }, [])
  const handleAddFiles = (file: FileList) => {
    const newFiles: FileInfo[] = Array.from(file).map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: 'loading'
    }))
    setFiles((prev) => [...prev, ...newFiles])
    for (const file of newFiles) {
      uploadFile(file.file)
        .then(() => {
          setFiles((prev) => prev.map((f) => f.id === file.id ? { ...f, status: 'success' } : f))
        })
        .catch(() => {
          setFiles((prev) => prev.map((f) => f.id === file.id ? { ...f, status: 'error' } : f))
        })
    }
  }

  const handleClose = (id: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== id))
  }

  const getFileBadge = (file: FileInfo) => {
    const closeable = file.status === 'error';
    return (
      <FileBadge
        key={file.id}
        text={file.file.name}
        icon={file.status === 'loading' ? 'loading' : file.status === 'success' ? 'success' : file.status === 'error' ? 'error' : undefined}
        onClose={closeable ? () => handleClose(file.id) : undefined}
      />
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <ImageList images={images} />
      <FileUploader onAddFiles={handleAddFiles} />
      <div className="flex gap-2 flex-wrap items-center">
      {files.map(getFileBadge)}
      </div>
    </div>
  )
}

export default App

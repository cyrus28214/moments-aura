import { FileUploader } from '@/components/ui/file-uploader'
import { useState } from 'react'
import { Badge } from './components/ui/badge'
import { X } from 'lucide-react'

function App() {
  const [files, setFiles] = useState<File[]>([])

  const handleFileChange = (file: File | null) => {
    if (!file) return
    setFiles([...files, file])
  }

  const handleFileRemove = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <FileUploader onFileChange={handleFileChange} />
      <div className="flex gap-2 flex-wrap items-center mt-4">
        {files.map((file, index) => (
          <Badge variant="outline" key={index} className="gap-1.5 pr-1">
            <span>{file.name}</span>
            <button
              type="button"
              onClick={() => handleFileRemove(index)}
              className="rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  )
}

export default App

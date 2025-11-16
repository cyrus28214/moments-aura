import { FileUploader } from '@/features/upload/components/file-uploader'
import { FileBadge } from './features/upload/components/file-badge'
import { useEffect, useRef, useState } from 'react'
import { uploadFile } from './features/upload/api'
import { ImageList } from './features/image/components/image-list'
import { getImages, type Image } from './features/image/api'
import { ImageGrid } from './features/image/components/image-grid'
import { Slider } from './components/ui/slider'
import { MinusIcon, PlusIcon, UploadIcon } from 'lucide-react'
import { Button } from './components/ui/button'

interface FileInfo {
  id: string
  file: File
  status: 'idle' | 'loading' | 'success' | 'error'
}

const GRID_COLS_MIN = 3;
const GRID_COLS_MAX = 10;
const GRID_COLS_DEFAULT = 5;

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

  // copy images 10 times
  const repeatImages = images.flatMap((image) => Array(10).fill(image))

  const [gridCols, setGridCols] = useState<number>(GRID_COLS_DEFAULT);

  const handleDecreaseGridCols = () => {
    setGridCols(Math.max(GRID_COLS_MIN, gridCols - 1));
  }

  const handleIncreaseGridCols = () => {
    setGridCols(Math.min(GRID_COLS_MAX, gridCols + 1));
  }

  const handleUploadFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    for (const file of e.target.files) {
      uploadFile(file)
    }
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  }

  return (
    <div className="flex flex-col h-screen gap-4">
      <div className="flex items-center gap-2 p-2">
        <div className="flex items-center gap-1">
          {/* click minus icon, zoom out images, increase grid cols */}
          <Button variant="ghost" className="size-7 cursor-pointer" onClick={handleIncreaseGridCols}>
            <MinusIcon />
          </Button>
          <Slider
            value={[GRID_COLS_MAX + GRID_COLS_MIN - gridCols]}
            onValueChange={(value) => {
              setGridCols(GRID_COLS_MAX + GRID_COLS_MIN - value[0]);
            }}
            min={GRID_COLS_MIN}
            max={GRID_COLS_MAX}
            step={1}
            className="w-24"
          />  
          {/* click plus icon, zoom in images, decrease grid cols */}
          <Button variant="ghost" className="size-7 cursor-pointer" onClick={handleDecreaseGridCols}>
            <PlusIcon />
          </Button>
        </div>
        <Button variant="ghost" className="size-7 cursor-pointer" onClick={handleFileInputClick}>
          <UploadIcon />
          <input type="file" onChange={handleUploadFiles} className="hidden" multiple accept="image/*" ref={fileInputRef} />
        </Button>
      </div>
      <div className="grid gap-6 p-4" style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
        {repeatImages.map((image) => (
          <div className="aspect-square overflow-hidden">
            <img src={`/api/images/${image.id}/content`} alt={image.file_name} className="w-full h-full object-contain block" />
          </div>
        ))}
      </div>
      {/* <FileUploader onAddFiles={handleAddFiles} />
      <div className="flex gap-2 flex-wrap items-center">
      {files.map(getFileBadge)}
      </div> */}
    </div>
  )
}

export default App

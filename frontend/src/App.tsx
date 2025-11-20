import { useEffect, useRef, useState } from 'react'
import { uploadFile } from './features/upload/api'
import { getImages, type Image } from './features/image/api'
import { deleteImages } from './features/image/api'
import { Slider } from './components/ui/slider'
import { MinusIcon, PlusIcon, SquareCheckIcon, SquareMousePointerIcon, CloudUploadIcon, LayoutGridIcon, Trash2Icon } from 'lucide-react'
import { Button } from './components/ui/button'
import { cn } from './lib/utils'
import { 
  AlertDialog,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogDescription,
} from './components/ui/alert-dialog'
import { Toaster } from './components/ui/sonner'
import { toast } from 'sonner'

type ImageExtra = Image & {
  selected: boolean
}

const GRID_COLS_MIN = 3;
const GRID_COLS_MAX = 10;
const GRID_COLS_DEFAULT = 5;

function App() {
  const [images, setImages] = useState<ImageExtra[]>([])
  useEffect(() => {
    getImages().then((images) => setImages(images.map((image) => ({ ...image, selected: false }))))
  }, [])

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

  const [selectMode, setSelectMode] = useState<boolean>(false);
  const selectAll = images.every((image) => image.selected);

  const clearSelection = () => {
    setImages(images.map((image) => ({ ...image, selected: false })));
  }

  const handleSelectionClick = () => {
    setSelectMode(!selectMode);
  }

  const handleImageClick = (imageId: string) => {
    if (!selectMode) return;
    setImages(images.map((image) => {
      if (image.id !== imageId) {
        return image
      }
      return { ...image, selected: !image.selected };
    }));
    console.log(images);
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setImages(images.map((image) => ({ ...image, selected: false })));
    } else {
      setImages(images.map((image) => ({ ...image, selected: true })));
    }
  }

  const handleDeleteSelectedImages = () => {
    setConfirmDeleteModalOpen(true);
  }

  const handleConfirmDelete = async () => {
    const selectedIds = images
      .filter((image) => image.selected)
      .map((image) => image.id);

    if (selectedIds.length === 0) {
      setConfirmDeleteModalOpen(false);
      return;
    }

    try {
      await deleteImages(selectedIds);
      setImages((prevImages) => 
        prevImages.filter((image) => !selectedIds.includes(image.id))
      );
      toast.success("删除成功");
    } catch (error) {
      toast.error("删除失败");
      console.error(error);
    } finally {
      setConfirmDeleteModalOpen(false);
      setSelectMode(false);
    }
  }

  const [coverMode, setCoverMode] = useState<boolean>(false);
  const handleCoverModeClick = () => {
    setCoverMode(!coverMode);
  }

  const selectedCount = images.filter((image) => image.selected).length;

  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState<boolean>(false);

  return (
    <div className="flex flex-col h-screen gap-4">
      <div className="flex items-center gap-2 p-2">
        <Button variant="ghost" className={cn("size-7 cursor-pointer", coverMode && "text-primary-foreground hover:text-primary-foreground")} onClick={handleCoverModeClick}>
          <LayoutGridIcon />
        </Button>
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
          <CloudUploadIcon />
          <input type="file" onChange={handleUploadFiles} className="hidden" multiple accept="image/*" ref={fileInputRef} />
        </Button>
        <Button variant="ghost" className={cn("size-7 cursor-pointer", selectMode && "text-primary-foreground hover:text-primary-foreground")} onClick={handleSelectionClick}>
          <SquareMousePointerIcon />
        </Button>
        {selectMode && (<>
          <p className="text-sm">
            {selectedCount} / {images.length}
          </p>
          <Button variant="ghost" className={cn("size-7 cursor-pointer", selectAll && "text-primary-foreground hover:text-primary-foreground")} onClick={handleSelectAll}>
            <SquareCheckIcon />
          </Button>
          <Button variant="ghost" disabled={selectedCount === 0} className="size-7 cursor-pointer text-destructive hover:text-destructive" onClick={handleDeleteSelectedImages}>
            <Trash2Icon />
          </Button>
        </>)}
      </div>
      <div className="grid gap-6 p-4" style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
        {images.map((image) => (
          <div 
            key={image.id}
            className="relative aspect-square" 
            >
            <img 
              src={`/api/images/${image.id}/content`} 
              alt={image.file_name} 
              onClick={() => handleImageClick(image.id)}
              className={cn(
                "block w-full h-full cursor-pointer",
                coverMode ? "object-cover" : "object-contain",
                selectMode && (image.selected || selectAll) && "ring-2 ring-primary-foreground"
              )}
            />
          </div>
        ))}
      </div>
      {/* <FileUploader onAddFiles={handleAddFiles} />
      <div className="flex gap-2 flex-wrap items-center">
      {files.map(getFileBadge)}
      </div> */}
      <ConfirmDeleteModal
        open={confirmDeleteModalOpen}
        onOpenChange={setConfirmDeleteModalOpen}
        onCancel={() => setConfirmDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
      <Toaster position="top-center" />
    </div>
  )
}

function ConfirmDeleteModal({ open, onOpenChange, onCancel, onConfirm }: { 
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onCancel: () => void,
  onConfirm: () => void
}) {
  return (<AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <div className="flex flex-col items-center gap-8 p-4">
        <div className="flex flex-col items-center gap-4">
          <Trash2Icon className="size-8" />
          <AlertDialogTitle>确定要删除吗？</AlertDialogTitle>
          <AlertDialogDescription>
            这个操作无法撤销。这将永久删除你所选择的图片。
          </AlertDialogDescription>
        </div>
        <div className="flex w-full gap-2">
          <Button variant="outline" className="flex-1 cursor-pointer" onClick={onCancel}>取消</Button>
          <Button variant="outline" className="flex-1 cursor-pointer text-destructive hover:text-destructive" onClick={onConfirm}>删除</Button>
        </div>
      </div>
    </AlertDialogContent>
  </AlertDialog>)
}

export default App

import { useEffect, useRef, useState, useCallback } from 'react'

import { upload_image, delete_images, type Image, list_images } from '@/api'

import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogContent,
  AlertDialogDescription,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { MinusIcon, PlusIcon, SquareCheckIcon, SquareMousePointerIcon, CloudUploadIcon, LayoutGridIcon, Trash2Icon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/features/auth/hooks'
import { PhotoView } from '../photos/components/photo'
import { ModeToggle } from '../theme/components/mode-toggle'

type ImageExtra = Image & {
  selected: boolean
}

const GRID_COLS_MIN = 3;
const GRID_COLS_MAX = 10;
const GRID_COLS_DEFAULT = 5;

export default function DashboardPage() {
  const navigate = useNavigate();
  const { token, isLoading } = useAuth();
  const [images, setImages] = useState<ImageExtra[]>([])
  const [gridCols, setGridCols] = useState<number>(GRID_COLS_DEFAULT);

  useEffect(() => {
    if (!isLoading && !token) {
      navigate({ to: '/login' });
    }
  }, [token, isLoading, navigate]);

  const fetchImages = useCallback(async () => {
    if (!token) return;
    const { images } = await list_images(token);
    setImages(images.map((image) => ({ ...image, selected: false })));
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchImages();
    }
  }, [token, fetchImages])

  const handleUploadFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !token) return;
    const tasks = Promise.all(Array.from(e.target.files).map(file => upload_image(file, token)));
    tasks.then(() => {
      toast.success("Uploaded successfully");
      fetchImages();
    }).catch((error) => {
      toast.error("Upload failed");
      console.error(error);
    });
  }

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  }

  const [selectMode, setSelectMode] = useState<boolean>(false);
  const selectAll = images.every((image) => image.selected);

  const handleSelectionClick = () => {
    setSelectMode(!selectMode);
  }

  const handleImageClick = (imageId: number) => {
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

    if (!token) return;

    try {
      await delete_images(selectedIds, token);
      setImages((prevImages) =>
        prevImages.filter((image) => !selectedIds.includes(image.id))
      );
      toast.success("Successfully deleted");
    } catch (error) {
      toast.error("Failed to delete");
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
    <div className="flex flex-col min-h-screen p-4 gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="icon" className={cn("cursor-pointer", coverMode && "text-primary hover:text-primary")} onClick={handleCoverModeClick}>
          <LayoutGridIcon />
        </Button>
        <div className="flex items-center gap-1">
          {/* click minus icon, zoom out images, increase grid cols */}
          <Button variant="ghost" size="icon" className="cursor-pointer"
            onClick={() => setGridCols(Math.max(GRID_COLS_MIN, gridCols - 1))}
          >
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
          <Button variant="ghost" size="icon" className="cursor-pointer"
            onClick={() => setGridCols(Math.min(GRID_COLS_MAX, gridCols + 1))}
          >
            <PlusIcon />
          </Button>
        </div>
        <Button variant="ghost" size="icon" className="cursor-pointer" onClick={handleFileInputClick}>
          <CloudUploadIcon />
          <input type="file" onChange={handleUploadFiles} className="hidden" multiple accept="image/*" ref={fileInputRef} />
        </Button>
        <Button variant="ghost" size="icon" disabled={images.length === 0} className={cn("cursor-pointer", selectMode && "text-primary hover:text-primary")} onClick={handleSelectionClick}>
          <SquareMousePointerIcon />
        </Button>
        {selectMode && (<>
          <p className="text-sm">
            {selectedCount} / {images.length}
          </p>
          <Button variant="ghost" size="icon" className={cn("cursor-pointer", selectAll && "text-primary hover:text-primary")} onClick={handleSelectAll}>
            <SquareCheckIcon />
          </Button>
          <Button variant="ghost" size="icon" disabled={selectedCount === 0} className="cursor-pointer text-destructive hover:text-destructive" onClick={handleDeleteSelectedImages}>
            <Trash2Icon />
          </Button>
        </>)}
        <ModeToggle />
      </div>
      {images.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className="text-muted-foreground">No photos</p>
          <button className="text-primary underline-offset-4 hover:underline" onClick={handleFileInputClick}>Upload</button>
        </div>
      ) : (
        <div className="grid gap-6 p-4" style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
          {images.map((image) => (
            <div
              key={image.id}
              className="relative aspect-square"
            >
              <PhotoView
                imageId={image.id}
                token={token!}
                alt={image.file_name}
                className={cn(
                  "block w-full h-full cursor-pointer",
                  coverMode ? "object-cover" : "object-contain",
                  selectMode && (image.selected || selectAll) && "ring-2 ring-primary"
                )}
                onClick={() => handleImageClick(image.id)}
              />
            </div>
          ))}
        </div>
      )}
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

const ConfirmDeleteModal = ({ open, onOpenChange, onCancel, onConfirm }: {
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onCancel: () => void,
  onConfirm: () => void
}) => {
  return (<AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <div className="flex flex-col items-center gap-8 p-4">
        <div className="flex flex-col items-center gap-4">
          <Trash2Icon className="size-8" />
          <AlertDialogTitle>Are you sure you want to delete?</AlertDialogTitle>
          <AlertDialogDescription>
            This operation cannot be undone. This will permanently delete the images you have selected.
          </AlertDialogDescription>
        </div>
        <div className="flex w-full gap-2">
          <Button variant="outline" className="flex-1 cursor-pointer" onClick={onCancel}>Cancel</Button>
          <Button variant="outline" className="flex-1 cursor-pointer text-destructive hover:text-destructive" onClick={onConfirm}>Delete</Button>
        </div>
      </div>
    </AlertDialogContent>
  </AlertDialog>)
}
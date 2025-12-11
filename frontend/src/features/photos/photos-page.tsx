
import { useState } from 'react'
import { useRef } from 'react'

import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { MinusIcon, PlusIcon, SquareCheckIcon, LayoutGridIcon, Trash2Icon, PanelLeft, CloudUploadIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardContext } from '../layout/dashboard-layout'
import { ImageDetailView } from '@/features/photos/image-detail-view'
import ConfirmDeleteModal from '@/features/photos/confirm-delete-modal'
import { useImages } from '@/features/photos/image-context'
import { usePhotoSelection } from './use-photo-selection'
import { PhotoCard } from './photo-card'

export default function PhotosPage() {
  const { images: serverImages, uploadImages, deleteImages } = useImages();
  const { setSidebarOpen, sidebarOpen } = useDashboardContext();

  // Grid State
  const [gridCols, setGridCols] = useState<number>(5);
  const [coverMode, setCoverMode] = useState<boolean>(false);

  // Selection State
  const { selectedIds, toggleSelection, toggleSelectAll, clearSelection } = usePhotoSelection(serverImages);
  // View State
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewingTab, setViewingTab] = useState<"info" | "edit">("info");

  // Delete State
  const [deleteTargetIds, setDeleteTargetIds] = useState<Set<string>>(new Set());
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState<boolean>(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived Data
  const images = serverImages.map((img, index) => ({
    ...img,
    selected: selectedIds.has(img.id),
    index
  }));
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    await uploadImages(files);
  }

  const viewingImage = images.find(img => img.id === viewingId);
  const prevImage = viewingImage && images[viewingImage.index - 1];
  const nextImage = viewingImage && images[viewingImage.index + 1];
  const handleImageClick = (imageId: string) => {
    if (selectedIds.size === 0) {
      setViewingId(imageId);
      return;
    };
    toggleSelection(imageId);
  }


  const handleDeleteSelectedImages = () => {
    if (selectedIds.size === 0) return;
    setDeleteTargetIds(selectedIds);
    setConfirmDeleteModalOpen(true);
    clearSelection();
  }

  const handleDeleteImage = (imageId: string) => {
    setDeleteTargetIds(new Set([imageId]));
    setConfirmDeleteModalOpen(true);
    clearSelection();
  }

  const handleConfirmDelete = async () => {
    const deleteTargetArr = Array.from(deleteTargetIds);
    await deleteImages(deleteTargetArr);
  }

  const handleViewingOpen = (imageId: string, tag: "info" | "edit") => {
    setViewingTab(tag);
    setViewingId(imageId);
  }

  return (
    <div className="flex flex-col h-screen">

      {/* Tool Bar */}
      <div className="flex flex-wrap items-center gap-2 sticky p-4 top-0 z-10 bg-background">
        <Button variant="ghost" size="icon" className="cursor-pointer" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <PanelLeft />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={cn("cursor-pointer", coverMode && "text-primary hover:text-primary")}
          onClick={() => setCoverMode(!coverMode)}
        >
          <LayoutGridIcon />
        </Button>

        <GridController
          gridCols={gridCols}
          setGridCols={setGridCols}
        />

        <div className="flex-1" />

        <Button variant="ghost" size="icon" className="cursor-pointer" onClick={handleUploadClick}>
          <CloudUploadIcon />
        </Button>

        {
          selectedIds.size > 0 &&
          <Button variant="ghost" size="icon" className="cursor-pointer text-destructive hover:text-destructive" onClick={handleDeleteSelectedImages}>
            <Trash2Icon />
          </Button>
        }

        <Button variant="ghost" size="icon" className={cn("cursor-pointer", images.length > 0 && selectedIds.size === images.length && "text-primary hover:text-primary")} onClick={toggleSelectAll}>
          <SquareCheckIcon />
        </Button>

        <input type="file" ref={fileInputRef} onChange={handleUploadFiles} className="hidden" multiple accept="image/*" />
      </div>

      {/* Image Grid */}
      <div className="px-6 py-4 flex-1">
        {images.length === 0 ?

          /*  No images */
          (
            <div className="flex flex-col items-center justify-center">
              <p className="text-muted-foreground">No photos</p>
              <button className="text-primary underline-offset-4 hover:underline" onClick={handleUploadClick}>Upload</button>
            </div>
          ) : (

            /* Has images */
            <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
              {images.map((image) => (
                <PhotoCard
                  key={image.id}
                  image={image}
                  coverMode={coverMode}
                  isSelectMode={selectedIds.size > 0}
                  onClick={() => handleImageClick(image.id)}
                  onToggleSelect={() => toggleSelection(image.id)}
                  onEdit={() => handleViewingOpen(image.id, "edit")}
                  onInfo={() => handleViewingOpen(image.id, "info")}
                  onDelete={() => handleDeleteImage(image.id)}
                />
              ))}
            </div >
          )
        }
      </div >
      <ConfirmDeleteModal
        open={confirmDeleteModalOpen}
        onOpenChange={setConfirmDeleteModalOpen}
        onCancel={() => setConfirmDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
      {
        viewingImage && (
          <ImageDetailView
            image={viewingImage}
            tab={viewingTab}
            setTab={setViewingTab}
            onClose={() => setViewingId(null)}
            onNext={nextImage ? () => setViewingId(nextImage.id) : undefined}
            onPrev={prevImage ? () => setViewingId(prevImage.id) : undefined}
          />
        )
      }
      <Toaster position="top-center" />
    </div >
  )
}

function GridController({
  gridCols,
  setGridCols,
  gridColsMin = 3,
  gridColsMax = 10
}: {
  gridCols: number;
  setGridCols: (gridCols: number) => void;
  gridColsMin?: number;
  gridColsMax?: number;
  gridColsDefault?: number;
}) {
  // Note: this slider is **reversed** by design, it is not a bug
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="cursor-pointer"
        onClick={() => setGridCols(Math.min(gridColsMax, gridCols + 1))}
      >
        <MinusIcon />
      </Button>
      <Slider
        value={[gridColsMax + gridColsMin - gridCols]}
        onValueChange={(value) => {
          setGridCols(gridColsMax + gridColsMin - value[0]);
        }}
        min={gridColsMin}
        max={gridColsMax}
        step={1}
        className="w-24 cursor-pointer"
      />
      {/* click plus icon, zoom in images, decrease grid cols */}
      <Button variant="ghost" size="icon" className="cursor-pointer"
        onClick={() => setGridCols(Math.max(gridColsMin, gridCols - 1))}
      >
        <PlusIcon />
      </Button>
    </div>
  );
}
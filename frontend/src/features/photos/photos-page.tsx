
import { useState } from 'react'
import { useRef } from 'react'

import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { MinusIcon, PlusIcon, SquareCheckIcon, LayoutGridIcon, Trash2Icon, PanelLeft, CloudUploadIcon, FilterIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardContext } from '../layout/dashboard-layout'
import { ImageDetailView } from '@/features/photos/image-detail-view'
import ConfirmDeleteModal from '@/features/photos/confirm-delete-modal'
import { useImages } from '@/features/photos/image-context'
import { usePhotoSelection } from './use-photo-selection'
import { PhotoCard } from './photo-card'
import { Badge } from '@/components/ui/badge'
import { TagFilterPanel } from '../tags/tags-filter-panel'
import { SlideshowModal } from './slideshow-modal'

export default function PhotosPage() {
  const { images: serverImages, uploadImages, deleteImages, tags } = useImages();
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

  // Slideshow State
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [slideshowStartIndex, setSlideshowStartIndex] = useState(0);

  // Tag Filter State
  const [openTagsFilter, setOpenTagsFilter] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const toggleTagFilter = (tagName: string) => {
    clearSelection();
    const newTags = new Set(selectedTags);
    if (newTags.has(tagName)) {
      newTags.delete(tagName);
    } else {
      newTags.add(tagName);
    }
    setSelectedTags(newTags);
  };

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derived Data
  const filteredImages = serverImages.filter(img => {
    if (selectedTags.size === 0) return true;
    // AND logic: image must have ALL selected tags
    return Array.from(selectedTags).every(tag => img.tags && img.tags.includes(tag));
  });

  const images = filteredImages.map((img, index) => ({
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
  }

  const handleDeleteImage = (imageId: string) => {
    setDeleteTargetIds(new Set([imageId]));
    setConfirmDeleteModalOpen(true);
  }

  const handleConfirmDelete = async () => {
    const deleteTargetArr = Array.from(deleteTargetIds);
    await deleteImages(deleteTargetArr);
    clearSelection();
  }

  const handleViewingOpen = (imageId: string, tag: "info" | "edit") => {
    setViewingTab(tag);
    setViewingId(imageId);
  }

  const handleSlideshow = (imageId: string) => {
    // Determine start index relative to the list of images we will show
    const index = imagesToDisplay.findIndex(img => img.id === imageId);
    setSlideshowStartIndex(index >= 0 ? index : 0);
    setSlideshowOpen(true);
  }

  // If selectedIds.size > 0, we show ONLY selected images in the slideshow.
  // Otherwise, we show ALL (filtered) images.
  const imagesToDisplay = selectedIds.size > 0
    ? images.filter(img => selectedIds.has(img.id))
    : images;


  return (
    <div className="flex flex-col min-h-screen">

      {/* Sticky Header Group */}
      <div className="sticky top-0 z-10 bg-background border-b">
        {/* Tool Bar */}
        <div className="flex flex-wrap items-center gap-2 p-4">
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

          <Button
            variant={openTagsFilter ? "secondary" : "ghost"}
            size="icon"
            className="cursor-pointer"
            onClick={() => setOpenTagsFilter(!openTagsFilter)}
          >
            <FilterIcon className={cn("w-5 h-5", selectedTags.size > 0 && "text-primary fill-primary")} />
          </Button>


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

        <TagFilterPanel
          open={openTagsFilter}
          tags={tags}
          selectedTags={selectedTags}
          onToggleTag={toggleTagFilter}
          onClearTags={() => setSelectedTags(new Set())}
        />
      </div>{/* End Sticky Header Group */}


      {
        /* Image Grid */
        images.length === 0 ? (
          <div className="px-6 py-4 flex-1 flex flex-col items-center justify-center">
            <p className="text-muted-foreground">No photos</p>
            <button className="text-primary underline-offset-4 hover:underline" onClick={handleUploadClick}>Upload</button>
          </div>
        ) : (
          <div className="px-6 py-4 flex-1">
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
                  onSlideshow={() => handleSlideshow(image.id)}
                />
              ))}
            </div >
          </div>
        )
      }

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

      <SlideshowModal
        open={slideshowOpen}
        onClose={() => setSlideshowOpen(false)}
        images={imagesToDisplay}
        initialIndex={slideshowStartIndex}
      />
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
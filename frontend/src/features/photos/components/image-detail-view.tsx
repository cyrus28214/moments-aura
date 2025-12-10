import { useState, useEffect } from "react";
import { XIcon, ChevronLeftIcon, ChevronRightIcon, InfoIcon, CalendarIcon, HashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoView } from "./photo";
import { cn } from "@/lib/utils";
import { type Image } from "@/api";
import { motion } from "framer-motion";

interface ImageDetailViewProps {
    image: Image;
    isOpen: boolean;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
    hasNext: boolean;
    hasPrev: boolean;
    token: string;
}

export const ImageDetailView = ({
    image,
    isOpen,
    onClose,
    onNext,
    onPrev,
    hasNext,
    hasPrev,
    token,
}: ImageDetailViewProps) => {
    const [showDetails, setShowDetails] = useState(true);

    // Handle keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft" && hasPrev) onPrev();
            if (e.key === "ArrowRight" && hasNext) onNext();
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, hasNext, hasPrev, onClose, onNext, onPrev]);

    // if (!isOpen) return null; // Controlled by AnimatePresence in parent

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="z-50 fixed inset-0 flex bg-background/95 backdrop-blur-sm"
        >
            {/* Main Image Area */}
            <div className="relative flex-1 flex items-center justify-center">
                {/* Top Controls */}
                <div className="absolute top-4 left-4 z-10">
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full bg-background/50 hover:bg-background/80">
                        <XIcon className="h-6 w-6" />
                    </Button>
                </div>
                <div className="absolute top-4 right-4 z-10">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowDetails(!showDetails)}
                        className="rounded-full bg-background/50 hover:bg-background/80"
                    >
                        <InfoIcon className="h-6 w-6" />
                    </Button>
                </div>

                {/* Navigation Buttons */}
                {hasPrev && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
                        <Button variant="ghost" size="icon" onClick={onPrev} className="rounded-full bg-background/50 hover:bg-background/80 h-12 w-12">
                            <ChevronLeftIcon className="h-8 w-8" />
                        </Button>
                    </div>
                )}
                {hasNext && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
                        <Button variant="ghost" size="icon" onClick={onNext} className="rounded-full bg-background/50 hover:bg-background/80 h-12 w-12">
                            <ChevronRightIcon className="h-8 w-8" />
                        </Button>
                    </div>
                )}

                {/* Image */}
                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                    <PhotoView
                        imageId={image.id}
                        token={token}
                        alt={`Photo ${image.id}`}
                        className="max-w-full max-h-full object-contain shadow-2xl"
                        showSkeleton={false}
                    />
                </div>
            </div>

            {/* Details Sidebar */}
            <div
                className={cn(
                    "w-s border-l bg-background transition-all duration-300 ease-in-out flex flex-col",
                    showDetails ? "translate-x-0" : "translate-x-full w-0 border-l-0 overflow-hidden"
                )}
            >
                <div className="p-6 space-y-6 min-w-80">
                    <h2 className="text-xl font-semibold">Details</h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center text-muted-foreground">
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                <span className="text-sm">Uploaded Date</span>
                            </div>
                            <p className="font-medium">
                                {new Date(image.uploaded_at * 1000).toLocaleString()}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center text-muted-foreground">
                                <HashIcon className="h-4 w-4 mr-2" />
                                <span className="text-sm">Image ID</span>
                            </div>
                            <p className="font-mono text-xs break-all text-muted-foreground">
                                {image.id}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center text-muted-foreground">
                                <HashIcon className="h-4 w-4 mr-2" />
                                <span className="text-sm">Hash</span>
                            </div>
                            <p className="font-mono text-xs break-all text-muted-foreground">
                                {image.image_hash}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useImageBlob } from "./image-context";

interface SlideshowModalProps {
    images: { id: string }[];
    initialIndex: number;
    open: boolean;
    onClose: () => void;
}

export function SlideshowModal({ images, initialIndex, open, onClose }: SlideshowModalProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    // Reset index when opening with a new initialIndex
    useEffect(() => {
        if (open) {
            setCurrentIndex(initialIndex);
        }
    }, [open, initialIndex]);

    // Auto-advance
    useEffect(() => {
        if (!open) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 3000); // 3 seconds per slide

        return () => clearInterval(timer);
    }, [open, images.length]);

    // Global click handler to close
    useEffect(() => {
        if (!open) return;

        const handleClick = () => onClose();
        window.addEventListener('click', handleClick);
        window.addEventListener('keydown', handleClick); // also close on key press

        return () => {
            window.removeEventListener('click', handleClick);
            window.removeEventListener('keydown', handleClick);
        };
    }, [open, onClose]);

    if (!open) return null;

    const currentImage = images[currentIndex];

    // Prevent clicks inside the modal from closing effectively IS handled by the global listener,
    // but the user requirement is "ANY click operation exits".
    // So we don't need `e.stopPropagation()`.

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm cursor-pointer"
                >
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                        {currentImage && (
                            <SlideshowImage imageId={currentImage.id} />
                        )}
                    </div>

                    {/* Optional: Progress indicator or controls could go here, but requirement says minimalist/exit on interaction */}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function SlideshowImage({ imageId }: { imageId: string }) {
    const { url } = useImageBlob(imageId);

    return (
        <motion.img
            key={imageId} // Key change triggers animation
            src={url}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="max-w-full max-h-full object-contain shadow-2xl drop-shadow-2xl"
        />
    );
}

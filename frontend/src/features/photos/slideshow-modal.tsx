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
    useEffect(() => {
        if (open) {
            setCurrentIndex(initialIndex);
        }
    }, [open, initialIndex]);

    useEffect(() => {
        if (!open) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 3000);

        return () => clearInterval(timer);
    }, [open, images.length]);

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    const currentImage = images[currentIndex];

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    key="modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onClick={onClose}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm cursor-pointer"
                >
                    <div className="relative w-full h-full flex items-center justify-center p-4">
                        <AnimatePresence initial={false}>
                            {currentImage && (
                                <SlideshowImage
                                    key={currentImage.id}
                                    imageId={currentImage.id}
                                />
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function SlideshowImage({ imageId }: { imageId: string }) {
    const { url } = useImageBlob(imageId);

    if (!url) return null;

    return (
        <motion.img
            src={url}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.0, ease: "easeInOut" }}
            className="absolute max-w-full max-h-full object-contain select-none"
            alt="Slideshow"
        />
    );
}
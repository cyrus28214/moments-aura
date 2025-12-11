import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { XIcon, PanelRightIcon, ChevronRightIcon, ChevronLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorState } from "./image-sidebar";
import { ImageSidebar } from "./image-sidebar";
import { type Image } from "@/api";
import { toast } from "sonner";
import { ImageCanvas } from "./image-canvas";
import { DiscardChangesModal } from "./discard-changes-modal";
import { useImageBlob, useImages } from "./image-context";

interface ImageDetailViewProps {
    image: Image;
    onClose: () => void;
    onNext?: () => void;
    onPrev?: () => void;
    tab: "info" | "edit";
    setTab: (tab: "info" | "edit") => void;
}

export const ImageDetailView = ({ image, onClose, onNext, onPrev, tab, setTab }: ImageDetailViewProps) => {
    const { uploadImages, addTag, removeTag } = useImages();
    const [showSidebar, setShowSidebar] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const { url: imageUrl } = useImageBlob(image.id);
    console.log({ source: "ImageDetailView", photo_id: image.id, url: imageUrl });

    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { state: editorState, update: updateEditor, reset: resetEditor, hasChanges } = useEditorState();

    useEffect(() => {
        resetEditor();
    }, [image.id, resetEditor]);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const handleActivity = () => {
            setShowControls(true);
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setShowControls(false);
            }, 2000);
        };

        window.addEventListener("mousemove", handleActivity);
        window.addEventListener("keydown", handleActivity);
        window.addEventListener("click", handleActivity);

        handleActivity();

        return () => {
            clearTimeout(timeoutId);
            window.removeEventListener("mousemove", handleActivity);
            window.removeEventListener("keydown", handleActivity);
            window.removeEventListener("click", handleActivity);
        };
    }, []);

    const controlCls = "cursor-pointer rounded-full shadow-md size-10 bg-background/80 hover:bg-background/95";
    const controlVariants = {
        visible: { opacity: 1, pointerEvents: "auto" as const },
        hidden: { opacity: 0, pointerEvents: "none" as const },
    };

    const [pendingAction, setPendingAction] = useState<"close" | "prev" | "next" | null>(null);

    const hasPrev = !!onPrev;
    const hasNext = !!onNext;

    const performAction = (action: "close" | "prev" | "next") => {
        switch (action) {
            case "close":
                onClose();
                break;
            case "prev":
                onPrev?.();
                break;
            case "next":
                onNext?.();
                break;
        }
    }

    const handleActionRequest = (action: "close" | "prev" | "next") => {
        if (hasChanges()) {
            setPendingAction(action);
            return;
        }
        performAction(action);
    }

    const handleDiscardConfirm = () => {
        if (pendingAction) {
            performAction(pendingAction);
            setPendingAction(null);
        }
    };

    const handleKeepEditing = () => {
        setPendingAction(null);
    };

    const handleSave = async () => {
        const canvas = canvasRef.current;
        if (!canvas) {
            toast.error("Canvas not ready");
            return;
        }

        const toastId = toast.loading("Processing image...");
        const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", 1.0)
        );
        if (!blob) {
            toast.dismiss(toastId);
            toast.error("Failed to generate image blob");
            return;
        }

        const fileName = `edited-${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: "image/jpeg" });
        await uploadImages([file]);
        toast.success("Saved as new image!");
        toast.dismiss(toastId);
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="z-50 fixed inset-0 flex bg-background/95 backdrop-blur-sm"
        >
            {/* Main Area */}
            <div className="relative flex-1 flex overflow-hidden">

                {/* Controls Overlay: Close Button */}
                <motion.div
                    className="absolute top-4 left-4 z-20"
                    variants={controlVariants}
                    animate={showControls ? "visible" : "hidden"}
                    transition={{ duration: 0.3 }}
                >
                    <Button variant="secondary" onClick={() => handleActionRequest("close")} className={controlCls}><XIcon /></Button>
                </motion.div>

                {/* Controls Overlay: Prev Button */}
                {
                    hasPrev && (
                        <motion.div
                            className="absolute -translate-y-1/2 top-1/2 left-4 z-20"
                            variants={controlVariants}
                            animate={showControls ? "visible" : "hidden"}
                            transition={{ duration: 0.3 }}
                        >
                            <Button variant="secondary" onClick={() => handleActionRequest("prev")} className={controlCls}><ChevronLeftIcon /></Button>
                        </motion.div>
                    )
                }

                {/* Controls Overlay: Next Button */}
                {
                    hasNext && (
                        <motion.div
                            className="absolute -translate-y-1/2 top-1/2 right-4 z-20"
                            variants={controlVariants}
                            animate={showControls ? "visible" : "hidden"}
                            transition={{ duration: 0.3 }}
                        >
                            <Button variant="secondary" onClick={() => handleActionRequest("next")} className={controlCls}><ChevronRightIcon /></Button>
                        </motion.div>
                    )
                }

                {/* Sidebar Toggle */}
                <motion.div
                    className="absolute top-4 right-4 z-20"
                    variants={controlVariants}
                    animate={showControls ? "visible" : "hidden"}
                    transition={{ duration: 0.3 }}
                >
                    <Button variant="secondary" onClick={() => setShowSidebar(!showSidebar)} className={controlCls}><PanelRightIcon /></Button>
                </motion.div>

                {/* Viewer */}
                <div className="flex-1 bg-black/80 flex items-center justify-center">
                    {
                        imageUrl && (
                            <ImageCanvas className="max-h-full max-w-full" ref={canvasRef} imageSrc={imageUrl} brightness={editorState.brightness} contrast={editorState.contrast} saturation={editorState.saturation} />
                        )
                    }
                </div>
            </div >

            {/* Sidebar */}
            <ImageSidebar
                image={image}
                open={showSidebar}
                tab={tab}
                setTab={setTab}
                editorState={editorState}
                onUpdateState={updateEditor}
                onReset={resetEditor}
                onSave={handleSave}
                onAddTag={(tag: string) => addTag(image.id, tag)}
                onRemoveTag={(tag: string) => removeTag(image.id, tag)}
            />

            {/* Modal */}
            <DiscardChangesModal
                open={pendingAction !== null}
                onDiscard={handleDiscardConfirm}
                onKeepEditing={handleKeepEditing}
            />
        </motion.div >
    );
};
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion"; // 确保引入 AnimatePresence (虽然这里只用普通 motion 也可以)
import { XIcon, PanelRightIcon, MaximizeIcon, ChevronRightIcon, ChevronLeftIcon, Disc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorState } from "./image-sidebar";
import { ImageSidebar } from "./image-sidebar";
import { type Image, get_image_content } from "@/api";
import { toast } from "sonner";
import { ImageCanvas } from "./image-canvas";
import { DiscardChangesModal } from "./discard-changes-modal";

interface ImageDetailViewProps {
    image: Image;
    onClose: () => void;
    token: string;
    onNext?: () => void;
    onPrev?: () => void;
}

export const ImageDetailView = ({ image, onClose, token, onNext, onPrev }: ImageDetailViewProps) => {
    const [showSidebar, setShowSidebar] = useState(true);
    const [activeTab, setActiveTab] = useState("info");
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [showControls, setShowControls] = useState(true);
    const [showDiscardModal, setShowDiscardModal] = useState(false);

    const { state: editorState, update: updateEditor, reset: resetEditor, hasChanges } = useEditorState();

    useEffect(() => {
        let active = true;
        const load = async () => {
            try {
                const url = await get_image_content(image.id, token);
                if (active) setImageUrl(url);
            } catch (e) { toast.error("Failed to load image"); }
        };
        load();
        resetEditor();
        return () => { active = false; };
    }, [image.id, token, resetEditor]);

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

    const controlCls = "rounded-full shadow-md size-10 bg-background/80 hover:bg-background/95";
    const controlVariants = {
        visible: { opacity: 1, pointerEvents: "auto" as const },
        hidden: { opacity: 0, pointerEvents: "none" as const },
    };

    const handleClose = () => {
        // if there is change unsaved
        if (hasChanges()) {
            setShowDiscardModal(true);
            return;
        }
        onClose();
    }

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
                    <Button variant="secondary" onClick={handleClose} className={controlCls}><XIcon /></Button>
                </motion.div>

                {/* Controls Overlay: Prev Button */}
                {
                    onPrev && (
                        <motion.div
                            className="absolute -translate-y-1/2 top-1/2 left-4 z-20"
                            variants={controlVariants}
                            animate={showControls ? "visible" : "hidden"}
                            transition={{ duration: 0.3 }}
                        >
                            <Button variant="secondary" onClick={onPrev} className={controlCls}><ChevronLeftIcon /></Button>
                        </motion.div>
                    )
                }

                {/* Controls Overlay: Next Button */}
                {
                    onNext && (
                        <motion.div
                            className="absolute -translate-y-1/2 top-1/2 right-4 z-20"
                            variants={controlVariants}
                            animate={showControls ? "visible" : "hidden"}
                            transition={{ duration: 0.3 }}
                        >
                            <Button variant="secondary" onClick={onNext} className={controlCls}><ChevronRightIcon /></Button>
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
                            <ImageCanvas imageSrc={imageUrl} brightness={editorState.brightness} contrast={editorState.contrast} saturation={editorState.saturation} />
                        )
                    }
                </div>
            </div >

            {/* Sidebar */}
            < ImageSidebar
                image={image}
                isOpen={showSidebar}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                editorState={editorState}
                onUpdateState={updateEditor}
                onReset={resetEditor}
            />

            {/* Modal */}
            <DiscardChangesModal
                open={showDiscardModal}
                onOpenChange={open => setShowDiscardModal(open)}
                onDiscard={onClose}
                onKeepEditing={() => setShowDiscardModal(false)}
            />
        </motion.div >
    );
};
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    MoreVerticalIcon, HeartIcon, SquareMousePointerIcon,
    EditIcon, InfoIcon, Trash2Icon
} from 'lucide-react';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useImageBlob } from './image-context';

interface PhotoCardProps {
    image: {
        id: string;
        width: number;
        height: number;
        tags?: string[];
        selected: boolean;
    };
    coverMode: boolean;
    isSelectMode: boolean;

    onClick: () => void;
    onToggleSelect: () => void;
    onEdit: () => void;
    onInfo: () => void;
    onDelete: () => void;
}

export const PhotoCard = ({
    image,
    coverMode,
    isSelectMode,
    onClick,
    onToggleSelect,
    onEdit,
    onInfo,
    onDelete
}: PhotoCardProps) => {
    const { url } = useImageBlob(image.id);

    return (
        <motion.div layout className="aspect-square flex items-center justify-center">
            <div
                className="relative group max-w-full max-h-full"
                style={{
                    aspectRatio: coverMode ? '1 / 1' : `${image.width} / ${image.height}`,
                }}
            >
                <div
                    onClick={onClick}
                    className="w-full h-full relative"
                >
                    <motion.img
                        src={url}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                            "block cursor-pointer shadow-sm rounded-sm w-full h-full transition-all",
                            image.selected && "ring-4 ring-primary opacity-80",
                            coverMode ? "object-cover" : "object-contain"
                        )}
                    />
                </div>

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" className="size-8 cursor-pointer rounded-full shadow-md bg-background/80 hover:bg-background/95">
                                <MoreVerticalIcon className="size-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { /* Favorite */ }}>
                                <HeartIcon className="w-4 h-4 mr-2" />
                                Favorite
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onToggleSelect}>
                                <SquareMousePointerIcon className="w-4 h-4 mr-2" />
                                {image.selected ? "Unselect" : "Select"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onEdit}>
                                <EditIcon className="w-4 h-4 mr-2" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onInfo}>
                                <InfoIcon className="w-4 h-4 mr-2" />
                                View Info
                            </DropdownMenuItem>
                            {!isSelectMode && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={onDelete}>
                                        <Trash2Icon className="w-4 h-4 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {image.tags && image.tags.length > 0 && (
                    <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {image.tags.map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 text-xs bg-black/50 text-white rounded-md backdrop-blur-sm">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
};
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { RotateCcwIcon } from "lucide-react";

interface Tag {
    name: string;
    count: number;
}

interface TagFilterPanelProps {
    open: boolean;
    tags: Tag[];
    selectedTags: Set<string>;
    onToggleTag: (tagName: string) => void;
    onClearTags: () => void;
}

export function TagFilterPanel({
    open,
    tags,
    selectedTags,
    onToggleTag,
    onClearTags
}: TagFilterPanelProps) {
    return (
        <AnimatePresence initial={false}>
            {open && (
                <motion.div
                    key="filter-panel"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden bg-background"
                >
                    {/* Padding 放在内部容器，避免 height:0 时撑开高度 */}
                    <div className="px-4 pb-4 pt-2">

                        {/* Tags List */}
                        <div className="flex flex-wrap gap-2">
                            {tags.sort((a, b) => b.count - a.count).map(tag => {
                                const isSelected = selectedTags.has(tag.name);
                                return (
                                    <Badge
                                        key={tag.name}
                                        onClick={() => onToggleTag(tag.name)}
                                        variant={isSelected ? "default" : "secondary"}
                                        className={cn(
                                            "text-sm h-9 flex items-center justify-center gap-2 px-4 py-2 rounded-md cursor-pointer"
                                        )}
                                    >
                                        <span>{tag.name}</span>
                                        <span className={cn("opacity-70", isSelected ? "text-primary-foreground/80" : "text-muted-foreground")}>
                                            {tag.count}
                                        </span>
                                    </Badge>
                                );
                            })}
                            {tags.length === 0 && (
                                <div className="text-sm text-muted-foreground p-2">No tags available</div>
                            )}
                            {selectedTags.size > 0 && (
                                <Button variant="ghost" size="icon" className="cursor-pointer" onClick={onClearTags}>
                                    <RotateCcwIcon />
                                </Button>
                            )}
                        </div>

                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
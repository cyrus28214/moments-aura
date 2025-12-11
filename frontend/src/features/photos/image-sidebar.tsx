import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { CalendarIcon, SunIcon, ContrastIcon, DropletIcon, RotateCcwIcon, SaveIcon, TagIcon, PlusIcon, XIcon, ImageIcon, Wand2Icon, Loader2Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Sheet,
    SheetContent,
    SheetTitle,
} from "@/components/ui/sheet"

import { type Image, recommend_tags } from "@/api";
import { cn, formatTimestamp } from "@/lib/utils";
import { isEqual } from "lodash";
import { useDashboardContext } from "../layout/dashboard-layout";
import { useAuth } from "../auth/hooks";
import { toast } from "sonner";

import { useState, useCallback, useEffect } from "react";

export interface EditorState {
    brightness: number;
    contrast: number;
    saturation: number;
}

export const useEditorState = () => {
    const initialState: EditorState = {
        brightness: 100,
        contrast: 100,
        saturation: 100,
    };

    const [state, setState] = useState<EditorState>(initialState);

    const update = (state: Partial<EditorState>) => {
        setState((prev) => ({ ...prev, ...state }));
    };

    const reset = useCallback(() => setState(initialState), []);

    const hasChanges = useCallback(() => {
        return !isEqual(state, initialState);
    }, [state]);

    return { state, update, reset, hasChanges };
};

interface ImageSidebarProps {
    image: Image;
    open: boolean;
    onOpenChange?: (open: boolean) => void;
    tab: "info" | "edit";
    setTab: (tab: "info" | "edit") => void;
    editorState: EditorState;
    onUpdateState: (state: Partial<EditorState>) => void;
    onReset: () => void;
    onSave: () => void;
    onAddTag: (tag: string) => void;
    onRemoveTag: (tag: string) => void;
    isMobile?: boolean;
}

const ImageSidebarContent = ({
    image, tab, setTab, editorState, onUpdateState, onReset, onSave, onAddTag, onRemoveTag
}: Omit<ImageSidebarProps, 'open' | 'onOpenChange' | 'isMobile'>) => {
    const [newTag, setNewTag] = useState("");
    const { features } = useDashboardContext();
    const { token } = useAuth();
    const [isRecommending, setIsRecommending] = useState(false);
    const [recommendedTags, setRecommendedTags] = useState<string[]>([]);

    useEffect(() => {
        setRecommendedTags([]);
        setIsRecommending(false);
    }, [image.id]);

    const onTabChange = (tab: string) => {
        if (tab === "info" || tab == "edit") {
            setTab(tab);
        }
    }

    return (
        <Tabs value={tab} onValueChange={onTabChange} className="flex-1 flex flex-col h-full">
            <div className="px-6 pt-6 pb-2">
                <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger className="cursor-pointer" value="info">Info</TabsTrigger>
                    <TabsTrigger className="cursor-pointer" value="edit">Edit</TabsTrigger>
                </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* INFO TAB */}
                <TabsContent value="info" className="p-6 space-y-6 m-0">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <span className="text-sm text-muted-foreground flex gap-2 items-center"><CalendarIcon className="w-4 h-4" /> Uploaded</span>
                            <p className="font-medium">{formatTimestamp(image.uploaded_at)}</p>
                        </div>

                        <div className="space-y-2">
                            <span className="text-sm text-muted-foreground flex gap-2 items-center"><ImageIcon className="w-4 h-4" /> Resolution</span>
                            <p className="font-medium">{image.width} x {image.height}</p>
                        </div>

                        <div className="space-y-2">
                            <span className="text-sm text-muted-foreground flex gap-2 items-center"><TagIcon className="w-4 h-4" /> Tags</span>
                            <div className="flex flex-wrap gap-2">
                                {image.tags?.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-sm px-2 py-1 flex items-center gap-1 rounded-md">
                                        {tag}
                                        <button onClick={() => onRemoveTag(tag)} className="hover:text-destructive"><XIcon className="w-4 h-4" /></button>
                                    </Badge>
                                ))}
                                <div className="flex items-center gap-2">
                                    <Input
                                        className="h-7 w-24 px-2 text-sm"
                                        placeholder="Add..."
                                        value={newTag}
                                        onChange={e => setNewTag(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' && newTag.trim()) {
                                                onAddTag(newTag.trim());
                                                setNewTag('');
                                            }
                                        }}
                                    />
                                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { if (newTag.trim()) { onAddTag(newTag.trim()); setNewTag(''); } }}>
                                        <PlusIcon className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                        {/* ... 其他 Info ... */}

                        {/* AI Recommendations */}
                        {features.includes('ai') && (
                            <div className="space-y-2 border-t pt-4">
                                <div className="flex items-center justify-between text-indigo-500">
                                    <span className="text-sm flex gap-2 items-center"><Wand2Icon className="w-4 h-4" /> AI Recommended Tags</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        disabled={isRecommending}
                                        onClick={async () => {
                                            if (!token) return;
                                            setIsRecommending(true);
                                            setRecommendedTags([]);
                                            try {
                                                const res = await recommend_tags(image.id, token);
                                                // Filter out tags that are already present
                                                const newTags = res.tags.filter((t: string) => !image.tags?.includes(t));
                                                setRecommendedTags(newTags);
                                                if (newTags.length === 0) {
                                                    toast.info("No new tags recommended");
                                                }
                                            } catch (e) {
                                                console.error(e);
                                                toast.error("Failed to get recommendations");
                                            } finally {
                                                setIsRecommending(false);
                                            }
                                        }}
                                    >
                                        {isRecommending ? <Loader2Icon className="w-4 h-4 animate-spin" /> : "Generate"}
                                    </Button>
                                </div>

                                {recommendedTags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 animate-in fade-in zoom-in duration-300">
                                        {recommendedTags.map(tag => (
                                            <Badge
                                                key={tag}
                                                variant="outline"
                                                className="cursor-pointer hover:bg-indigo-500 hover:text-primary-foreground transition-colors px-2 py-1 flex items-center gap-1 rounded-md text-sm"
                                                onClick={() => {
                                                    onAddTag(tag);
                                                    setRecommendedTags(prev => prev.filter(t => t !== tag));
                                                }}
                                            >
                                                <PlusIcon className="w-3 h-3 mr-1" />
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* EDIT TAB */}
                <TabsContent value="edit" className="p-6 m-0 space-y-6">

                    {/* Tools
                    <div className="flex gap-2 justify-center bg-muted/30 p-2 rounded-lg">
                            <Button variant={editorState.isCropping ? "default" : "outline"} size="icon" onClick={onToggleCrop}><CropIcon className="w-4 h-4"/></Button>
                            <Button variant="outline" size="icon" onClick={onRotate}><RotateCwIcon className="w-4 h-4"/></Button>
                    </div> */}

                    {/* Sliders */}
                    <div className="space-y-4">
                        <SliderControl label="Brightness" icon={<SunIcon className="w-4 h-4" />} value={editorState.brightness} onChange={(v: number) => onUpdateState({ brightness: v })} />
                        <SliderControl label="Contrast" icon={<ContrastIcon className="w-4 h-4" />} value={editorState.contrast} onChange={(v: number) => onUpdateState({ contrast: v })} />
                        <SliderControl label="Saturation" icon={<DropletIcon className="w-4 h-4" />} value={editorState.saturation} onChange={(v: number) => onUpdateState({ saturation: v })} />
                    </div>

                    <div className="space-y-4">
                        <Button variant="secondary" className="w-full cursor-pointer" onClick={onReset}><RotateCcwIcon className="w-4 h-4 mr-2" /> Reset</Button>
                        <Button variant="default" className="w-full cursor-pointer" onClick={onSave}><SaveIcon className="w-4 h-4 mr-2" /> Save & Exit</Button>
                    </div>
                </TabsContent>
            </div>
        </Tabs>
    );
};


export const ImageSidebar = (props: ImageSidebarProps) => {
    const { open, onOpenChange, isMobile, ...contentProps } = props;

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={onOpenChange}>
                <SheetContent side="right" className="p-0 w-80 sm:w-96">
                    <SheetTitle className="sr-only">Edit Image</SheetTitle>
                    <ImageSidebarContent {...contentProps} />
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <div className={cn(
            "w-md border-l bg-background transition-all duration-300 ease-in-out flex flex-col h-full",
            open ? "translate-x-0" : "translate-x-full w-0 border-l-0 overflow-hidden"
        )}>
            <ImageSidebarContent {...contentProps} />
        </div>
    );
};

const SliderControl = ({ label, icon, value, onChange }: any) => (
    <div className="space-y-3">
        <div className="flex justify-between">
            <label className="text-sm font-medium flex gap-2 items-center">{icon} {label}</label>
            <span className="text-xs text-muted-foreground">{value}%</span>
        </div>
        <Slider className="cursor-pointer" value={[value]} min={0} max={200} onValueChange={([v]) => onChange(v)} />
    </div>
);
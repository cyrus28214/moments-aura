import { AlertTriangleIcon } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const DiscardChangesModal = ({
    open,
    onOpenChange,
    onKeepEditing,
    onDiscard
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onKeepEditing: () => void;
    onDiscard: () => void;
}) => {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-[425px]">
                <AlertDialogHeader className="flex flex-col items-center gap-2">
                    <div className="flex size-12 items-center justify-center p-3 mb-2">
                        <AlertTriangleIcon className="size-6 text-amber-600" />
                    </div>
                    <AlertDialogTitle className="text-center">
                        Unsaved Changes
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                        You have unsaved changes. If you leave now, these changes will be lost.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="sm:justify-center sm:space-x-4 mt-4 w-full flex-row gap-2">
                    <AlertDialogCancel
                        onClick={onKeepEditing}
                        className="flex-1 mt-0"
                    >
                        Keep Editing
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onDiscard();
                        }}
                        className={cn(buttonVariants({ variant: "destructive" }), "flex-1")}
                    >
                        Discard & Leave
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
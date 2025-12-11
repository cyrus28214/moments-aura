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
    onKeepEditing,
    onDiscard
}: {
    open: boolean;
    onKeepEditing: () => void;
    onDiscard: () => void;
}) => {
    return (
        <AlertDialog open={open}>
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
                        className="flex-1 mt-0 cursor-pointer"
                    >
                        Keep Editing
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onDiscard}
                        className={cn(buttonVariants({ variant: "destructive" }), "flex-1 cursor-pointer")}
                    >
                        Discard & Leave
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"
import { Trash2Icon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ConfirmDeleteModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCancel: () => void
    onConfirm: () => void
}

const ConfirmDeleteModal = ({
    open,
    onOpenChange,
    onCancel,
    onConfirm
}: ConfirmDeleteModalProps) => {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="sm:max-w-[425px]">

                <AlertDialogHeader className="flex flex-col items-center gap-2">
                    <div className="flex size-12 items-center justify-center p-3 mb-2">
                        <Trash2Icon className="size-6 text-red-600" />
                    </div>
                    <AlertDialogTitle className="text-center">
                        Are you sure you want to delete?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                        This operation cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>


                <AlertDialogFooter className="sm:justify-center sm:space-x-4 mt-4 w-full flex-row gap-2">
                    <AlertDialogCancel
                        onClick={onCancel}
                        className="flex-1 mt-0"
                    >
                        Cancel
                    </AlertDialogCancel>

                    <AlertDialogAction
                        onClick={() => {
                            onConfirm();
                        }}
                        className={cn(buttonVariants({ variant: "destructive" }), "flex-1")}
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>

            </AlertDialogContent>
        </AlertDialog>
    )
}

export default ConfirmDeleteModal
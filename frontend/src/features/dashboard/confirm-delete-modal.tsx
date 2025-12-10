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

                {/* Header 区域：包含图标、标题和描述 */}
                <AlertDialogHeader className="flex flex-col items-center gap-2">
                    <div className="flex size-12 items-center justify-center p-3 mb-2">
                        <Trash2Icon className="size-6 text-red-600" />
                    </div>
                    <AlertDialogTitle className="text-center">
                        Are you sure you want to delete?
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                        This operation cannot be undone. This will permanently delete the images you have selected.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {/* Footer 区域：包含操作按钮 */}
                <AlertDialogFooter className="sm:justify-center sm:space-x-4 mt-4 w-full flex-row gap-2">
                    {/* Cancel 按钮：会自动处理关闭逻辑 */}
                    <AlertDialogCancel
                        onClick={onCancel}
                        className="flex-1 mt-0"
                    >
                        Cancel
                    </AlertDialogCancel>

                    {/* Action 按钮：用于确认操作 */}
                    {/* 使用 buttonVariants 来应用 destructive (红色警告) 样式 */}
                    <AlertDialogAction
                        onClick={(e) => {
                            // 阻止默认关闭行为，直到 onConfirm 执行完毕（如果它是异步的）
                            // 这里假设 onConfirm 是同步的，或者外部会处理 loading 状态
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
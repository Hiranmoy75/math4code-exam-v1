"use client";

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

interface DeleteModuleDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    moduleTitle: string;
}

export function DeleteModuleDialog({ open, onOpenChange, onConfirm, moduleTitle }: DeleteModuleDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="dark:bg-[#161b22] dark:border-slate-800">
                <AlertDialogHeader>
                    <AlertDialogTitle className="dark:text-white">Delete Module</AlertDialogTitle>
                    <AlertDialogDescription className="dark:text-slate-400">
                        Are you sure you want to delete "{moduleTitle}"? This will also delete all lessons within this module.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="dark:bg-transparent dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            onConfirm();
                            onOpenChange(false);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

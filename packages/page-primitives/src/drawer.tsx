import { ReactNode } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
    SheetTrigger,
} from "./components/ui/sheet";
import { cn } from "./lib/utils";
import type { ThemeStyle } from "@courselit/page-models";

interface DrawerProps {
    trigger: ReactNode;
    children: ReactNode;
    side?: "left" | "right" | "top" | "bottom";
    open: boolean;
    setOpen: (open: boolean) => void;
    title: string;
    description: string;
    style?: React.CSSProperties;
    className?: string;
    theme?: ThemeStyle;
}

export function Drawer({
    trigger,
    children,
    side = "left",
    open,
    setOpen,
    title,
    description,
    style,
    className = "",
    theme,
}: DrawerProps) {
    const classes = cn(
        // Base styles
        "courselit-theme",
        className,
    );

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>{trigger}</SheetTrigger>
            <SheetContent side={side} style={style} className={classes}>
                <SheetTitle className="sr-only">{title}</SheetTitle>
                <SheetDescription className="sr-only">
                    {description}
                </SheetDescription>
                {children}
            </SheetContent>
        </Sheet>
    );
}

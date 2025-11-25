"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bold, Italic, List, ListOrdered, Type, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
}

export function RichTextEditor({ value, onChange, className, placeholder }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Initialize content
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            if (editorRef.current.innerHTML === "" || value !== editorRef.current.innerHTML) {
                editorRef.current.innerHTML = value;
            }
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            const html = editorRef.current.innerHTML;
            onChange(html === "<br>" ? "" : html);
        }
    };

    const execCommand = (command: string, value: string | undefined = undefined) => {
        // Ensure editor has focus before executing command
        if (editorRef.current) {
            editorRef.current.focus();
        }
        document.execCommand(command, false, value);
        handleInput(); // Trigger update after command
    };

    return (
        <div className={cn("flex flex-col border rounded-md overflow-hidden bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2", className)}>
            <div className="flex items-center gap-1 p-1 border-b bg-muted/50 flex-wrap">
                <ToolbarButton
                    onClick={() => execCommand("bold")}
                    icon={<Bold className="h-4 w-4" />}
                    title="Bold"
                />
                <ToolbarButton
                    onClick={() => execCommand("italic")}
                    icon={<Italic className="h-4 w-4" />}
                    title="Italic"
                />
                <div className="w-px h-4 bg-border mx-1" />
                <ToolbarButton
                    onClick={() => execCommand("insertUnorderedList")}
                    icon={<List className="h-4 w-4" />}
                    title="Bullet List"
                />
                <ToolbarButton
                    onClick={() => execCommand("insertOrderedList")}
                    icon={<ListOrdered className="h-4 w-4" />}
                    title="Numbered List"
                />
                <div className="w-px h-4 bg-border mx-1" />
                <ToolbarButton
                    onClick={() => execCommand("formatBlock", "H3")}
                    icon={<Type className="h-4 w-4" />}
                    title="Heading"
                />
                <div className="w-px h-4 bg-border mx-1" />
                <div className="flex items-center gap-1 px-2">
                    <Palette className="h-4 w-4 text-muted-foreground" />
                    <input
                        type="color"
                        className="h-6 w-8 p-0 border-0 bg-transparent cursor-pointer"
                        onChange={(e) => execCommand("foreColor", e.target.value)}
                        title="Text Color"
                    />
                </div>
            </div>
            <div
                ref={editorRef}
                className="flex-1 p-4 min-h-[200px] outline-none prose dark:prose-invert max-w-none overflow-y-auto"
                contentEditable
                onInput={handleInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                data-placeholder={placeholder}
            />
            <style>{`
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    pointer-events: none;
                }
                /* Ensure lists are visible inside the editor */
                .prose ul {
                    list-style-type: disc !important;
                    padding-left: 1.5em !important;
                    margin-top: 0.5em !important;
                    margin-bottom: 0.5em !important;
                }
                .prose ol {
                    list-style-type: decimal !important;
                    padding-left: 1.5em !important;
                    margin-top: 0.5em !important;
                    margin-bottom: 0.5em !important;
                }
                .prose li {
                    display: list-item !important;
                }
                /* Ensure colors from execCommand work */
                .prose font[color], .prose span[style*="color"] {
                    color: inherit !important; /* Let the inline style win */
                }
            `}</style>
        </div>
    );
}

function ToolbarButton({ onClick, icon, title }: { onClick: () => void; icon: React.ReactNode; title: string }) {
    return (
        <Button
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
            onClick={(e) => {
                e.preventDefault();
                onClick();
            }}
            className="h-8 w-8 p-0 hover:bg-muted"
            title={title}
        >
            {icon}
        </Button>
    );
}

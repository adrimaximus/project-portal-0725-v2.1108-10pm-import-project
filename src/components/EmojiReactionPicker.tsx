import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SmilePlus } from "lucide-react";
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useTheme } from "@/contexts/ThemeProvider";
import { useState } from "react";

interface EmojiReactionPickerProps {
    onSelect: (emoji: string) => void;
}

export const EmojiReactionPicker = ({ onSelect }: EmojiReactionPickerProps) => {
    const { mode } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    const handlePickerSelect = (emoji: any) => {
        onSelect(emoji.native);
        setIsOpen(false);
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon">
                    <SmilePlus className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-auto border-0">
                <Picker 
                    data={data} 
                    onEmojiSelect={handlePickerSelect}
                    theme={mode === 'system' ? 'auto' : mode}
                    previewPosition="none"
                />
            </PopoverContent>
        </Popover>
    )
}
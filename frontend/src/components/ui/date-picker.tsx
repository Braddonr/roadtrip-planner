import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
  date?: Date;
  onDateChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Add custom CSS to override hover styles
  React.useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      .rdp-custom .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
        background-color: #f3f4f6 !important;
        color: #111827 !important;
      }
      .rdp-custom .rdp-day:hover:not([disabled]):not(.rdp-day_selected) {
        background-color: #f3f4f6 !important;
        color: #111827 !important;
      }
      .rdp-custom .rdp-button:focus:not([disabled]):not(.rdp-day_selected) {
        background-color: #f3f4f6 !important;
        color: #111827 !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <DayPicker
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            onDateChange?.(selectedDate);
            setOpen(false);
          }}
          disabled={(date) => date < new Date()}
          initialFocus
          styles={{
            day: {
              color: "#111827",
              backgroundColor: "transparent",
            },
            day_selected: {
              backgroundColor: "#2563eb",
              color: "white",
            },
            day_today: {
              backgroundColor: "#f3f4f6",
              color: "#111827",
              fontWeight: "600",
            },
            button: {
              backgroundColor: "transparent",
              border: "none",
            },
          }}
          modifiersStyles={{
            selected: {
              backgroundColor: "#2563eb",
              color: "white",
            },
            today: {
              backgroundColor: "#f3f4f6",
              color: "#111827",
              fontWeight: "600",
            },
          }}
          className="rdp-custom"
        />
      </PopoverContent>
    </Popover>
  );
}

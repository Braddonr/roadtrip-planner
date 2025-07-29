import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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

  console.log("DatePicker rendered with:", { date, placeholder, disabled, open });

  return (
    <Popover 
      open={open} 
      onOpenChange={(newOpen) => {
        console.log("Popover open state changing:", { from: open, to: newOpen });
        setOpen(newOpen);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
          disabled={disabled}
          onClick={() => {
            console.log("DatePicker button clicked");
          }}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0 z-[60]" 
        align="start"
        onClick={(e) => {
          console.log("PopoverContent clicked:", e.target);
          e.stopPropagation();
        }}
        onPointerDownOutside={(e) => {
          console.log("PopoverContent pointer down outside:", e.target);
        }}
      >
        <div 
          className="relative"
          onClick={(e) => {
            console.log("Calendar container clicked:", e.target);
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            console.log("Calendar container mouse down:", e.target);
          }}
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selectedDate) => {
              console.log("🎯 Calendar onSelect triggered:", selectedDate);
              onDateChange?.(selectedDate);
              setOpen(false);
            }}
            onDayClick={(day, modifiers) => {
              console.log("🖱️ Calendar onDayClick triggered:", { day, modifiers });
            }}
            disabled={(date) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const checkDate = new Date(date);
              checkDate.setHours(0, 0, 0, 0);
              const isDisabled = checkDate < today;
              console.log("Date disabled check:", { date: checkDate, today, isDisabled });
              return isDisabled;
            }}
            initialFocus
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

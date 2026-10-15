import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaults = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: cn("w-full", defaults.root),
        months: cn("relative flex flex-col gap-4 sm:flex-row", defaults.months),
        month: cn("flex w-full flex-col gap-3", defaults.month),
        nav: cn("absolute inset-x-0 top-0 flex w-full items-center justify-between", defaults.nav),
        button_previous: cn(buttonVariants({ variant: "ghost" }), "size-8 p-0 select-none", defaults.button_previous),
        button_next: cn(buttonVariants({ variant: "ghost" }), "size-8 p-0 select-none", defaults.button_next),
        month_caption: cn("flex h-8 w-full items-center justify-center", defaults.month_caption),
        caption_label: cn("text-sm font-medium select-none", defaults.caption_label),
        weekdays: cn("flex", defaults.weekdays),
        weekday: cn("flex-1 rounded-md text-[0.8rem] font-normal text-muted-foreground select-none", defaults.weekday),
        week: cn("mt-1 flex w-full", defaults.week),
        day: cn("group/day relative h-10 w-full flex-1 p-0 text-center select-none", defaults.day),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "relative size-10 w-full rounded-xl p-0 font-normal group-data-[today=true]/day:font-semibold group-data-[today=true]/day:ring-1 group-data-[today=true]/day:ring-primary/50 group-data-[selected=true]/day:bg-primary group-data-[selected=true]/day:text-primary-foreground group-data-[selected=true]/day:hover:bg-primary group-data-[selected=true]/day:after:bg-primary-foreground",
          defaults.day_button,
        ),
        today: cn(defaults.today),
        outside: cn("text-muted-foreground/50", defaults.outside),
        disabled: cn("text-muted-foreground opacity-50", defaults.disabled),
        hidden: cn("invisible", defaults.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("size-4", className)} />
          ) : (
            <ChevronRight className={cn("size-4", className)} />
          ),
      }}
      {...props}
    />
  )
}

export { Calendar }

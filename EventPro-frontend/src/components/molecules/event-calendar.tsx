import { useMemo, useState, type FormEvent } from "react"
import { format, isSameDay } from "date-fns"
import { Pin, Plus, X } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { useCalendarNotes } from "@/hooks/use-calendar-notes"
import { notify } from "@/lib/notify"

type CalendarEvent = { event_name?: string; event_date?: { date_value?: string }; [key: string]: unknown }

function toDate(value?: string) {
    if (!value) return null
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
}

const DOT = "[&>button]:before:absolute [&>button]:before:bottom-1 [&>button]:before:size-1 [&>button]:before:rounded-full [&>button]:before:content-['']"

/** shadcn calendar: dots mark event days (blue) and personal notes (amber); the chosen day's events and notes are listed below. */
export default function EventCalendar<T extends CalendarEvent>({
    events,
    userId,
    onSelectEvent,
}: {
    events: T[]
    userId?: string
    onSelectEvent?: (event: T) => void
}) {
    const [selected, setSelected] = useState<Date | undefined>(new Date())
    const [month, setMonth] = useState<Date>(new Date())
    const [text, setText] = useState("")
    const [open, setOpen] = useState(false)
    const [anchor, setAnchor] = useState<HTMLElement | null>(null)
    const { notes, addNote, deleteNote } = useCalendarNotes(userId)

    const dated = useMemo(
        () => events.flatMap(e => {
            const date = toDate(e.event_date?.date_value)
            return date ? [{ event: e, date }] : []
        }),
        [events]
    )
    const eventDays = useMemo(() => dated.map(d => d.date), [dated])
    const noteDays = useMemo(() => notes.flatMap(n => toDate(`${n.date}T00:00:00`) ?? []), [notes])

    const dayEvents = selected ? dated.filter(d => isSameDay(d.date, selected)) : []
    const dayKey = selected ? format(selected, "yyyy-MM-dd") : ""
    const dayNotes = notes.filter(n => n.date === dayKey)

    const submit = async (e: FormEvent) => {
        e.preventDefault()
        const value = text.trim()
        if (!value || !dayKey) return
        setText("")
        try {
            await addNote(dayKey, value)
        } catch (err) {
            setText(value)
            notify.error(err, "Couldn't save the note.")
        }
    }

    return (
        <div className="flex flex-col gap-5">
            <Calendar
                mode="single"
                required
                selected={selected as Date}
                onSelect={setSelected}
                onDayClick={(_day, _mods, e) => {
                    setAnchor(e.currentTarget as HTMLElement)
                    setOpen(true)
                }}
                month={month}
                onMonthChange={setMonth}
                modifiers={{ hasEvent: eventDays, hasNote: noteDays }}
                modifiersClassNames={{
                    hasEvent: "[&>button]:after:absolute [&>button]:after:bottom-1 [&>button]:after:left-[40%] [&>button]:after:size-1 [&>button]:after:rounded-full [&>button]:after:bg-primary [&>button]:after:content-['']",
                    hasNote: `${DOT} [&>button]:before:left-[56%] [&>button]:before:bg-amber-500`,
                }}
                className="w-full p-0"
            />

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverAnchor virtualRef={{ current: anchor }} />
                <PopoverContent className="space-y-3" onOpenAutoFocus={e => e.preventDefault()}>
                    <h3 className="text-sm font-semibold">{selected ? format(selected, "EEEE, MMMM d") : "Select a date"}</h3>
                    <div className="min-w-0 space-y-3">

                {dayEvents.length === 0 && dayNotes.length === 0 && (
                    <p className="text-sm text-muted-foreground">Nothing scheduled on this day.</p>
                )}

                {dayEvents.length > 0 && (
                    <ul className="space-y-2">
                        {dayEvents.map(({ event }, i) => (
                            <li key={i}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setOpen(false)
                                        onSelectEvent?.(event)
                                    }}
                                    className="flex w-full items-center gap-2 rounded-xl bg-primary/10 p-3 text-left text-sm font-medium transition-colors hover:bg-primary/15"
                                >
                                    <span className="size-2 shrink-0 rounded-full bg-primary" />
                                    {event.event_name}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                {dayNotes.length > 0 && (
                    <ul className="space-y-2">
                        {dayNotes.map(n => (
                            <li key={n.id} className="flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                                <Pin className="size-4 shrink-0 text-amber-500" />
                                <span className="min-w-0 flex-1 break-words">{n.text}</span>
                                <button
                                    type="button"
                                    onClick={() => void deleteNote(n.id)}
                                    aria-label="Delete note"
                                    className="rounded-md p-1 text-amber-700 hover:bg-amber-100"
                                >
                                    <X className="size-4" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}

                {userId && selected && (
                    <form onSubmit={submit} className="flex gap-2">
                        <input
                            value={text}
                            onChange={e => setText(e.target.value)}
                            maxLength={140}
                            placeholder="Pin a note, e.g. Delivery day"
                            aria-label="Add a note to this day"
                            className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-card px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        />
                        <button
                            type="submit"
                            disabled={!text.trim()}
                            aria-label="Add note"
                            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                        >
                            <Plus className="size-5" />
                        </button>
                    </form>
                )}
            </div>
                </PopoverContent>
            </Popover>
        </div>
    )
}

import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";

export default function AvailabilityPicker({ onChange, existingValue = "", setTimeError }) {
    const [selectedDays, setSelectedDays] = useState([]);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [error, setError] = useState(""); // ⬅️ error state

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    // Convert "HH:mm" → "h:mm AM/PM"
    const formatTime = (timeStr) => {
        if (!timeStr) return "?";
        const [hours, minutes] = timeStr.split(":").map(Number);
        const period = hours >= 12 ? "PM" : "AM";
        const formattedHours = hours % 12 || 12;
        return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${period}`;
    };

    // Convert "8:00 AM" → "08:00"
    const parseTo24Hr = (timeStr) => {
        if (!timeStr) return "";
        const [time, modifier] = timeStr.split(" ");
        let [hours, minutes] = time.split(":").map(Number);

        if (modifier === "PM" && hours !== 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;

        return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    };

    // Parse existing value like "Mon, Tue: 8:00 AM - 5:00 PM"
    useEffect(() => {
        if (existingValue) {
            const [dayPart, timePart] = existingValue.split(": ");
            const parsedDays = dayPart?.split(",").map((d) => d.trim()) || [];
            const [start, end] = timePart?.split(" - ").map((t) => t.trim()) || [];

            setSelectedDays(parsedDays);
            setStartTime(parseTo24Hr(start));
            setEndTime(parseTo24Hr(end));

            const formatted = `${parsedDays.join(", ")}: ${start} - ${end}`;

            // Validate time
            if (start && end && start === end) {
                setError("Start time and end time cannot be the same.");
                setTimeError("Start time and end time cannot be the same.")
                onChange(""); // prevent invalid output
                return;
            }
            else if (dayPart.length === 0 || dayPart.length === 1) {
                setTimeError("Please select at least two day of availability.");
            } else {
                setError("");
                setTimeError("")

            }

            onChange(formatted);
        }
    }, [existingValue]);

    const handleChange = (newDays = selectedDays, start = startTime, end = endTime) => {
        // Validate time
        if (start && end && start === end) {
            setTimeError("Start time and end time cannot be the same.");
            onChange("");
            return;
        }
        else if (newDays.length === 0 || newDays.length === 1) {
            setTimeError("Please select at least two day of availability.");
        }
        else {
            setError("");
            setTimeError("");

        }

        const formatted = `${newDays.join(", ")}: ${formatTime(start)} - ${formatTime(end)}`;
        onChange(formatted);
    };

    console.log(selectedDays.length)

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Availability
            </label>

            {/* Days Picker */}
            <div className="flex flex-wrap gap-2 mb-3">
                {days.map((day) => (
                    <button
                        key={day}
                        type="button"
                        onClick={() => {
                            const newDays = selectedDays.includes(day)
                                ? selectedDays.filter((d) => d !== day)
                                : [...selectedDays, day];
                            setSelectedDays(newDays);
                            handleChange(newDays);
                        }}
                        className={`px-3 py-1 text-sm rounded-lg border transition ${selectedDays.includes(day)
                            ? "bg-blue-600 text-white border-blue-600"
                            : "border-gray-300 text-gray-600 hover:bg-gray-100"
                            }`}
                    >
                        {day}
                    </button>
                ))}
            </div>

            {/* Time Inputs */}
            <div className="flex gap-3">
                <div className="flex flex-col flex-1">
                    <label className="text-sm text-gray-600 mb-1">Start Time</label>
                    <input
                        type="time"
                        value={startTime}
                        onChange={(e) => {
                            setStartTime(e.target.value);
                            handleChange(selectedDays, e.target.value, endTime);
                        }}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div className="flex flex-col flex-1">
                    <label className="text-sm text-gray-600 mb-1">End Time</label>
                    <input
                        type="time"
                        value={endTime}
                        onChange={(e) => {
                            setEndTime(e.target.value);
                            handleChange(selectedDays, startTime, e.target.value);
                        }}
                        className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* Error message */}
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

            {/* Preview */}
            <div className="mt-3 text-gray-700 text-sm">
                {selectedDays.length > 0 && startTime && endTime && !error && (
                    <p>
                        <span className="font-semibold">Selected:</span>{" "}
                        {selectedDays.join(", ")} ({formatTime(startTime)} – {formatTime(endTime)})
                    </p>
                )}
            </div>
        </div>
    );
}

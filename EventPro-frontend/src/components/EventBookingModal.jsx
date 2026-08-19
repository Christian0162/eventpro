import { Button, Dialog, DialogPanel } from "@headlessui/react";
import { X, CalendarDays } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function EventBookingModal({ events = [], activeContracts = [], supplierData }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const open = () => setIsOpen(true);
    const close = () => {
        setError("");
        setIsOpen(false);
    };

    const handleConfirm = () => {
        if (!selectedEvent) {
            setError("Please select an event to continue.");
            return;
        }
        if (activeContracts.some((c) => c.event_id === selectedEvent && c.supplier_id === supplierData.id)) {
            setError("This event already has an active contract.");
            return;
        }

        navigate(`/events/${selectedEvent}/contract/${supplierData.id}`);
        window.location.reload();

        setIsOpen(false);
    };

    const isEventDisabled = (eventId) => activeContracts.some((c) => c.event_id === eventId && c.supplier_id === supplierData.id);

    return (
        <>
            <Button
                onClick={open}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 
                text-white font-semibold py-2 px-5 rounded-xl shadow-md hover:shadow-lg 
                transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
                Book Supplier
            </Button>

            <Dialog open={isOpen} as="div" className="relative z-50 focus:outline-none" onClose={close}>
                {/* Overlay */}
                <div className="fixed inset-0 bg-black/40 transition-opacity duration-300" />

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <DialogPanel
                            transition
                            className="overflow-hidden w-full max-w-4xl mt-18 rounded-2xl bg-white shadow-2xl duration-300"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Select Event to Book
                                </h2>
                                <button
                                    onClick={close}
                                    className="text-gray-500 hover:text-gray-700 transition"
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            {/* Event List */}
                            <div className="max-h-80 overflow-y-auto px-6 py-4 space-y-3">
                                {events.length === 0 ? (
                                    <p className="text-center text-gray-500 py-6">
                                        No events available.
                                    </p>
                                ) : (
                                    events.map((event) => {
                                        const disabled = isEventDisabled(event.id);
                                        return (
                                            <label
                                                key={event.id}
                                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all
                                                ${disabled
                                                        ? "bg-gray-100 border-gray-200 cursor-not-allowed opacity-70"
                                                        : selectedEvent === event.id
                                                            ? "border-blue-500 bg-blue-50"
                                                            : "border-gray-200 hover:bg-gray-50"
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="event"
                                                    value={event.id}
                                                    disabled={disabled}
                                                    checked={selectedEvent === event.id}
                                                    onChange={() => setSelectedEvent(event.id)}
                                                    className="h-5 w-5 text-blue-600 cursor-pointer disabled:cursor-not-allowed"
                                                />
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <CalendarDays size={16} className="text-blue-500" />
                                                        <p className="font-medium text-gray-800">
                                                            {event.event_name}
                                                        </p>
                                                    </div>
                                                    <p className="text-gray-500 text-sm">
                                                        {event.event_date?.date_value}
                                                    </p>
                                                    {disabled && (
                                                        <p className="text-xs text-gray-400 italic">
                                                            Already booked with this supplier
                                                        </p>
                                                    )}
                                                </div>
                                            </label>
                                        );
                                    })
                                )}
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="px-6 py-2">
                                    <p className="text-red-500 text-sm">{error}</p>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                                <button
                                    onClick={close}
                                    className="px-5 py-2 rounded-lg border border-gray-300 text-gray-700 
                                    hover:bg-gray-100 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="px-5 py-2 rounded-lg bg-blue-600 text-white font-semibold 
                                    hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                                >
                                    Book Now
                                </button>
                            </div>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        </>
    );
}

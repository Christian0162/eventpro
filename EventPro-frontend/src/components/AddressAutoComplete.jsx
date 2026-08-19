import { useState, useEffect, useRef } from 'react';
import OutsideClickHandler from 'react-outside-click-handler';

export default function AddressAutocomplete({ setLocation, setCoords, default_location = "", id, name, disabled, className }) {
    const [query, setQuery] = useState(default_location);
    const [suggestions, setSuggestions] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const timeoutRef = useRef(null);

    useEffect(() => {
        if (!isTyping) {
            setQuery(default_location);
        }
    }, [default_location]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const handleChange = async (e) => {
        const value = e.target.value;
        setQuery(value);
        setIsTyping(true);
        setLocation(value);

        if (value.length < 2) {
            setSuggestions([]);
            return;
        }

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`https://us1.locationiq.com/v1/autocomplete.php?key=${import.meta.env.VITE_LOCATIONIQ_API}&q=${encodeURIComponent(value)}&limit=5&viewbox=123.93,10.26,124.10,10.33&bounded=1&countrycodes=ph`);
                const data = await response.json();
                setSuggestions(data || []);
            } catch (e) {
                console.error(e);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        }, 200);
    };

    const handleClick = (item) => {
        const location = [
            item.address.name,
            item.address.city,
            item.address.country,
        ].filter(Boolean).join(", ");
        setCoords({ lat: item.lat, lon: item.lon })
        setSuggestions([]);
        setLocation(location);
        setQuery(location);
        setIsTyping(false);
    };

    return (
        <div className="relative">
            <OutsideClickHandler onOutsideClick={() => setSuggestions([])}>
                <div>
                    <input
                        type="text"
                        disabled={disabled}
                        className={`${className}`}
                        value={query}
                        name={name}
                        id={id}
                        required
                        placeholder="e.g University of Cebu Lapu-Lapu and Mandaue"
                        onChange={handleChange}
                    />

                    {(isLoading || suggestions.length > 0) && (
                        <ul className={`bg-white border ${query.length > 0 ? "block" : "hidden"} border-gray-300 rounded-lg mt-2 max-h-60 overflow-y-auto z-1000 absolute w-full`}>
                            {isLoading ? (
                                <li className="px-4 py-2 text-sm text-gray-500">Loading...</li>
                            ) : (
                                suggestions.map((item, index) => (
                                    <li
                                        key={index}
                                        className="px-4 py-2 hover:bg-blue-200 cursor-pointer text-sm"
                                        onClick={() => handleClick(item)}
                                    >
                                        {[item.address.name, item.address.city, item.address.country]
                                            .filter(Boolean)
                                            .join(", ")}
                                    </li>
                                ))
                            )}
                        </ul>
                    )}
                </div>
            </OutsideClickHandler>
        </div>
    );
}
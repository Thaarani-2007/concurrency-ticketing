import { useState, useEffect, useContext, useMemo, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function Dashboard() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState(''); 
    
    const { user, logout } = useContext(AuthContext);
    console.log("WHAT DASHBOARD SEES:", user);
    const navigate = useNavigate();
    const searchInputRef = useRef(null);
    useEffect(() => {
        console.log("🚨 SECURITY CHECK - Dashboard thinks user is:", user);
        /*
        if (!user) {
            navigate('/login');
        } 
        // If they are logged in, but NOT an organizer, send to home
        else if (user.role !== 'ORGANIZER') {
            navigate('/');
        }
            */
    }, [user, navigate]);
    useEffect(() => {
        const controller = new AbortController();

        const fetchEvents = async () => {
            try {
                const response = await api.get('events/me/', { signal: controller.signal });
                const eventData = response.data.results ? response.data.results : response.data;
                setEvents(Array.isArray(eventData) ? eventData : []);
                
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
            } catch (err) {
                console.error("API FETCH ERROR:", err.response?.data || err.message, err);
                if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
                    const serverMessage = err.response?.data?.detail;
                    setError(serverMessage || 'Failed to load events. Please verify your server connection.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
        return () => controller.abort();
    }, []);

    const handleLogout = useCallback(() => {
        logout();
        navigate('/login');
    }, [logout, navigate]);

    const filteredEvents = useMemo(() => {
        if (!searchQuery) return events;
        return events.filter(event => {
            const title = (event.title || event.name || '').toLowerCase();
            const desc = (event.description || '').toLowerCase();
            const query = searchQuery.toLowerCase();
            return title.includes(query) || desc.includes(query);
        });
    }, [events, searchQuery]);

    const totalCapacity = useMemo(() => {
        return filteredEvents.reduce((total, event) => total + (event.total_capacity || event.total_tickets || 0), 0);
    }, [filteredEvents]);

    if (loading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500 font-medium animate-pulse">Loading Organizer Environment...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex flex-wrap justify-between items-center sticky top-0 z-10 gap-4">
                <div className="flex items-center gap-8">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                        Ticketing Hub <span className="text-blue-600 text-sm font-semibold align-middle ml-1">Organizer</span>
                    </h1>
                    <div className="hidden sm:block border-l border-gray-200 pl-6">
                        <Link to="/" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                            &larr; Browse Public Events
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <span className="hidden md:block text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                        {user?.username || user?.email || 'Organizer'}
                    </span>
                    <button onClick={handleLogout} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                        Log Out
                    </button>
                </div>
            </nav>

            <main className="mx-auto max-w-7xl px-6 py-10">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Events</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Showing {filteredEvents.length} events • Total Capacity: {totalCapacity} seats
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <input
                            ref={searchInputRef}
                            type="text"
                            placeholder="Search events..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm px-4 py-2.5 w-64 border outline-none"
                        />
                        <Link to="/create-event" className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors">
                            + Create New Event
                        </Link>
                    </div>
                </div>

                {error ? (
                    <div className="rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-200 shadow-sm">
                        {error}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredEvents.map((event) => {
                            // UPGRADED DATA MAPPING: Using start_datetime from the new schema
                            const eventTime = new Date(event.start_datetime || event.start_time || event.date);
                            const isExpired = eventTime < new Date();
                            
                            const capacity = event.total_capacity || event.total_tickets || 0;
                            const booked = event.tickets_sold || 0; 
                            const unsold = capacity - booked;
                            const isSoldOut = booked >= capacity;
                            
                            const price = event.price ? parseFloat(event.price) : 0;
                            
                            // UPGRADED DATA MAPPING: Using thumbnail from the new schema
                            const imageSrc = event.thumbnail || event.image;

                            return (
                                <div key={event.id} className={`flex flex-col justify-between rounded-xl bg-white shadow-sm border overflow-hidden hover:shadow-md transition-shadow ${isExpired ? 'border-gray-200 opacity-90' : 'border-gray-100'}`}>
                                    
                                    <div className="relative h-48 w-full bg-gray-100 border-b border-gray-100">
                                        {imageSrc ? (
                                            <img 
                                                src={imageSrc} 
                                                alt={event.title} 
                                                className={`h-full w-full object-cover ${isExpired ? 'grayscale' : ''}`}
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-gray-400 text-sm">
                                                No Banner Image
                                            </div>
                                        )}

                                        {/* NEW: Category & Mode Badges */}
                                        <div className="absolute top-3 left-3 flex gap-2">
                                            {event.category && (
                                                <span className="rounded bg-white/90 px-2 py-1 text-[10px] font-bold text-gray-800 shadow-sm uppercase">
                                                    {event.category}
                                                </span>
                                            )}
                                            {event.event_mode && (
                                                <span className="rounded bg-blue-600/90 px-2 py-1 text-[10px] font-bold text-white shadow-sm uppercase">
                                                    {event.event_mode}
                                                </span>
                                            )}
                                        </div>

                                        {isExpired ? (
                                            <div className="absolute top-3 right-3 rounded-full bg-gray-800 px-3 py-1 text-xs font-bold text-white shadow-sm">
                                                BOOKING OVER
                                            </div>
                                        ) : isSoldOut ? (
                                            <div className="absolute top-3 right-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                                                SOLD OUT
                                            </div>
                                        ) : (
                                            <div className="absolute top-3 right-3 rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                                                ACTIVE
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-6 flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className={`text-xl font-bold tracking-tight line-clamp-1 ${isExpired ? 'text-gray-600' : 'text-gray-900'}`}>
                                                {event.title || event.name}
                                            </h3>
                                            
                                            {/* UPGRADED: Using short_description if available, otherwise fallback */}
                                            <p className="mt-2 text-sm text-gray-600 h-20 overflow-y-auto pr-2 custom-scrollbar">
                                                {event.short_description || event.description || 'No description provided.'}
                                            </p>
                                        </div>
                                        
                                        <div className="mt-6 border-t border-gray-50 pt-4">
                                            
                                            <div className="grid grid-cols-4 items-center text-xs font-semibold text-gray-400 mb-4">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-400 font-normal">TIME</span>
                                                    <span className="text-gray-900 truncate">{
                                                        eventTime.toLocaleTimeString([], {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            hour12: true,
                                                        })
                                                    }</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-gray-400 font-normal">DATE</span>
                                                    <span className="text-gray-900 truncate">{eventTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                </div>
                                                
                                                <div className="flex flex-col text-center border-x border-gray-100 px-2">
                                                    <span className="text-gray-400 font-normal">PRICE</span>
                                                    {price === 0 ? (
                                                        <span className="text-green-600">FREE</span>
                                                    ) : (
                                                        <span className="text-gray-900">₹{price}</span>
                                                    )}
                                                </div>

                                                <div className="flex flex-col text-right">
                                                    <span className="text-gray-400 font-normal">CAPACITY</span>
                                                    <span className="text-gray-900">{capacity}</span>
                                                </div>
                                            </div>
                                            
                                            {isExpired ? (
                                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex justify-between items-center text-sm">
                                                    <span className="font-semibold text-gray-700"><span className="text-green-600">{booked}</span> Booked</span>
                                                    <span className="font-semibold text-gray-700"><span className="text-red-500">{unsold}</span> Unbooked</span>
                                                </div>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => navigate(`/event/${event.id}`)} 
                                                        className="flex-1 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors focus:outline-none"
                                                    >
                                                        Manage
                                                    </button>
                                                    <button 
                                                        onClick={() => navigate(`/edit-event/${event.id}`)} 
                                                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredEvents.length === 0 && !error && (
                            <div className="col-span-full py-16 text-center rounded-xl bg-white border border-dashed border-gray-300">
                                <h3 className="mt-2 text-sm font-semibold text-gray-900">No events found</h3>
                                <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">Try adjusting your search or create a new event.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
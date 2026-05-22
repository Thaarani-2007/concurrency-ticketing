import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';

export default function Home() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const navigate = useNavigate();
    
    // Bring in the user state and logout function
    const { user, logout } = useContext(AuthContext);

    useEffect(() => {
        const fetchPublicEvents = async () => {
            try {
                const response = await api.get('events/');
                const eventData = response.data.results ? response.data.results : response.data;
                setEvents(Array.isArray(eventData) ? eventData : []);
            } catch (err) {
                console.error(err);
                setError('Failed to load events. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchPublicEvents();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login'); // Keep them on the homepage, just refresh their state
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-pulse text-gray-500 font-medium text-lg tracking-wide">
                    Discovering upcoming events...
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
    }

    const activeEvents = events.filter(event => new Date(event.start_datetime || event.start_time || event.date) >= new Date());

    return (
        <div className="min-h-screen bg-white">
            
            {/* NEW: SMART NAVBAR */}
            <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
                <div className="text-white font-bold text-xl tracking-tight">Ticketing Hub</div>
                <div>
                    {user ? (
                        <div className="flex items-center gap-4">
                            
                            {/* ONLY SHOW DASHBOARD BUTTON TO ORGANIZERS */}
                            {user.role === 'ORGANIZER' && (
                                <Link 
                                    to="/dashboard" 
                                    className="text-sm font-semibold text-gray-900 bg-white hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
                                >
                                    Dashboard
                                </Link>
                            )}
                            
                            <button 
                                onClick={handleLogout} 
                                className="text-sm font-semibold text-white bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition-colors"
                            >
                                Log Out
                            </button>
                        </div>
                    ) : (
                        <Link 
                            to="/login" 
                            className="text-sm font-semibold text-gray-900 bg-white hover:bg-gray-100 px-5 py-2.5 rounded-lg transition-colors"
                        >
                            Log In
                        </Link>
                    )}
                </div>
            </nav>

            {/* HERO SECTION */}
            <div className="bg-gray-900 py-20 sm:py-28">
                <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
                        Find your next experience.
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-gray-300 max-w-2xl mx-auto">
                        Discover tech conferences, music festivals, and exclusive workshops happening around you. Secure your spot before they sell out.
                    </p>
                    
                    {/* SMART BUTTON LOGIC */}
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                        <p className="text-md text-gray-400">
                            Hosting something unforgettable?
                        </p>
                        
                        {!user ? (
                            <Link to="/login" className="text-sm font-semibold leading-6 text-white hover:text-blue-400 transition-colors">
                                Organizer Login <span aria-hidden="true">→</span>
                            </Link>
                        ) : user.role === 'ORGANIZER' ? (
                            <Link to="/dashboard" className="text-sm font-semibold leading-6 text-blue-400 hover:text-blue-300 transition-colors">
                                Go to Dashboard <span aria-hidden="true">→</span>
                            </Link>
                        ) : (
                            <Link to="/apply" className="text-sm font-bold leading-6 text-blue-400 hover:text-blue-300 transition-colors">
                                Become an Organizer <span aria-hidden="true">→</span>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* EVENT GRID */}
            <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
                <div className="flex justify-between items-center mb-10">
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">Upcoming Events</h2>
                    <span className="text-gray-500 text-sm font-medium">{activeEvents.length} events found</span>
                </div>

                <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                    {activeEvents.map((event) => {
                        const eventTime = new Date(event.start_datetime || event.start_time || event.date);
                        const price = event.price ? parseFloat(event.price) : 0;
                        const imageSrc = event.thumbnail || event.image;
                        const locationText = event.event_mode === 'ONLINE' 
                            ? 'Online Event' 
                            : (event.city ? `${event.city}${event.state ? `, ${event.state}` : ''}` : 'Location TBA');

                        return (
                            <div 
                                key={event.id} 
                                onClick={() => navigate(`/event/${event.id}`)}
                                className="group relative cursor-pointer flex flex-col bg-white rounded-2xl border border-gray-100 hover:border-blue-100 hover:shadow-xl transition-all duration-300 overflow-hidden"
                            >
                                {/* Image Container */}
                                <div className="aspect-[16/9] w-full overflow-hidden bg-gray-100 relative">
                                    {imageSrc ? (
                                        <img
                                            src={imageSrc}
                                            alt={event.title}
                                            className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-gray-400 text-sm bg-gray-50">
                                            Event Banner
                                        </div>
                                    )}
                                    
                                    {/* Top Left Badges */}
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        {event.category && (
                                            <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded text-xs font-bold text-gray-800 shadow-sm uppercase tracking-wider">
                                                {event.category}
                                            </span>
                                        )}
                                        {event.event_mode === 'ONLINE' && (
                                            <span className="bg-blue-600/90 backdrop-blur-sm px-2.5 py-1 rounded text-xs font-bold text-white shadow-sm uppercase tracking-wider">
                                                Online
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Price Tag */}
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-bold text-gray-900 shadow-sm">
                                        {price === 0 ? 'FREE' : `₹${price}`}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex items-center text-sm font-semibold text-blue-600 mb-2">
                                            <span>{eventTime.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                            <span className="mx-2">•</span>
                                            <span>{eventTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        
                                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                            {event.title || event.name}
                                        </h3>
                                        
                                        <p className="mt-3 text-sm text-gray-500 line-clamp-2">
                                            {event.short_description || event.description || 'Join us for this amazing event.'}
                                        </p>
                                    </div>

                                    <div className="mt-5 pt-4 border-t border-gray-50 flex items-center text-sm text-gray-500 font-medium">
                                        <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                        <span className="truncate">{locationText}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {activeEvents.length === 0 && (
                    <div className="text-center py-20">
                        <h3 className="text-lg font-semibold text-gray-900">No upcoming events</h3>
                        <p className="mt-1 text-gray-500">Check back later for new experiences.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
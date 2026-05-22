import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function EventDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchEventDetails = async () => {
            try {
                const response = await api.get(`events/${id}/`);
                setEvent(response.data);
            } catch (err) {
                console.error(err);
                setError('Failed to load event details. It may have been deleted or moved.');
            } finally {
                setLoading(false);
            }
        };
        fetchEventDetails();
    }, [id]);

    if (loading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center animate-pulse text-gray-500">Loading Event Experience...</div>;
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
                <p className="text-red-500 font-medium mb-4">{error}</p>
                <Link to="/" className="text-blue-600 hover:underline">&larr; Back to Events</Link>
            </div>
        );
    }

    // --- DATA NORMALIZATION ---
    // Safely handling both the old schema and the new schema
    const imageSrc = event.thumbnail || event.image;
    const startTime = new Date(event.start_datetime || event.start_time || event.date);
    const endTime = event.end_datetime ? new Date(event.end_datetime) : null;
    const isExpired = startTime < new Date();
    
    const capacity = event.total_capacity || event.total_tickets || 0;
    const booked = event.tickets_sold || 0; 
    const isSoldOut = booked >= capacity;
    const price = event.price ? parseFloat(event.price) : 0;
    
    const eventMode = event.event_mode || 'OFFLINE';

    return (
        <div className="min-h-screen bg-white">
            {/* 1. HERO BANNER */}
            <div className="relative h-72 sm:h-96 w-full bg-gray-900">
                {imageSrc ? (
                    <img src={imageSrc} alt={event.title} className="h-full w-full object-cover opacity-50" />
                ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-800 opacity-60"></div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
                
                <div className="absolute bottom-0 left-0 w-full p-8 max-w-7xl mx-auto">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${isExpired ? 'bg-gray-600 text-white' : 'bg-blue-600 text-white'}`}>
                            {isExpired ? 'Past Event' : 'Upcoming'}
                        </span>
                        {event.category && (
                            <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full uppercase tracking-wide border border-white/30">
                                {event.category}
                            </span>
                        )}
                        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full uppercase tracking-wide border border-white/30">
                            {eventMode}
                        </span>
                    </div>
                    
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-2">
                        {event.title || event.name}
                    </h1>
                    
                    {event.short_description && (
                        <p className="text-lg text-gray-300 max-w-3xl line-clamp-2">
                            {event.short_description}
                        </p>
                    )}
                </div>
            </div>

            {/* 2. EVENT CONTENT GRID */}
            <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
                
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-10">
                    
                    {/* Key Info Pills */}
                    <div className="flex flex-wrap gap-4 border-b border-gray-100 pb-8">
                        <div className="flex items-center text-gray-700 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                            <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
                            <span className="text-sm font-medium">{event.language || 'English'}</span>
                        </div>
                        <div className="flex items-center text-gray-700 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                            <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            <span className="text-sm font-medium">{event.age_restriction || 'All Ages'}</span>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">About this event</h2>
                        <div className="prose prose-blue text-gray-600 whitespace-pre-wrap">
                            {event.description || 'No description provided by the organizer.'}
                        </div>
                    </div>

                    {/* Organizer Section */}
                    {event.organizer_name && (
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                            <h2 className="text-lg font-bold text-gray-900 mb-4">Organizer</h2>
                            <p className="font-semibold text-gray-900 text-xl">{event.organizer_name}</p>
                            <div className="mt-3 space-y-2 text-sm text-gray-600">
                                {event.organizer_email && <p className="flex items-center"><span className="font-medium mr-2">Email:</span> <a href={`mailto:${event.organizer_email}`} className="text-blue-600 hover:underline">{event.organizer_email}</a></p>}
                                {event.organizer_website && <p className="flex items-center"><span className="font-medium mr-2">Website:</span> <a href={event.organizer_website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{event.organizer_website}</a></p>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Checkout Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-8">
                        
                        {/* Price Tag */}
                        <div className="mb-6 border-b border-gray-100 pb-6">
                            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Ticket Price</p>
                            <p className="text-4xl font-extrabold text-gray-900 mt-1">
                                {price === 0 ? 'FREE' : `₹${price}`}
                            </p>
                        </div>

                        {/* Date & Time Block */}
                        <div className="space-y-4 mb-6 border-b border-gray-100 pb-6">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Date & Time</h3>
                            <div className="flex items-start text-gray-600">
                                <svg className="w-5 h-5 mr-3 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                <div>
                                    <p className="font-medium text-gray-900">{startTime.toLocaleDateString(undefined, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                    <p className="text-sm">{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} {endTime && `- ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}</p>
                                    <p className="text-xs text-gray-400 mt-1">{event.timezone || 'Local Time'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Location Block */}
                        <div className="space-y-4 mb-8">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Location</h3>
                            
                            {eventMode === 'ONLINE' ? (
                                <div className="flex items-start text-gray-600">
                                    <svg className="w-5 h-5 mr-3 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                    <div>
                                        <p className="font-medium text-gray-900">Online Event</p>
                                        <p className="text-sm text-gray-500">Access link will be provided upon registration.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start text-gray-600">
                                    <svg className="w-5 h-5 mr-3 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    <div>
                                        {event.venue_name && <p className="font-medium text-gray-900">{event.venue_name}</p>}
                                        {event.address && <p className="text-sm text-gray-600">{event.address}</p>}
                                        <p className="text-sm text-gray-600">
                                            {[event.city, event.state, event.country].filter(Boolean).join(', ')}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Booking Button Logic */}
                        {isExpired ? (
                            <button disabled className="w-full py-4 rounded-xl font-bold text-white bg-gray-400 cursor-not-allowed">
                                Event Has Ended
                            </button>
                        ) : isSoldOut ? (
                            <button disabled className="w-full py-4 rounded-xl font-bold text-white bg-red-500 cursor-not-allowed">
                                Sold Out
                            </button>
                        ) : (
                            <button 
                                onClick={() => navigate(`/event/${event.id}/seats`)}
                                className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all transform hover:-translate-y-0.5"
                            >
                                Get Tickets
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
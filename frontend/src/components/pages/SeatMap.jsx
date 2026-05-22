import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function SeatMap() {
    const { id: eventId } = useParams();
    const navigate = useNavigate();

    const [event, setEvent] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lockingSeatId, setLockingSeatId] = useState(null);

    // OPTIMIZATION 1: Fetch from localStorage ONCE, not inside the loop
    const currentUserEmail = useMemo(() => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const userObj = JSON.parse(userStr);
                return userObj.email;
            }
            return null;
        } catch (e) {
            return null;
        }
    }, []);

    useEffect(() => {
        const fetchSeatMapData = async () => {
            try {
                const [eventRes, ticketsRes] = await Promise.all([
                    api.get(`events/${eventId}/`),
                    api.get(`events/${eventId}/tickets/`)
                ]);
                
                setEvent(eventRes.data);
                setTickets(Array.isArray(ticketsRes.data) ? ticketsRes.data : []);
            } catch (err) {
                console.error("API Error:", err);
                setError('Failed to load the seat map. Please refresh the page.');
            } finally {
                setLoading(false);
            }
        };

        fetchSeatMapData();
    }, [eventId]);

    // OPTIMIZATION 2: useCallback keeps the function reference stable
    const handleSeatClick = useCallback(async (ticket) => {
        if (ticket.status !== 'AVAILABLE' || lockingSeatId) return;

        setError('');
        setLockingSeatId(ticket.id);

        try {
            const response = await api.post(`tickets/${ticket.id}/lock/`);
            console.log("LOCK ACQUIRED:", response.data.expires_at);
            navigate(`/checkout/${ticket.id}`);
        } catch (err) {
            const serverMessage = err.response?.data?.error;
            setError(serverMessage || "This seat was just locked by another user! Please select a different seat.");
            
            // Refresh tickets to show what changed
            try {
                const refreshRes = await api.get(`events/${eventId}/tickets/`);
                setTickets(Array.isArray(refreshRes.data) ? refreshRes.data : []);
            } catch (refreshErr) {
                console.error("Failed to refresh tickets", refreshErr);
            }
        } finally {
            setLockingSeatId(null);
        }
    }, [eventId, lockingSeatId, navigate]);

    // OPTIMIZATION 3: useMemo prevents recalculating the grid unless tickets or locking state changes
    const seatGrid = useMemo(() => {
        return tickets.map((ticket) => {
            const isAvailable = ticket.status === 'AVAILABLE';
            const isBooked = ticket.status === 'BOOKED';
            const isReserved = ticket.status === 'RESERVED';
            
            // Check ownership using the cached email
            const isMine = isReserved && ticket.user_email === currentUserEmail;
            const isLocking = lockingSeatId === ticket.id;

            let seatClasses = "relative flex items-center justify-center aspect-square rounded-lg font-bold text-sm transition-all duration-150 border-2 shadow-sm outline-none";

            if (isBooked) {
                seatClasses += " bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed";
            } else if (isReserved && !isMine) {
                seatClasses += " bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed";
            } else if (isMine) {
                seatClasses += " bg-blue-100 border-blue-500 text-blue-700 hover:bg-blue-200 cursor-pointer scale-105";
            } else {
                seatClasses += " bg-white border-gray-200 text-gray-700 hover:bg-green-50 hover:border-green-400 hover:text-green-800 hover:scale-105 cursor-pointer";
            }

            if (isLocking) {
                seatClasses += " cursor-wait";
            }

            return (
                <button 
                    key={ticket.id} 
                    disabled={!isAvailable || lockingSeatId}
                    onClick={() => handleSeatClick(ticket)}
                    className={seatClasses}
                    title={`Seat ${ticket.seat_number} (${ticket.status})`}
                >
                    {isLocking ? (
                        <div className="w-4 h-4 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
                    ) : isBooked || (isReserved && !isMine) ? (
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    ) : (
                        ticket.seat_number
                    )}
                </button>
            );
        });
    }, [tickets, lockingSeatId, handleSeatClick, currentUserEmail]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Initializing seat map grid...</div>;
    }

    if (!event) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="text-center">
                    <p className="text-red-500 font-medium mb-4">{error || 'Event not found.'}</p>
                    <Link to="/" className="text-blue-600 hover:underline">&larr; Back to Events</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-16">
            <header className="bg-white border-b border-gray-100 p-6 shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <Link to={`/event/${eventId}`} className="text-sm font-medium text-blue-600 hover:underline">
                            &larr; Back to Details
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">
                            Select Seat: <span className="text-gray-600">{event.title}</span>
                        </h1>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-semibold text-gray-500">PRICE PER SEAT</p>
                        <p className="text-3xl font-extrabold text-gray-900 mt-1">₹{event.price}</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-6 md:p-12">
                {error && (
                    <div className="mb-8 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 font-medium text-sm flex items-start">
                        <svg className="w-5 h-5 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                        {error}
                    </div>
                )}

                <div className="bg-white p-8 md:p-12 rounded-2xl shadow-xl border border-gray-100">
                    <div className="mb-16 text-center">
                        <div className="w-3/4 mx-auto h-2 bg-gray-300 rounded-full"></div>
                        <p className="text-xs text-gray-400 mt-2 font-semibold uppercase tracking-widest">STAGE / SCREEN</p>
                    </div>

                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                        {/* We just render the memoized grid here */}
                        {seatGrid}
                    </div>
                </div>

                <div className="mt-12 p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center gap-8 text-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-md bg-white border-2 border-gray-200"></div>
                        <span className="text-gray-600 font-medium">Available</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-md bg-gray-200 border-2 border-gray-300 flex items-center justify-center text-gray-400">
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </div>
                        <span className="text-gray-600 font-medium">Taken</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-md bg-blue-100 border-2 border-blue-500"></div>
                        <span className="text-gray-600 font-medium">Your Selection (Locked)</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
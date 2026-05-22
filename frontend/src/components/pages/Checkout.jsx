import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import api from '../api/axios';

export default function Checkout() {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [ticketData, setTicketData] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [status, setStatus] = useState('loading'); // 'loading', 'active', 'expired', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const expiresAtRef = useRef(null);

    // --- 1. THE SECURE INITIALIZATION ---
    useEffect(() => {
        let isMounted = true;

        const verifyLockWithServer = async () => {
            try {
                // We ask Django: Do I actually own this lock?
                const response = await api.get(`tickets/${ticketId}/status/`);
                
                if (!isMounted) return;

                if (response.data.status === 'RESERVED' && response.data.is_owner) {
                    // WE OWN IT! Set the true expiration time from the server.
                    expiresAtRef.current = new Date(response.data.expires_at);
                    setTicketData({ seat_number: "Verifying..." }); // Optional: Fetch real seat number if added to API
                    setStatus('active');
                } else {
                    // The server says we don't own it (maybe it expired, or we are hacking)
                    setStatus('expired');
                }
            } catch (err) {
                if (isMounted) {
                    setStatus('error');
                    setErrorMessage('Could not connect to ticketing server. Your lock may be invalid.');
                }
            }
        };

        // Run the verification immediately
        verifyLockWithServer();

        // Security Feature: Re-verify with the server every 15 seconds
        // Just in case the user's browser clock is messed up.
        const verificationInterval = setInterval(verifyLockWithServer, 15000);

        return () => {
            isMounted = false;
            clearInterval(verificationInterval);
        };
    }, [ticketId]);


    // --- 2. THE COUNTDOWN TIMER (Visual Only) ---
    // This just updates the UI. The real security is the server check above.
    useEffect(() => {
        if (status !== 'active' || !expiresAtRef.current) return;

        const timer = setInterval(() => {
            const now = new Date();
            const difference = expiresAtRef.current - now;

            if (difference <= 0) {
                clearInterval(timer);
                setTimeLeft("0:00");
                setStatus('expired');
            } else {
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
                const seconds = Math.floor((difference % (1000 * 60)) / 1000);
                setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [status]);


    // --- 3. THE PAYMENT CONFIRMATION ---
    const handlePayment = async () => {
        setIsProcessing(true);
        setErrorMessage('');

        try {
            const response = await api.post(`tickets/${ticketId}/confirm/`);
            
            setStatus('success');
            setTicketData({
                ...ticketData,
                booking_id: response.data.booking_id,
                seat_number: response.data.seat_number
            });

        } catch (err) {
            setIsProcessing(false);
            const serverMessage = err.response?.data?.error;
            
            if (err.response?.status === 408) {
                setStatus('expired');
            } else {
                setStatus('error');
                setErrorMessage(serverMessage || "Payment failed. Please try again.");
            }
        }
    };

    // --- RENDER LOGIC ---
    if (status === 'loading') {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Verifying secure connection to ticketing server...</div>;
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Ticket Secured!</h2>
                    <p className="text-gray-500 mb-8">We've sent a confirmation email with your ticket details.</p>
                    
                    <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left border border-gray-100">
                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide mb-1">Seat Number</p>
                        <p className="text-2xl font-bold text-gray-900 mb-4">{ticketData?.seat_number}</p>
                        
                        <p className="text-sm text-gray-500 font-semibold uppercase tracking-wide mb-1">Booking ID</p>
                        <p className="font-mono text-gray-900 break-all">{ticketData?.booking_id}</p>
                    </div>

                    <button onClick={() => navigate('/')} className="w-full py-3 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    if (status === 'expired') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Reservation Expired</h2>
                    <p className="text-gray-500 mb-8">Your lock has expired or is invalid. The seat has been released back to the public.</p>
                    <button onClick={() => navigate(-1)} className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">
                        Back to Seat Map
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-6">
            <div className="max-w-3xl mx-auto">
                <Link to={-1} className="text-sm font-medium text-blue-600 hover:underline mb-8 inline-block">
                    &larr; Back to Seat Map
                </Link>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-900 px-8 py-6 flex justify-between items-center text-white">
                        <div>
                            <h2 className="text-xl font-bold">Checkout</h2>
                            <p className="text-gray-400 text-sm mt-1">Complete your payment</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Time Remaining</p>
                            <p className="text-2xl font-mono font-bold text-red-400 animate-pulse">{timeLeft}</p>
                        </div>
                    </div>

                    <div className="p-8">
                        {status === 'error' && (
                            <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 border border-red-200 font-medium text-sm">
                                {errorMessage}
                            </div>
                        )}

                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8 flex justify-between items-center">
                            <div>
                                <p className="text-sm font-semibold text-blue-800">Your Seat is Reserved!</p>
                                <p className="text-xs text-blue-600 mt-1">No one else can buy it until the timer runs out.</p>
                            </div>
                            <svg className="w-8 h-8 text-blue-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">Payment Method</h3>
                            
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center cursor-not-allowed">
                                <p className="text-gray-500 font-medium">Dummy Checkout Enabled</p>
                                <p className="text-xs text-gray-400 mt-1">No real credit card required for this demonstration.</p>
                            </div>

                            <button
                                onClick={handlePayment}
                                disabled={isProcessing}
                                className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 mt-8 flex justify-center items-center"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                                        Processing Payment...
                                    </>
                                ) : (
                                    'Simulate Purchase & Confirm Seat'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
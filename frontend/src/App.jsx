import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Home from './components/pages/Home';
import Login from './components/pages/Login';

const Dashboard = lazy(() => import('./components/pages/Dashboard'));
const CreateEvent = lazy(() => import('./components/pages/CreateEvent'))
const EventDetails = lazy(() => import('./components/pages/EventDetails'));
const ApplyToHost = lazy(() => import('./components/pages/ApplyToHost')); 
const Register = lazy(() => import('./components/pages/Register'));
const EditEvent = lazy(()=>import('./components/pages/EditEvent'));

// --- NEW PAGES ---
const SeatMap = lazy(() => import('./components/pages/SeatMap'));
const Checkout = lazy(() => import('./components/pages/Checkout'));

const GlobalLoader = () => (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-gray-500 animate-pulse">Loading App...</div>
    </div>
);

export default function App() {
  return(
    <BrowserRouter>
      <Suspense fallback={<GlobalLoader/>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/event/:id" element={<EventDetails />} />
            {/* The visual grid where they click a seat to lock it */}
            <Route path="/event/:id/seats" element={<SeatMap />} /> 
            
            {/* The final payment page with the 5-minute countdown */}
            <Route path="/checkout/:ticketId" element={<Checkout />} /> 

            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/apply" element={<ApplyToHost />} />
            <Route path="/create-event" element={<CreateEvent />} />
            <Route path="/edit-event/:id" element={<EditEvent />} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

export default function CreateEvent() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // 1. The Massive State Object
    const [formData, setFormData] = useState({ 
        title: '', short_description: '', description: '', category: 'OTHER',
        language: 'English', age_restriction: 'All Ages',
        start_time: '', end_datetime: '', timezone: 'Asia/Kolkata',
        event_mode: 'OFFLINE', venue_name: '', address: '', city: '', state: '', country: '', meeting_link: '',
        total_capacity: '', price: '',
        organizer_name: '', organizer_email: '', organizer_phone: '', organizer_website: ''
    });
    const [imageFile, setImageFile] = useState(null);

    const getMinTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 30);
        const offset = now.getTimezoneOffset() * 60000;
        return (new Date(now - offset)).toISOString().slice(0, 16);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        const submitData = new FormData();
        
        // SENIOR TRICK: Loop through the state object instead of typing 20 append lines!
        Object.keys(formData).forEach(key => {
            // Only append if the user actually typed something
            if (formData[key] !== '') {
                submitData.append(key, formData[key]);
            }
        });
        
        if (imageFile) {
            submitData.append('thumbnail', imageFile);
        }

        try {
            await api.post('events/me/', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            navigate('/dashboard');
        } catch (err) {
            console.error("API Error:", err.response?.data || err.message);
            setError('Failed to create event. Please check your inputs.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Link to="/dashboard" className="text-sm font-medium text-gray-500 hover:text-blue-600 mb-4 inline-block">
                        &larr; Back to Dashboard
                    </Link>
                    <h2 className="text-3xl font-extrabold text-gray-900">Create New Event</h2>
                    <p className="mt-1 text-sm text-gray-500">Provide comprehensive details for your attendees.</p>
                </div>

                {error && <div className="mb-6 rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-8">
                    
                    {/* SECTION 1: Basic Information */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">1. Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
                                <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description (Preview)</label>
                                <input type="text" name="short_description" value={formData.short_description} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" maxLength="255" placeholder="A catchy 1-sentence summary" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Description *</label>
                                <textarea name="description" rows="5" required value={formData.description} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select name="category" value={formData.category} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
                                    <option value="TECH">Technology</option>
                                    <option value="MUSIC">Music</option>
                                    <option value="SPORTS">Sports</option>
                                    <option value="BUSINESS">Business</option>
                                    <option value="WORKSHOP">Workshop</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                                <input type="text" name="language" value={formData.language} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g., English, Hindi" />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Date & Time */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">2. Schedule</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                                <input type="datetime-local" name="start_time" required min={getMinTime()} value={formData.start_datetime} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                <input type="datetime-local" name="end_datetime" min={formData.start_datetime || getMinTime()} value={formData.end_datetime} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                                <input type="text" name="timezone" value={formData.timezone} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Location */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">3. Location</h3>
                        
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Event Mode</label>
                            <select name="event_mode" value={formData.event_mode} onChange={handleChange} className="w-full md:w-1/3 rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
                                <option value="OFFLINE">Offline (In-Person)</option>
                                <option value="ONLINE">Online (Virtual)</option>
                                <option value="HYBRID">Hybrid</option>
                            </select>
                        </div>

                        {formData.event_mode !== 'ONLINE' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name</label>
                                    <input type="text" name="venue_name" value={formData.venue_name} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">State & Country</label>
                                    <div className="flex gap-2">
                                        <input type="text" name="state" placeholder="State" value={formData.state} onChange={handleChange} className="w-1/2 rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                        <input type="text" name="country" placeholder="Country" value={formData.country} onChange={handleChange} className="w-1/2 rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {formData.event_mode !== 'OFFLINE' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Link (Zoom, Meet, etc.)</label>
                                <input type="url" name="meeting_link" value={formData.meeting_link} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="https://" />
                            </div>
                        )}
                    </div>

                    {/* SECTION 4: Ticketing & Organizer */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">4. Ticketing & Organizer</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Total Capacity *</label>
                                <input type="number" name="total_capacity" required min="1" value={formData.total_capacity} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Price (₹) *</label>
                                <input type="number" name="price" required min="0" step="0.01" value={formData.price} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                            </div>
                            
                            <div className="md:col-span-2 mt-4 border-t pt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Public Display Name (Organizer)</label>
                                <input type="text" name="organizer_name" value={formData.organizer_name} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="e.g., Apple Inc, TechClub" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                                <input type="email" name="organizer_email" value={formData.organizer_email} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                <input type="url" name="organizer_website" value={formData.organizer_website} onChange={handleChange} className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="https://" />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 5: Media */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">5. Media</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Event Banner / Thumbnail</label>
                            <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                            <p className="mt-1 text-xs text-gray-500">Wide aspect ratio recommended (16:9). Max 5MB.</p>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end sticky bottom-6 z-10 bg-white p-4 rounded-xl border border-gray-200 shadow-xl">
                        <button type="submit" disabled={isLoading} className="rounded-md bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition-colors w-full sm:w-auto">
                            {isLoading ? 'Publishing...' : 'Publish Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
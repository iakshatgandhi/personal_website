import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './card';

const ScheduleCall = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    selectedDate: '',
    selectedTime: '',
    message: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const availableTimes = [
    '09:00 AM', '10:00 AM', '11:00 AM',
    '02:00 PM', '03:00 PM', '04:00 PM'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.email || !formData.selectedDate || !formData.selectedTime) {
      setError('Please fill in all required fields.');
      return false;
    }
  
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return false;
    }
  
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(formData.selectedDate)) {
      setError('Invalid date format.');
      return false;
    }
  
    const selectedDateTime = new Date(`${formData.selectedDate}T${formData.selectedTime}`);
    const now = new Date();
    if (selectedDateTime <= now) {
      setError('Please select a future date and time.');
      return false;
    }
  
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/scheduleCall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error('This time slot is no longer available. Please select another time.');
        } else if (response.status === 400 && data.details) {
          throw new Error(data.details.map(err => err.message).join(', '));
        } else {
          throw new Error(data.error || 'Failed to schedule call.');
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Submission error:', error);
      setError(error.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Disable past dates in the date picker
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="relative w-full max-w-2xl m-4">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-red-100 hover:text-red-300 z-10 transition-colors duration-200"
          aria-label="Close modal"
        >
          ✕
        </button>
        <Card className="w-full bg-black/90 backdrop-blur-lg border border-red-900/30 rounded-lg shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-red-300 to-red-600 bg-clip-text text-transparent flex items-center justify-center gap-2">
              <Calendar className="w-8 h-8 text-red-500" />
              Schedule a Call
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {success && (
                <div className="text-green-500 text-center bg-green-500/10 p-3 rounded-md">
                  Call scheduled successfully! Redirecting...
                </div>
              )}
              {error && (
                <div className="text-red-500 text-center bg-red-500/10 p-3 rounded-md">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-red-100 block">Name *</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded-md bg-black/50 border border-red-900/30 text-red-100 focus:outline-none focus:border-red-500 hover:border-red-500 transition-colors duration-200"
                    required
                    aria-required="true"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-red-100 block">Email *</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded-md bg-black/50 border border-red-900/30 text-red-100 focus:outline-none focus:border-red-500 hover:border-red-500 transition-colors duration-200"
                    required
                    aria-required="true"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="selectedDate" className="text-red-100 block">Date *</label>
                  <input
                    id="selectedDate"
                    name="selectedDate"
                    type="date"
                    min={minDate}
                    value={formData.selectedDate}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded-md bg-black/50 border border-red-900/30 text-red-100 focus:outline-none focus:border-red-500 hover:border-red-500 transition-colors duration-200"
                    required
                    aria-required="true"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="selectedTime" className="text-red-100 block">Preferred Time *</label>
                  <select
                    id="selectedTime"
                    name="selectedTime"
                    value={formData.selectedTime}
                    onChange={handleInputChange}
                    className="w-full p-2 rounded-md bg-black/50 border border-red-900/30 text-red-100 focus:outline-none focus:border-red-500 hover:border-red-500 transition-colors duration-200"
                    required
                    aria-required="true"
                  >
                    <option value="">Select a time</option>
                    {availableTimes.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-red-100 block">Message (Optional)</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="w-full p-2 rounded-md bg-black/50 border border-red-900/30 text-red-100 focus:outline-none focus:border-red-500 hover:border-red-500 transition-colors duration-200 h-32"
                  placeholder="Let me know what you'd like to discuss..."
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-red-700 to-red-900 text-red-100 rounded-md hover:from-red-600 hover:to-red-800 transition-all duration-200 font-semibold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-100" />
                ) : (
                  'Schedule Call'
                )}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};


export default ScheduleCall;
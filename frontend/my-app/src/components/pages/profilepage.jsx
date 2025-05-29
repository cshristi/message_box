'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ProfileUpdate() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Fetch current user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please log in to update your profile');
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('http://localhost:5000/api/auth/profile', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error('Failed to fetch profile data');
        const data = await res.json();
        setFormData({
          name: data.username || '', // Map 'username' from API to 'name'
          email: data.email || '',
          password: '',
        });
      } catch (err) {
        const errorMessage = err.message || 'Failed to fetch profile data';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    };

    fetchUserData();
  }, [router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to update your profile');
      router.push('/login');
      return;
    }

    // Only send fields that have been updated
    const updateData = {};
    if (formData.name) updateData.username = formData.name; // Map 'name' to 'username' for API
    if (formData.email) updateData.email = formData.email;
    if (formData.password) updateData.password = formData.password;

    try {
      const res = await fetch('http://localhost:5000/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const data = await res.json();

      // Update localStorage with new user data
      localStorage.setItem('username', data.username || 'User');
      localStorage.setItem('email', data.email || '');

      toast.success('Profile updated successfully!');
      router.push('/homepage');
    } catch (err) {
      const errorMessage = err.message || 'Failed to update profile';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#F3E2E4]">
      <div
        className="hidden lg:flex w-1/2 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            'url("image.png")',
        }}
      >
        <div className="flex flex-col justify-center items-center w-full bg-[#A1887F]/50 p-12 text-white">
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
            Update Your Profile
          </h1>
          <p className="text-lg opacity-90 max-w-md text-center">
            Personalize your account details to keep your profile up to date.
          </p>
          <div className="mt-8 h-1 w-24 bg-white rounded-full"></div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#A1887F] p-8 transform transition-all hover:shadow-3xl">
          <h2 className="text-3xl font-bold text-[#854C52] mb-6 text-left">
            Edit Profile
          </h2>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-300 text-red-700 px-4 py-2 mb-6 rounded-r-lg animate-slide-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative ml-4">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A1887F] bg-gray-50 transition-all"
                required
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>

            <div className="relative ml-4">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A1887F] bg-gray-50 transition-all"
                required
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                />
              </svg>
            </div>

            <div className="relative ml-4">
              <input
                type="password"
                name="password"
                placeholder="New Password (optional)"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A1887F] bg-gray-50 transition-all"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 11c0-1.104-.896-2-2-2s-2 .896-2 2 2 4 2 4m2-4c0-1.104-.896-2-2-2s-2 .896-2 2m4 0c0-1.104-.896-2-2-2s-2 .896-2 2m6 0c0-1.104-.896-2-2-2s-2 .896-2 2m4 0v6H8m8-6v6"
                />
              </svg>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#854C52] text-white py-3 rounded-lg hover:bg-[#6D3C44] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold tracking-wide flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </form>

          <div className="text-center mt-6 text-gray-700 text-sm">
            <p>
              Back to homepage?{' '}
              <span
                onClick={() => router.push('/homepage')}
                className="text-[#854C52] cursor-pointer hover:underline font-semibold transition-all"
              >
                Return
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
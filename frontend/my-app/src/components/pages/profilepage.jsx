'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ProfileUpdate() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    profilePhoto: null,
  });
  const [previewImage, setPreviewImage] = useState(null);
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
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to fetch profile data');
        }
        const data = await res.json();
        setFormData({
          name: data.username || '',
          email: data.email || '',
          password: '',
          profilePhoto: null, // Keep as null for file input
        });
        setPreviewImage(data.profilePhoto || null);
      } catch (err) {
        const errorMessage = err.message || 'Failed to fetch profile data';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    };

    fetchUserData();
  }, [router]);

  const handleChange = (e) => {
    if (e.target.name === 'profilePhoto') {
      const file = e.target.files[0];
      if (file) {
        console.log('Selected file:', {
          name: file.name,
          type: file.type,
          size: file.size
        });

        // Validate file type and size
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
          setError('Please upload a valid image (jpg, jpeg, or png)');
          e.target.value = ''; // Clear the input
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          setError('Image size must be under 5MB');
          e.target.value = ''; // Clear the input
          return;
        }
        
        setFormData({ ...formData, profilePhoto: file });
        const previewUrl = URL.createObjectURL(file);
        setPreviewImage(previewUrl);
      } else {
        setFormData({ ...formData, profilePhoto: null });
        setPreviewImage(null);
      }
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
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

    // Create FormData
    const updateData = new FormData();
    
    // Only append non-empty values
    if (formData.name && formData.name.trim()) {
      updateData.append('username', formData.name.trim());
    }
    if (formData.email && formData.email.trim()) {
      updateData.append('email', formData.email.trim());
    }
    if (formData.password && formData.password.trim()) {
      updateData.append('password', formData.password.trim());
    }
    if (formData.profilePhoto && formData.profilePhoto instanceof File) {
      updateData.append('profilePhoto', formData.profilePhoto);
      console.log('Appending file:', formData.profilePhoto.name);
    }

    // Debug FormData contents
    console.log('FormData contents:');
    for (let [key, value] of updateData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File - ${value.name} (${value.type}, ${value.size} bytes)`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }

    try {
      console.log('Sending request to update profile...');
      const res = await fetch('http://localhost:5000/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type for FormData - let browser set it with boundary
        },
        body: updateData,
      });

      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);
      
      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      let data;
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        // If not JSON, get text to see what we're receiving
        const text = await res.text();
        console.log('Non-JSON response:', text);
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}...`);
      }
      
      console.log('Response data:', data);

      if (!res.ok) {
        const errorMsg = data.error || data.message || `HTTP ${res.status}: ${res.statusText}`;
        console.error('Server error details:', {
          error: data.error,
          errorCode: data.errorCode,
          details: data.details,
          errorName: data.errorName
        });
        throw new Error(errorMsg);
      }

      // Update localStorage
      if (data.username) localStorage.setItem('username', data.username);
      if (data.email) localStorage.setItem('email', data.email);
      if (data.profilePhoto) localStorage.setItem('profilePhoto', data.profilePhoto);

      toast.success('Profile updated successfully!');
      router.push('/homepage');
    } catch (err) {
      console.error('Update profile error:', err);
      let errorMessage = 'Failed to update profile';
      
      if (err.message) {
        errorMessage = err.message;
      } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = 'Network error - please check your connection';
      }
      
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
          backgroundImage: 'url("image.png")',
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
            {previewImage && (
              <div className="flex justify-center mb-4">
                <img
                  src={previewImage}
                  alt="Profile Preview"
                  className="w-24 h-24 rounded-full object-cover border-2 border-[#A1887F]"
                />
              </div>
            )}

            <div className="relative ml-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Photo
              </label>
              <input
                type="file"
                name="profilePhoto"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A1887F] bg-gray-50 transition-all"
              />
            </div>

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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
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
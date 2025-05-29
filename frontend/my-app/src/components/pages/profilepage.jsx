// 'use client';
// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import toast from 'react-hot-toast';

// const ProfileUpdatePage = () => {
//   const [user, setUser] = useState(null);
//   const [form, setForm] = useState({
//     name: '',
//     email: '',
//     currentPassword: '',
//     newPassword: '',
//     confirmPassword: '',
//     profilePhoto: null,
//   });
//   const [preview, setPreview] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [updating, setUpdating] = useState(false);
//   const router = useRouter();

//   useEffect(() => {
//     const fetchUser = async () => {
//       try {
//         setLoading(true);
//         const token = localStorage.getItem('token');
//         const userId = JSON.parse(localStorage.getItem('user'))?._id;

//         if (!token || !userId) {
//           toast.error('Please login first');
//           return router.push('/login');
//         }

//         const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         });

//         if (!res.ok) {
//           throw new Error(`HTTP error! status: ${res.status}`);
//         }
        
//         const userData = await res.json();
//         setUser(userData);
//         setForm({
//           name: userData.name || '',
//           email: userData.email || '',
//           currentPassword: '',
//           newPassword: '',
//           confirmPassword: '',
//           profilePhoto: null,
//         });
        
//         // Set current profile photo as preview
//         if (userData.profilePhoto) {
//           setPreview(userData.profilePhoto);
//         }
//       } catch (err) {
//         console.error('Failed to fetch user:', err);
//         toast.error('Failed to load profile');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUser();
//   }, [router]);

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       setForm({ ...form, profilePhoto: file });
      
//       // Create preview URL
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setPreview(reader.result);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const validateForm = () => {
//     if (!form.name.trim()) {
//       toast.error('Name is required');
//       return false;
//     }
    
//     if (!form.email.trim()) {
//       toast.error('Email is required');
//       return false;
//     }
    
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     if (!emailRegex.test(form.email)) {
//       toast.error('Please enter a valid email');
//       return false;
//     }

//     // If updating password, validate password fields
//     if (form.newPassword || form.confirmPassword || form.currentPassword) {
//       if (!form.currentPassword) {
//         toast.error('Current password is required to change password');
//         return false;
//       }
      
//       if (!form.newPassword) {
//         toast.error('New password is required');
//         return false;
//       }
      
//       if (form.newPassword !== form.confirmPassword) {
//         toast.error('New passwords do not match');
//         return false;
//       }
      
//       if (form.newPassword.length < 6) {
//         toast.error('New password must be at least 6 characters long');
//         return false;
//       }
//     }
    
//     return true;
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!validateForm()) return;
    
//     try {
//       setUpdating(true);
//       const token = localStorage.getItem('token');
//       const userId = JSON.parse(localStorage.getItem('user'))?._id;
      
//       if (!token || !userId) {
//         toast.error('Please login first');
//         return router.push('/login');
//       }

//       const formData = new FormData();
//       formData.append('name', form.name.trim());
//       formData.append('email', form.email.trim());
      
//       // Only include password fields if user is changing password
//       if (form.newPassword) {
//         formData.append('currentPassword', form.currentPassword);
//         formData.append('password', form.newPassword);
//       }
      
//       if (form.profilePhoto) {
//         formData.append('profilePhoto', form.profilePhoto);
//       }

//       const res = await fetch(
//         `http://localhost:5000/api/users/update-profile/${userId}`,
//         {
//           method: 'PUT',
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//           body: formData,
//         }
//       );

//       if (!res.ok) {
//         const errorData = await res.json();
//         throw new Error(errorData.message || 'Failed to update profile');
//       }
      
//       const updatedUserData = await res.json();
      
//       // Update local storage with new user data
//       const currentUser = JSON.parse(localStorage.getItem('user'));
//       const updatedUser = { ...currentUser, ...updatedUserData };
//       localStorage.setItem('user', JSON.stringify(updatedUser));
      
//       setUser(updatedUserData);
      
//       // Clear password fields after successful update
//       setForm({
//         ...form,
//         currentPassword: '',
//         newPassword: '',
//         confirmPassword: '',
//         profilePhoto: null,
//       });
      
//       toast.success('Profile updated successfully!');
      
//       // Optionally redirect to profile view page
//       // router.push('/profile');
      
//     } catch (err) {
//       console.error('Update failed:', err);
//       toast.error(err.message || 'Failed to update profile');
//     } finally {
//       setUpdating(false);
//     }
//   };

//   const handleCancel = () => {
//     // Reset form to original user data
//     if (user) {
//       setForm({
//         name: user.name || '',
//         email: user.email || '',
//         currentPassword: '',
//         newPassword: '',
//         confirmPassword: '',
//         profilePhoto: null,
//       });
//       setPreview(user.profilePhoto || null);
//     }
//     toast.info('Changes cancelled');
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#854C52] mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading profile...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!user) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <p className="text-gray-600 mb-4">No user data found</p>
//           <button
//             onClick={() => router.push('/login')}
//             className="bg-[#854C52] text-white px-4 py-2 rounded hover:bg-[#6D3C44] transition-colors"
//           >
//             Go to Login
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 py-8">
//       <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
//         <div className="flex items-center justify-between mb-6">
//           <h1 className="text-3xl font-bold text-gray-800">Update Profile</h1>
//           <button
//             onClick={() => router.back()}
//             className="text-gray-600 hover:text-gray-800 transition-colors"
//           >
//             ← Back
//           </button>
//         </div>
        
//         {/* Profile Photo Section */}
//         <div className="flex flex-col items-center mb-8">
//           <div className="relative mb-4">
//             {preview ? (
//               <img
//                 src={preview}
//                 alt="Profile Preview"
//                 className="w-32 h-32 object-cover rounded-full border-4 border-gray-200"
//               />
//             ) : (
//               <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center border-4 border-gray-200">
//                 <span className="text-gray-500 text-sm">No Photo</span>
//               </div>
//             )}
//           </div>
          
//           <div className="text-center">
//             <label className="cursor-pointer bg-[#854C52] text-white px-4 py-2 rounded hover:bg-[#6D3C44] transition-colors inline-block">
//               Choose New Photo
//               <input
//                 type="file"
//                 name="profilePhoto"
//                 onChange={handleFileChange}
//                 accept="image/*"
//                 className="hidden"
//               />
//             </label>
//             <p className="text-sm text-gray-500 mt-2">JPG, PNG or GIF (max 5MB)</p>
//           </div>
//         </div>
        
//         <form onSubmit={handleSubmit} className="space-y-6">
//           {/* Basic Information */}
//           <div className="grid md:grid-cols-2 gap-6">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Full Name *
//               </label>
//               <input
//                 type="text"
//                 name="name"
//                 value={form.name}
//                 onChange={handleChange}
//                 className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854C52] focus:border-transparent"
//                 required
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">
//                 Email Address *
//               </label>
//               <input
//                 type="email"
//                 name="email"
//                 value={form.email}
//                 onChange={handleChange}
//                 className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854C52] focus:border-transparent"
//                 required
//               />
//             </div>
//           </div>
          
//           {/* Password Section */}
//           <div className="border-t pt-6">
//             <h3 className="text-lg font-medium text-gray-800 mb-4">Change Password (Optional)</h3>
//             <div className="grid md:grid-cols-3 gap-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Current Password
//                 </label>
//                 <input
//                   type="password"
//                   name="currentPassword"
//                   value={form.currentPassword}
//                   onChange={handleChange}
//                   placeholder="Enter current password"
//                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854C52] focus:border-transparent"
//                 />
//               </div>
              
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   New Password
//                 </label>
//                 <input
//                   type="password"
//                   name="newPassword"
//                   value={form.newPassword}
//                   onChange={handleChange}
//                   placeholder="Enter new password"
//                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854C52] focus:border-transparent"
//                 />
//               </div>
              
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Confirm New Password
//                 </label>
//                 <input
//                   type="password"
//                   name="confirmPassword"
//                   value={form.confirmPassword}
//                   onChange={handleChange}
//                   placeholder="Confirm new password"
//                   className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#854C52] focus:border-transparent"
//                 />
//               </div>
//             </div>
//             <p className="text-sm text-gray-500 mt-2">
//               Leave password fields empty if you don't want to change your password
//             </p>
//           </div>
          
//           {/* Action Buttons */}
//           <div className="flex flex-col sm:flex-row gap-4 pt-6">
//             <button
//               type="submit"
//               disabled={updating}
//               className="flex-1 bg-[#854C52] text-white py-3 px-6 rounded-lg hover:bg-[#6D3C44] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
//             >
//               {updating ? (
//                 <>
//                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                   Updating...
//                 </>
//               ) : (
//                 'Update Profile'
//               )}
//             </button>
            
//             <button
//               type="button"
//               onClick={handleCancel}
//               disabled={updating}
//               className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               Cancel Changes
//             </button>
//           </div>
//         </form>
        
//         {/* Additional Info */}
//         <div className="mt-8 p-4 bg-gray-50 rounded-lg">
//           <h4 className="font-medium text-gray-800 mb-2">Account Information</h4>
//           <div className="text-sm text-gray-600 space-y-1">
//             <p><strong>User ID:</strong> {user._id}</p>
//             <p><strong>Account Created:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</p>
//             <p><strong>Last Updated:</strong> {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProfileUpdatePage;
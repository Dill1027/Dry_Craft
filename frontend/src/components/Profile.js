import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';

function Profile() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const defaultAvatarUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8081'}/images/default-avatar.png`;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('image', image);

      const response = await axiosInstance.put(`/api/users/${user.id}/profile-picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update local storage with new user data
      const updatedUser = { ...user, profilePicture: response.data.profilePicture };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      setSuccess('Profile picture updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile picture');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>
        
        {error && <div className="mb-4 text-red-500">{error}</div>}
        {success && <div className="mb-4 text-green-500">{success}</div>}

        <div className="flex items-center space-x-6 mb-6">
          <div className="w-24 h-24 rounded-full overflow-hidden">
            <img
              src={previewUrl || (user.profilePicture ? (user.profilePicture.startsWith('/api/') ? user.profilePicture : `/api/media/${user.profilePicture}`) : defaultAvatarUrl)}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={(e) => {
                console.log('Failed to load image:', e.target.src);
                e.target.onerror = null; // Prevent infinite loop
                e.target.src = defaultAvatarUrl;
              }}
            />
          </div>
          
          <div>
            <h3 className="text-lg font-medium">{user.firstName} {user.lastName}</h3>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Profile Picture
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100"
            />
          </div>
          
          <button
            type="submit"
            disabled={!image || loading}
            className={`w-full py-2 px-4 rounded-md text-white font-medium
              ${!image || loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            {loading ? 'Updating...' : 'Update Profile Picture'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;

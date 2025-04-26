import React, { useState } from 'react';
import axiosInstance from '../utils/axios';

function Tutorial({ tutorial, onTutorialDeleted, onTutorialUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: tutorial.title,
    description: tutorial.description,
    steps: tutorial.steps,
    materials: tutorial.materials || [] // Add materials
  });
  const [newVideo, setNewVideo] = useState(null);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const user = JSON.parse(localStorage.getItem('user'));

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this tutorial?')) return;

    try {
      setDeleting(true);
      await axiosInstance.delete(`/api/tutorials/${tutorial.id}`);
      onTutorialDeleted?.(tutorial.id);
    } catch (error) {
      console.error('Error deleting tutorial:', error);
      setError('Failed to delete tutorial');
      setTimeout(() => setError(null), 3000);
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editData.title.trim()) return;

    try {
      setUpdating(true);
      const formData = new FormData();
      formData.append('title', editData.title);
      formData.append('description', editData.description);
      editData.steps.forEach((step, index) => {
        formData.append(`steps[${index}]`, step);
      });
      editData.materials.forEach((material, index) => {
        formData.append(`materials[${index}]`, material);
      });
      if (newVideo) {
        formData.append('video', newVideo);
      }

      const response = await axiosInstance.put(
        `/api/tutorials/${tutorial.id}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      onTutorialUpdated?.(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating tutorial:', error);
      setError(error.response?.data || 'Failed to update tutorial');
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {error && (
        <div className="bg-red-100 text-red-600 p-3 rounded mb-4">
          {error}
        </div>
      )}

      {isEditing ? (
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          <input
            type="text"
            value={editData.title}
            onChange={(e) => setEditData({...editData, title: e.target.value})}
            className="w-full p-2 border rounded"
            placeholder="Tutorial title"
          />
          <textarea
            value={editData.description}
            onChange={(e) => setEditData({...editData, description: e.target.value})}
            className="w-full p-2 border rounded"
            placeholder="Description"
            rows="3"
          />
          {editData.steps.map((step, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={step}
                onChange={(e) => {
                  const newSteps = [...editData.steps];
                  newSteps[index] = e.target.value;
                  setEditData({...editData, steps: newSteps});
                }}
                className="flex-1 p-2 border rounded"
                placeholder={`Step ${index + 1}`}
              />
              <button
                type="button"
                onClick={() => {
                  const newSteps = editData.steps.filter((_, i) => i !== index);
                  setEditData({...editData, steps: newSteps});
                }}
                className="px-3 py-2 text-red-500 hover:bg-red-50 rounded"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setEditData({
              ...editData,
              steps: [...editData.steps, '']
            })}
            className="text-blue-500 hover:text-blue-600"
          >
            + Add Step
          </button>
          
          <div>
            <h3 className="font-semibold mb-2">Materials:</h3>
            {editData.materials.map((material, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={material}
                  onChange={(e) => {
                    const newMaterials = [...editData.materials];
                    newMaterials[index] = e.target.value;
                    setEditData({...editData, materials: newMaterials});
                  }}
                  className="flex-1 p-2 border rounded"
                  placeholder={`Material ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    const newMaterials = editData.materials.filter((_, i) => i !== index);
                    setEditData({...editData, materials: newMaterials});
                  }}
                  className="px-3 py-2 text-red-500 hover:bg-red-50 rounded"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setEditData({
                ...editData,
                materials: [...editData.materials, '']
              })}
              className="text-blue-500 hover:text-blue-600"
            >
              + Add Material
            </button>
          </div>

          <div>
            <input
              type="file"
              accept="video/mp4,video/quicktime"
              onChange={(e) => setNewVideo(e.target.files[0])}
              className="mb-2"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating || !editData.title.trim()}
              className={`px-4 py-2 rounded text-white ${
                updating || !editData.title.trim()
                  ? 'bg-gray-400'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {updating ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">{tutorial.title}</h2>
            {user?.id === tutorial.authorId && (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-500 hover:text-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className={`text-red-500 ${
                    deleting ? 'opacity-50' : 'hover:text-red-600'
                  }`}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )}
          </div>

          <p className="text-gray-600 mb-4">{tutorial.description}</p>

          {tutorial.materials?.length > 0 && (
            <div className="border-t pt-4 mb-4">
              <h3 className="font-semibold mb-2">Required Materials:</h3>
              <ul className="list-disc list-inside space-y-1">
                {tutorial.materials.map((material, index) => (
                  <li key={index} className="text-gray-700">{material}</li>
                ))}
              </ul>
            </div>
          )}

          {tutorial.videoUrl && (
            <div className="mb-4">
              <video
                src={tutorial.videoUrl}
                controls
                className="w-full rounded"
                preload="metadata"
              />
            </div>
          )}

          {tutorial.steps?.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Steps:</h3>
              <ol className="list-decimal list-inside space-y-2">
                {tutorial.steps.map((step, index) => (
                  <li key={index} className="text-gray-700">{step}</li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Tutorial;

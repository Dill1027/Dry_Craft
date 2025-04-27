import React, { useState, useEffect } from "react";
import PropTypes from 'prop-types';
import axiosInstance from "../utils/axios";
import { getFullUrl, handleImageError, getMediaUrl } from '../utils/mediaUtils';

const PLACEHOLDER_IMAGE = '/images/placeholder.png';

function Post({ 
  post, 
  onPostDeleted = () => {}, 
  onPostUpdated = () => {} 
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editImages, setEditImages] = useState([]);
  const [editPreviewUrls, setEditPreviewUrls] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [mediaUrls, setMediaUrls] = useState({});
  const [error, setError] = useState(null);
  const [videoError, setVideoError] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showComments, setShowComments] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState("");
  const [editingCommentIndex, setEditingCommentIndex] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const user = JSON.parse(localStorage.getItem("user"));
  const defaultAvatarUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8081'}/images/default-avatar.png`;

  const visibleComments = showAllComments ? comments : comments.slice(0, 2);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const loadMedia = async () => {
    try {
      setVideoError(false);
      const newMediaUrls = {};

      if (post.videoUrl) {
        const mediaId = post.videoUrl.split("/").pop();
        try {
          const videoUrl = await getMediaUrl(mediaId, post.videoUrl);
          if (videoUrl) {
            newMediaUrls.video = videoUrl;
          } else {
            setVideoError(true);
          }
        } catch (error) {
          console.error('Error loading video:', error);
          setVideoError(true);
        }
      }

      if (post.imageUrls?.length) {
        for (const url of post.imageUrls) {
          const mediaId = url.split("/").pop();
          try {
            const mediaUrl = await getMediaUrl(mediaId, url);
            if (mediaUrl) newMediaUrls[mediaId] = mediaUrl;
          } catch (error) {
            console.error(`Error loading image ${mediaId}:`, error);
            // Use placeholder for failed images
            newMediaUrls[mediaId] = PLACEHOLDER_IMAGE;
          }
        }
      }

      setMediaUrls(prevUrls => ({...prevUrls, ...newMediaUrls}));
    } catch (error) {
      console.error('Error in loadMedia:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();
    
    if (isMounted) {
      loadMedia();
    }

    return () => {
      isMounted = false;
      abortController.abort();
      Object.values(mediaUrls).forEach((url) => {
        if (url?.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [post.videoUrl, post.imageUrls]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      setDeleting(true);
      await axiosInstance.delete(`/api/posts/${post.id}?userId=${user.id}`);
      onPostDeleted?.(post.id);
      setShowMenu(false);
    } catch (error) {
      console.error("Error deleting post:", error);
      setError("Failed to delete post");
      setTimeout(() => setError(null), 3000);
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowMenu(false);
    setEditContent(post.content);
    setEditImages([]);
    setEditPreviewUrls([]);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setEditImages(files);
    const urls = files.map((file) => URL.createObjectURL(file));
    setEditPreviewUrls(urls);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editContent.trim() && editImages.length === 0) return;

    try {
      setUpdating(true);
      const formData = new FormData();
      formData.append("userId", user.id);
      formData.append("content", editContent);
      editImages.forEach((image) => formData.append("images", image));

      const response = await axiosInstance.put(`/api/posts/${post.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onPostUpdated?.(response.data);
      setIsEditing(false);

      editPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    } catch (error) {
      console.error("Error updating post:", error);
      setError(error.response?.data || "Failed to update post");
      setTimeout(() => setError(null), 3000);
    } finally {
      setUpdating(false);
    }
  };

  const handleLike = async () => {
    try {
      const response = await axiosInstance.interact(
        `/api/posts/${post.id}/like`,
        'POST',
        null,
        { userId: user.id }
      );
      
      setIsLiked(response.data.isLiked);
      setLikeCount(response.data.likeCount);
    } catch (error) {
      console.error('Error toggling like:', error);
      setError(error.code === 'ECONNABORTED' 
        ? "Request timed out. Please try again." 
        : "Failed to update like status"
      );
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleCommentClick = () => {
    setShowAllComments(!showAllComments);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      const response = await axiosInstance.post(
        `/api/posts/${post.id}/comments`,
        null,
        {
          params: {
            userId: user.id,
            content: newComment.trim()
          }
        }
      );
      setComments(response.data.comments);
      setNewComment("");
    } catch (error) {
      console.error('Error adding comment:', error);
      setError("Failed to add comment");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleEditComment = (index, content) => {
    const commentContent = content.split(": ")[1];
    setEditingCommentIndex(index);
    setEditCommentContent(commentContent);
  };

  const handleUpdateComment = async (index) => {
    if (!editCommentContent.trim()) return;
    
    try {
      const response = await axiosInstance.put(
        `/api/posts/${post.id}/comments/${index}`,
        null,
        {
          params: {
            userId: user.id,
            content: editCommentContent.trim()
          }
        }
      );
      setComments(response.data.comments);
      setEditingCommentIndex(null);
      setEditCommentContent('');
    } catch (error) {
      console.error('Error updating comment:', error);
      setError("Failed to update comment");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDeleteComment = async (index) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await axiosInstance.delete(
        `/api/posts/${post.id}/comments/${index}`,
        {
          params: { userId: user.id }
        }
      );
      setComments(response.data.comments);
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError("Failed to delete comment");
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md mb-4 p-4 relative">
      {error && (
        <div className="absolute top-0 left-0 w-full bg-red-500 text-white text-center py-2">
          {error}
        </div>
      )}
      {user && user.id === post.userId && (
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 rounded-full"
            disabled={deleting || updating}
          >
            <svg
              className="w-6 h-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
              <button
                onClick={handleEdit}
                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
              >
                Edit Post
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={`w-full text-left px-4 py-2 text-sm ${
                  deleting ? "text-gray-400" : "text-red-600 hover:bg-gray-100"
                }`}
              >
                {deleting ? "Deleting..." : "Delete Post"}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center mb-4">
        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center mr-3">
          {post.userProfilePicture ? (
            <img
              src={post.userProfilePicture.startsWith('/api/') ? post.userProfilePicture : `/api/media/${post.userProfilePicture}`}
              alt={post.userName}
              className="w-full h-full rounded-full object-cover"
              onError={(e) => {
                console.log('Failed to load profile picture:', e.target.src);
                e.target.onerror = null;
                e.target.src = defaultAvatarUrl;
              }}
            />
          ) : (
            <span className="text-lg font-semibold">
              {post.userName?.charAt(0)}
            </span>
          )}
        </div>
        <div>
          <h3 className="font-semibold">{post.userName || "Unknown User"}</h3>
          <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleUpdateSubmit} className="mt-4">
          <textarea
            className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            disabled={updating}
          />
          {editPreviewUrls.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {editPreviewUrls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Preview ${index}`}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              ))}
            </div>
          )}
          <div className="flex justify-between items-center">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="edit-image-input"
              disabled={updating}
            />
            <label
              htmlFor="edit-image-input"
              className="cursor-pointer text-blue-500 hover:text-blue-600"
            >
              Add Images
            </label>
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  updating || (!editContent.trim() && editImages.length === 0)
                }
                className={`px-4 py-2 rounded text-white ${
                  updating || (!editContent.trim() && editImages.length === 0)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {updating ? "Updating..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <>
          <p className="mb-4">{post.content}</p>

          {post.videoUrl && (
            <div className="mb-4">
              {videoError ? (
                <div className="bg-gray-100 p-4 rounded-lg text-center">
                  <p className="text-gray-600">Video failed to load</p>
                  <button 
                    onClick={() => {
                      setVideoError(false);
                      loadMedia();
                    }}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  >
                    Retry Loading
                  </button>
                </div>
              ) : (
                <video
                  key={mediaUrls.video} // Add key to force remount on URL change
                  src={mediaUrls.video || getFullUrl(post.videoUrl)}
                  className="max-h-96 w-full object-contain"
                  controls
                  playsInline
                  preload="metadata"
                  onError={(e) => {
                    console.error("Video loading error:", e);
                    setVideoError(true);
                  }}
                />
              )}
            </div>
          )}

          {post.imageUrls?.map((url, index) => {
            const mediaId = url.split("/").pop();
            return (
              <img
                key={index}
                src={mediaUrls[mediaId] || getFullUrl(url)}
                alt={`Post image ${index + 1}`}
                className="max-h-96 object-contain mb-4 w-full"
                onError={(e) => {
                  const fallbackUrl = handleImageError(url);
                  if (fallbackUrl) {
                    e.target.src = fallbackUrl;
                  }
                }}
              />
            );
          })}

          <div className="flex flex-col border-t mt-4 pt-4">
            <div className="flex items-center space-x-6 mb-4">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-1 ${
                  isLiked ? "text-blue-500" : "text-gray-500"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill={isLiked ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
                <span>{likeCount}</span>
              </button>
              
              <button 
                onClick={() => setShowComments(!showComments)}
                className="flex items-center space-x-2 text-gray-500 hover:text-blue-500"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span>{comments.length}</span>
              </button>
            </div>

            {showComments && (
              <div className="mt-4 space-y-3">
                {visibleComments.map((comment, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg mb-2">
                    <div className="flex justify-between items-start">
                      {editingCommentIndex === index ? (
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={editCommentContent}
                            onChange={(e) => setEditCommentContent(e.target.value)}
                            className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleUpdateComment(index)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingCommentIndex(null)}
                            className="px-3 py-1 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600">{comment}</p>
                          <div className="flex gap-2 ml-2">
                            <button
                              onClick={() => handleEditComment(index, comment)}
                              className="text-blue-500 hover:text-blue-600 text-sm"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteComment(index)}
                              className="text-red-500 hover:text-red-600 text-sm"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round" 
                                  strokeWidth="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                
                {comments.length > 2 && (
                  <button
                    onClick={handleCommentClick}
                    className="text-sm text-blue-500 hover:text-blue-600 mb-4"
                  >
                    {showAllComments 
                      ? "Show less comments" 
                      : `Show ${comments.length - 2} more comments`}
                  </button>
                )}
                
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className={`px-4 py-2 rounded text-white ${
                      !newComment.trim() 
                        ? "bg-gray-300 cursor-not-allowed" 
                        : "bg-blue-500 hover:bg-blue-600"
                    }`}
                  >
                    Comment
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

Post.propTypes = {
  post: PropTypes.shape({
    id: PropTypes.string.isRequired,
    userId: PropTypes.string.isRequired,
    userName: PropTypes.string,
    userProfilePicture: PropTypes.string,
    content: PropTypes.string,
    videoUrl: PropTypes.string,
    imageUrls: PropTypes.arrayOf(PropTypes.string),
    likes: PropTypes.number,
    comments: PropTypes.arrayOf(PropTypes.string),
    createdAt: PropTypes.string,
    likeCount: PropTypes.number,
    isLiked: PropTypes.bool
  }).isRequired,
  onPostDeleted: PropTypes.func,
  onPostUpdated: PropTypes.func
};

export default Post;
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
  const [isHoveringLike, setIsHoveringLike] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));
  const defaultAvatarUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:8081'}/images/default-avatar.png`;

  const visibleComments = showAllComments ? comments : comments.slice(0, 2);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const loadMedia = async () => {
    try {
      setVideoError(false);
      const newMediaUrls = {};

      if (post.videoUrl) {
        const mediaId = post.videoUrl.split("/").pop();
        try {
          const videoUrl = await getMediaUrl(mediaId, post.videoUrl, {
            retries: 2,
            retryDelay: 1000,
            timeout: 20000
          });
          if (videoUrl) {
            newMediaUrls.video = videoUrl;
          }
        } catch (error) {
          console.error('Error loading video:', error);
          newMediaUrls.video = getFullUrl(post.videoUrl);
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
            newMediaUrls[mediaId] = PLACEHOLDER_IMAGE;
          }
        }
      }

      setMediaUrls(prevUrls => {
        Object.values(prevUrls).forEach(url => {
          if (url?.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
        return {...prevUrls, ...newMediaUrls};
      });
    } catch (error) {
      console.error('Error in loadMedia:', error);
      setError("Failed to load media content");
    }
  };

  const handleVideoError = async (e) => {
    console.error("Video loading error:", e);
    
    try {
      const video = e.target;
      
      const directUrl = getFullUrl(post.videoUrl);
      if (video.src !== directUrl) {
        console.log("Attempting direct URL:", directUrl);
        video.src = directUrl;
        return;
      }

      if (post.videoUrl) {
        const mediaId = post.videoUrl.split("/").pop();
        const videoUrl = await getMediaUrl(mediaId, post.videoUrl, {
          retries: 3,
          retryDelay: 1000,
          timeout: 30000,
          forceRefresh: true
        });
        
        if (videoUrl && video.src !== videoUrl) {
          console.log("Attempting media service URL:", videoUrl);
          video.src = videoUrl;
          return;
        }
      }

      throw new Error("Failed to load video after all recovery attempts");
    } catch (error) {
      console.error("Video recovery failed:", error);
      setVideoError(true);
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
      
      if (response.data.isLiked) {
        setIsHoveringLike(true);
        setTimeout(() => setIsHoveringLike(false), 1000);
      }
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

  const isCommentAuthor = (comment) => {
    const authorId = comment.split('|')[0];
    return user && user.id === authorId;
  };

  const getCommentContent = (comment) => {
    const parts = comment.split('|');
    return parts[1];
  };

  return (
    <div className="bg-white rounded-xl shadow-md mb-4 p-6 relative transition-all duration-300 hover:shadow-lg">
      {error && (
        <div className="absolute top-0 left-0 w-full bg-red-500 text-white text-center py-2 animate-fade-in-down">
          {error}
        </div>
      )}
      
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mr-3 overflow-hidden shadow-inner">
          {post.userProfilePicture ? (
            <img
              src={post.userProfilePicture.startsWith('/api/') ? post.userProfilePicture : `/api/media/${post.userProfilePicture}`}
              alt={post.userName}
              className="w-full h-full rounded-full object-cover transition-transform duration-300 hover:scale-105"
              onError={(e) => {
                console.log('Failed to load profile picture:', e.target.src);
                e.target.onerror = null;
                e.target.src = defaultAvatarUrl;
              }}
            />
          ) : (
            <span className="text-xl font-semibold text-gray-600">
              {post.userName?.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{post.userName || "Unknown User"}</h3>
          <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
        </div>
        
        {user && user.id === post.userId && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full transition-colors duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={deleting || updating}
              aria-label="Post options"
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
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in-up">
                <button
                  onClick={handleEdit}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors duration-200 flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Post
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors duration-200 flex items-center ${
                    deleting ? "text-gray-400 bg-gray-50" : "text-red-600 hover:bg-red-50"
                  }`}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {deleting ? "Deleting..." : "Delete Post"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleUpdateSubmit} className="mt-4">
          <textarea
            className="w-full p-4 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
            rows="4"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            disabled={updating}
            placeholder="What's on your mind?"
          />
          
          {editPreviewUrls.length > 0 && (
            <div className="mb-4 grid grid-cols-3 gap-2">
              {editPreviewUrls.map((url, index) => (
                <div key={index} className="relative group rounded-lg overflow-hidden aspect-square">
                  <img
                    src={url}
                    alt={`Preview ${index}`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newUrls = [...editPreviewUrls];
                      const newImages = [...editImages];
                      newUrls.splice(index, 1);
                      newImages.splice(index, 1);
                      setEditPreviewUrls(newUrls);
                      setEditImages(newImages);
                      URL.revokeObjectURL(url);
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
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
                className="cursor-pointer flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors duration-200"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Add Images
              </label>
            </div>
            
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                disabled={updating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  updating || (!editContent.trim() && editImages.length === 0)
                }
                className={`px-4 py-2 rounded-lg text-white transition-colors duration-200 ${
                  updating || (!editContent.trim() && editImages.length === 0)
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-md"
                }`}
              >
                {updating ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </span>
                ) : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <>
          <p className="mb-4 text-gray-800 whitespace-pre-line">{post.content}</p>

          {post.videoUrl && (
            <div className="mb-4 rounded-xl overflow-hidden bg-gray-100">
              {videoError ? (
                <div className="p-6 rounded-lg text-center">
                  <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="mt-2 text-gray-600">Video failed to load</p>
                  <button 
                    onClick={() => {
                      setVideoError(false);
                      loadMedia();
                    }}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
                  >
                    Retry Loading
                  </button>
                </div>
              ) : (
                <div className="relative pt-[56.25%]">
                  <video
                    key={mediaUrls.video || post.videoUrl}
                    src={mediaUrls.video || getFullUrl(post.videoUrl)}
                    className="absolute top-0 left-0 w-full h-full object-contain bg-black"
                    controls
                    playsInline
                    controlsList="nodownload"
                    preload="metadata"
                    onError={handleVideoError}
                    crossOrigin="anonymous"
                  />
                </div>
              )}
            </div>
          )}

          {post.imageUrls?.length > 0 && (
            <div className={`mb-4 rounded-xl overflow-hidden ${post.imageUrls.length > 1 ? 'grid grid-cols-2 gap-1' : ''}`}>
              {post.imageUrls.map((url, index) => {
                const mediaId = url.split("/").pop();
                return (
                  <div key={index} className="relative group">
                    <img
                      src={mediaUrls[mediaId] || getFullUrl(url)}
                      alt={`Post image ${index + 1}`}
                      className="w-full h-full max-h-96 object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const fallbackUrl = handleImageError(url);
                        if (fallbackUrl) {
                          e.target.src = fallbackUrl;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <span className="text-white text-sm">Image {index + 1} of {post.imageUrls.length}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-col border-t border-gray-100 mt-4 pt-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handleLike}
                onMouseEnter={() => setIsHoveringLike(true)}
                onMouseLeave={() => setIsHoveringLike(false)}
                className={`flex items-center space-x-1 transition-all duration-300 ${
                  isLiked ? "text-blue-500" : "text-gray-500 hover:text-blue-500"
                }`}
              >
                <div className="relative">
                  <svg
                    className={`w-6 h-6 ${isHoveringLike ? 'animate-bounce' : ''}`}
                    fill={isLiked ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={isLiked ? "0" : "2"}
                      d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                    />
                  </svg>
                  {isLiked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 bg-blue-500 rounded-full opacity-20 animate-ping"></div>
                    </div>
                  )}
                </div>
                <span className={`font-medium ${isLiked ? 'text-blue-500' : 'text-gray-600'}`}>
                  {likeCount}
                </span>
              </button>
              
              <button 
                onClick={() => setShowComments(!showComments)}
                className={`flex items-center space-x-1 transition-colors duration-300 ${
                  showComments ? "text-blue-500" : "text-gray-500 hover:text-blue-500"
                }`}
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
                <span className="font-medium">{comments.length}</span>
              </button>
            </div>

            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showComments ? 'max-h-screen' : 'max-h-0'}`}>
              <div className="space-y-3 pt-2">
                {visibleComments.map((comment, index) => (
                  <div 
                    key={index} 
                    className="p-3 bg-gray-50 rounded-lg transition-all duration-200 hover:bg-gray-100"
                  >
                    <div className="flex justify-between items-start">
                      {editingCommentIndex === index ? (
                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            value={editCommentContent}
                            onChange={(e) => setEditCommentContent(e.target.value)}
                            className="flex-1 p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                          />
                          <button
                            onClick={() => handleUpdateComment(index)}
                            className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingCommentIndex(null)}
                            className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex-1">
                            <p className="text-sm text-gray-600">{getCommentContent(comment)}</p>
                          </div>
                          {isCommentAuthor(comment) && (
                            <div className="flex gap-2 ml-2">
                              <button
                                onClick={() => handleEditComment(index, comment)}
                                className="text-gray-500 hover:text-blue-500 text-sm transition-colors duration-200"
                                aria-label="Edit comment"
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
                                className="text-gray-500 hover:text-red-500 text-sm transition-colors duration-200"
                                aria-label="Delete comment"
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
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
                
                {comments.length > 2 && (
                  <button
                    onClick={handleCommentClick}
                    className="text-sm text-blue-500 hover:text-blue-600 mb-2 transition-colors duration-200 flex items-center justify-center w-full py-2 rounded-lg hover:bg-blue-50"
                  >
                    {showAllComments ? (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                        </svg>
                        Show less comments
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                        Show {comments.length - 2} more comments
                      </>
                    )}
                  </button>
                )}
                
                <div className="flex gap-2 mt-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a comment..."
                      className="w-full p-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-4 pr-12 transition-all duration-200"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full ${
                        !newComment.trim() 
                          ? "text-gray-400 cursor-not-allowed" 
                          : "text-blue-500 hover:bg-blue-100 transition-colors duration-200"
                      }`}
                      aria-label="Post comment"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
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
  const [showComments, setShowComments] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState("");
  const [editingCommentIndex, setEditingCommentIndex] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');
  const [currentReaction, setCurrentReaction] = useState(() => {
    const savedReaction = localStorage.getItem(`post_${post.id}_reaction`);
    return savedReaction || post?.userReaction || null;
  });
  const [reactionCounts, setReactionCounts] = useState(() => {
    return post?.reactionCounts || {};
  });
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [isHoveringReaction, setIsHoveringReaction] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
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
    const abortController = new AbortController();
    
    try {
      setVideoError(false);
      const newMediaUrls = {};

      if (post.videoUrl) {
        const mediaId = post.videoUrl.split("/").pop();
        try {
          const videoUrl = await getMediaUrl(mediaId, post.videoUrl, {
            signal: abortController.signal,
            retries: 2,
            retryDelay: 1000,
            timeout: 20000
          });
          if (videoUrl) {
            newMediaUrls.video = videoUrl;
          }
        } catch (error) {
          if (!abortController.signal.aborted) {
            console.error('Error loading video:', error);
            newMediaUrls.video = getFullUrl(post.videoUrl);
          }
        }
      }

      if (!abortController.signal.aborted && post.imageUrls?.length) {
        await Promise.all(post.imageUrls.map(async (url) => {
          const mediaId = url.split("/").pop();
          try {
            const mediaUrl = await getMediaUrl(mediaId, url, {
              signal: abortController.signal
            });
            if (mediaUrl) newMediaUrls[mediaId] = mediaUrl;
          } catch (error) {
            if (!abortController.signal.aborted) {
              console.error(`Error loading image ${mediaId}:`, error);
              newMediaUrls[mediaId] = PLACEHOLDER_IMAGE;
            }
          }
        }));
      }

      if (!abortController.signal.aborted) {
        setMediaUrls(prevUrls => {
          Object.values(prevUrls).forEach(url => {
            if (url?.startsWith('blob:')) {
              URL.revokeObjectURL(url);
            }
          });
          return {...prevUrls, ...newMediaUrls};
        });
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        console.error('Error in loadMedia:', error);
        setError("Failed to load media content");
      }
    }

    return () => abortController.abort();
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

  useEffect(() => {
    if (post?.reactionCounts) {
      setReactionCounts(post.reactionCounts);
    }
    if (post?.userReaction) {
      setCurrentReaction(post.userReaction);
      localStorage.setItem(`post_${post.id}_reaction`, post.userReaction);
    }
  }, [post]);

  useEffect(() => {
    if (currentReaction) {
      localStorage.setItem(`post_${post.id}_reaction`, currentReaction);
    } else {
      localStorage.removeItem(`post_${post.id}_reaction`);
    }
  }, [currentReaction, post.id]);

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

  const handleDeleteAllComments = async () => {
    if (!window.confirm('Are you sure you want to delete all comments on this post?')) return;

    try {
      const response = await axiosInstance.delete(
        `/api/posts/${post.id}/comments/all`,
        {
          params: { userId: user.id }
        }
      );
      setComments(response.data.comments);
    } catch (error) {
      console.error('Error deleting all comments:', error);
      setError("Failed to delete all comments");
      setTimeout(() => setError(null), 3000);
    }
  };

  const isCommentAuthor = (comment) => {
    const authorId = comment.split('|')[0];
    return user && user.id === authorId;
  };

  const canDeleteComment = (comment) => {
    const authorId = comment.split('|')[0];
    return user && (user.id === authorId || user.id === post.userId);
  };

  const getCommentContent = (comment) => {
    const parts = comment.split('|');
    return parts[1];
  };

  const handleReaction = async (reactionType) => {
    if (!user) {
      setError("Please login to react to posts");
      setTimeout(() => setError(null), 3000);
      return;
    }

    const oldReaction = currentReaction;
    const oldCounts = { ...reactionCounts };

    try {
      const newReactionType = currentReaction === reactionType ? null : reactionType;
      
      // Optimistic update
      setCurrentReaction(newReactionType);
      const updatedCounts = { ...reactionCounts };
      
      if (oldReaction) {
        updatedCounts[oldReaction] = Math.max(0, (updatedCounts[oldReaction] || 0) - 1);
      }
      
      if (newReactionType) {
        updatedCounts[newReactionType] = (updatedCounts[newReactionType] || 0) + 1;
        setIsHoveringReaction(true);
      }
      setReactionCounts(updatedCounts);

      const response = await axiosInstance.post(`/api/posts/${post.id}/reactions`, {
        userId: user.id,
        reactionType: newReactionType
      });

      if (response.data) {
        setCurrentReaction(response.data.userReaction);
        setReactionCounts(response.data.reactionCounts || {});
        
        if (response.data.userReaction) {
          localStorage.setItem(`post_${post.id}_reaction`, response.data.userReaction);
        } else {
          localStorage.removeItem(`post_${post.id}_reaction`);
        }

        // Update the post in parent component
        onPostUpdated({
          ...post,
          userReaction: response.data.userReaction,
          reactionCounts: response.data.reactionCounts
        });
      }
    } catch (error) {
      // Revert changes on error
      setCurrentReaction(oldReaction);
      setReactionCounts(oldCounts);
      setError("Failed to update reaction");
      
      if (oldReaction) {
        localStorage.setItem(`post_${post.id}_reaction`, oldReaction);
      } else {
        localStorage.removeItem(`post_${post.id}_reaction`);
      }
    }
  };

  const getReactionEmoji = (type) => {
    switch (type) {
      case 'LIKE': return '👍';
      case 'HEART': return '❤️';
      default: return '👍';
    }
  };

  const getTotalReactions = () => {
    if (!reactionCounts || typeof reactionCounts !== 'object') {
      return 0;
    }
    return Object.values(reactionCounts).reduce((sum, count) => sum + (count || 0), 0);
  };

  const handleShare = async (type) => {
    try {
      const title = `Check out this post by ${post.userName}`;
      const postUrl = `${window.location.origin}/post/${post.id}`;
      const encodedUrl = encodeURIComponent(postUrl);
      const encodedTitle = encodeURIComponent(title);
      
      switch (type) {
        case 'copy':
          await navigator.clipboard.writeText(postUrl);
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 2000);
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`);
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`);
          break;
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error sharing:', error);
      setError('Failed to share post');
      setTimeout(() => setError(null), 3000);
    }
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

          <div className="flex flex-col border-t mt-4 pt-4">
            <div className="flex items-center space-x-6 mb-4">
              <div className="flex space-x-4">
                <button
                  className={`reaction-button flex items-center space-x-2 px-3 py-2 rounded-full 
                    ${currentReaction === 'LIKE' 
                      ? 'bg-blue-50 text-blue-500 scale-110' 
                      : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'} 
                    transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleReaction(currentReaction === 'LIKE' ? null : 'LIKE');
                  }}
                >
                  <span className={`text-xl transform transition-transform duration-300 
                    ${currentReaction === 'LIKE' ? 'animate-bounce' : 'hover:scale-110'}`}>
                    👍
                  </span>
                  <span className="text-sm font-medium">{reactionCounts['LIKE'] || 0}</span>
                </button>

                <button
                  className={`reaction-button flex items-center space-x-2 px-3 py-2 rounded-full 
                    ${currentReaction === 'HEART' 
                      ? 'bg-red-50 text-red-500 scale-110' 
                      : 'text-gray-500 hover:text-red-500 hover:bg-red-50'} 
                    transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleReaction(currentReaction === 'HEART' ? null : 'HEART');
                  }}
                >
                  <span className={`text-xl filter ${currentReaction === 'HEART' ? 'animate-heartbeat' : 'hover:scale-110'}
                    transform transition-transform duration-300`}>
                    ❤️
                  </span>
                  <span className="text-sm font-medium">{reactionCounts['HEART'] || 0}</span>
                </button>
              </div>

              <button 
                onClick={() => setShowComments(!showComments)}
                className={`flex items-center space-x-1 transition-colors duration-300 ${
                  showComments ? "text-blue-500" : "text-gray-500 hover:text-blue-500"
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
                  />
                </svg>
                <span className="font-medium">{comments.length}</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  <span className="font-medium">Share</span>
                </button>

                {showShareMenu && (
                  <div className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-xl shadow-lg z-50 py-2 border border-gray-100 animate-fade-in-down transform origin-bottom-right">
                    <button
                      onClick={() => handleShare('copy')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-3"
                    >
                      <span className="p-1.5 rounded-lg bg-gray-100">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                      </span>
                      <span>{shareSuccess ? 'Copied!' : 'Copy Link'}</span>
                    </button>

                    <button
                      onClick={() => handleShare('facebook')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-3"
                    >
                      <span className="p-1.5 rounded-lg bg-blue-100">
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                        </svg>
                      </span>
                      <span>Share on Facebook</span>
                    </button>

                    <button
                      onClick={() => handleShare('twitter')}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-3"
                    >
                      <span className="p-1.5 rounded-lg bg-blue-100">
                        <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                        </svg>
                      </span>
                      <span>Share on Twitter</span>
                    </button>

                    <button
                      onClick={() => handleShare('whatsapp')} 
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-3"
                    >
                      <span className="p-1.5 rounded-lg bg-green-100">
                        <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                      </span>
                      <span>Share on WhatsApp</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showComments ? 'max-h-screen' : 'max-h-0'}`}>
              <div className="space-y-3 pt-2">
                {window.location.pathname.includes('/profile') && user?.id === post.userId && comments.length > 0 && (
                  <button
                    onClick={handleDeleteAllComments}
                    className="w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                      />
                    </svg>
                    Delete All Comments
                  </button>
                )}
                {visibleComments.map((comment, index) => (
                  <div 
                    key={index} 
                    className="p-3 bg-gray-50 rounded-lg transition-all duration-200 hover:bg-gray-100 relative group"
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
                            <p className="text-sm text-gray-600 pr-8">{getCommentContent(comment)}</p>
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                            {isCommentAuthor(comment) && (
                              <>
                                <button
                                  onClick={() => handleEditComment(index, comment)}
                                  className="text-gray-500 hover:text-blue-500 text-sm transition-colors duration-200"
                                  aria-label="Edit comment"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                    />
                                  </svg>
                                </button>
                              </>
                            )}
                            {canDeleteComment(comment) && (
                              <button
                                onClick={() => handleDeleteComment(index)}
                                className="text-gray-500 hover:text-red-500 text-sm transition-colors duration-200"
                                aria-label="Delete comment"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
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
    isLiked: PropTypes.bool,
    userReaction: PropTypes.string,
    reactionCounts: PropTypes.object
  }).isRequired,
  onPostDeleted: PropTypes.func,
  onPostUpdated: PropTypes.func
};

export default Post;
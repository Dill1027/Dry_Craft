import React, { useState } from "react";
import { Box, Button, TextField, Typography, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axiosInstance from '../utils/axios';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      const jsonBlob = new Blob([JSON.stringify(formData)], {
        type: 'application/json'
      });
      formDataToSend.append('data', jsonBlob);

      if (profileImage) {
        formDataToSend.append('profileImage', profileImage);
      }

      const response = await axiosInstance.post('/api/auth/register', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Registration successful:', response.data);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error('Registration failed:', err);
      const errorMessage = err.code === 'ERR_NETWORK' 
        ? "Cannot connect to server. Please check if the server is running."
        : err.response?.data?.message || err.response?.data || "Registration failed";
      setError(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        backgroundSize: "400% 400%",
        animation: "gradient 15s ease infinite",
        p: 2,
      }}
    >
      <Paper
        elevation={10}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 450,
          borderRadius: 4,
          transform: "translateY(0)",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          "&:hover": {
            transform: "translateY(-5px)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          },
          backdropFilter: "blur(10px)",
          backgroundColor: "rgba(255, 255, 255, 0.85)",
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: "-50%",
            left: "-50%",
            width: "200%",
            height: "200%",
            background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)",
            transform: "rotate(30deg)",
            animation: "shine 3s infinite",
          },
        }}
      >
        {success && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(255, 255, 255, 0.9)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 10,
              animation: "fadeIn 0.5s ease",
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                mb: 3,
                backgroundColor: "success.light",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "scaleIn 0.5s ease",
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
              Registration Successful!
            </Typography>
            <Typography variant="body1" sx={{ color: "text.secondary" }}>
              Redirecting to login...
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 4,
            position: "relative",
          }}
        >
          <input
            accept="image/*"
            type="file"
            id="profile-image-input"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
          <label htmlFor="profile-image-input">
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                border: '2px dashed #667eea',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                mb: 2,
                '&:hover': {
                  borderColor: '#764ba2',
                }
              }}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#667eea"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              )}
            </Box>
          </label>
          <Box
            sx={{
              width: 80,
              height: 80,
              mb: 2,
              background: "linear-gradient(45deg, #667eea, #764ba2)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 20px rgba(102, 126, 234, 0.5)",
              animation: "pulse 2s infinite",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="8.5" cy="7" r="4"></circle>
              <line x1="20" y1="8" x2="20" y2="14"></line>
              <line x1="23" y1="11" x2="17" y2="11"></line>
            </svg>
          </Box>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: "linear-gradient(45deg, #667eea, #764ba2)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textAlign: "center",
            }}
          >
            Join Dry Craft
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ color: "text.secondary", textAlign: "center" }}
          >
            Create your account to get started
          </Typography>
        </Box>

        {error && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              backgroundColor: "error.light",
              color: "error.contrastText",
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              gap: 1,
              animation: "shake 0.5s ease-in-out",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              margin="normal"
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  "&.Mui-focused fieldset": {
                    borderColor: "#667eea",
                    boxShadow: "0 0 0 2px rgba(102, 126, 234, 0.2)",
                  },
                },
              }}
            />
            <TextField
              fullWidth
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              margin="normal"
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                  "&.Mui-focused fieldset": {
                    borderColor: "#667eea",
                    boxShadow: "0 0 0 2px rgba(102, 126, 234, 0.2)",
                  },
                },
              }}
            />
          </Box>
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "&.Mui-focused fieldset": {
                  borderColor: "#667eea",
                  boxShadow: "0 0 0 2px rgba(102, 126, 234, 0.2)",
                },
              },
            }}
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                "&.Mui-focused fieldset": {
                  borderColor: "#667eea",
                  boxShadow: "0 0 0 2px rgba(102, 126, 234, 0.2)",
                },
              },
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              py: 1.5,
              borderRadius: 2,
              background: "linear-gradient(45deg, #667eea, #764ba2)",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              "&:hover": {
                background: "linear-gradient(45deg, #5a6fd1, #6a4295)",
                boxShadow: "0 6px 8px rgba(0, 0, 0, 0.15)",
                transform: "translateY(-1px)",
              },
              "&:active": {
                transform: "translateY(0)",
              },
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden",
              "&::after": {
                content: '""',
                position: "absolute",
                top: "-50%",
                left: "-60%",
                width: "200%",
                height: "200%",
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)",
                transform: "rotate(30deg)",
                transition: "all 0.5s ease",
              },
              "&:hover::after": {
                left: "100%",
              },
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Box
                sx={{
                  display: "inline-block",
                  width: 20,
                  height: 20,
                  border: "2px solid rgba(255,255,255,0.3)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
            ) : (
              "Register"
            )}
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => navigate("/login")}
            sx={{
              mt: 2,
              color: "#667eea",
              "&:hover": {
                backgroundColor: "transparent",
                color: "#5a6fd1",
                textDecoration: "underline",
              },
            }}
          >
            Already have an account? Login
          </Button>
        </form>
      </Paper>

      <style>
        {`
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.7); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(102, 126, 234, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(102, 126, 234, 0); }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%, 60% { transform: translateX(-5px); }
            40%, 80% { transform: translateX(5px); }
          }
          @keyframes shine {
            to { left: 150%; }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleIn {
            from { transform: scale(0); }
            to { transform: scale(1); }
          }
        `}
      </style>
    </Box>
  );
}

export default Register;
import React, { useState } from "react";
import { Box, Button, TextField, Typography, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axios";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post("/api/auth/login", formData);
      localStorage.setItem("user", JSON.stringify(response.data));
      navigate("/");
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data || "An error occurred";
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
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 4,
          }}
        >
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
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
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
            Welcome Back
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ color: "text.secondary", textAlign: "center" }}
          >
            Sign in to continue to Dry Craft
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
              "Login"
            )}
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => navigate("/register")}
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
            Don't have an account? Register
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
        `}
      </style>
    </Box>
  );
}

export default Login;
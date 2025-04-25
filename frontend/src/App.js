import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from './components/Profile';
import Products from './pages/seller/Products';
import AddProduct from "./pages/seller/AddProduct";
import ProductList from "./pages/seller/ProductList";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/products" element={<Products />} />
            <Route path="/addproducts" element={<AddProduct />} />
            <Route path="/productlist" element={<ProductList />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

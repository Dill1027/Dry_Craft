import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from './components/Profile';

import Products from './pages/seller/Products';
import AddProduct from "./pages/seller/AddProduct";
import ProductList from "./pages/seller/ProductList";

import Tutorials from "./pages/Tutorials";
import TutorialForm from "./pages/TutorialForm";
import TutorialDetail from "./pages/TutorialDetail";
import MyTutorials from "./pages/MyTutorials";
import TutorialEdit from "./pages/TutorialEdit";


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

            <Route path="/tutorials" element={<Tutorials />} />
            <Route path="/my-tutorials" element={<MyTutorials />} />
            <Route path="/tutorials/create" element={<TutorialForm />} />
            <Route path="/tutorials/:id" element={<TutorialDetail />} />
            <Route path="/tutorials/edit/:id" element={<TutorialEdit />} />

          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

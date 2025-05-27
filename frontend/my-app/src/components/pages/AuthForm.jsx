"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function AuthForm({ type }) {
  const [formData, setFormData] = useState(
    type === "signup" 
      ? { name: "", email: "", password: "" }
      : { email: "", password: "" }
  );
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const url = type === "login" 
      ? "http://localhost:5000/api/auth/login" 
      : "http://localhost:5000/api/auth/signup";

    try {
      const res = await axios.post(url, formData);
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        router.push("/");
      }
    } catch (err) {
      console.error("Error:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.error || "Something went wrong";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-semibold mb-6 text-center">
          {type === "login" ? "Login" : "Sign Up"}
        </h2>

        {type === "signup" && (
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-2 border text-black rounded mb-4"
            required
          />
        )}

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 border text-black rounded mb-4"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full text-black p-2 border rounded mb-4"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Loading..." : (type === "login" ? "Login" : "Sign Up")}
        </button>
      </form>
    </div>
  );
}
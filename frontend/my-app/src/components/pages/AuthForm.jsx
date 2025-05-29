"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast from "react-hot-toast";

export default function AuthForm({ type }) {
  const [formData, setFormData] = useState(
    type === "signup"
      ? { name: "", email: "", password: "" }
      : { email: "", password: "" }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const url =
      type === "login"
        ? "http://localhost:5000/api/auth/login"
        : "http://localhost:5000/api/auth/signup";

    try {
      const res = await axios.post(url, formData);

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);

        const username = res.data.user?.name || "User";
        const email = res.data.user?.email || "";

        localStorage.setItem("username", username);
        localStorage.setItem("email", email);

        toast.success(
          type === "login" ? "Login successful!" : "Account created successfully!"
        );

        if (type === "login") {
          router.push("/homepage");
        } else {
          router.push("/login");
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Something went wrong";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3E2E4]">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-[#A1887F]">
        <h2 className="text-3xl font-bold mb-6 text-center text-[#854C52]">
          {type === "login" ? "Welcome Back" : "Create Account"}
        </h2>

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === "signup" && (
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A1887F]"
              required
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A1887F]"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full text-black p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A1887F]"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#854C52] text-white py-3 rounded-lg hover:bg-[#6D3C44] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {loading ? "Loading..." : type === "login" ? "Login" : "Sign Up"}
          </button>
        </form>

        <div className="text-center mt-6 text-gray-700">
          {type === "login" ? (
            <p>
              Don&apos;t have an account?{" "}
              <span
                onClick={() => router.push("/signup")}
                className="text-[#854C52] cursor-pointer hover:underline font-semibold"
              >
                Sign Up
              </span>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <span
                onClick={() => router.push("/login")}
                className="text-[#854C52] cursor-pointer hover:underline font-semibold"
              >
                Login
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

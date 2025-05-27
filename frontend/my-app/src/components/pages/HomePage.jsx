"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [username, setUsername] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("username");

    console.log("Token:", token);
    console.log("Username from localStorage:", user);

    if (token && user) {
      setUsername(user);
    } else {
      console.log("No token or username found, redirecting to login");
      router.push("/login");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-green-50 to-blue-50 relative">
      <button
        onClick={handleLogout}
        className="absolute top-6 right-6 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-lg"
      >           
        Logout
      </button>

      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4 text-gray-800">
          Welcome, {username || "User"}! 🎉
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          You have successfully logged into your account.
        </p>
        
       

        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Your Dashboard
          </h2>
          <p className="text-gray-600">
            This is your personalized homepage. You can add more features here!
          </p>
        </div>
      </div>
    </div>
  );
}
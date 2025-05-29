// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import axios from "axios";
// import toast from "react-hot-toast";

// export default function AuthForm({ type }) {
//   const [formData, setFormData] = useState(
//     type === "signup"
//       ? { name: "", email: "", password: "" }
//       : { email: "", password: "" }
//   );
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const router = useRouter();

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//     setError("");
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     setError("");

//     const url =
//       type === "login"
//         ? "http://localhost:5000/api/auth/login"
//         : "http://localhost:5000/api/auth/signup";

//     try {
//       const res = await axios.post(url, formData);

//       if (res.data.token) {
//         localStorage.setItem("token", res.data.token);

//         const username = res.data.user?.name || "User";
//         const email = res.data.user?.email || "";

//         localStorage.setItem("username", username);
//         localStorage.setItem("email", email);

//         toast.success(
//           type === "login" ? "Login successful!" : "Account created successfully!"
//         );

//         if (type === "login") {
//           router.push("/homepage");
//         } else {
//           router.push("/login");
//         }
//       }
//     } catch (err) {
//       const errorMessage = err.response?.data?.error || "Something went wrong";
//       setError(errorMessage);
//       toast.error(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-[#F3E2E4]">
//       <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-[#A1887F]">
//         <h2 className="text-3xl font-bold mb-6 text-center text-[#854C52]">
//           {type === "login" ? "Welcome Back" : "Create Account"}
//         </h2>

//         {error && (
//           <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded mb-4">
//             {error}
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-4">
//           {type === "signup" && (
//             <input
//               type="text"
//               name="name"
//               placeholder="Full Name"
//               value={formData.name}
//               onChange={handleChange}
//               className="w-full p-3 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A1887F]"
//               required
//             />
//           )}

//           <input
//             type="email"
//             name="email"
//             placeholder="Email"
//             value={formData.email}
//             onChange={handleChange}
//             className="w-full p-3 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A1887F]"
//             required
//           />

//           <input
//             type="password"
//             name="password"
//             placeholder="Password"
//             value={formData.password}
//             onChange={handleChange}
//             className="w-full text-black p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A1887F]"
//             required
//           />

//           <button
//             type="submit"
//             disabled={loading}
//             className="w-full bg-[#854C52] text-white py-3 rounded-lg hover:bg-[#6D3C44] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
//           >
//             {loading ? "Loading..." : type === "login" ? "Login" : "Sign Up"}
//           </button>
//         </form>

//         <div className="text-center mt-6 text-gray-700">
//           {type === "login" ? (
//             <p>
//               Don&apos;t have an account?{" "}
//               <span
//                 onClick={() => router.push("/signup")}
//                 className="text-[#854C52] cursor-pointer hover:underline font-semibold"
//               >
//                 Sign Up
//               </span>
//             </p>
//           ) : (
//             <p>
//               Already have an account?{" "}
//               <span
//                 onClick={() => router.push("/login")}
//                 className="text-[#854C52] cursor-pointer hover:underline font-semibold"
//               >
//                 Login
//               </span>
//             </p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }








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
    <div className="min-h-screen flex bg-[#F3E2E4]">
      {/* Left Background Photo Panel */}
      <div
        className="hidden lg:flex w-1/2 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('/image.png')",
        }}
      >
        <div className="flex flex-col justify-center items-center w-full bg-[#A1887F]/50 p-12 text-black">
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
            {type === "login" ? "Welcome Back!" : "Join Us!"}
          </h1>
          <p className="text-lg opacity-90 max-w-md text-center">
            {type === "login"
              ? "Log in to continue your journey with us."
              : "Create an account to start exploring."}
          </p>
          <div className="mt-8 h-1 w-24 bg-[#8B5D33] rounded-full"></div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#A1887F] p-8 transform transition-all hover:shadow-3xl">
          <h2 className="text-3xl font-bold text-[#854C52] mb-6 text-left">
            {type === "login" ? "Sign In" : "Sign Up"}
          </h2>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-300 text-red-700 px-4 py-2 mb-6 rounded-r-lg animate-slide-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {type === "signup" && (
              <div className="relative ml-4">
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-3 pl-10 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A1887F] bg-gray-50 transition-all"
                  required
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}

            <div className="relative ml-4">
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A1887F] bg-gray-50 transition-all"
                required
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                />
              </svg>
            </div>

            <div className="relative ml-4">
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 pl-10 border border-gray-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A1887F] bg-gray-50 transition-all"
                required
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 11c0-1.104-.896-2-2-2s-2 .896-2 2 2 4 2 4m2-4c0-1.104-.896-2-2-2s-2 .896-2 2m4 0c0-1.104-.896-2-2-2s-2 .896-2 2m6 0c0-1.104-.896-2-2-2s-2 .896-2 2m4 0v6H8m8-6v6"
                />
              </svg>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#854C52] text-white py-3 rounded-lg hover:bg-[#6D3C44] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold tracking-wide flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  Loading...
                </>
              ) : type === "login" ? (
                "Sign In"
              ) : (
                "Sign Up"
              )}
            </button>
          </form>

          <div className="text-center mt-6 text-gray-700 text-sm">
            {type === "login" ? (
              <p>
                Need an account?{" "}
                <span
                  onClick={() => router.push("/signup")}
                  className="text-[#854C52] cursor-pointer hover:underline font-semibold transition-all"
                >
                  Sign Up
                </span>
              </p>
            ) : (
              <p>
                Already registered?{" "}
                <span
                  onClick={() => router.push("/login")}
                  className="text-[#854C52] cursor-pointer hover:underline font-semibold transition-all"
                >
                  Sign In
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
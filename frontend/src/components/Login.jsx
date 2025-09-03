import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-full max-w-md p-8 bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl">
        <h2 className="text-2xl font-extrabold text-center text-federal_blue-500 mb-6">
          Welcome Back 👋
        </h2>

        <div className="space-y-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 border border-non_photo_blue-300 rounded-xl focus:ring-2 focus:ring-honolulu_blue-500 outline-none transition"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            type="email"
            className="w-full px-4 py-3 border border-non_photo_blue-300 rounded-xl focus:ring-2 focus:ring-honolulu_blue-500 outline-none transition"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            type="password"
            className="w-full px-4 py-3 border border-non_photo_blue-300 rounded-xl focus:ring-2 focus:ring-honolulu_blue-500 outline-none transition"
          />

          <button
            onClick={() => {
              if (!name || !email || !password) return alert("Please enter name, email & password");
              onLogin({ name, email, password });
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-honolulu_blue-500 to-pacific_cyan-500 text-white font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            Join 🚀
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          New here? Use the form to sign up. Existing users can login with email & password.
        </p>
      </div>
    </div>
  );
}

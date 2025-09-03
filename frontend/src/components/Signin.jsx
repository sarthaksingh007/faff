import React, { useState } from "react";

export default function Signin({ onSignin, onSwitchToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-full max-w-md p-8 bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl">
        <h2 className="text-2xl font-extrabold text-center text-federal_blue-500 mb-6">
          Sign In
        </h2>

        <div className="space-y-4">
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
              if (!email || !password) return alert("Enter email & password");
              onSignin({ email, password });
            }}
            className="w-full py-3 rounded-xl text-black bg-gradient-to-r from-honolulu_blue-500 to-pacific_cyan-500  font-semibold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            Sign In
          </button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          New here? <button onClick={onSwitchToSignup} className="text-honolulu_blue-500 underline">Create an account</button>
        </p>
      </div>
    </div>
  );
}



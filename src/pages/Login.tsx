import React, { useState } from "react"; 
import { loginUser } from "../services/auth";
import { FaEye, FaEyeSlash } from "react-icons/fa"; 

interface LoginProps {
  onLogin: (role: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); 
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!username || !password) {
      setMessage("Username and password are required");
      return;
    }

    try {
      const user = await loginUser(username, password); 
      // user.role is returned from API
      onLogin(user.role.toLowerCase()); 
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-[#020617]">
      <div className="bg-gray-900 text-white p-8 rounded-lg shadow-lg w-80">
        <h2 className="text-center text-2xl mb-4">MENT Login</h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-2 mb-3 rounded bg-gray-800 text-white focus:outline-none"
        />

        <div className="relative mb-3">
          <input
            type={showPassword ? "text" : "password"} 
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 rounded bg-gray-800 text-white pr-10 focus:outline-none"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded mt-2 font-semibold"
        >
          Login
        </button>

        {message && <p className="text-red-500 text-center mt-2">{message}</p>}
      </div>
    </div>
  );
};

export default Login;

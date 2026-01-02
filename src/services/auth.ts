import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

export async function loginUser(username: string, password: string) {
  try {
    const response = await axios.post(`${BASE_URL}/ttscanner/auth/login/`, {
      username,
      password,
    });
    const data = response.data;
    console.log("Login successful:", data);

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.user.role);
    localStorage.setItem("external_user_id", data.user.external_user_id);

    return data.user;
  } catch (error: any) {
    console.error("Login failed:", error.response?.data || error.message);
    throw error;
  }
}

// Get user role
export function getUserRole(): string | null {
  return localStorage.getItem("role");
}

// Set / clear role
export const setUserRole = (role: string) => localStorage.setItem("role", role);
export const clearUserRole = () => localStorage.removeItem("role");

// ⚡ Get external_user_id for API calls
export function getUserID(): number | null {
  const id = localStorage.getItem("external_user_id");
  return id ? parseInt(id) : null;
}

// Logout
export async function logoutUser() {
  try {
    await axios.post(`${BASE_URL}/ttscanner/logout/`);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("external_user_id"); // ⚡ remove external_user_id
  } catch (error: any) {
    console.error("Logout failed:", error.response?.data || error.message);
    throw error;
  }
}

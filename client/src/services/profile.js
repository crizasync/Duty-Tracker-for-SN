import api from "./api";

/**
 * Get the logged-in user's profile
 */
export const getProfile = async () => {
  const response = await api.get("/profile");
  return response;
};

/**
 * Update profile with or without an avatar image
 *
 * @param {FormData} formData
 */
export const updateProfile = async (formData) => {
  const response = await api.put("/profile", formData);
  return response;
};
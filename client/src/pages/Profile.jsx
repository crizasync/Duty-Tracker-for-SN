import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Camera, Pencil, UserRound, Upload, X } from "lucide-react";

import MenuBar from "../components/MenuBar";
import { getProfile, updateProfile } from "../services/profile";

const initialEditForm = {
  fullName: "",
  phoneNumber: "",
};

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editForm, setEditForm] = useState(initialEditForm);

  // New states
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await getProfile();

      const user = res.data.profile;

      setProfile(user);

      setEditForm({
        fullName: user?.full_name || "",
        phoneNumber: user?.phone_number || "",
      });

      if (user?.avatar_url) {
        setPreview(`${import.meta.env.VITE_API_URL}${user.avatar_url}`);
      }
    } catch {
      toast.error("Unable to load profile.");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = () => setIsEditOpen(true);

  const closeEditModal = () => {
    setIsEditOpen(false);

    // restore preview if cancelled
    if (profile?.avatar_url) {
      setPreview(`${import.meta.env.VITE_API_URL}${profile.avatar_url}`);
    } else {
      setPreview("");
    }

    setSelectedImage(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be less than 2MB.");
      return;
    }

    setSelectedImage(file);
    // preview for immediate display in the left card
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("fullName", editForm.fullName);
      formData.append("phoneNumber", editForm.phoneNumber);

      if (selectedImage) {
        formData.append("avatar", selectedImage);
      }

      const res = await updateProfile(formData);

      setProfile(res.data.profile);

      // Reflect updated avatar in preview (and bust cache so the new image shows)
      const updated = res?.data?.profile;

      if (updated?.avatar_url) {
        setPreview(
          `${import.meta.env.VITE_API_URL}${updated.avatar_url}?t=${Date.now()}`,
        );
      } else {
        setPreview("");
      }

      toast.success("Profile updated!");

      closeEditModal();

      loadProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSubmitting(false);
    }
  };

  const initials = (profile?.full_name || "U")
    .split(" ")
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-rose-50 p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <MenuBar />

        {/* Header */}
        <section className="rounded-3xl border border-pink-200 bg-white p-6 shadow-sm">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-pink-600">
                Account Profile
              </p>

              <h1 className="mt-2 text-3xl font-black text-rose-900">
                Your Personal Profile
              </h1>

              <p className="mt-2 text-sm text-rose-700">
                Update your personal information and profile picture.
              </p>
            </div>

            <button
              onClick={openEditModal}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-3 font-semibold text-white hover:brightness-110"
            >
              <Pencil size={18} />
              Edit Profile
            </button>
          </div>
        </section>

        {/* Body */}
        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* LEFT CARD */}

          <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-pink-200 bg-gradient-to-br from-pink-100 to-rose-100 text-4xl font-black text-rose-700">
                  {preview ? (
                    <img
                      src={preview}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>

                <button
                  onClick={openEditModal}
                  className="absolute bottom-0 right-0 rounded-full bg-pink-500 p-2 text-white shadow-lg hover:bg-pink-600"
                >
                  <Camera size={18} />
                </button>
              </div>

              <h2 className="mt-5 text-2xl font-bold text-rose-900">
                {loading ? "Loading..." : profile?.full_name}
              </h2>

              <p className="text-sm text-rose-600">{profile?.email}</p>
            </div>

            <div className="mt-8 space-y-3">
              <ProfileStat
                label="Phone Number"
                value={profile?.phone_number || "-"}
              />

              <ProfileStat
                label="Member Since"
                value={
                  profile?.created_at
                    ? profile.created_at.substring(0, 10)
                    : "-"
                }
              />
            </div>
          </div>

          {/* RIGHT SIDE STARTS HERE */}
          <div className="space-y-4 rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-pink-100 p-3 text-pink-600">
                <UserRound size={24} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-rose-900">
                  Profile Overview
                </h2>

                <p className="text-sm text-rose-600">
                  Your account information.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard label="Full Name" value={profile?.full_name || "-"} />

              <InfoCard label="Email" value={profile?.email || "-"} />

              <InfoCard
                label="Phone Number"
                value={profile?.phone_number || "-"}
              />
            </div>
          </div>
        </section>
      </div>

      {/* EDIT PROFILE MODAL */}

      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-pink-100 px-6 py-5">
              <div>
                <h2 className="text-2xl font-bold text-rose-900">
                  Edit Profile
                </h2>

                <p className="text-sm text-rose-600">
                  Update your profile information.
                </p>
              </div>

              <button
                onClick={closeEditModal}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6 p-6">
              {/* IMAGE */}

              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-4 border-pink-200 bg-pink-100">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-rose-700">
                        {initials}
                      </span>
                    )}
                  </div>

                  <label
                    htmlFor="avatar"
                    className="absolute bottom-1 right-1 cursor-pointer rounded-full bg-pink-500 p-3 text-white shadow-lg hover:bg-pink-600"
                  >
                    <Camera size={18} />
                  </label>
                </div>

                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                <p className="mt-3 text-xs text-gray-500">
                  JPG, PNG or WEBP (Maximum 2MB)
                </p>
              </div>

              {/* FORM */}

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-rose-800">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        fullName: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-pink-200 px-4 py-3 outline-none focus:border-pink-400"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-rose-800">
                    Phone Number
                  </label>

                  <input
                    type="text"
                    value={editForm.phoneNumber}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        phoneNumber: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-pink-200 px-4 py-3 outline-none focus:border-pink-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-xl border border-gray-300 px-5 py-3 font-medium hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 font-semibold text-white hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileStat({ label, value }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-rose-500">
        {label}
      </p>

      <p className="mt-1 font-semibold text-rose-900">{value}</p>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-pink-500">
        {label}
      </p>

      <p className="mt-2 break-all text-sm font-semibold text-rose-900">
        {value}
      </p>
    </div>
  );
}

import ModalDecoration from "../components/ModalDecoration";
import PageHeading from "../components/PageHeading";
import { useContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Camera, Pencil, UserRound, X } from "lucide-react";

import MenuBar from "../components/MenuBar";
import { defaultColor, useTheme } from "../context/theme";
import ThemePicker from "../components/ThemePicker";
import { getProfile, updateProfile } from "../services/profile";

import { AuthContext } from "../context/AuthContext";
import { getAvatarUrl } from "../utils/avatar";

const initialEditForm = {
  fullName: "",
  phoneNumber: "",
};

export default function Profile() {
  const { theme, setTheme } = useTheme();
  const { updateUser } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [editForm, setEditForm] = useState(initialEditForm);

  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedPreview, setSelectedPreview] = useState("");
  const savedAvatar = getAvatarUrl(profile?.avatar_url);
  const preview = selectedPreview || savedAvatar;

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        const res = await getProfile();
        if (active) setProfile(res.data.profile);
      } catch {
        if (active) toast.error("Unable to load profile.");
      } finally {
        if (active) setLoading(false);
      }
    };
    loadProfile();
    return () => { active = false; };
  }, []);

  useEffect(() => () => {
    if (selectedPreview) URL.revokeObjectURL(selectedPreview);
  }, [selectedPreview]);

  const openEditModal = () => {
    setEditForm({ fullName: profile?.full_name || "", phoneNumber: profile?.phone_number || "" });
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setSelectedImage(null);
    setSelectedPreview("");
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please select a JPG, PNG, or WEBP image.");
      return;
    }

    setSelectedImage(file);
    // Keep unsaved selections inside the editor.
    setSelectedPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (submitting) return;
    setSubmitting(true);

    try {
      const formData = new FormData();

      formData.append("fullName", editForm.fullName);
      formData.append("phoneNumber", editForm.phoneNumber);

      if (selectedImage) {
        formData.append("avatar", selectedImage);
      }

      const res = await updateProfile(formData);

      const updated = res.data.profile;
      setProfile(updated);
      updateUser(updated);
      closeEditModal();
      toast.success("Profile updated!");
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
    <div className="app-page profile-page min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <MenuBar />

        {/* Header */}
        <section className="rounded-3xl border border-pink-200 bg-white p-6 shadow-sm">
          <PageHeading eyebrow="PROFILE" title="Your little corner" description="Make yourself at home.">
            <button
              onClick={openEditModal}
              className="page-heading-primary-action flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-3 font-semibold text-white hover:brightness-110"
            >
              <Pencil size={18} />
              Edit Profile
            </button>
          </PageHeading>
        </section>

        {/* Body */}
        <section aria-labelledby="appearance-title" className="rounded-3xl border border-pink-200 bg-white p-6 shadow-sm">
          <h2 id="appearance-title" className="text-rose-900">Color theme</h2>
          <p className="mt-1 text-sm text-rose-700">Pick any color. Your preference is saved for this account on this browser.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <ThemePicker />
            <span className="font-mono text-sm text-rose-800">{theme.toUpperCase()}</span>
            <button type="button" onClick={() => setTheme(defaultColor)} className="rounded-lg border border-pink-200 px-3 py-2 text-sm font-semibold text-rose-800 hover:bg-pink-50 focus-visible:outline-2 focus-visible:outline-pink-600">Reset color</button>
          </div>
        </section>
        <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* LEFT CARD */}

          <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-pink-200 bg-gradient-to-br from-pink-100 to-rose-100 text-4xl font-black text-rose-700">
                  {savedAvatar ? (
                    <img
                      src={savedAvatar}
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

              <h2 className="mt-5 text-rose-900">
                {loading ? "Loading..." : profile?.full_name}
              </h2>

              <p className="text-sm text-rose-600">{profile?.username}</p>
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
                <h2 className="text-rose-900">
                  Profile Overview
                </h2>

                <p className="text-sm text-rose-600">
                  Your account information.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard label="Full Name" value={profile?.full_name || "-"} />

              <InfoCard label="Username" value={profile?.username || "-"} />

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
        <div className="cute-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="cute-modal w-full max-w-2xl rounded-3xl bg-white shadow-2xl">
            <div className="cute-modal-heading flex items-center justify-between border-b border-pink-100 px-6 py-5">
              <ModalDecoration />
              <div>
                <h2 className="text-rose-900">
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
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />

                <p className="mt-3 text-xs text-gray-500">
                  JPG, PNG or WEBP
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
                    placeholder="e.g. Maria Santos"
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
                    placeholder="e.g. 0912 345 6789"
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

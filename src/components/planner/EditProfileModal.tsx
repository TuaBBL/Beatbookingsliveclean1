import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { X, Upload, User } from "lucide-react";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface Profile {
  name: string;
  email: string;
  country: string;
  state: string;
  city: string;
  image_url: string | null;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  onSave,
}: EditProfileModalProps) {
  const [profile, setProfile] = useState<Profile>({
    name: "",
    email: "",
    country: "",
    state: "",
    city: "",
    image_url: null,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("name, email, country, state, city, image_url")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setProfile(data);
        setImagePreview(data.image_url);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("Please select a JPG, PNG, or WEBP image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function uploadImage(): Promise<string | null> {
    if (!imageFile) return profile.image_url;

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("media")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let imageUrl = profile.image_url;
      if (imageFile) {
        const uploadedUrl = await uploadImage();
        if (!uploadedUrl) {
          setLoading(false);
          return;
        }
        imageUrl = uploadedUrl;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          name: profile.name,
          country: profile.country,
          state: profile.state,
          city: profile.city,
          image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save profile");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-neutral-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-neutral-800">
        <div className="sticky top-0 bg-neutral-900 p-6 border-b border-neutral-800 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-3">Profile Image</label>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden border-2 border-neutral-700">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-gray-600" />
                )}
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  Upload Image
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  JPG, PNG or WEBP. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Display Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={profile.email}
              disabled
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">
              Email cannot be changed here
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Country</label>
              <select
                value={profile.country}
                onChange={(e) =>
                  setProfile({ ...profile, country: e.target.value })
                }
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-orange-500"
              >
                <option value="">Select...</option>
                <option value="AU">Australia</option>
                <option value="NZ">New Zealand</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">State</label>
              <input
                type="text"
                value={profile.state}
                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                placeholder="e.g., NSW, VIC"
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">City</label>
              <input
                type="text"
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                placeholder="e.g., Sydney"
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-neutral-900 p-6 border-t border-neutral-800 flex gap-3">
          <button
            onClick={onClose}
            disabled={loading || uploading}
            className="flex-1 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || uploading}
            className="flex-1 px-6 py-3 bg-orange-600 hover:bg-orange-700 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading || uploading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

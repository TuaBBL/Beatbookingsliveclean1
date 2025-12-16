import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import EditProfileModal from "./EditProfileModal";
import { User, Settings } from "lucide-react";

export default function PlannerProfileMenu() {
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    image_url: string | null;
  } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("name, email, image_url")
        .eq("id", user.id)
        .maybeSingle();

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  }

  if (!profile) return null;

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="text-right hidden md:block">
          <p className="font-semibold text-sm">{profile.name}</p>
          <p className="text-xs text-gray-400">{profile.email}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden border-2 border-neutral-700">
          {profile.image_url ? (
            <img
              src={profile.image_url}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-5 h-5 text-gray-600" />
          )}
        </div>
        <button
          onClick={() => setShowEditModal(true)}
          className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition"
          title="Edit Profile"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={() => {
          loadProfile();
        }}
      />
    </>
  );
}

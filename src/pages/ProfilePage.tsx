import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronLeft, User, Camera } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(() =>
    localStorage.getItem("profile_image")
  );

  const handleImageChange = (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];

    if (file.size > 4 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 4 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      localStorage.setItem("profile_image", result);
      setProfileImage(result);
      toast.success("Foto de perfil actualizada");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" /> Volver a inicio
      </button>

      <h1 className="text-2xl font-semibold tracking-tight">Mi perfil</h1>

      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Datos personales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div
              className="relative h-20 w-20 rounded-full bg-muted flex items-center justify-center overflow-hidden cursor-pointer group"
              onClick={() => fileRef.current?.click()}
            >
              {profileImage ? (
                <img src={profileImage} alt="Perfil" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageChange(e.target.files)}
            />
          </div>

          {/* Info fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Nombre</p>
              <p className="font-medium">{user?.name || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Dirección fiscal</p>
              <p className="font-medium">{user?.issuerAddress || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">NIF / CIF</p>
              <p className="font-medium">{user?.issuerNif || "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Email fiscal</p>
              <p className="font-medium">{user?.issuerEmail || "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;

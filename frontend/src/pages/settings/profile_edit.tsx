"use client";

import { useTranslation } from "../../lib/useTranslations";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SettingsLayout from "../../components/settings_layout";
import ProtectedRoute from "@/components/protected_routes/protected_routes";

function ProfileEditComponent() {
  const { t } = useTranslation();
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState("/img/user.png");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) throw new Error("No hay usuario en localStorage");

        const user = JSON.parse(userStr);
        const token = user.token;
        const userId = user.id;

        if (!token || !userId) throw new Error("Token o ID faltante");

        const response = await fetch("http://localhost:8000/perfil/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || "Error al cargar perfil");
        }

        const data = await response.json();
        setEmail(data.correo || "");
        setUsername(data.nombre || "");
        setDescription(data.descripcion || "");
        setLocation(data.ubicacion || "");
        setPhone(data.Tel ? String(data.Tel) : "");
        setProfileImage(data.foto_perfil || "/img/user.png");
        setPreviewImage(null);
      } catch (err: any) {
        setError(`No se pudo cargar el perfil: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    try {
      setIsLoading(true);
      setError("");

      const userStr = localStorage.getItem("user");
      if (!userStr) throw new Error("Usuario no autenticado");

      const user = JSON.parse(userStr);
      const token = user.token;
      const userId = user.id;

      if (!token || !userId) {
        throw new Error("Credenciales inválidas");
      }

      const formData = new FormData();
      formData.append("nombre", username);
      formData.append("descripcion", description);
      formData.append("ubicacion", location);
      formData.append("Tel", phone || "null");

      // Añadir archivo si hay preview
      if (fileInputRef.current?.files?.[0]) {
        formData.append("foto_perfil", fileInputRef.current.files[0]);
      }

      const response = await fetch(`http://localhost:8000/perfil/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // ⚠️ NO pongas Content-Type; el navegador lo pone automáticamente con boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Error al guardar");
      }

      const result = await response.json();
      const newImageUrl = result.foto_perfil || profileImage;

      // Actualizar localStorage
      const updatedUser = {
        ...user,
        nombre: username,
        perfil: {
          ...user.perfil,
          descripcion: description,
          ubicacion: location,
          Tel: phone ? parseInt(phone, 10) : null,
          foto_perfil: newImageUrl,
        },
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setProfileImage(newImageUrl);
      setPreviewImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      alert("Perfil actualizado exitosamente");
    } catch (err: any) {
      console.error("Error al guardar cambios:", err);
      setError(err.message || "Error al guardar los cambios.");
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToLogin = () => {
    window.location.href = "/auth/login";
  };

  const displayedImage = previewImage || profileImage;

  if (isLoading) {
    return (
      <SettingsLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </SettingsLayout>
    );
  }

  if (error) {
    return (
      <SettingsLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error}</p>
            <div className="space-x-2">
              <Button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Reintentar
              </Button>
              <Button
                onClick={redirectToLogin}
                className="bg-green-600 hover:bg-green-700"
              >
                Ir al Login
              </Button>
            </div>
          </div>
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Editar <span className="text-blue-400">perfil</span>
          </h1>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={handleSaveChanges}
            disabled={isLoading}
          >
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>

        <Card className="bg-[#1a1a1a] border-[#1a1a1a]">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <Avatar className="w-16 h-16">
                <AvatarImage src={displayedImage} />
                <AvatarFallback className="bg-blue-600 text-white">
                  {username ? username.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{username || "Usuario"}</h3>
                <p className="text-gray-400">{email || "Correo no disponible"}</p>
              </div>
              <Button
                variant="outline"
                className="border-blue-500 text-blue-400 hover:bg-blue-600 hover:text-white"
                onClick={() => fileInputRef.current?.click()}
              >
                Cambiar foto
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Descripción</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Escribe una descripción sobre ti..."
                  className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                  maxLength={255}
                />
                <p className="text-right text-sm text-gray-400 mt-1">
                  {description.length}/255
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ubicación</label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ej: Ciudad, País"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Teléfono</label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: 123456789"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-700 rounded-md">
            <p className="text-red-400">{error}</p>
          </div>
        )}
      </div>
    </SettingsLayout>
  );
}

export default function ProfileEdit() {
  return (
    <ProtectedRoute>
      <ProfileEditComponent />
    </ProtectedRoute>
  );
}
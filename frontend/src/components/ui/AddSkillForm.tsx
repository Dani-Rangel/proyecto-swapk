import React, { useState } from "react";
import { X } from "lucide-react";
import { Skill, SkillAssociation } from "@/services/api_Skills";

interface AddSkillFormProps {
  perfilId: number;
  habilidades: Skill[];
  onClose: () => void;
  onSave: (assoc: SkillAssociation) => Promise<void>;
}

type Tipo = "Ofrece" | "Busca";
type Nivel = "Principiante" | "Intermedio" | "Experto";

export function AddSkillForm({ perfilId, habilidades, onClose, onSave }: AddSkillFormProps) {
  const [habilidadId, setHabilidadId] = useState<number>(habilidades.length > 0 ? habilidades[0].id : -1);
  const [type, setType] = useState<Tipo>("Ofrece");
  const [level, setLevel] = useState<Nivel>("Principiante");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (habilidadId <= 0) {
      setError("Selecciona una habilidad válida.");
      return;
    }

    setLoading(true);

    try {
      await onSave({
        Perfil_id: perfilId,
        habilidad_id: habilidadId,
        tipo: type,
        nivel: level,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al guardar la habilidad.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#1E1E1E] p-6 rounded-lg border border-[#2E2E2E] w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-white text-lg font-semibold">Añadir Habilidad</h2>
          <button onClick={onClose}>
            <X className="text-white hover:text-red-400" />
          </button>
        </div>

        {habilidades.length === 0 ? (
          <p className="text-red-400">No hay habilidades disponibles para seleccionar.</p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <select
              value={habilidadId}
              onChange={(e) => setHabilidadId(Number(e.target.value))}
              className="bg-gray-800 text-white p-2 rounded border border-gray-600"
            >
              <option value={-1} disabled>
                Selecciona una habilidad
              </option>
              {habilidades.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.nombre}
                </option>
              ))}
            </select>

            <select
              value={type}
              onChange={(e) => setType(e.target.value as Tipo)}
              className="bg-gray-800 text-white p-2 rounded border border-gray-600"
            >
              <option value="Ofrece">Ofrece</option>
              <option value="Busca">Busca</option>
            </select>

            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as Nivel)}
              className="bg-gray-800 text-white p-2 rounded border border-gray-600"
            >
              <option value="Principiante">Principiante</option>
              <option value="Intermedio">Intermedio</option>
              <option value="Experto">Experto</option>
            </select>

            {error && <div className="text-red-400 text-sm">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded shadow-lg"
            >
              {loading ? "Guardando..." : "Guardar habilidad"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// src/components/ui/ReporteDialog.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/useTranslations";
import toast from "react-hot-toast";
import axios from "axios";

const api = axios.create({
  baseURL: "https://backend-production-fc5e.up.railway.app",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (e) {
        console.error("Error parsing user from localStorage", e);
      }
    }
  }
  return config;
});

interface ReporteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  intercambioId: number; // Lo usamos solo para mostrar contexto, NO se envía al backend
}

export default function ReporteDialog({ isOpen, onClose, intercambioId }: ReporteDialogProps) {
  const { t } = useTranslation();
  const [motivo, setMotivo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!motivo.trim()) {
      toast.error(t("report_reason_required"));
      return;
    }

    setIsSubmitting(true);
    try {
      // ✅ Enviamos solo tipo y motivo
      // El ID del trueque se incluye en el texto para contexto humano
      await api.post("/reportes/", {
        tipo: "Trueque",
        motivo: `[Trueque ID: ${intercambioId}] ${motivo.trim()}`,
      });
      toast.success(t("report_sent_success"));
      setMotivo("");
      onClose();
    } catch (error: any) {
      console.error("Error al enviar reporte:", error);
      toast.error(error.response?.data?.detail || t("error_sending_report"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-[#1E1E1E] text-white border-[#2E2E2E]">
        <DialogHeader>
          <DialogTitle>{t("report_exchange")}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="motivo">{t("report_reason")}</Label>
            <Textarea
              id="motivo"
              placeholder={t("describe_issue")}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="bg-[#2E2E2E] border-[#404040] text-white resize-none"
              rows={4}
            />
            <p className="text-xs text-gray-400 mt-1">
              {`${t("report_context_info_prefix")} ${intercambioId} ${t("report_context_info_suffix")}`}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !motivo.trim()}>
            {isSubmitting ? t("sending") : t("send_report")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, History, Plus } from "lucide-react";
import MonitorActivoTab from "@/components/caja/MonitorActivoTab";
import HistorialCierresTab from "@/components/caja/HistorialCierresTab";
import { useCaja } from "@/context/CajaContext";

/**
 * PANTALLA 1: Vista Master de Gestión de Cajas
 * - Tab "Monitor Activo": Grid de cards con cajas abiertas
 * - Tab "Historial de Cierres": Tabla de auditoría con filtros
 */
export default function GestionCajasPage() {
  const { currentSession } = useCaja();
  const [activeTab, setActiveTab] = useState("monitor");

  // Usuario puede aperturar si NO tiene sesión activa
  const canOpenCaja = !currentSession;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Cajas</h1>
          <p className="text-muted-foreground mt-1">
            Monitoreo en tiempo real y auditoría de cierres
          </p>
        </div>

        {canOpenCaja && (
          <Button size="lg">
            <Plus className="mr-2 h-4 w-4" />
            Aperturar Caja
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitor Activo
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial de Cierres
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitor" className="mt-6">
          <MonitorActivoTab />
        </TabsContent>

        <TabsContent value="historial" className="mt-6">
          <HistorialCierresTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

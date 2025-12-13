// Página de configuración del tenant con gestión tributaria
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Building2, FileText, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetApiTenantConfiguracion,
  usePutApiTenantConfiguracion,
  useGetApiTenantConfiguracionFiscal,
  usePatchApiTenantConfiguracionFiscal,
} from "@/api/generated/tenant/tenant";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { TenantConfiguracion, TenantConfiguracionConfiguracionAnyOf } from "@/api/generated/model";
import { getErrorMessage } from "@/lib/api-error";

// Componente para editar información de la empresa
function EmpresaForm({ configData, queryClient }: { configData: TenantConfiguracion | undefined, queryClient: QueryClient }) {
  // Acceso type-safe a configuracion.empresa
  const empresaConfig = configData?.configuracion?.empresa;
  const [nombreEmpresa, setNombreEmpresa] = useState(configData?.nombre_empresa || "");
  const [ruc, setRuc] = useState(empresaConfig?.ruc || "");
  const [direccion, setDireccion] = useState(empresaConfig?.direccion || "");
  const [telefono, setTelefono] = useState(empresaConfig?.telefono || "");
  const [email, setEmail] = useState(empresaConfig?.email || "");

  const updateConfigMutation = usePutApiTenantConfiguracion({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/tenant/configuracion'] });
        toast.success("Datos de empresa actualizados");
      },
      onError: (err) => {
        toast.error(getErrorMessage(err));
      },
    },
  });

  function handleSaveEmpresa(e: React.FormEvent) {
    e.preventDefault();

    if (!nombreEmpresa || !direccion) {
      toast.error("Nombre y dirección son obligatorios");
      return;
    }

    updateConfigMutation.mutate({
      data: {
        nombre_empresa: nombreEmpresa,
        configuracion: {
          ...(configData?.configuracion || {}),
          empresa: {
            ruc,
            direccion,
            telefono,
            email,
          },
        } as TenantConfiguracionConfiguracionAnyOf,
      },
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Datos de la Empresa</CardTitle>
        <CardDescription>
          Información que aparecerá en comprobantes y documentos oficiales
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSaveEmpresa} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre-empresa">Nombre de la Empresa *</Label>
            <Input
              id="nombre-empresa"
              value={nombreEmpresa}
              onChange={(e) => setNombreEmpresa(e.target.value)}
              placeholder="Ferretería El Constructor SAC"
              required
            />
            <p className="text-xs text-muted-foreground">
              Razón social o nombre comercial
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ruc">RUC / ID Fiscal</Label>
            <Input
              id="ruc"
              value={ruc}
              onChange={(e) => setRuc(e.target.value)}
              placeholder="20123456789"
            />
            <p className="text-xs text-muted-foreground">
              Número de identificación tributaria (RUC, RFC, CUIT, etc.)
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+51 999 888 777"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email de Contacto</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ventas@empresa.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección Fiscal *</Label>
            <Textarea
              id="direccion"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Av. Principal 123, Distrito, Ciudad, País"
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              Dirección completa que aparecerá en comprobantes
            </p>
          </div>

          <Separator />

          {/* Vista previa */}
          <div className="space-y-2">
            <Label>Vista Previa en Comprobantes</Label>
            <div className="rounded-lg border bg-muted p-4 space-y-1 text-sm">
              <p className="font-semibold">{nombreEmpresa || "—"}</p>
              <p className="text-muted-foreground">RUC: {ruc || "—"}</p>
              <p className="text-muted-foreground">{direccion || "—"}</p>
              <p className="text-muted-foreground">
                {telefono && `Tel: ${telefono}`}
                {telefono && email && " • "}
                {email}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const empresaData = configData?.configuracion?.empresa;
                setNombreEmpresa(configData?.nombre_empresa || "");
                setRuc(empresaData?.ruc || "");
                setDireccion(empresaData?.direccion || "");
                setTelefono(empresaData?.telefono || "");
                setEmail(empresaData?.email || "");
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateConfigMutation.isPending}
            >
              {updateConfigMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 size-4" />
                  Guardar Datos
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

const ConfiguracionPage = () => {
  const queryClient = useQueryClient();

  // ✅ Obtener configuración actual
  const { data: configData, isLoading } = useGetApiTenantConfiguracion();
  const { data: configFiscal } = useGetApiTenantConfiguracionFiscal();

  // Estados locales para formularios
  const [impuestoNombre, setImpuestoNombre] = useState("");
  const [tasaImpuesto, setTasaImpuesto] = useState("");
  const [esAgenteRetencion, setEsAgenteRetencion] = useState(false);
  const [exoneradoRegional, setExoneradoRegional] = useState(false);

  // ✅ Mutation para actualizar configuración fiscal
  const updateFiscalMutation = usePatchApiTenantConfiguracionFiscal({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/tenant/configuracion-fiscal'] });
        queryClient.invalidateQueries({ queryKey: ['/api/tenant/configuracion'] });
        toast.success("Configuración fiscal actualizada");
      },
      onError: (err) => {
        toast.error(getErrorMessage(err));
      },
    },
  });

  // Inicializar formulario cuando carga data
  useState(() => {
    if (configFiscal) {
      setImpuestoNombre(configFiscal.impuesto_nombre || "IGV");
      setTasaImpuesto(String(configFiscal.tasa_impuesto || 18));
      setEsAgenteRetencion(configFiscal.es_agente_retencion || false);
      setExoneradoRegional(configFiscal.exonerado_regional || false);
    }
  });

  function handleSaveFiscal(e: React.FormEvent) {
    e.preventDefault();

    const tasa = parseFloat(tasaImpuesto);
    if (isNaN(tasa) || tasa < 0 || tasa > 100) {
      toast.error("La tasa de impuesto debe estar entre 0 y 100");
      return;
    }

    updateFiscalMutation.mutate({
      data: {
        impuesto_nombre: impuestoNombre,
        tasa_impuesto: tasa,
        es_agente_retencion: esAgenteRetencion,
        exonerado_regional: exoneradoRegional,
      },
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 lg:px-6 pt-1 md:pt-2 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold">Configuración</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Administra la configuración de tu empresa y preferencias del sistema
        </p>
      </div>

      <Tabs defaultValue="empresa" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="empresa">
            <Building2 className="mr-2 size-4" />
            Empresa
          </TabsTrigger>
          <TabsTrigger value="fiscal">
            <FileText className="mr-2 size-4" />
            Fiscal
          </TabsTrigger>
          <TabsTrigger value="notificaciones">
            <Mail className="mr-2 size-4" />
            Emails
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: INFORMACIÓN DE LA EMPRESA */}
        <TabsContent value="empresa" className="space-y-4">
          <EmpresaForm configData={configData} queryClient={queryClient} />
        </TabsContent>

        {/* TAB 2: CONFIGURACIÓN FISCAL (IGV) */}
        <TabsContent value="fiscal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración Tributaria</CardTitle>
              <CardDescription>
                Gestión del impuesto aplicable (IGV) según tu ubicación y régimen fiscal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveFiscal} className="space-y-6">
                {/* SECCIÓN: CONFIGURACIÓN DE IMPUESTO */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Configuración del Impuesto</h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="impuesto-nombre">
                        Nombre del Impuesto
                      </Label>
                      <Input
                        id="impuesto-nombre"
                        value={impuestoNombre}
                        onChange={(e) => setImpuestoNombre(e.target.value)}
                        placeholder="IGV"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Ejemplo: IGV (Perú), IVA (Colombia), VAT (Internacional)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tasa-impuesto">
                        Tasa de Impuesto (%)
                      </Label>
                      <Input
                        id="tasa-impuesto"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={tasaImpuesto}
                        onChange={(e) => setTasaImpuesto(e.target.value)}
                        placeholder="18.00"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        IGV estándar en Perú: 18%
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* SECCIÓN: REGÍMENES ESPECIALES */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Regímenes Especiales</h3>

                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="exonerado-regional"
                        checked={exoneradoRegional}
                        onCheckedChange={(checked) =>
                          setExoneradoRegional(checked === true)
                        }
                      />
                      <div className="space-y-1">
                        <Label
                          htmlFor="exonerado-regional"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Exoneración Regional (Amazonía/Selva)
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Activa si tu empresa opera en zona exonerada del IGV por ubicación
                          geográfica. Todas las ventas estarán exoneradas automáticamente.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="agente-retencion"
                        checked={esAgenteRetencion}
                        onCheckedChange={(checked) =>
                          setEsAgenteRetencion(checked === true)
                        }
                      />
                      <div className="space-y-1">
                        <Label
                          htmlFor="agente-retencion"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Agente de Retención SUNAT
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Activa si tu empresa está designada como agente de retención del IGV.
                          Aplica para empresas con facturación anual superior a 1,500 UIT.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* ALERTA INFORMATIVA */}
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                  <div className="flex gap-3">
                    <div className="text-yellow-600 font-semibold text-sm">⚠️</div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-yellow-800">
                        Impacto de los Cambios
                      </p>
                      <ul className="text-xs text-yellow-700 space-y-1 ml-4 list-disc">
                        <li>
                          Los cambios aplican solo a <strong>nuevas ventas</strong> registradas
                          después de guardar
                        </li>
                        <li>
                          Las ventas históricas mantienen la tasa de IGV con la que fueron
                          registradas
                        </li>
                        <li>
                          Si activas "Exoneración Regional", todas las ventas futuras tendrán IGV
                          = 0%
                        </li>
                        <li>
                          Productos individuales pueden tener excepciones mediante el campo
                          "Afectación IGV"
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="submit"
                    disabled={updateFiscalMutation.isPending}
                  >
                    {updateFiscalMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 size-4" />
                        Guardar Configuración Fiscal
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: NOTIFICACIONES (PLACEHOLDER) */}
        <TabsContent value="notificaciones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones por Email</CardTitle>
              <CardDescription>
                Configura alertas y reportes automáticos (Próximamente)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="size-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">
                  Esta funcionalidad estará disponible en futuras versiones
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfiguracionPage;

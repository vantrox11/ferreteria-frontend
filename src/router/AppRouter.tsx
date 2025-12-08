// Configuración de rutas de la aplicación con protección de autenticación
import { BrowserRouter, Routes, Route } from "react-router-dom";

import DemoShell from "@/pages/DemoShell";
import DashboardShell from "@/app/dashboard/DashboardShell";
import ProtectedRoute from "./ProtectedRoute";

// Auth

import LoginPage from "@/pages/auth/Login";
import RegisterPage from "@/pages/auth/Register";

// Páginas principales

import ProductosPage from "@/pages/productos/index";
import CategoriasPage from "@/pages/categorias/index";
import MarcasPage from "@/pages/marcas/index";
import UnidadesMedidaPage from "@/pages/unidades-medida/index";
import InventarioPage from "@/pages/inventario/index";
import ComprasPage from "@/pages/compras/index";
import NuevaOrdenCompraFiscalPage from "@/pages/compras/nueva-fiscal";
import KardexPage from "@/pages/kardex/index";
import POSPage from "@/pages/ventas/POS";
import HistorialVentasPage from "@/pages/ventas/historial-v2";
import NotasCreditoPage from "@/pages/ventas/notas-credito-v2";
import GuiasRemisionPage from "@/pages/documentos/guias-remision-v2";
import DashboardVentasV6Page from "@/pages/dashboard/ventas/dashboard-v6";
import DashboardGeneralPage from "@/pages/dashboard/DashboardGeneral";
import DashboardVentasAnalisisPage from "@/pages/dashboard/DashboardVentasAnalisis";
//import ReportesPage from "@/pages/reportes/index";
//import ReportesFiscalesPage from "@/pages/reportes/fiscales";
import ConfiguracionPage from "@/pages/configuracion/index";
import ClientesPage from "@/pages/clientes/index";
import ProveedoresPage from "@/pages/proveedores/index";
import PedidosPage from "@/pages/pedidos/index";
import CobranzasPage from "@/pages/cobranzas/index";
import UsuariosPage from "@/pages/usuarios/index";
import AdminCajasPage from "@/pages/admin/cajas";
import AdminSesionesPage from "@/pages/admin/sesiones-caja";
import AdminSeriesPage from "@/pages/admin/series";
import MovimientosCajaPage from "@/pages/caja/movimientos";
import GestionCajasPage from "@/pages/caja/gestion-cajas";
import CajaDetallePage from "@/pages/caja/caja-detalle";
// Tienda pública
import Catalogo from "@/pages/tienda/Catalogo"
import Checkout from "@/pages/tienda/Checkout"
import PedidoConfirmado from "@/pages/tienda/PedidoConfirmado"


const AppRouter: React.FC = () => {

    return (
        <BrowserRouter>
            <Routes>
                {/* Rutas públicas - Entry Point: Carga directamente la DEMO del SaaS */}
                <Route path="/" element={<DemoShell />} />

                {/* Rutas Tienda Pública */}
                <Route path="/tienda/catalogo" element={<Catalogo />} />
                <Route path="/tienda/checkout" element={<Checkout />} />
                <Route path="/tienda/pedido-confirmado/:id" element={<PedidoConfirmado />} />


                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                {/* Rutas protegidas del dashboard */}
                <Route path="/dashboard" element={<ProtectedRoute />}>

                    <Route path="" element={<DashboardShell />}>
                        {/* Dashboard principal */}
                        <Route index element={<DashboardGeneralPage />} />

                        {/* Dashboards */}
                        <Route path="dashboard-general" element={<DashboardGeneralPage />} />
                        <Route path="dashboard-ventas-analisis" element={<DashboardVentasAnalisisPage />} />

                        {/* Páginas principales de cada módulo */}
                        <Route path="productos" element={<ProductosPage />} />

                        <Route path="categorias" element={<CategoriasPage />} />

                        <Route path="marcas" element={<MarcasPage />} />

                        <Route path="unidades-medida" element={<UnidadesMedidaPage />} />

                        <Route path="inventario" element={<InventarioPage />} />

                        <Route path="usuarios" element={<UsuariosPage />} />

                        <Route path="clientes" element={<ClientesPage />} />

                        <Route path="proveedores" element={<ProveedoresPage />} />

                        <Route path="pedidos" element={<PedidosPage />} />

                        <Route path="cobranzas" element={<CobranzasPage />} />

                        <Route path="compras" element={<ComprasPage />} />
                        <Route path="compras/nueva-fiscal" element={<NuevaOrdenCompraFiscalPage />} />

                        <Route path="kardex" element={<KardexPage />} />

                        <Route path="ventas" element={<POSPage />} />
                        <Route path="ventas/historial-v2" element={<HistorialVentasPage />} />
                        <Route path="ventas/notas-credito-v2" element={<NotasCreditoPage />} />
                        <Route path="ventas/dashboard-v6" element={<DashboardVentasV6Page />} />

                        <Route path="documentos/guias-remision-v2" element={<GuiasRemisionPage />} />



                        <Route path="configuracion" element={<ConfiguracionPage />} />

                        {/* Administración de Caja */}
                        <Route path="admin/cajas" element={<AdminCajasPage />} />
                        <Route path="admin/sesiones" element={<AdminSesionesPage />} />
                        <Route path="admin/series" element={<AdminSeriesPage />} />

                        {/* Gestión de Caja */}
                        <Route path="cajas" element={<GestionCajasPage />} />
                        <Route path="cajas/:id" element={<CajaDetallePage />} />
                        <Route path="caja/movimientos" element={<MovimientosCajaPage />} />
                    </Route>
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;

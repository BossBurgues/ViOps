import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/contexts/AppContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ClientesPage from "./pages/ClientesPage";
import UnidadesPage from "./pages/UnidadesPage";
import OrdensPage from "./pages/OrdensPage";
import OSDetalhePage from "./pages/OSDetalhePage";
import NovaOSPage from "./pages/NovaOSPage";
import CentralPage from "./pages/CentralPage";
import FinanceiroPage from "./pages/FinanceiroPage";
import UsuariosPage from "./pages/UsuariosPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import AuditoriaPage from "./pages/AuditoriaPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/unidades" element={<UnidadesPage />} />
            <Route path="/ordens" element={<OrdensPage />} />
            <Route path="/ordens/nova" element={<NovaOSPage />} />
            <Route path="/ordens/:id" element={<OSDetalhePage />} />
            <Route path="/central" element={<CentralPage />} />
            <Route path="/financeiro" element={<FinanceiroPage />} />
            <Route path="/usuarios" element={<UsuariosPage />} />
            <Route path="/relatorios" element={<RelatoriosPage />} />
            <Route path="/configuracoes" element={<ConfiguracoesPage />} />
            <Route path="/auditoria" element={<AuditoriaPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

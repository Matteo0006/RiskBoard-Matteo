import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import CompanyProfile from "./pages/CompanyProfile";
import Obligations from "./pages/Obligations";
import RiskIndicators from "./pages/RiskIndicators";
import Reminders from "./pages/Reminders";
import IntegrationDemo from "./pages/IntegrationDemo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/company" element={<CompanyProfile />} />
          <Route path="/obligations" element={<Obligations />} />
          <Route path="/risk" element={<RiskIndicators />} />
          <Route path="/reminders" element={<Reminders />} />
          <Route path="/integration" element={<IntegrationDemo />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PlanProvider } from "@/contexts/PlanContext";
import NavBar from "@/components/NavBar";
import Landing from "@/pages/Landing";
import Drift from "@/pages/Drift";
import Recovery from "@/pages/Recovery";
import ActionStatus from "@/pages/ActionStatus";
import OuraProfile from "@/pages/OuraProfile";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PlanProvider>
        <Sonner />
        <BrowserRouter>
          <NavBar />
          <main className="pt-14">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/oura" element={<OuraProfile />} />
              <Route path="/drift" element={<Drift />} />
              <Route path="/recovery" element={<Recovery />} />
              <Route path="/action-status" element={<ActionStatus />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </BrowserRouter>
      </PlanProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

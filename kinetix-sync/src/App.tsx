import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  BrowserRouter, 
  Routes, 
  Route,
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements 
} from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { FitnessProvider } from "@/contexts/FitnessContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AuthPage } from "@/pages/AuthPage";
import { FitnessApp } from "@/pages/FitnessApp";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/" element={isAuthenticated ? <FitnessApp /> : <AuthPage />} />
        <Route path="/app" element={isAuthenticated ? <FitnessApp /> : <AuthPage />} />
        <Route path="/auth" element={<AuthPage />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </>
    )
  );

  return <RouterProvider router={router} />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <FitnessProvider>
          <NotificationProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <AppContent />
            </TooltipProvider>
          </NotificationProvider>
        </FitnessProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

import { BrowserRouter, Route, Routes } from "react-router";
import SignInPage from "./pages/SignInPage";
import ChatAppPage from "./pages/ChatAppPage";
import { Toaster } from "sonner";
import SignUpPage from "./pages/SignUpPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import HomePage from "./pages/HomePage3";
import { ThemeProvider } from "@/components/theme-provider";
import WorkshopsPage from "./pages/WorkshopsPage";
import WorkshopDetail from "./pages/WorkshopDetail";
import CreateWorkshopPage from "./pages/CreateWorkshopPage2.tsx";
import HostDashboardPage from "@/pages/HostDashboardPage";
import MyBookingsPage from "./pages/MyBookingsPage.tsx";
import EditWorkshopPage from "./pages/EditWorkshopPage.tsx";
import MainLayout from "@/components/layout/MainLayout";
import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <Toaster richColors />
        <BrowserRouter>
          <Routes>
            {/* Auth standalone pages */}
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />

            {/* Full-screen chat page */}
            <Route element={<ProtectedRoute />}>
              <Route path="/chatapp" element={<ChatAppPage />} />
            </Route>

            {/* Main App Layout: Header & Footer automatically present on all pages */}
            <Route element={<MainLayout />}>
              {/* Public routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/workshops" element={<WorkshopsPage />} />
              <Route path="/workshops/:id" element={<WorkshopDetail />} />

              {/* User Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/my-bookings" element={<MyBookingsPage />} />
              </Route>

              {/* Host Protected routes */}
              <Route element={<ProtectedRoute allowedRoles={["host"]} />}>
                <Route path="/workshops/:id/edit" element={<EditWorkshopPage />} />
                <Route path="/workshops/create" element={<CreateWorkshopPage />} />
                <Route path="/host" element={<HostDashboardPage />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

export default App;

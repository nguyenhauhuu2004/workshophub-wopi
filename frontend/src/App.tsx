import { BrowserRouter, Route, Routes } from "react-router";
import SignInPage from "./pages/SignInPage";
import ChatAppPage from "./pages/ChatAppPage";
import { Toaster } from "sonner";
import SignUpPage from "./pages/SignUpPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import HomePage from "./pages/HomePage2";
import { ThemeProvider } from "@/components/theme-provider";
// import { WorkshopsPage } from "./pages/WorkshopsPage";
import { WorkshopDetail } from "./pages/WorkshopDetail";
import { CreateWorkshopPage } from "./pages/CreateWorkshopPage2.tsx";
import HostDashboardPage from "@/pages/HostDashboardPage";
import MyBookingsPage from "./pages/MyBookingsPage.tsx";

function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <Toaster richColors />
      <BrowserRouter>
        <Routes>
          {/* public routes */}
          <Route path="/signin" element={<SignInPage />} />

          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/" element={<HomePage />} />

          {/* <Route path="/workshops" element={<WorkshopsPage />} /> */}
          <Route path="/workshops/:id" element={<WorkshopDetail />} />
          {/* protectect routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/chatapp" element={<ChatAppPage />} />
            <Route path="/my-bookings" element={<MyBookingsPage />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["host"]} />}>
            <Route path="/workshops/create" element={<CreateWorkshopPage />} />
            <Route path="/host" element={<HostDashboardPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

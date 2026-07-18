import { BrowserRouter, Route, Routes } from "react-router";
import SignInPage from "./pages/SignInPage";
import ChatAppPage from "./pages/ChatAppPage";
import { Toaster } from "sonner";
import SignUpPage from "./pages/SignUpPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import HomePage from "./pages/HomePage";
import { ThemeProvider } from "@/components/theme-provider"
import { WorkshopsPage } from "./pages/WorkshopsPage";
import { WorkshopDetail } from "./pages/WorkshopDetail";
import { CreateWorkshopPage } from "./pages/CreateWorkshopPage";


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
            <Route
              path="/signin"
              element={<SignInPage />}
            />
            <Route
              path="/workshopDetail"
              element={<WorkshopDetail />}
            />
            <Route
              path="/createWorkshop"
              element={<CreateWorkshopPage />}
            />
            <Route
              path="/signup"
              element={<SignUpPage />}
            />
            <Route
              path="/"
              element={<HomePage />}
            />

            <Route
              path="/workshops"
              element={<WorkshopsPage />}
            />
    

            {/* protectect routes */}
            <Route element={<ProtectedRoute />}>
              <Route
                path="/chatapp"
                element={<ChatAppPage />}
              />
            </Route>
          </Routes>
        </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

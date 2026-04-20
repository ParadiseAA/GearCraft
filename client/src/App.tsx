import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import GuestRoute from "./components/GuestRoute";
import AuthPage from "./pages/AuthPage";
import CatalogPage from "./pages/CatalogPage";
import HomePage from "./pages/HomePage";
import { useAuthStore } from "./store/authStore";

export default function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />

        <Route element={<GuestRoute />}>
          <Route path="/auth" element={<AuthPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

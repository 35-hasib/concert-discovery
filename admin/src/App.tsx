import { Navigate, Route, Routes } from "react-router-dom";

import { AdminShell } from "./components/AdminShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { BlogsPage } from "./pages/BlogsPage";
import { CreateBlogPage } from "./pages/CreateBlogPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EditBlogPage } from "./pages/EditBlogPage";
import { LoginPage } from "./pages/LoginPage";
import { PreviewBlogPage } from "./pages/PreviewBlogPage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/preview/:id" element={<PreviewBlogPage />} />
        <Route element={<AdminShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/blogs" element={<BlogsPage />} />
          <Route path="/blogs/new" element={<CreateBlogPage />} />
          <Route path="/blogs/:id/edit" element={<EditBlogPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

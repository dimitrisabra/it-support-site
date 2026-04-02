import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import UserChat from "./pages/UserChat";
import UserProfile from "./pages/UserProfile";
import UserDashboard from "./pages/UserDashboard";
import UserAnnouncements from "./pages/UserAnnouncements";
import UserNotifications from "./pages/UserNotifications";
import UserSettings from "./pages/UserSettings";
import UserTickets from "./pages/UserTickets";
import AdminDashboard from "./pages/AdminDashboard";
import AdminKnowledgeBase from "./pages/AdminKnowledgeBase";
import AdminChats from "./pages/AdminChats";
import AdminEscalations from "./pages/AdminEscalations";
import AdminUsers from "./pages/AdminUsers";
import AdminSettings from "./pages/AdminSettings";
import AdminActivityLog from "./pages/AdminActivityLog";
import AdminSavedReplies from "./pages/AdminSavedReplies";
import AdminNotifications from "./pages/AdminNotifications";
import AdminAnnouncements from "./pages/AdminAnnouncements";
import AdminReports from "./pages/AdminReports";
import SystemStatus from "./pages/SystemStatus";
import HelpCenter from "./pages/HelpCenter";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/status" element={<SystemStatus />} />
            <Route path="/help" element={<HelpCenter />} />
            <Route path="/chat" element={<ProtectedRoute><UserChat /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
            <Route path="/user/announcements" element={<ProtectedRoute><UserAnnouncements /></ProtectedRoute>} />
            <Route path="/user/notifications" element={<ProtectedRoute><UserNotifications /></ProtectedRoute>} />
            <Route path="/user/settings" element={<ProtectedRoute><UserSettings /></ProtectedRoute>} />
            <Route path="/user/tickets" element={<ProtectedRoute><UserTickets /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/knowledge" element={<ProtectedRoute requireAdmin><AdminKnowledgeBase /></ProtectedRoute>} />
            <Route path="/admin/chats" element={<ProtectedRoute requireAdmin><AdminChats /></ProtectedRoute>} />
            <Route path="/admin/escalations" element={<ProtectedRoute requireAdmin><AdminEscalations /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>} />
            <Route path="/admin/activity" element={<ProtectedRoute requireAdmin><AdminActivityLog /></ProtectedRoute>} />
            <Route path="/admin/replies" element={<ProtectedRoute requireAdmin><AdminSavedReplies /></ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute requireAdmin><AdminNotifications /></ProtectedRoute>} />
            <Route path="/admin/announcements" element={<ProtectedRoute requireAdmin><AdminAnnouncements /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute requireAdmin><AdminReports /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

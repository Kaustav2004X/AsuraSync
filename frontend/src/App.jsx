import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import theme from "./theme";
import { supabase } from "./supabase";
import { apiFetch } from "./api";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
import LandingPage from "./pages/LandingPage";
import LibraryPage from "./pages/LibraryPage";
import ProfilePage from "./pages/ProfilePage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow+Condensed:wght@300;400;500;600;700;800&family=Noto+Sans:wght@400;500&display=swap";
document.head.appendChild(fontLink);

function buildUser(u) {
  return {
    id: u.id,
    name: u.user_metadata?.full_name || u.email.split("@")[0],
    email: u.email,
    avatar: (u.user_metadata?.full_name || u.email)[0].toUpperCase(),
    avatarImage: null, // loaded from profile API
    bio: "",
    joinDate: new Date(u.created_at).toLocaleDateString(),
    providers: u.app_metadata?.providers || [u.app_metadata?.provider || "email"],
    provider: u.app_metadata?.provider || "email",
  };
}

export default function App() {
  const [user, setUser]       = useState(null);
  const [series, setSeries]   = useState([]);
  const [loading, setLoading] = useState(true);

  const totalUnread = series.reduce((a, s) => a + Math.max(0, (s.latestChapter || 0) - (s.readChapters || 0)), 0);

  const loadLibrary = async () => {
    try {
      const data = await apiFetch("/library");
      setSeries(data || []);
    } catch (err) {
      console.error("Failed to load library:", err);
      setSeries([]);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(buildUser(session.user));
        loadLibrary();
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(buildUser(session.user));
        loadLibrary();
      } else {
        setUser(null);
        setSeries([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/library" />} />

          {/* Password reset — accessible without auth (recovery token in URL hash) */}
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route path="/library" element={
            !user ? <Navigate to="/" /> : (
              <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
                <Navbar user={user} totalUnread={totalUnread} />
                <LibraryPage series={series} setSeries={setSeries} />
                <BottomNav />
              </Box>
            )
          } />

          <Route path="/profile" element={
            !user ? <Navigate to="/" /> : (
              <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
                <Navbar user={user} totalUnread={totalUnread} />
                <ProfilePage user={user} setUser={setUser} series={series} onLogout={() => supabase.auth.signOut()} />
                <BottomNav />
              </Box>
            )
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
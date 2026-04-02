import { useState } from "react";
import {
  Box, Typography, Button, IconButton, Avatar, Tooltip,
  Badge, Drawer, Divider,
} from "@mui/material";
import {
  NotificationsActive, Menu as MenuIcon,
  Close, LibraryBooks, Person,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";

import AsuraSyncLogo from "../assets/AsuraSync.png";

export default function Navbar({ user, totalUnread }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate  = useNavigate();
  const location  = useLocation();
  const page      = location.pathname;

  const navItems = [
    { path: "/library", label: "Library", icon: <LibraryBooks sx={{ fontSize: 18 }} /> },
    { path: "/profile", label: "Profile", icon: <Person sx={{ fontSize: 18 }} /> },
  ];

  const avatarSx = {
    width: 36, height: 36,
    background: "linear-gradient(135deg, #7F1CE2, #5A0FB0)",
    fontSize: 14, fontWeight: 700,
    cursor: "pointer",
    border: "2px solid rgba(127,28,226,0.3)",
  };

  const drawerAvatarSx = {
    width: 44, height: 44,
    background: "linear-gradient(135deg, #7F1CE2, #5A0FB0)",
    fontSize: 16, fontWeight: 700,
  };

  return (
    <>
      <Box sx={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(10,10,15,0.95)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 2, md: 4 }, py: 1.5, display: "flex", alignItems: "center", gap: 2 }}>

          {/* Logo */}
          <Box onClick={() => navigate("/library")} sx={{ display: "flex", alignItems: "center", gap: 1.5, cursor: "pointer", mr: 2 }}>
            <Box sx={{ width: 32, height: 32, borderRadius: 1, overflow: "hidden", flexShrink: 0 }}>
              <img src={AsuraSyncLogo} alt="AsuraSync" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Box>
            <Typography sx={{ fontFamily: "'Bebas Neue', cursive", fontSize: 22, letterSpacing: "0.1em", display: { xs: "none", sm: "block" }, color: "text.primary" }}>
              ASURA<Box component="span" sx={{ color: "#7F1CE2" }}>SYNC</Box>
            </Typography>
          </Box>

          {/* Desktop nav links */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 0.5 }}>
            {navItems.map(item => (
              <Button key={item.path} startIcon={item.icon} onClick={() => navigate(item.path)}
                sx={{
                  color: page === item.path ? "#7F1CE2" : "text.secondary",
                  borderBottom: page === item.path ? "2px solid #7F1CE2" : "2px solid transparent",
                  borderRadius: 0, px: 2, py: 1.5, fontSize: 13,
                  "&:hover": { color: "text.primary", background: "transparent" },
                }}>
                {item.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ flex: 1 }} />

          {/* Notifications */}
          <Tooltip title="Unread chapters">
            <IconButton sx={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 1 }}>
              <Badge badgeContent={totalUnread > 0 ? totalUnread : null} color="error" max={99}>
                <NotificationsActive sx={{ fontSize: 20 }} />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Avatar — shows uploaded image if available */}
          <Avatar
            src={user?.avatarImage || undefined}
            onClick={() => navigate("/profile")}
            sx={{ ...avatarSx, display: { xs: "none", sm: "flex" } }}>
            {!user?.avatarImage && (user?.avatar || user?.name?.charAt(0))}
          </Avatar>

          {/* Mobile hamburger */}
          <IconButton onClick={() => setDrawerOpen(true)} sx={{ display: { md: "none" }, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 1 }}>
            <MenuIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Mobile Drawer */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: 270, bgcolor: "background.paper" } }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography sx={{ fontFamily: "'Bebas Neue', cursive", fontSize: 20, color: "text.primary" }}>
              ASURA<Box component="span" sx={{ color: "#7F1CE2" }}>SYNC</Box>
            </Typography>
            <IconButton size="small" onClick={() => setDrawerOpen(false)}><Close fontSize="small" /></IconButton>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, p: 2, background: "rgba(127,28,226,0.08)", borderRadius: 2, border: "1px solid rgba(127,28,226,0.2)" }}>
            <Avatar src={user?.avatarImage || undefined} sx={drawerAvatarSx}>
              {!user?.avatarImage && (user?.avatar || user?.name?.charAt(0))}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: 14, color: "text.primary" }}>{user?.name}</Typography>
              <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{user?.email}</Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {navItems.map(item => (
            <Box key={item.path} onClick={() => { navigate(item.path); setDrawerOpen(false); }}
              sx={{
                display: "flex", alignItems: "center", gap: 2, px: 2, py: 1.8,
                borderRadius: 2, mb: 1, cursor: "pointer",
                background: page === item.path ? "rgba(127,28,226,0.1)" : "transparent",
                border: "1px solid",
                borderColor: page === item.path ? "rgba(127,28,226,0.3)" : "transparent",
                "&:hover": { background: "rgba(127,28,226,0.06)" },
              }}>
              <Box sx={{ color: page === item.path ? "#7F1CE2" : "text.secondary" }}>{item.icon}</Box>
              <Typography sx={{ color: page === item.path ? "#7F1CE2" : "text.primary", fontWeight: 700, fontSize: 15 }}>
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Drawer>
    </>
  );
}
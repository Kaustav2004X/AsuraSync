import { Box, Typography } from "@mui/material";
import { LibraryBooks, Person } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const page = location.pathname;

  const items = [
    { path: "/library", label: "Library", icon: <LibraryBooks sx={{ fontSize: 22 }} /> },
    { path: "/profile", label: "Profile", icon: <Person sx={{ fontSize: 22 }} /> },
  ];

  return (
    <Box sx={{
      display: { xs: "flex", md: "none" },
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 200,
      background: "rgba(10,10,15,0.97)", backdropFilter: "blur(16px)",
      borderTop: "1px solid rgba(255,255,255,0.08)",
    }}>
      {items.map(item => (
        <Box key={item.path} onClick={() => navigate(item.path)}
          sx={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            py: 1.5, cursor: "pointer",
            color: page === item.path ? "#E8341C" : "#8A8398",
            "&:active": { background: "rgba(232,52,28,0.08)" },
          }}>
          {item.icon}
          <Typography sx={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", mt: 0.3 }}>
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
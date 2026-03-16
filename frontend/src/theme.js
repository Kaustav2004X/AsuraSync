import { createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#7F1CE2", light: "#9B4EF5", dark: "#5A0FB0" },
    secondary: { main: "#A855F7", light: "#C084FC", dark: "#7E22CE" },
    background: { default: "#0A0A0F", paper: "#12121A" },
    text: { primary: "#F0EAE0", secondary: "#9A8AB0" },
    success: { main: "#2ECC71" },
    info: { main: "#3498DB" },
    divider: "rgba(255,255,255,0.06)",
  },
  typography: {
    fontFamily: "'Barlow Condensed', 'Noto Sans', sans-serif",
    h1: { fontFamily: "'Bebas Neue', cursive", letterSpacing: "0.05em" },
    h2: { fontFamily: "'Bebas Neue', cursive", letterSpacing: "0.04em" },
    h3: { fontFamily: "'Bebas Neue', cursive", letterSpacing: "0.03em" },
    h4: { fontFamily: "'Bebas Neue', cursive", letterSpacing: "0.02em" },
    h5: { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700 },
    button: { fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.08em" },
  },
  shape: { borderRadius: 4 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "uppercase", borderRadius: 2, fontWeight: 700, letterSpacing: "0.1em" },
        containedPrimary: {
          background: "linear-gradient(135deg, #7F1CE2 0%, #5A0FB0 100%)",
          boxShadow: "0 4px 20px rgba(127,28,226,0.4)",
          "&:hover": { boxShadow: "0 6px 30px rgba(127,28,226,0.6)" },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: "#12121A",
          border: "1px solid rgba(255,255,255,0.06)",
          "&:hover": { border: "1px solid rgba(127,28,226,0.3)" },
          transition: "all 0.3s ease",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
            "&:hover fieldset": { borderColor: "rgba(127,28,226,0.5)" },
            "&.Mui-focused fieldset": { borderColor: "#7F1CE2" },
          },
        },
      },
    },
    MuiPaper: { styleOverrides: { root: { background: "#12121A" } } },
    MuiDialog: {
      styleOverrides: {
        paper: { background: "#12121A", border: "1px solid rgba(255,255,255,0.08)" },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: { background: "#1A1A25", border: "1px solid rgba(255,255,255,0.08)" },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: { background: "#12121A", borderLeft: "1px solid rgba(255,255,255,0.08)" },
      },
    },
    MuiChip: { styleOverrides: { root: { borderRadius: 2, fontWeight: 700 } } },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "uppercase", fontWeight: 700,
          letterSpacing: "0.08em", fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13,
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          "&.Mui-checked": { color: "#7F1CE2" },
          "&.Mui-checked + .MuiSwitch-track": { backgroundColor: "#7F1CE2" },
        },
      },
    },
  },
});

export default theme;
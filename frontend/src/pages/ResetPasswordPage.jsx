import { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, Paper, Alert, CircularProgress, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import AsuraSyncLogo from "../assets/AsuraSync.png";

const P  = "#7F1CE2";
const PD = "#5A0FB0";

export default function ResetPasswordPage() {
  const [password, setPassword]           = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw]               = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [success, setSuccess]             = useState(false);
  const [ready, setReady]                 = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase puts #access_token=...&type=recovery in the URL hash
    // onAuthStateChange fires PASSWORD_RECOVERY event when this is detected
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Also check if already in recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    setError("");
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      // redirect to app after 2 seconds
      setTimeout(() => navigate("/library"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "rgba(127,28,226,0.25)" },
      "&:hover fieldset": { borderColor: P },
      "&.Mui-focused fieldset": { borderColor: P },
    },
  };

  return (
    <Box sx={{ minHeight:"100vh", background:"#0A0A0F", display:"flex", alignItems:"center", justifyContent:"center", px:2, position:"relative" }}>
      <Box sx={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 60% 60% at 50% 50%, rgba(127,28,226,0.12) 0%, transparent 70%)", pointerEvents:"none" }} />

      <Paper sx={{ width:"100%", maxWidth:400, p:{ xs:3, md:4 }, background:"rgba(18,18,26,0.92)", border:"1px solid rgba(127,28,226,0.2)", boxShadow:"0 40px 80px rgba(127,28,226,0.2)", backdropFilter:"blur(20px)", position:"relative", zIndex:1 }}>

        <Box sx={{ textAlign:"center", mb:3 }}>
          <Box sx={{ width:52, height:52, borderRadius:2, overflow:"hidden", mx:"auto", mb:2, boxShadow:"0 8px 24px rgba(127,28,226,0.4)" }}>
            <img src={AsuraSyncLogo} alt="AsuraSync" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          </Box>
          <Typography sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:32, color:"#F0EAE0", mb:0.5 }}>
            SET NEW PASSWORD
          </Typography>
          <Typography sx={{ color:"#9A8AB0", fontSize:13 }}>
            {success ? "Password updated successfully!" : "Choose a strong new password"}
          </Typography>
        </Box>

        {success ? (
          <Box sx={{ textAlign:"center" }}>
            <Alert severity="success" sx={{ mb:2 }}>Password updated! Redirecting you now...</Alert>
            <CircularProgress size={24} sx={{ color: P }} />
          </Box>
        ) : !ready ? (
          <Box sx={{ textAlign:"center", py:2 }}>
            <CircularProgress size={32} sx={{ color: P }} />
            <Typography sx={{ color:"#9A8AB0", fontSize:13, mt:2 }}>Loading reset session...</Typography>
          </Box>
        ) : (
          <Box sx={{ display:"flex", flexDirection:"column", gap:2 }}>
            <TextField
              label="New Password" size="small" fullWidth
              type={showPw ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              sx={fieldSx}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPw(v => !v)} edge="end" sx={{ color:"#9A8AB0" }}>
                      {showPw ? <VisibilityOff sx={{ fontSize:18 }} /> : <Visibility sx={{ fontSize:18 }} />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <TextField
              label="Confirm New Password" size="small" fullWidth
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleReset()}
              sx={fieldSx}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowConfirm(v => !v)} edge="end" sx={{ color:"#9A8AB0" }}>
                      {showConfirm ? <VisibilityOff sx={{ fontSize:18 }} /> : <Visibility sx={{ fontSize:18 }} />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            {error && <Alert severity="error" sx={{ py:0.5, fontSize:12 }}>{error}</Alert>}
            <Button fullWidth variant="contained" onClick={handleReset} disabled={loading}
              sx={{ py:1.4, background:`linear-gradient(135deg, ${P}, ${PD})`, mt:0.5 }}>
              {loading ? <CircularProgress size={20} color="inherit" /> : "Set New Password"}
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
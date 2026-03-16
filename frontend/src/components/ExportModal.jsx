import { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, IconButton, Alert, CircularProgress,
} from "@mui/material";
import { Close, FileDownload, Check, OpenInNew } from "@mui/icons-material";
import { getUpcoming, getStatusColor } from "../data";

export default function ExportModal({ open, onClose, seriesList }) {
  const [step, setStep] = useState("preview");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setStep("auth"); setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false); setStep("done");
  };

  const handleClose = () => { setStep("preview"); setLoading(false); onClose(); };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { background: "#12121A", border: "1px solid rgba(255,255,255,0.08)", mx: { xs: 1, sm: 3 } } }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h5" sx={{ fontSize: { xs: 17, md: 21 } }}>EXPORT TO GOOGLE SHEETS</Typography>
        <IconButton size="small" onClick={handleClose}><Close fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent>
        {step === "preview" && (
          <Box>
            <Box sx={{ background: "#0A0A0F", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 1, overflow: "auto", mb: 3 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", background: "rgba(232,52,28,0.1)", minWidth: 320 }}>
                {["Series", "Read", "Unread", "Latest"].map(h => (
                  <Box key={h} sx={{ px: 1.5, py: 1.2 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#E8341C", textTransform: "uppercase" }}>{h}</Typography>
                  </Box>
                ))}
              </Box>
              {seriesList.slice(0, 5).map((s, i) => (
                <Box key={s.id} sx={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", background: i % 2 ? "rgba(255,255,255,0.02)" : "transparent", borderTop: "1px solid rgba(255,255,255,0.04)", minWidth: 320 }}>
                  <Box sx={{ px: 1.5, py: 1 }}><Typography sx={{ fontSize: 11, color: "#F0EAE0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</Typography></Box>
                  <Box sx={{ px: 1.5, py: 1 }}><Typography sx={{ fontSize: 11, color: "#2ECC71" }}>{s.readChapters}</Typography></Box>
                  <Box sx={{ px: 1.5, py: 1 }}><Typography sx={{ fontSize: 11, color: getUpcoming(s) > 0 ? "#E8341C" : "#8A8398" }}>{getUpcoming(s)}</Typography></Box>
                  <Box sx={{ px: 1.5, py: 1 }}><Typography sx={{ fontSize: 11, color: "#F5A623" }}>Ch.{s.latestChapter}</Typography></Box>
                </Box>
              ))}
              {seriesList.length > 5 && (
                <Box sx={{ px: 2, py: 1, textAlign: "center", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <Typography sx={{ fontSize: 11, color: "#8A8398" }}>+{seriesList.length - 5} more</Typography>
                </Box>
              )}
            </Box>
            <Alert severity="info" sx={{ background: "rgba(52,152,219,0.08)", color: "#F0EAE0", fontSize: 12 }}>
              Google Drive authorization will be requested.
            </Alert>
          </Box>
        )}
        {step === "auth" && (
          <Box sx={{ textAlign: "center", py: 5 }}>
            <CircularProgress sx={{ color: "#E8341C", mb: 2 }} />
            <Typography sx={{ color: "#8A8398" }}>Connecting to Google Drive...</Typography>
          </Box>
        )}
        {step === "done" && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Box sx={{ width: 64, height: 64, background: "rgba(46,204,113,0.15)", border: "2px solid #2ECC71", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2.5 }}>
              <Check sx={{ color: "#2ECC71", fontSize: 32 }} />
            </Box>
            <Typography variant="h5" sx={{ color: "#F0EAE0", mb: 1 }}>EXPORT COMPLETE!</Typography>
            <Typography sx={{ color: "#8A8398", fontSize: 13, mb: 3 }}>Spreadsheet "AsuraSync Export" created in your Drive.</Typography>
            <Button variant="contained" endIcon={<OpenInNew />} onClick={handleClose}>Open in Google Sheets</Button>
          </Box>
        )}
      </DialogContent>
      {step === "preview" && (
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleClose} sx={{ color: "#8A8398" }}>Cancel</Button>
          <Button variant="contained" onClick={handleExport} startIcon={<FileDownload />}>Export {seriesList.length} Series</Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
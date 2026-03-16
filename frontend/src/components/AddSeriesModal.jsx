import { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Button, IconButton, TextField,
  Chip, CircularProgress, InputAdornment, Alert,
} from "@mui/material";
import { Close, Link as LinkIcon, Add } from "@mui/icons-material";
import { Grow } from "@mui/material";
import { apiFetch } from "../api";

export default function AddSeriesModal({ open, onClose, onAdd }) {
  const [url, setUrl]         = useState("");
  const [loading, setLoading] = useState(false);
  const [adding, setAdding]   = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError]     = useState("");

  const handleFetch = async () => {
    if (!url.trim()) { setError("Please enter a URL"); return; }
    if (!url.startsWith("http")) { setError("Please enter a valid URL starting with http"); return; }
    setLoading(true);
    setError("");
    setPreview(null);
    try {
      const data = await apiFetch(`/scrape/preview?url=${encodeURIComponent(url)}`);
      setPreview({ ...data, url });
    } catch (err) {
      setError(err.message || "Failed to fetch series info. Check the URL and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!preview) return;
    setAdding(true);
    try {
      const entry = await apiFetch("/library", {
        method: "POST",
        body: JSON.stringify({
          url: preview.url,
          title: preview.title,
          cover: preview.cover,
          status: preview.status,
          description: preview.description || "",
          latestChapter: preview.latestChapter,
          readChapters: 0,
          rating: 0,
          notes: "",
        }),
      });
      onAdd({
        ...entry,
        // ensure frontend-expected fields exist
        notifications: true,
        addedOn: new Date().toISOString().split("T")[0],
      });
      setUrl("");
      setPreview(null);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to add series. It may already be in your library.");
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    setUrl("");
    setPreview(null);
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { background: "#12121A", border: "1px solid rgba(255,255,255,0.08)", mx: { xs: 1, sm: 3 } } }}>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="h5" sx={{ fontSize: { xs: 18, md: 22 } }}>ADD NEW SERIES</Typography>
        <IconButton size="small" onClick={handleClose}><Close fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography sx={{ color: "#8A8398", fontSize: 13, mb: 2 }}>
          Paste an Asura Scans, Asuratoon, or Asuracomic series URL.
        </Typography>

        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <TextField
            fullWidth placeholder="https://asuracomic.net/series/..."
            value={url}
            onChange={e => { setUrl(e.target.value); setError(""); setPreview(null); }}
            onKeyDown={e => e.key === "Enter" && handleFetch()}
            InputProps={{ startAdornment: <InputAdornment position="start"><LinkIcon sx={{ color: "#8A8398", fontSize: 16 }} /></InputAdornment> }}
            error={!!error} size="small"
          />
          <Button variant="contained" onClick={handleFetch} disabled={loading} sx={{ minWidth: 80, flexShrink: 0 }}>
            {loading ? <CircularProgress size={16} color="inherit" /> : "Fetch"}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, py: 0.5, fontSize: 12 }}>{error}</Alert>
        )}

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
          {["asuracomic.net", "asuratoon.com", "asurascans.com"].map(d => (
            <Chip key={d} label={d} size="small"
              sx={{ fontSize: 10, background: "rgba(127,28,226,0.1)", color: "#A855F7", border: "1px solid rgba(127,28,226,0.2)" }} />
          ))}
        </Box>

        {loading && (
          <Box sx={{ textAlign: "center", py: 3 }}>
            <CircularProgress size={32} sx={{ color: "#7F1CE2" }} />
            <Typography sx={{ color: "#9A8AB0", fontSize: 13, mt: 1.5 }}>
              Fetching series info...
            </Typography>
          </Box>
        )}

        {preview && !loading && (
          <Grow in>
            <Box sx={{ border: "1px solid rgba(127,28,226,0.3)", borderRadius: 2, p: 2, background: "rgba(127,28,226,0.04)" }}>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Box sx={{ width: 70, height: 96, borderRadius: 1, overflow: "hidden", flexShrink: 0, background: "#0A0A0F" }}>
                  {preview.cover
                    ? <img src={preview.cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <Box sx={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9A8AB0", fontSize: 11 }}>No cover</Box>
                  }
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 15, color: "#F0EAE0", mb: 0.5 }}>{preview.title}</Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                    <Chip label={preview.status} size="small"
                      sx={{ fontSize: 10, height: 20, background: "rgba(46,204,113,0.15)", color: "#2ECC71" }} />
                  </Box>
                  <Typography sx={{ color: "#9A8AB0", fontSize: 13 }}>
                    <Box component="span" sx={{ color: "#F5A623", fontWeight: 700 }}>{preview.latestChapter}</Box> chapters available
                  </Typography>
                  {preview.description && (
                    <Typography sx={{ color: "#9A8AB0", fontSize: 11, mt: 0.8, lineHeight: 1.6,
                      overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
                      {preview.description}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </Grow>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} sx={{ color: "#8A8398" }}>Cancel</Button>
        <Button variant="contained" onClick={handleAdd} disabled={!preview || adding} startIcon={adding ? <CircularProgress size={14} color="inherit" /> : <Add />}>
          {adding ? "Adding..." : "Add to Library"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
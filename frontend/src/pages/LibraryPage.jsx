import { useState, useEffect } from "react";
import {
  Box, Typography, Button, TextField, InputAdornment, FormControl,
  Select, MenuItem, Tabs, Tab, IconButton, Chip, LinearProgress,
  Fade, Grow, Alert, Snackbar, Tooltip, CircularProgress,
} from "@mui/material";
import {
  Add, Search, Sort, GridView, ViewList, AutoStories,
  Schedule, CheckCircle, NotificationsActive, FileDownload, ChevronRight,
  Refresh,
} from "@mui/icons-material";
import SeriesCard from "../components/SeriesCard";
import AddSeriesModal from "../components/AddSeriesModal";
import SeriesDetailModal from "../components/SeriesDetailModal";
import ExportModal from "../components/ExportModal";
import { getProgress, getUpcoming, getStatusColor, getReadingStatus } from "../data";
import { apiFetch } from "../api";

const COOLDOWN_MS  = 15 * 60 * 1000; // 15 minutes
const COOLDOWN_KEY = "asurasync_last_refresh";

function getCooldownRemaining() {
  const last = parseInt(localStorage.getItem(COOLDOWN_KEY) || "0", 10);
  const elapsed = Date.now() - last;
  return Math.max(0, COOLDOWN_MS - elapsed);
}

function formatCooldown(ms) {
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

export default function LibraryPage({ series, setSeries }) {
  const [addOpen, setAddOpen]               = useState(false);
  const [exportOpen, setExportOpen]         = useState(false);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [detailOpen, setDetailOpen]         = useState(false);
  const [viewMode, setViewMode]             = useState("grid");
  const [filterTab, setFilterTab]           = useState(0);
  const [sortBy, setSortBy]                 = useState("title");
  const [search, setSearch]                 = useState("");
  const [snack, setSnack]                   = useState({ open: false, message: "", severity: "success" });

  // Refresh button state
  const [refreshing, setRefreshing]         = useState(false);
  const [cooldown, setCooldown]             = useState(getCooldownRemaining());

  // Tick cooldown timer every second
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      const remaining = getCooldownRemaining();
      setCooldown(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const showSnack = (msg, sev = "success") => setSnack({ open: true, message: msg, severity: sev });

  const handleAdd = (s) => { setSeries(prev => [...prev, s]); showSnack(`"${s.title}" added!`); };

  const handleUpdate = async (updated) => {
    try {
      await apiFetch(`/library/${updated.id}`, {
        method: "PUT",
        body: JSON.stringify({
          readChapters: updated.readChapters,
          rating: updated.rating,
          notes: updated.notes,
        }),
      });
      setSeries(prev => prev.map(s => s.id === updated.id ? updated : s));
      if (selectedSeries?.id === updated.id) setSelectedSeries(updated);
    } catch {
      showSnack("Failed to update series", "error");
    }
  };

  const handleRemove = async (id) => {
    const s = series.find(x => x.id === id);
    try {
      await apiFetch(`/library/${id}`, { method: "DELETE" });
      setSeries(prev => prev.filter(x => x.id !== id));
      showSnack(`Removed "${s?.title}"`, "info");
      if (detailOpen && selectedSeries?.id === id) setDetailOpen(false);
    } catch {
      showSnack("Failed to remove series", "error");
    }
  };

  const handleRefresh = async () => {
    if (cooldown > 0 || refreshing) return;
    setRefreshing(true);
    try {
      const updated = await apiFetch("/library/refresh", { method: "POST" });
      // Merge updated series data into state
      if (Array.isArray(updated)) {
        setSeries(prev => prev.map(s => {
          const fresh = updated.find(u => u.id === s.id);
          return fresh ? { ...s, ...fresh } : s;
        }));
        showSnack("Library refreshed!");
      } else {
        showSnack("Library refreshed!");
      }
      localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
      setCooldown(COOLDOWN_MS);
    } catch (err) {
      showSnack(err.message || "Refresh failed", "error");
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = series.filter(s => {
    const ms = !search || s.title.toLowerCase().includes(search.toLowerCase());
    const mt = filterTab === 0 ? true
      : filterTab === 1 ? getUpcoming(s) > 0
      : filterTab === 2 ? getUpcoming(s) === 0 && s.status !== "Completed"
      : filterTab === 3 ? s.status === "Completed"
      : s.rating === 5;
    return ms && mt;
  }).sort((a, b) => {
    if (sortBy === "title")    return a.title.localeCompare(b.title);
    if (sortBy === "progress") return getProgress(b) - getProgress(a);
    if (sortBy === "unread")   return getUpcoming(b) - getUpcoming(a);
    if (sortBy === "rating")   return (b.rating || 0) - (a.rating || 0);
    return 0;
  });

  const totalUnread    = series.reduce((a, s) => a + getUpcoming(s), 0);
  const completedCount = series.filter(s => s.readChapters === s.latestChapter && s.latestChapter > 0).length;
  const notifCount     = series.filter(s => s.notifications).length;

  return (
    <Box sx={{ pb: { xs: 10, md: 4 } }}>
      <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 2, md: 4 }, pt: 3, pb: 2 }}>

        {/* Stats */}
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(4,1fr)" }, gap: { xs: 1.5, md: 2 }, mb: 3 }}>
          {[
            { icon: <AutoStories />,        label: "Series",     value: series.length,  color: "#7F1CE2" },
            { icon: <Schedule />,           label: "Unread",     value: totalUnread,    color: "#F5A623" },
            { icon: <CheckCircle />,        label: "Up to Date", value: completedCount, color: "#2ECC71" },
            { icon: <NotificationsActive/>, label: "Tracking",   value: notifCount,     color: "#3498DB" },
          ].map(st => (
            <Box key={st.label} sx={{ background: "#12121A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 2, p: { xs: 2, md: 2.5 }, display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{ width: { xs: 38, md: 44 }, height: { xs: 38, md: 44 }, background: st.color + "18", borderRadius: 1.5, display: "flex", alignItems: "center", justifyContent: "center", color: st.color, flexShrink: 0 }}>{st.icon}</Box>
              <Box>
                <Typography sx={{ fontFamily: "'Bebas Neue', cursive", fontSize: { xs: 26, md: 32 }, color: st.color, lineHeight: 1 }}>{st.value}</Typography>
                <Typography sx={{ fontSize: { xs: 10, md: 12 }, color: "#8A8398", textTransform: "uppercase", letterSpacing: "0.08em" }}>{st.label}</Typography>
              </Box>
            </Box>
          ))}
        </Box>

        {/* Toolbar */}
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, mb: 2.5, alignItems: { sm: "center" } }}>
          <TextField placeholder="Search series..." size="small" value={search} onChange={e => setSearch(e.target.value)} sx={{ flex: 1 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ fontSize: 16, color: "#8A8398" }} /></InputAdornment> }} />
          <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>

            {/* Refresh button */}
            <Tooltip title={cooldown > 0 ? `Cooldown: ${formatCooldown(cooldown)}` : "Refresh chapter data"}>
              <span>
                <Button
                  variant="outlined" size="small"
                  startIcon={refreshing ? <CircularProgress size={13} color="inherit" /> : <Refresh />}
                  onClick={handleRefresh}
                  disabled={cooldown > 0 || refreshing || series.length === 0}
                  sx={{
                    borderColor: cooldown > 0 ? "rgba(255,255,255,0.1)" : "rgba(127,28,226,0.4)",
                    color: cooldown > 0 ? "#8A8398" : "#A855F7",
                    fontSize: { xs: 11, md: 13 },
                    "&:hover": { borderColor: "#7F1CE2", color: "#A855F7" },
                    "&.Mui-disabled": { borderColor: "rgba(255,255,255,0.08)", color: "#8A8398" },
                  }}>
                  {cooldown > 0 ? formatCooldown(cooldown) : refreshing ? "Refreshing..." : "Refresh"}
                </Button>
              </span>
            </Tooltip>

            <Button variant="outlined" size="small" startIcon={<FileDownload />} onClick={() => setExportOpen(true)}
              sx={{ borderColor: "rgba(255,255,255,0.15)", color: "#F0EAE0", fontSize: { xs: 11, md: 13 }, "&:hover": { borderColor: "#F5A623", color: "#F5A623" } }}>
              Export
            </Button>
            <Button variant="contained" size="small" startIcon={<Add />} onClick={() => setAddOpen(true)} sx={{ fontSize: { xs: 11, md: 13 } }}>
              Add Series
            </Button>
          </Box>
        </Box>

        {/* Filters + sort */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Tabs value={filterTab} onChange={(_, v) => setFilterTab(v)}
            sx={{ "& .MuiTabs-indicator": { background: "#7F1CE2" }, flex: 1, minWidth: 0 }} variant="scrollable" scrollButtons="auto">
            <Tab label="All"     sx={{ minWidth: 50, px: { xs: 1.5, md: 2 } }} />
            <Tab label="Behind"  sx={{ minWidth: 60, px: { xs: 1.5, md: 2 } }} />
            <Tab label="Current" sx={{ minWidth: 60, px: { xs: 1.5, md: 2 } }} />
            <Tab label="Done"    sx={{ minWidth: 50, px: { xs: 1.5, md: 2 } }} />
            <Tab label="⭐ Favs" sx={{ minWidth: 60, px: { xs: 1.5, md: 2 } }} />
          </Tabs>
          <Box sx={{ display: "flex", gap: 1, flexShrink: 0 }}>
            <FormControl size="small" sx={{ minWidth: { xs: 100, md: 130 } }}>
              <Select value={sortBy} onChange={e => setSortBy(e.target.value)} startAdornment={<Sort sx={{ fontSize: 14, mr: 0.5, color: "#8A8398" }} />}>
                <MenuItem value="title">A→Z</MenuItem>
                <MenuItem value="progress">Progress</MenuItem>
                <MenuItem value="unread">Unread</MenuItem>
                <MenuItem value="rating">Rating</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ display: "flex", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 1, overflow: "hidden" }}>
              <IconButton size="small" onClick={() => setViewMode("grid")} sx={{ borderRadius: 0, background: viewMode === "grid" ? "rgba(127,28,226,0.15)" : "transparent", color: viewMode === "grid" ? "#7F1CE2" : "#8A8398", p: 0.8 }}><GridView sx={{ fontSize: 18 }} /></IconButton>
              <IconButton size="small" onClick={() => setViewMode("list")} sx={{ borderRadius: 0, background: viewMode === "list" ? "rgba(127,28,226,0.15)" : "transparent", color: viewMode === "list" ? "#7F1CE2" : "#8A8398", p: 0.8 }}><ViewList sx={{ fontSize: 18 }} /></IconButton>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Series content */}
      <Box sx={{ maxWidth: 1400, mx: "auto", px: { xs: 2, md: 4 } }}>
        {filtered.length === 0 ? (
          <Box sx={{ textAlign: "center", py: { xs: 6, md: 10 } }}>
            <AutoStories sx={{ fontSize: { xs: 48, md: 64 }, color: "rgba(255,255,255,0.08)", mb: 2 }} />
            <Typography variant="h4" sx={{ color: "rgba(255,255,255,0.15)", mb: 1, fontSize: { xs: 24, md: 32 } }}>NO SERIES FOUND</Typography>
            <Typography sx={{ color: "#8A8398", mb: 3, fontSize: 14 }}>{search ? `No results for "${search}"` : "Add your first series to get started"}</Typography>
            {!search && filterTab === 0 && <Button variant="contained" startIcon={<Add />} onClick={() => setAddOpen(true)}>Add Series</Button>}
          </Box>
        ) : viewMode === "grid" ? (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2,1fr)", sm: "repeat(3,1fr)", md: "repeat(4,1fr)", lg: "repeat(5,1fr)", xl: "repeat(6,1fr)" }, gap: { xs: 1.5, md: 2 } }}>
            {filtered.map(s => (
              <Grow in key={s.id} timeout={280}>
                <Box>
                  <SeriesCard series={s} onUpdate={handleUpdate} onRemove={handleRemove}
                    onClick={() => { setSelectedSeries(s); setDetailOpen(true); }} />
                </Box>
              </Grow>
            ))}
            <Box onClick={() => setAddOpen(true)} sx={{ border: "2px dashed rgba(255,255,255,0.07)", borderRadius: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", minHeight: { xs: 200, md: 260 }, gap: 1, "&:hover": { borderColor: "rgba(127,28,226,0.35)", background: "rgba(127,28,226,0.025)" } }}>
              <Box sx={{ width: 40, height: 40, border: "2px dashed rgba(255,255,255,0.13)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Add sx={{ color: "#8A8398", fontSize: 20 }} />
              </Box>
              <Typography sx={{ color: "#8A8398", fontSize: { xs: 11, md: 12 }, fontWeight: 600, textTransform: "uppercase" }}>Add</Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
            {filtered.map(s => {
              const up = getUpcoming(s); const prog = getProgress(s); const rs = getReadingStatus(s);
              return (
                <Fade in key={s.id}>
                  <Box onClick={() => { setSelectedSeries(s); setDetailOpen(true); }}
                    sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, md: 2 }, p: { xs: 1.5, md: 2 }, background: "#12121A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 2, cursor: "pointer", "&:hover": { border: "1px solid rgba(127,28,226,0.3)" }, transition: "all 0.2s" }}>
                    <Box sx={{ width: { xs: 44, md: 52 }, height: { xs: 58, md: 68 }, borderRadius: 1, overflow: "hidden", flexShrink: 0 }}>
                      <img src={s.cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: { xs: 13, md: 15 }, color: "#F0EAE0", mb: 0.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</Typography>
                      <Box sx={{ display: "flex", gap: 0.8, mb: 0.8, flexWrap: "wrap" }}>
                        <Chip label={s.status} size="small" sx={{ fontSize: 9, height: 16, background: getStatusColor(s.status) + "20", color: getStatusColor(s.status) }} />
                      </Box>
                      <LinearProgress variant="determinate" value={prog} sx={{ height: 2.5, borderRadius: 2, background: "rgba(255,255,255,0.08)", "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg, #7F1CE2, #A855F7)" } }} />
                    </Box>
                    <Box sx={{ textAlign: "right", flexShrink: 0, display: { xs: "none", sm: "block" }, minWidth: 80 }}>
                      <Typography sx={{ fontFamily: "'Bebas Neue', cursive", fontSize: { sm: 20, md: 24 }, color: rs.color, lineHeight: 1 }}>{s.readChapters}/{s.latestChapter}</Typography>
                      <Typography sx={{ fontSize: 10, color: rs.color, textTransform: "uppercase" }}>{rs.label}</Typography>
                    </Box>
                    {up > 0 && <Chip label={`${up}`} size="small" sx={{ background: "rgba(127,28,226,0.15)", color: "#A855F7", fontWeight: 700, fontSize: 11, display: { xs: "flex", sm: "none" } }} />}
                    <ChevronRight sx={{ color: "#8A8398", flexShrink: 0 }} />
                  </Box>
                </Fade>
              );
            })}
          </Box>
        )}
      </Box>

      <AddSeriesModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAdd} />
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} seriesList={series} />
      <SeriesDetailModal series={selectedSeries} open={detailOpen} onClose={() => setDetailOpen(false)} onUpdate={handleUpdate} />

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack({ ...snack, open: false })} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })} sx={{ background: "#1A1A25", border: "1px solid rgba(255,255,255,0.1)", color: "#F0EAE0" }}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}
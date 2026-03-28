import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, Box, Typography, IconButton, Chip,
  LinearProgress, Tabs, Tab, Button, Slider, TextField,
} from "@mui/material";
import {
  Close, OpenInNew, Add, Remove, CheckCircle,
  RadioButtonUnchecked, Star, StarBorder,
} from "@mui/icons-material";
import { getProgress, getUpcoming, getStatusColor } from "../data";

export default function SeriesDetailModal({ series, open, onClose, onUpdate }) {
  const [tab, setTab]               = useState(0);
  const [readCount, setReadCount]   = useState(0);
  const [inputVal, setInputVal]     = useState("");

  useEffect(() => {
    if (series) {
      setReadCount(series.readChapters || 0);
      setInputVal(String(series.readChapters || 0));
    }
  }, [series]);

  if (!series) return null;

  const progress = getProgress(series);
  const upcoming = getUpcoming(series);
  const total    = series.latestChapter || 0;

  const commitRead = (val) => {
    const clamped = Math.max(0, Math.min(total, val));
    setReadCount(clamped);
    setInputVal(String(clamped));
    onUpdate({ ...series, readChapters: clamped });
  };

  const handleInputBlur = () => {
    const n = parseInt(inputVal, 10);
    if (!isNaN(n)) commitRead(n);
    else setInputVal(String(readCount));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { background: "#0A0A0F", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "90vh", mx: { xs: 0.5, sm: 3 } } }}>

      {/* Hero header */}
      <Box sx={{ position: "relative", height: { xs: 160, md: 200 }, overflow: "hidden", flexShrink: 0 }}>
        <img src={series.cover} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(8px) brightness(0.3)", transform: "scale(1.1)" }} />
        <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #0A0A0F 40%, transparent 100%)" }} />
        <IconButton onClick={onClose} sx={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.6)", p: 0.8 }}>
          <Close sx={{ fontSize: 18 }} />
        </IconButton>
        <Box sx={{ position: "absolute", bottom: 12, left: { xs: 12, md: 24 }, display: "flex", gap: 2, alignItems: "flex-end" }}>
          <Box sx={{ width: { xs: 64, md: 90 }, height: { xs: 86, md: 120 }, borderRadius: 1, overflow: "hidden", border: "2px solid rgba(255,255,255,0.2)", flexShrink: 0 }}>
            <img src={series.cover} alt={series.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </Box>
          <Box sx={{ pb: 0.5 }}>
            <Typography variant="h4" sx={{ fontSize: { xs: 18, md: 30 }, color: "#F0EAE0", lineHeight: 1.1 }}>
              {series.title.toUpperCase()}
            </Typography>
            <Box sx={{ display: "flex", gap: 0.8, mt: 0.8, flexWrap: "wrap", alignItems: "center" }}>
              <Chip label={series.status} size="small"
                sx={{ fontSize: 9, height: 18, background: getStatusColor(series.status) + "30", color: getStatusColor(series.status) }} />
              {/* star rating */}
              {[1,2,3,4,5].map(n => (
                <IconButton key={n} size="small" onClick={() => onUpdate({ ...series, rating: series.rating === n ? 0 : n })} sx={{ p: 0.2 }}>
                  {n <= (series.rating || 0)
                    ? <Star sx={{ fontSize: 14, color: "#F5A623" }} />
                    : <StarBorder sx={{ fontSize: 14, color: "rgba(255,255,255,0.3)" }} />}
                </IconButton>
              ))}
            </Box>
          </Box>
        </Box>
      </Box>

      <DialogContent sx={{ pt: 2 }}>
        {/* Stats row */}
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 1.5, mb: 2.5 }}>
          {[
            { label: "Latest",   value: `Ch.${total}`,  color: "#F5A623" },
            { label: "Read",     value: readCount,       color: "#2ECC71" },
            { label: "Unread",   value: upcoming,        color: upcoming > 0 ? "#A855F7" : "#8A8398" },
            { label: "Progress", value: `${progress}%`, color: "#3498DB" },
          ].map(s => (
            <Box key={s.label} sx={{ background: "#12121A", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 1, p: { xs: 1, md: 1.5 }, textAlign: "center" }}>
              <Typography sx={{ fontFamily: "'Bebas Neue', cursive", fontSize: { xs: 22, md: 28 }, color: s.color, lineHeight: 1 }}>{s.value}</Typography>
              <Typography sx={{ fontSize: { xs: 9, md: 11 }, color: "#8A8398", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</Typography>
            </Box>
          ))}
        </Box>

        <LinearProgress variant="determinate" value={progress}
          sx={{ height: 5, borderRadius: 3, mb: 2.5, background: "rgba(255,255,255,0.08)",
            "& .MuiLinearProgress-bar": { background: "linear-gradient(90deg, #7F1CE2, #A855F7)", borderRadius: 3 } }} />

        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{ mb: 2.5, "& .MuiTabs-indicator": { background: "#7F1CE2" }, minHeight: 36 }}
          variant="scrollable" scrollButtons="auto">
          <Tab label="Progress" sx={{ minHeight: 36, py: 0 }} />
          <Tab label="Details"  sx={{ minHeight: 36, py: 0 }} />
        </Tabs>

        {/* ── PROGRESS TAB ── */}
        {tab === 0 && (
          <Box>
            <Typography sx={{ fontSize: 13, color: "#9A8AB0", mb: 2 }}>
              Update how many chapters you've read. Use the slider, buttons, or type directly.
            </Typography>

            {/* read counter */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <IconButton onClick={() => commitRead(readCount - 1)} disabled={readCount <= 0}
                sx={{ border: "1px solid rgba(127,28,226,0.3)", borderRadius: 1, p: 0.8, "&:hover": { background: "rgba(127,28,226,0.1)" } }}>
                <Remove sx={{ fontSize: 16 }} />
              </IconButton>

              <Box sx={{ flex: 1, textAlign: "center" }}>
                <TextField
                  value={inputVal}
                  onChange={e => setInputVal(e.target.value)}
                  onBlur={handleInputBlur}
                  onKeyDown={e => e.key === "Enter" && handleInputBlur()}
                  size="small"
                  inputProps={{ style: { textAlign: "center", fontSize: 28, fontFamily: "'Bebas Neue', cursive", color: "#7F1CE2", width: 80 } }}
                  sx={{ "& .MuiOutlinedInput-root": { "& fieldset": { borderColor: "rgba(127,28,226,0.3)" }, "&:hover fieldset": { borderColor: "#7F1CE2" }, "&.Mui-focused fieldset": { borderColor: "#7F1CE2" } } }}
                />
                <Typography sx={{ fontSize: 11, color: "#9A8AB0", mt: 0.5 }}>of {total} chapters</Typography>
              </Box>

              <IconButton onClick={() => commitRead(readCount + 1)} disabled={readCount >= total}
                sx={{ border: "1px solid rgba(127,28,226,0.3)", borderRadius: 1, p: 0.8, "&:hover": { background: "rgba(127,28,226,0.1)" } }}>
                <Add sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>

            {/* slider */}
            <Box sx={{ px: 1, mb: 3 }}>
              <Slider
                value={readCount}
                min={0} max={total} step={1}
                onChange={(_, val) => { setReadCount(val); setInputVal(String(val)); }}
                onChangeCommitted={(_, val) => commitRead(val)}
                sx={{ color: "#7F1CE2", "& .MuiSlider-thumb": { width: 16, height: 16 }, "& .MuiSlider-track": { background: "linear-gradient(90deg, #7F1CE2, #A855F7)" } }}
              />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography sx={{ fontSize: 10, color: "#9A8AB0" }}>0</Typography>
                <Typography sx={{ fontSize: 10, color: "#9A8AB0" }}>{total}</Typography>
              </Box>
            </Box>

            {/* quick actions */}
            <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
              <Button size="small" variant="outlined" startIcon={<CheckCircle sx={{ fontSize: 13 }} />}
                onClick={() => commitRead(total)}
                sx={{ fontSize: 11, borderColor: "rgba(46,204,113,0.3)", color: "#2ECC71", "&:hover": { background: "rgba(46,204,113,0.08)", borderColor: "#2ECC71" } }}>
                Mark All Read
              </Button>
              <Button size="small" variant="outlined" startIcon={<RadioButtonUnchecked sx={{ fontSize: 13 }} />}
                onClick={() => commitRead(0)}
                sx={{ fontSize: 11, borderColor: "rgba(255,255,255,0.1)", color: "#8A8398", "&:hover": { background: "rgba(255,255,255,0.04)" } }}>
                Mark All Unread
              </Button>
              {upcoming > 0 && (
                <Button size="small" variant="outlined"
                  onClick={() => commitRead(total)}
                  sx={{ fontSize: 11, borderColor: "rgba(127,28,226,0.3)", color: "#A855F7", "&:hover": { background: "rgba(127,28,226,0.08)" } }}>
                  Catch Up ({upcoming} unread)
                </Button>
              )}
            </Box>
          </Box>
        )}

        {/* ── DETAILS TAB ── */}
        {tab === 1 && (
          <Box>
            {series.description && (
              <Box sx={{ mb: 2.5, p: 2, background: "#12121A", borderRadius: 2, border: "1px solid rgba(255,255,255,0.06)" }}>
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: "#9A8AB0", textTransform: "uppercase", letterSpacing: "0.1em", mb: 1 }}>Synopsis</Typography>
                <Typography sx={{ fontSize: 13, color: "#C4B8D8", lineHeight: 1.75 }}>{series.description}</Typography>
              </Box>
            )}

            {[
              ["Source URL",  series.url,       "#A855F7", true],
              ["Status",      series.status,    "#F0EAE0", false],
              ["Notifications", series.notifications ? "Enabled" : "Muted", series.notifications ? "#2ECC71" : "#8A8398", false],
            ].map(([label, value, color, isLink]) => (
              <Box key={label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 1.5, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <Typography sx={{ color: "#8A8398", fontSize: 13, flexShrink: 0 }}>{label}</Typography>
                {isLink && value ? (
                  <Button size="small" endIcon={<OpenInNew sx={{ fontSize: 11 }} />}
                    href={value} target="_blank" component="a"
                    sx={{ color, fontSize: 12, maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    Open Series
                  </Button>
                ) : (
                  <Typography sx={{ color, fontSize: 13, maxWidth: "60%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</Typography>
                )}
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
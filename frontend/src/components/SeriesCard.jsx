import { useState } from "react";
import {
  Card, CardContent, CardActions, Box, Typography, Button,
  IconButton, LinearProgress, Tooltip, Menu, MenuItem, Divider,
} from "@mui/material";
import {
  Star, StarBorder, NotificationsActive, NotificationsNone,
  NewReleases, ArrowForward, MoreVert, CheckCircle,
  RadioButtonUnchecked, Close,
} from "@mui/icons-material";
import { getProgress, getUpcoming, getReadingStatus } from "../data";

export default function SeriesCard({ series, onUpdate, onRemove, onClick }) {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const progress  = getProgress(series);
  const upcoming  = getUpcoming(series);
  const rs        = getReadingStatus(series);

  return (
    <Card sx={{
      height: "100%", display: "flex", flexDirection: "column", cursor: "pointer",
      position: "relative", overflow: "hidden",
      "&:hover .cz": { transform: "scale(1.06)" },
      "&:hover": { boxShadow: "0 16px 50px rgba(0,0,0,0.5)", transform: "translateY(-2px)" },
    }} onClick={onClick}>

      {upcoming > 0 && (
        <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 2, background: "#7F1CE2", borderRadius: 1, px: 0.8, py: 0.2, display: "flex", alignItems: "center", gap: 0.4 }}>
          <NewReleases sx={{ fontSize: 11 }} />
          <Typography sx={{ fontSize: 10, fontWeight: 700 }}>{upcoming}</Typography>
        </Box>
      )}

      <Box sx={{ position: "relative", paddingTop: "140%", overflow: "hidden", flexShrink: 0 }}>
        <Box className="cz" sx={{ position: "absolute", inset: 0, transition: "transform 0.4s ease" }}>
          <img src={series.cover} alt={series.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </Box>
        <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #12121A 0%, rgba(18,18,26,0.2) 55%, transparent 100%)" }} />
        <Box sx={{ position: "absolute", top: 7, left: 7, display: "flex", gap: 0.5 }}>
          <Tooltip title={series.rating === 5 ? "Unfavorite" : "Favorite"}>
            <IconButton size="small" onClick={e => { e.stopPropagation(); onUpdate({ ...series, rating: series.rating === 5 ? 0 : 5 }); }}
              sx={{ background: "rgba(0,0,0,0.65)", p: 0.5 }}>
              {series.rating === 5
                ? <Star sx={{ fontSize: 13, color: "#F5A623" }} />
                : <StarBorder sx={{ fontSize: 13, color: "#fff" }} />}
            </IconButton>
          </Tooltip>
          <Tooltip title={series.notifications ? "Mute" : "Enable notifications"}>
            <IconButton size="small" onClick={e => { e.stopPropagation(); onUpdate({ ...series, notifications: !series.notifications }); }}
              sx={{ background: "rgba(0,0,0,0.65)", p: 0.5 }}>
              {series.notifications
                ? <NotificationsActive sx={{ fontSize: 13, color: "#F5A623" }} />
                : <NotificationsNone sx={{ fontSize: 13, color: "#fff" }} />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <CardContent sx={{ pt: 1.2, pb: 0.8, px: 1.5, flex: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: { xs: 12, sm: 13 }, color: "#F0EAE0", lineHeight: 1.3, mb: 0.8, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {series.title}
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.8 }}>
          <Box sx={{ width: 5, height: 5, borderRadius: "50%", background: rs.color, flexShrink: 0 }} />
          <Typography sx={{ fontSize: 10, color: rs.color, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>{rs.label}</Typography>
        </Box>
        <LinearProgress variant="determinate" value={progress}
          sx={{ height: 2.5, borderRadius: 2, mb: 0.8, background: "rgba(255,255,255,0.08)",
            "& .MuiLinearProgress-bar": { background: progress === 100 ? "#2ECC71" : "linear-gradient(90deg, #7F1CE2, #A855F7)", borderRadius: 2 } }} />
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography sx={{ fontSize: 10, color: "#8A8398" }}>
            <Box component="span" sx={{ color: "#F0EAE0", fontWeight: 600 }}>{series.readChapters}</Box>/{series.latestChapter}
          </Typography>
          <Typography sx={{ fontSize: 10, color: "#8A8398" }}>{progress}%</Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ px: 1.5, pb: 1.5, pt: 0.5, gap: 0.8 }}>
        <Button fullWidth size="small" variant="outlined" onClick={e => { e.stopPropagation(); onClick(); }}
          sx={{ fontSize: 10, py: 0.6, borderColor: "rgba(255,255,255,0.12)", color: "#F0EAE0", "&:hover": { borderColor: "#7F1CE2" } }}
          endIcon={<ArrowForward sx={{ fontSize: 12 }} />}>
          Details
        </Button>
        <IconButton size="small" onClick={e => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}
          sx={{ flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 1, p: 0.7 }}>
          <MoreVert sx={{ fontSize: 16 }} />
        </IconButton>
        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}
          PaperProps={{ sx: { background: "#1A1A25", border: "1px solid rgba(255,255,255,0.08)" } }}>
          <MenuItem onClick={() => { onUpdate({ ...series, readChapters: series.latestChapter }); setMenuAnchor(null); }}>
            <CheckCircle sx={{ fontSize: 14, mr: 1, color: "#2ECC71" }} /> Mark All Read
          </MenuItem>
          <MenuItem onClick={() => { onUpdate({ ...series, readChapters: 0 }); setMenuAnchor(null); }}>
            <RadioButtonUnchecked sx={{ fontSize: 14, mr: 1 }} /> Mark All Unread
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { onRemove(series.id); setMenuAnchor(null); }} sx={{ color: "#E8341C" }}>
            <Close sx={{ fontSize: 14, mr: 1 }} /> Remove
          </MenuItem>
        </Menu>
      </CardActions>
    </Card>
  );
}
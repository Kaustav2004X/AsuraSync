import { useState, useEffect } from "react";
import {
  Box, Typography, Switch, CircularProgress,
  Button, Snackbar, Alert,
} from "@mui/material";
import {
  NotificationsActive, NotificationsOff, BugReport, CheckCircle,
} from "@mui/icons-material";
import { usePushNotifications } from "../hooks/usePushNotifications";
import { apiFetch } from "../api";

const P  = "#7F1CE2";
const PL = "#A855F7";
const PA = (o) => `rgba(127,28,226,${o})`;

const switchSx = {
  "& .MuiSwitch-switchBase.Mui-checked": { color: P },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: P },
};

const SettingRow = ({ icon, label, description, control, last = false }) => (
  <Box sx={{ display:"flex", alignItems:"center", gap:2, py:2,
             borderBottom: last ? "none" : `1px solid ${PA(0.1)}` }}>
    <Box sx={{ width:38, height:38, background:PA(0.12), border:`1px solid ${PA(0.25)}`,
               borderRadius:1.5, display:"flex", alignItems:"center", justifyContent:"center",
               color:P, flexShrink:0 }}>
      {icon}
    </Box>
    <Box sx={{ flex:1, minWidth:0 }}>
      <Typography sx={{ fontWeight:700, fontSize:{ xs:13, md:14 }, color:"#F0EAE0" }}>{label}</Typography>
      {description && <Typography sx={{ fontSize:11, color:"#9A8AB0" }}>{description}</Typography>}
    </Box>
    {control}
  </Box>
);

export default function NotificationsTab({ series, setSeries }) {
  const { supported, permission, subscribed, loading, subscribe, unsubscribe, sendTest } =
    usePushNotifications();

  // FIX 3: snackbar instead of inline alert
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
  const showSnack = (msg, sev = "success") => setSnack({ open: true, message: msg, severity: sev });

  const [testLoading,       setTestLoading]       = useState(false);
  // FIX 2: track notification state locally so toggles are immediately responsive
  const [notifStates,       setNotifStates]       = useState({});
  const [perSeriesUpdating, setPerSeriesUpdating] = useState({});

  // Initialise local notif states from series prop
  useEffect(() => {
    const init = {};
    series.forEach(s => { init[s.id] = s.notifications !== false; });
    setNotifStates(init);
  }, [series]);

  const handleToggle = async () => {
    if (subscribed) await unsubscribe();
    else await subscribe();
  };

  const handleTest = async () => {
    setTestLoading(true);
    const ok = await sendTest();
    showSnack(
      ok ? "Test notification sent! Check your browser." : "Failed — make sure your subscription is active.",
      ok ? "success" : "error"
    );
    setTestLoading(false);
  };

  // FIX 2: update local state immediately + call API + update parent series state
  const handleSeriesToggle = async (entryId, currentValue) => {
    const newValue = !currentValue;
    // Optimistic local update
    setNotifStates(prev => ({ ...prev, [entryId]: newValue }));
    setPerSeriesUpdating(prev => ({ ...prev, [entryId]: true }));
    try {
      await apiFetch(`/library/${entryId}`, {
        method: "PUT",
        body: JSON.stringify({ notifications: newValue }),
      });
      // Update parent series state so other tabs stay in sync
      if (setSeries) {
        setSeries(prev => prev.map(s =>
          s.id === entryId ? { ...s, notifications: newValue } : s
        ));
      }
    } catch {
      // Revert on failure
      setNotifStates(prev => ({ ...prev, [entryId]: currentValue }));
      showSnack("Failed to update notification setting", "error");
    } finally {
      setPerSeriesUpdating(prev => ({ ...prev, [entryId]: false }));
    }
  };

  return (
    <Box sx={{ display:"flex", flexDirection:"column", gap:2 }}>

      {/* ── Push toggle ── */}
      <Box sx={{ background:"#12121A", border:`1px solid ${PA(0.15)}`, borderRadius:2, p:{ xs:2, md:3 } }}>
        <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:2 }}>
          <Box sx={{ width:4, height:20, background:`linear-gradient(to bottom, ${P}, ${PL})`, borderRadius:2 }} />
          <Typography sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:20, color:"#F0EAE0" }}>
            PUSH NOTIFICATIONS
          </Typography>
        </Box>

        {!supported ? (
          <Alert severity="warning" sx={{ fontSize:13 }}>
            Your browser does not support push notifications.
          </Alert>
        ) : permission === "denied" ? (
          <Alert severity="error" sx={{ fontSize:13 }}>
            Notifications are blocked. Allow them in your browser site settings and refresh.
          </Alert>
        ) : (
          <>
            <SettingRow
              icon={subscribed
                ? <NotificationsActive sx={{ fontSize:18 }} />
                : <NotificationsOff    sx={{ fontSize:18 }} />}
              label="Browser Push Notifications"
              description={subscribed
                ? "You'll be notified when new chapters drop or a series link breaks."
                : "Enable to get notified about new chapters and broken links."}
              control={
                loading
                  ? <CircularProgress size={20} sx={{ color: P }} />
                  : <Switch checked={subscribed} onChange={handleToggle} sx={switchSx} />
              }
            />
            {subscribed && (
              <SettingRow
                icon={<BugReport sx={{ fontSize:18 }} />}
                label="Send Test Notification"
                description="Verify push notifications are reaching your device."
                last
                control={
                  <Button size="small" variant="outlined" onClick={handleTest} disabled={testLoading}
                    sx={{ borderColor:PA(0.35), color:"#F0EAE0", fontSize:11,
                          "&:hover":{ borderColor:P, background:PA(0.08) } }}>
                    {testLoading ? <CircularProgress size={14} color="inherit" /> : "Test"}
                  </Button>
                }
              />
            )}
          </>
        )}
      </Box>

      {/* ── Per-series toggles ── */}
      <Box sx={{ background:"#12121A", border:`1px solid ${PA(0.15)}`, borderRadius:2, p:{ xs:2, md:3 } }}>
        <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:1.5 }}>
          <Box sx={{ width:4, height:16, background:`linear-gradient(to bottom, ${P}, ${PL})`, borderRadius:2 }} />
          <Typography sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:18, color:"#F0EAE0" }}>
            PER-SERIES
          </Typography>
        </Box>
        <Typography sx={{ fontSize:12, color:"#9A8AB0", mb:2 }}>
          Mute notifications for individual series.
        </Typography>
        {series.length === 0 ? (
          <Typography sx={{ fontSize:13, color:"#9A8AB0", py:2 }}>No series in library yet.</Typography>
        ) : series.map(s => (
          <Box key={s.id} sx={{ display:"flex", alignItems:"center", gap:2, py:1.5,
               borderBottom:`1px solid ${PA(0.08)}` }}>
            <Box sx={{ width:36, height:48, borderRadius:1, overflow:"hidden", flexShrink:0 }}>
              {s.cover
                ? <img src={s.cover} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                : <Box sx={{ width:"100%", height:"100%", background:PA(0.15) }} />
              }
            </Box>
            <Typography sx={{ flex:1, fontSize:13, color:"#F0EAE0", overflow:"hidden",
                               textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {s.title}
            </Typography>
            {perSeriesUpdating[s.id]
              ? <CircularProgress size={18} sx={{ color: P }} />
              : <Switch
                  size="small"
                  checked={notifStates[s.id] ?? (s.notifications !== false)}
                  onChange={() => handleSeriesToggle(s.id, notifStates[s.id] ?? (s.notifications !== false))}
                  sx={switchSx}
                />
            }
          </Box>
        ))}
      </Box>

      {/* FIX 3: Snackbar popup instead of inline alert */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical:"bottom", horizontal:"center" }}>
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}
          sx={{ background:"#1A1A25", border:`1px solid ${PA(0.3)}`, color:"#F0EAE0" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
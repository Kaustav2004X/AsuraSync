import { useState, useRef, useEffect } from "react";
import {
  Box, Typography, Button, Avatar, Chip, Tabs, Tab, TextField,
  LinearProgress, Switch, Divider, IconButton, Tooltip,
  CircularProgress, Alert, Snackbar, Dialog, DialogTitle,
  DialogContent, DialogActions,
} from "@mui/material";
import {
  Edit, Save, Cancel, Google, FileDownload, Logout,
  NotificationsActive, TrendingUp, EmojiEvents,
  Security, CheckCircle, Email, CameraAlt, AddPhotoAlternate,
  AutoAwesome, Check, Visibility, VisibilityOff, Star, StarBorder,
  DeleteForever, Delete,
} from "@mui/icons-material";
import { getProgress, getUpcoming } from "../data";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { supabase } from "../supabase";
import CropDialog from "../components/CropDialog";

const P  = "#7F1CE2";
const PL = "#A855F7";
const PD = "#5A0FB0";
const PA = (o) => `rgba(127,28,226,${o})`;

const BANNERS = [
  "linear-gradient(135deg, #0D0520 0%, #1A0A35 40%, #2D1060 100%)",
  "linear-gradient(135deg, #0A0A1A 0%, #1A1060 50%, #0D0520 100%)",
  "linear-gradient(135deg, #150830 0%, #7F1CE2 60%, #A855F7 100%)",
  "linear-gradient(135deg, #0A0A0F 0%, #1f0d33 50%, #3b1278 100%)",
  "linear-gradient(135deg, #0D0A20 0%, #2D1060 40%, #5A0FB0 100%)",
  "linear-gradient(135deg, #0A0010 0%, #4a0080 50%, #7F1CE2 100%)",
];

export default function ProfilePage({ user, setUser, series, onLogout }) {
  const [editing, setEditing]           = useState(false);
  const [editName, setEditName]         = useState(user.name);
  const [editBio, setEditBio]           = useState(user.bio || "");
  const [activeTab, setActiveTab]       = useState(0);
  const [snack, setSnack]               = useState({ open: false, message: "", severity: "success" });
  const [saving, setSaving]             = useState(false);

  // profile data from DB (email, name)
  const [profileEmail, setProfileEmail] = useState(user.email);

  // banner & avatar
  const [bannerMode, setBannerMode]         = useState(false);
  const [selectedBanner, setSelectedBanner] = useState(user.banner || BANNERS[0]);
  const [bannerImage, setBannerImage]       = useState(user.bannerImage || null);
  const [avatarImage, setAvatarImage]       = useState(user.avatarImage || null);
  const [googleEmail, setGoogleEmail]       = useState("")

  // crop
  const [cropState, setCropState] = useState({ open: false, src: "", type: "" });

  // password change
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword]           = useState("");
  const [confirmPassword, setConfirmPassword]   = useState("");
  const [showNewPw, setShowNewPw]               = useState(false);
  const [showConfirmPw, setShowConfirmPw]       = useState(false);
  const [pwLoading, setPwLoading]               = useState(false);
  const [pwError, setPwError]                   = useState("");

  // change email
  const [changingEmail, setChangingEmail] = useState(false);
  const [newEmail, setNewEmail]           = useState("");
  const [emailLoading, setEmailLoading]   = useState(false);
  const [emailError, setEmailError]       = useState("");

  // google link
  const [linkingGoogle, setLinkingGoogle] = useState(false);

  // delete account — type "DELETE" to confirm
  const [deleteDialog, setDeleteDialog] = useState({
    open: false, confirmText: "", loading: false, error: "",
  });

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);
  const navigate       = useNavigate();

  const totalRead   = series.reduce((a, s) => a + (s.readChapters || 0), 0);
  const totalUnread = series.reduce((a, s) => a + getUpcoming(s), 0);
  const completed   = series.filter(s => s.readChapters === s.latestChapter && s.latestChapter > 0).length;
  const favourites  = series.filter(s => s.rating === 5);
  const mostRead    = [...series].sort((a, b) => (b.readChapters || 0) - (a.readChapters || 0))[0];

  // FIX 7: check providers array reliably — user is "google only" only if google is the
  // ONLY provider and email/password is not set up
  const providersList = user.providers || [user.provider || "email"];
  const hasGoogle     = providersList.includes("google");
  const hasEmail      = providersList.includes("email") || providersList.includes("email/password");
  // Only disable password change if google is linked but NO email provider
  const isGoogleOnly  = hasGoogle && !hasEmail;

  const showSnack = (msg, sev = "success") => setSnack({ open: true, message: msg, severity: sev });

  // FIX 8: load profile from DB — use DB name and email as source of truth
  useEffect(() => {
    apiFetch("/user/profile")
      .then(data => {
        setUser(prev => ({
          ...prev,
          name: data.name || prev.name,
          bio: data.bio || "",
          avatarImage: data.avatar_url || null,
          bannerImage: data.banner_url || null,
          banner: data.banner_preset || prev.banner,
          // keep email from auth (more reliable)
        }));
        setEditName(data.name || user.name || "");
        setEditBio(data.bio || "");
        setProfileEmail(user.email); // email from auth
        if (data.avatar_url) setAvatarImage(data.avatar_url);
        if (data.banner_url) setBannerImage(data.banner_url);
        if (data.banner_preset) setSelectedBanner(data.banner_preset);
      })
      .catch(err => console.error("Failed to load profile:", err));
    
    supabase.auth.getUserIdentities().then(({ data }) => {
      const googleId = data?.identities?.find(id => id.provider === "google");
      if (googleId?.identity_data?.email) {
        setGoogleEmail(googleId.identity_data.email);
      }
    });
  }, []);

  // FIX 8: save also updates Supabase auth metadata + profiles table
  const handleSave = async () => {
    setSaving(true);
    try {
      // update profiles table
      await apiFetch("/user/profile", {
        method: "PUT",
        body: JSON.stringify({ name: editName, bio: editBio, banner_preset: selectedBanner }),
      });
      // update Supabase auth user_metadata so it reflects everywhere
      await supabase.auth.updateUser({ data: { full_name: editName } });

      setUser(prev => ({
        ...prev,
        name: editName,
        bio: editBio,
        banner: selectedBanner,
        avatar: editName.charAt(0).toUpperCase(),
      }));
      setEditing(false);
      setBannerMode(false);
      showSnack("Profile updated!");
    } catch {
      showSnack("Failed to save profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropState({ open: true, src: reader.result, type: "avatar" });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleBannerFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropState({ open: true, src: reader.result, type: "banner" });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropDone = async (blob) => {
    const type = cropState.type;
    setCropState({ open: false, src: "", type: "" });
    const file = new File([blob], `${type}.webp`, { type: "image/webp" });
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (type === "avatar") {
        const data = await apiFetch("/user/avatar", { method: "POST", body: formData });
        setAvatarImage(data.avatar_url);
        // FIX 6: update user object so Navbar gets the new avatar
        setUser(prev => ({ ...prev, avatarImage: data.avatar_url }));
        showSnack("Avatar updated!");
      } else {
        const data = await apiFetch("/user/banner", { method: "POST", body: formData });
        setBannerImage(data.banner_url);
        setSelectedBanner(null);
        setUser(prev => ({ ...prev, bannerImage: data.banner_url }));
        setBannerMode(false);
        showSnack("Banner updated!");
      }
    } catch {
      showSnack(`Failed to upload ${type}`, "error");
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      await apiFetch("/user/avatar", { method: "DELETE" });
      setAvatarImage(null);
      setUser(prev => ({ ...prev, avatarImage: null }));
      showSnack("Avatar removed");
    } catch {
      showSnack("Failed to remove avatar", "error");
    }
  };

  const handleBannerDone = async () => {
    try {
      if (!bannerImage) {
        await apiFetch("/user/profile", {
          method: "PUT",
          body: JSON.stringify({ banner_preset: selectedBanner }),
        });
        setUser(prev => ({ ...prev, banner: selectedBanner, bannerImage: null }));
      }
      setBannerMode(false);
      showSnack("Banner saved!");
    } catch {
      showSnack("Failed to save banner", "error");
    }
  };

  const handleDeleteBanner = async () => {
    try {
      await apiFetch("/user/banner", { method: "DELETE" });
      setBannerImage(null);
      setSelectedBanner(BANNERS[0]);
      setUser(prev => ({ ...prev, bannerImage: null, banner: BANNERS[0] }));
      setBannerMode(false);
      showSnack("Banner reset to default");
    } catch {
      showSnack("Failed to reset banner", "error");
    }
  };

  const handlePasswordChange = async () => {
    setPwError("");
    if (newPassword.length < 6) { setPwError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setPwError("Passwords do not match"); return; }
    setPwLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setChangingPassword(false);
      setNewPassword(""); setConfirmPassword("");
      showSnack("Password updated successfully!");
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwLoading(false);
    }
  };

  // FIX 9: email change — unlinks Google identity if present, then updates email
  const handleEmailChange = async () => {
    setEmailError("");
    if (!newEmail || !newEmail.includes("@")) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailLoading(true);
    try {
      // If user has google linked, unlink it first
      if (hasGoogle) {
        try {
          const { data: identitiesData } = await supabase.auth.getUserIdentities();
          const googleIdentity = identitiesData?.identities?.find(id => id.provider === "google");
          if (googleIdentity) {
            await supabase.auth.unlinkIdentity(googleIdentity);
          }
        } catch (unlinkErr) {
          console.warn("Could not unlink Google identity:", unlinkErr.message);
          // Continue anyway — email change is more important
        }
      }

      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;

      setChangingEmail(false);
      setNewEmail("");
      showSnack("Confirmation emails sent! Check both inboxes.");
    } catch (err) {
      setEmailError(err.message);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleLinkGoogle = async () => {
    setLinkingGoogle(true);
    try {
      // Use signInWithOAuth with link_identity scopes instead of linkIdentity
      // This forces the full Google account chooser screen
      const { error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: "select_account",   // forces account chooser
            access_type: "offline",
          },
        },
      });
      if (error) throw error;
    } catch (err) {
      showSnack(err.message || "Failed to link Google", "error");
      setLinkingGoogle(false);
    }
  };
  
  // FIX 4: delete account — type "DELETE" to confirm, no OTP
  const handleConfirmDelete = async () => {
    if (deleteDialog.confirmText !== "DELETE") return;
    setDeleteDialog(d => ({ ...d, loading: true, error: "" }));
    try {
      await apiFetch("/user", { method: "DELETE" });
      await supabase.auth.signOut();
      navigate("/");
    } catch (err) {
      setDeleteDialog(d => ({ ...d, error: err.message, loading: false }));
    }
  };

  const SettingRow = ({ icon, label, description, control, last = false }) => (
    <Box sx={{ display:"flex", alignItems:"center", gap:2, py:2, borderBottom: last ? "none" : `1px solid ${PA(0.1)}` }}>
      <Box sx={{ width:38, height:38, background:PA(0.12), border:`1px solid ${PA(0.25)}`, borderRadius:1.5, display:"flex", alignItems:"center", justifyContent:"center", color:P, flexShrink:0 }}>
        {icon}
      </Box>
      <Box sx={{ flex:1, minWidth:0 }}>
        <Typography sx={{ fontWeight:700, fontSize:{ xs:13, md:14 }, color:"#F0EAE0" }}>{label}</Typography>
        {description && <Typography sx={{ fontSize:11, color:"#9A8AB0" }}>{description}</Typography>}
      </Box>
      {control}
    </Box>
  );

  const switchSx = {
    "& .MuiSwitch-switchBase.Mui-checked": { color: P },
    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: P },
  };
  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: PA(0.25) },
      "&:hover fieldset": { borderColor: P },
      "&.Mui-focused fieldset": { borderColor: P },
    },
  };

  return (
    <Box sx={{ maxWidth:900, mx:"auto", px:{ xs:2, md:4 }, py:3, pb:{ xs:14, md:6 } }}>

      {/* ── PROFILE CARD ── */}
      <Box sx={{ background:"#12121A", border:`1px solid ${PA(0.2)}`, borderRadius:3, overflow:"hidden", mb:3 }}>

        {/* Banner */}
        <Box sx={{
          height:{ xs:110, md:150 }, position:"relative", overflow:"hidden",
          background: bannerImage ? "none" : (selectedBanner || BANNERS[0]),
          backgroundImage: bannerImage ? `url(${bannerImage})` : undefined,
          backgroundSize:"cover", backgroundPosition:"center",
        }}>
          <Box sx={{ position:"absolute", inset:0, opacity:0.25, backgroundImage:`radial-gradient(${PA(0.6)} 1px, transparent 1px)`, backgroundSize:"22px 22px" }} />
          <Box sx={{ position:"absolute", inset:0, background:"linear-gradient(135deg, transparent 40%, rgba(127,28,226,0.15) 60%, transparent 80%)" }} />
          <Box sx={{ position:"absolute", top:10, right:10, display:"flex", gap:1 }}>
            {(bannerImage || (selectedBanner && selectedBanner !== BANNERS[0])) && (
              <Tooltip title="Reset to default">
                <IconButton onClick={handleDeleteBanner}
                  sx={{ background:"rgba(220,38,38,0.7)", border:"1px solid rgba(220,38,38,0.5)", color:"#fff", backdropFilter:"blur(8px)", "&:hover":{ background:"rgba(220,38,38,0.9)" }, transition:"all 0.2s" }}>
                  <Delete sx={{ fontSize:16 }} />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={bannerMode ? "Save banner" : "Edit banner"}>
              <IconButton
                onClick={bannerMode ? handleBannerDone : () => setBannerMode(true)}
                sx={{ background: bannerMode ? P : "rgba(0,0,0,0.55)", border:`1px solid ${bannerMode ? P : PA(0.3)}`, color:"#F0EAE0", backdropFilter:"blur(8px)", "&:hover":{ background: bannerMode ? PL : PA(0.3) }, transition:"all 0.2s" }}>
                {bannerMode ? <Check sx={{ fontSize:18 }} /> : <AddPhotoAlternate sx={{ fontSize:18 }} />}
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* FIX 2: removed "Choose Banner — click ✓ to save" text */}
        {bannerMode && (
          <Box sx={{ px:{ xs:2, md:4 }, py:2, background:PA(0.06), borderBottom:`1px solid ${PA(0.15)}` }}>
            <Box sx={{ display:"flex", gap:1.5, flexWrap:"wrap", alignItems:"center" }}>
              {BANNERS.map((b, i) => (
                <Box key={i} onClick={() => { setSelectedBanner(b); setBannerImage(null); }}
                  sx={{ width:64, height:36, borderRadius:1.5, background:b, cursor:"pointer", border: selectedBanner === b && !bannerImage ? `2px solid ${P}` : "2px solid transparent", boxShadow: selectedBanner === b && !bannerImage ? `0 0 12px ${PA(0.5)}` : "none", transition:"all 0.2s", "&:hover":{ transform:"scale(1.08)" } }} />
              ))}
              <Tooltip title="Upload custom image">
                <Box onClick={() => bannerInputRef.current?.click()}
                  sx={{ width:64, height:36, borderRadius:1.5, border:`2px dashed ${PA(0.4)}`, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", "&:hover":{ borderColor:P, background:PA(0.08) }, transition:"all 0.2s" }}>
                  <AddPhotoAlternate sx={{ fontSize:16, color:PL }} />
                </Box>
              </Tooltip>
              <input ref={bannerInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleBannerFileSelect} />
            </Box>
          </Box>
        )}

        {/* Avatar + actions */}
        <Box sx={{ px:{ xs:2.5, md:4 }, pb:3 }}>
          <Box sx={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", mt:-5, mb:2.5, flexWrap:"wrap", gap:1 }}>
            <Box sx={{ position:"relative", flexShrink:0 }}>
              <Avatar src={avatarImage || undefined}
                sx={{ width:{ xs:76, md:92 }, height:{ xs:76, md:92 }, background:`linear-gradient(135deg, ${P}, ${PD})`, fontSize:{ xs:28, md:34 }, fontWeight:700, border:`4px solid #12121A`, boxShadow:`0 4px 24px ${PA(0.45)}`, fontFamily:"'Bebas Neue', cursive" }}>
                {!avatarImage && (user.avatar || user.name?.charAt(0))}
              </Avatar>
              <Tooltip title="Change avatar">
                <IconButton onClick={() => avatarInputRef.current?.click()}
                  sx={{ position:"absolute", bottom:0, right:0, width:26, height:26, background:P, border:"2px solid #12121A", "&:hover":{ background:PL }, p:0 }}>
                  <CameraAlt sx={{ fontSize:13, color:"#fff" }} />
                </IconButton>
              </Tooltip>
              {avatarImage && (
                <Tooltip title="Remove avatar">
                  <IconButton onClick={handleDeleteAvatar}
                    sx={{ position:"absolute", bottom:0, left:0, width:26, height:26, background:"rgba(220,38,38,0.85)", border:"2px solid #12121A", "&:hover":{ background:"#DC2626" }, p:0 }}>
                    <Delete sx={{ fontSize:12, color:"#fff" }} />
                  </IconButton>
                </Tooltip>
              )}
              <input ref={avatarInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleAvatarFileSelect} />
            </Box>
            <Box sx={{ display:"flex", gap:1, pb:0.5 }}>
              {!editing ? (
                <Button variant="outlined" size="small" startIcon={<Edit sx={{ fontSize:13 }} />}
                  onClick={() => { setEditing(true); setEditName(user.name); setEditBio(user.bio || ""); }}
                  sx={{ borderColor:PA(0.4), color:"#F0EAE0", fontSize:12, "&:hover":{ borderColor:P, background:PA(0.08) } }}>
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button variant="contained" size="small"
                    startIcon={saving ? <CircularProgress size={12} color="inherit" /> : <Save sx={{ fontSize:13 }} />}
                    onClick={handleSave} disabled={saving}
                    sx={{ fontSize:12, background:`linear-gradient(135deg, ${P}, ${PD})` }}>
                    {saving ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outlined" size="small" startIcon={<Cancel sx={{ fontSize:13 }} />}
                    onClick={() => { setEditing(false); setBannerMode(false); }}
                    sx={{ borderColor:PA(0.3), color:"#9A8AB0", fontSize:12 }}>
                    Cancel
                  </Button>
                </>
              )}
            </Box>
          </Box>

          {!editing ? (
            <Box>
              <Typography sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:{ xs:26, md:34 }, color:"#F0EAE0", lineHeight:1, mb:0.4, letterSpacing:"0.03em" }}>{user.name}</Typography>
              {/* FIX 8: email from DB/auth state */}
              <Typography sx={{ fontSize:13, color:"#9A8AB0", mb:1 }}>{profileEmail}</Typography>
              {user.bio
                ? <Typography sx={{ fontSize:14, color:"#C4B8D8", lineHeight:1.7, maxWidth:500 }}>{user.bio}</Typography>
                : <Typography sx={{ fontSize:13, color:PA(0.35), fontStyle:"italic" }}>No bio yet — click Edit Profile to add one</Typography>
              }
              <Box sx={{ display:"flex", gap:1.5, mt:2, flexWrap:"wrap" }}>
                <Chip icon={<EmojiEvents sx={{ fontSize:14, color:`${PL} !important` }} />} label={`${series.length} Series`} size="small" sx={{ background:PA(0.1), color:PL, border:`1px solid ${PA(0.25)}` }} />
                <Chip icon={<TrendingUp sx={{ fontSize:14, color:`#2ECC71 !important` }} />} label={`${totalRead} Ch. Read`} size="small" sx={{ background:"rgba(46,204,113,0.1)", color:"#2ECC71", border:"1px solid rgba(46,204,113,0.2)" }} />
                {user.joinDate && <Chip label={`Joined ${user.joinDate}`} size="small" sx={{ background:PA(0.07), color:"#9A8AB0", border:`1px solid ${PA(0.15)}` }} />}
              </Box>
            </Box>
          ) : (
            <Box sx={{ display:"flex", flexDirection:"column", gap:2, maxWidth:500 }}>
              <TextField label="Display Name" value={editName} onChange={e => setEditName(e.target.value)} size="small" fullWidth sx={fieldSx} />
              <TextField label="Bio" value={editBio} onChange={e => setEditBio(e.target.value)} size="small" fullWidth multiline rows={3} placeholder="Tell others about your reading taste..." sx={fieldSx} />
            </Box>
          )}
        </Box>
      </Box>

      {/* TABS */}
      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
        sx={{ mb:3, "& .MuiTabs-indicator":{ background:`linear-gradient(90deg, ${P}, ${PL})`, height:3, borderRadius:2 }, background:"#12121A", borderRadius:2, border:`1px solid ${PA(0.15)}`, px:1 }}
        variant="scrollable" scrollButtons="auto">
        {["Stats","Notifications","Favourites","Account"].map(t => (
          <Tab key={t} label={t} sx={{ minHeight:46, color:"#9A8AB0", "&.Mui-selected":{ color:PL } }} />
        ))}
      </Tabs>


      {/* STATS */}
      {activeTab === 0 && (
        <Box>
          <Box sx={{ display:"grid", gridTemplateColumns:{ xs:"repeat(2,1fr)", sm:"repeat(4,1fr)" }, gap:{ xs:1.5, md:2 }, mb:3 }}>
            {[
              { label:"Chapters Read", value:totalRead,        color:P,         Icon:AutoAwesome        },
              { label:"Unread",        value:totalUnread,       color:"#F5A623", Icon:NotificationsActive },
              { label:"Up to Date",    value:completed,         color:"#2ECC71", Icon:CheckCircle         },
              { label:"Favourites",    value:favourites.length, color:PL,        Icon:Star                },
            ].map(st => (
              <Box key={st.label} sx={{ background:"#12121A", border:`1px solid ${PA(0.15)}`, borderRadius:2, p:{ xs:2, md:2.5 }, textAlign:"center", position:"relative", overflow:"hidden", "&:hover":{ borderColor:PA(0.4) } }}>
                <Box sx={{ position:"absolute", top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, ${st.color}, transparent)`, opacity:0.7 }} />
                <Box sx={{ width:36, height:36, borderRadius:1.5, background:`${st.color}18`, border:`1px solid ${st.color}40`, display:"flex", alignItems:"center", justifyContent:"center", mx:"auto", mb:1 }}>
                  <st.Icon sx={{ fontSize:18, color:st.color }} />
                </Box>
                <Typography sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:{ xs:28, md:36 }, color:st.color, lineHeight:1 }}>{st.value}</Typography>
                <Typography sx={{ fontSize:{ xs:10, md:11 }, color:"#9A8AB0", textTransform:"uppercase", letterSpacing:"0.08em", mt:0.3 }}>{st.label}</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ background:"#12121A", border:`1px solid ${PA(0.15)}`, borderRadius:2, p:{ xs:2, md:3 }, mb:2 }}>
            <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:2.5 }}>
              <Box sx={{ width:4, height:20, background:`linear-gradient(to bottom, ${P}, ${PL})`, borderRadius:2 }} />
              <Typography sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:20, color:"#F0EAE0", letterSpacing:"0.05em" }}>READING BREAKDOWN</Typography>
            </Box>
            {series.length === 0 ? (
              <Typography sx={{ fontSize:13, color:"#9A8AB0", textAlign:"center", py:2 }}>No series in library yet</Typography>
            ) : series.map(s => (
              <Box key={s.id} sx={{ mb:2 }}>
                <Box sx={{ display:"flex", justifyContent:"space-between", mb:0.6 }}>
                  <Typography sx={{ fontSize:13, color:"#F0EAE0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"65%" }}>{s.title}</Typography>
                  <Typography sx={{ fontSize:12, color:"#9A8AB0", flexShrink:0 }}>{s.readChapters}/{s.latestChapter}</Typography>
                </Box>
                <LinearProgress variant="determinate" value={getProgress(s)} sx={{ height:5, borderRadius:3, background:PA(0.12), "& .MuiLinearProgress-bar":{ background: getProgress(s)===100 ? "#2ECC71" : `linear-gradient(90deg, ${P}, ${PL})`, borderRadius:3 } }} />
              </Box>
            ))}
          </Box>

          {mostRead && (
            <Box sx={{ background:`linear-gradient(135deg, ${PA(0.1)}, ${PA(0.05)})`, border:`1px solid ${PA(0.25)}`, borderRadius:2, p:{ xs:2, md:3 }, display:"flex", gap:2, alignItems:"center" }}>
              <Box sx={{ width:54, height:72, borderRadius:1, overflow:"hidden", flexShrink:0 }}>
                <img src={mostRead.cover} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </Box>
              <Box>
                <Box sx={{ display:"flex", alignItems:"center", gap:1, mb:0.5 }}>
                  <EmojiEvents sx={{ fontSize:14, color:PL }} />
                  <Typography sx={{ fontSize:11, color:PL, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em" }}>Most Read</Typography>
                </Box>
                <Typography sx={{ fontWeight:700, fontSize:{ xs:14, md:16 }, color:"#F0EAE0" }}>{mostRead.title}</Typography>
                <Typography sx={{ fontSize:13, color:"#9A8AB0" }}>{mostRead.readChapters} chapters read</Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}


      {/* NOTIFICATIONS */}
      {activeTab === 1 && (
        <Box sx={{ background:"#12121A", border:`1px solid ${PA(0.15)}`, borderRadius:2, p:{ xs:2, md:3 } }}>
          <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:0.5 }}>
            <Box sx={{ width:4, height:20, background:`linear-gradient(to bottom, ${P}, ${PL})`, borderRadius:2 }} />
            <Typography sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:20, color:"#F0EAE0" }}>NOTIFICATION SETTINGS</Typography>
          </Box>
          <Typography sx={{ fontSize:13, color:"#9A8AB0", mb:3, ml:1 }}>Control how and when you're notified.</Typography>
          <SettingRow icon={<NotificationsActive sx={{ fontSize:18 }} />} label="Push Notifications" description="Get notified when new chapters drop" control={<Switch defaultChecked sx={switchSx} />} />
          <SettingRow icon={<Email sx={{ fontSize:18 }} />} label="Email Digest" description="Weekly summary of new releases" control={<Switch sx={switchSx} />} />
          <SettingRow icon={<TrendingUp sx={{ fontSize:18 }} />} label="Weekly Report" description="Your reading stats every Sunday" control={<Switch defaultChecked sx={switchSx} />} last />
          <Divider sx={{ my:2.5, borderColor:PA(0.1) }} />
          <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:1.5 }}>
            <Box sx={{ width:4, height:16, background:`linear-gradient(to bottom, ${P}, ${PL})`, borderRadius:2 }} />
            <Typography sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:18, color:"#F0EAE0" }}>PER-SERIES</Typography>
          </Box>
          {series.length === 0 ? (
            <Typography sx={{ fontSize:13, color:"#9A8AB0", py:2 }}>No series in library yet</Typography>
          ) : series.map(s => (
            <Box key={s.id} sx={{ display:"flex", alignItems:"center", gap:2, py:1.5, borderBottom:`1px solid ${PA(0.08)}` }}>
              <Box sx={{ width:36, height:48, borderRadius:1, overflow:"hidden", flexShrink:0 }}>
                <img src={s.cover} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              </Box>
              <Typography sx={{ flex:1, fontSize:13, color:"#F0EAE0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{s.title}</Typography>
              <Switch size="small" defaultChecked={s.notifications !== false} sx={switchSx} />
            </Box>
          ))}
        </Box>
      )}


      {/* FIX 5: FAVOURITES — series from props so progress is always current */}
      {activeTab === 2 && (
        <Box sx={{ background:"#12121A", border:`1px solid ${PA(0.15)}`, borderRadius:2, p:{ xs:2, md:3 } }}>
          <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:2 }}>
            <Box sx={{ width:4, height:20, background:`linear-gradient(to bottom, ${P}, ${PL})`, borderRadius:2 }} />
            <Typography sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:20, color:"#F0EAE0" }}>FAVOURITES</Typography>
          </Box>
          {favourites.length === 0 ? (
            <Box sx={{ textAlign:"center", py:5 }}>
              <StarBorder sx={{ fontSize:44, color:PA(0.3), mb:1.5 }} />
              <Typography sx={{ fontSize:14, color:"#9A8AB0" }}>
                No favourites yet — rate a series 5 stars in your library
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display:"flex", flexDirection:"column", gap:1.5 }}>
              {favourites.map((s, i) => {
                const prog = getProgress(s); // FIX 5: always fresh from series prop
                return (
                  <Box key={s.id} sx={{ display:"flex", gap:2, alignItems:"center", p:{ xs:1.5, md:2 }, background:`linear-gradient(135deg, ${PA(0.08)}, ${PA(0.03)})`, border:`1px solid ${PA(0.2)}`, borderRadius:2 }}>
                    <Typography sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:20, color:PA(0.5), minWidth:28, textAlign:"center" }}>{i + 1}</Typography>
                    <Box sx={{ width:46, height:62, borderRadius:1, overflow:"hidden", flexShrink:0 }}>
                      <img src={s.cover} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    </Box>
                    <Box sx={{ flex:1, minWidth:0 }}>
                      <Typography sx={{ fontWeight:700, fontSize:{ xs:13, md:15 }, color:"#F0EAE0", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", mb:0.3 }}>{s.title}</Typography>
                      <Typography sx={{ fontSize:12, color:"#9A8AB0", mb:0.5 }}>{s.readChapters}/{s.latestChapter} chapters</Typography>
                      <Box sx={{ display:"flex", gap:0.2 }}>
                        {[1,2,3,4,5].map(n => <Star key={n} sx={{ fontSize:13, color:"#F5A623" }} />)}
                      </Box>
                    </Box>
                    <Box sx={{ textAlign:"right", flexShrink:0 }}>
                      <Typography sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:22, color:prog===100?"#2ECC71":P, lineHeight:1 }}>{prog}%</Typography>
                      <Typography sx={{ fontSize:10, color:"#9A8AB0" }}>progress</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}


      {/* ACCOUNT */}
      {activeTab === 3 && (
        <Box sx={{ display:"flex", flexDirection:"column", gap:2 }}>
          <Box sx={{ background:"#12121A", border:`1px solid ${PA(0.15)}`, borderRadius:2, p:{ xs:2, md:3 } }}>
            <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:2 }}>
              <Box sx={{ width:4, height:20, background:`linear-gradient(to bottom, ${P}, ${PL})`, borderRadius:2 }} />
              <Typography sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:20, color:"#F0EAE0" }}>ACCOUNT</Typography>
            </Box>

            {/* FIX 7: Change password — disabled only if google-only (no email provider) */}
            <SettingRow icon={<Security sx={{ fontSize:18 }} />} label="Change Password"
              description={isGoogleOnly ? "Sign up with email to enable password" : "Update your login password"}
              control={!isGoogleOnly && (
                <Button size="small" variant="outlined"
                  onClick={() => { setChangingPassword(!changingPassword); setPwError(""); setNewPassword(""); setConfirmPassword(""); }}
                  sx={{ borderColor:PA(0.3), color:"#F0EAE0", fontSize:11, "&:hover":{ borderColor:P, background:PA(0.08) } }}>
                  {changingPassword ? "Cancel" : "Update"}
                </Button>
              )}
            />
            {changingPassword && !isGoogleOnly && (
              <Box sx={{ ml:{ md:6 }, mb:2, mt:1, display:"flex", flexDirection:"column", gap:1.5, maxWidth:400 }}>
                <TextField label="New Password" size="small" fullWidth type={showNewPw?"text":"password"} value={newPassword} onChange={e=>setNewPassword(e.target.value)} sx={fieldSx}
                  InputProps={{ endAdornment: <IconButton size="small" onClick={()=>setShowNewPw(!showNewPw)} edge="end">{showNewPw?<VisibilityOff sx={{fontSize:16}}/>:<Visibility sx={{fontSize:16}}/>}</IconButton> }} />
                <TextField label="Confirm New Password" size="small" fullWidth type={showConfirmPw?"text":"password"} value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handlePasswordChange()} sx={fieldSx}
                  InputProps={{ endAdornment: <IconButton size="small" onClick={()=>setShowConfirmPw(!showConfirmPw)} edge="end">{showConfirmPw?<VisibilityOff sx={{fontSize:16}}/>:<Visibility sx={{fontSize:16}}/>}</IconButton> }} />
                {pwError && <Alert severity="error" sx={{ py:0.5, fontSize:12 }}>{pwError}</Alert>}
                <Button variant="contained" size="small" onClick={handlePasswordChange} disabled={pwLoading}
                  sx={{ alignSelf:"flex-start", background:`linear-gradient(135deg, ${P}, ${PD})`, fontSize:12 }}>
                  {pwLoading ? <CircularProgress size={16} color="inherit"/> : "Set New Password"}
                </Button>
              </Box>
            )}

            {/* Change email */}
            <SettingRow icon={<Email sx={{ fontSize:18 }} />} label="Change Email"
              description={hasGoogle ? "Changing email will unlink your Google account" : `Current: ${profileEmail}`}
              control={
                <Button size="small" variant="outlined"
                  onClick={() => { setChangingEmail(!changingEmail); setEmailError(""); setNewEmail(""); }}
                  sx={{ borderColor:PA(0.3), color:"#F0EAE0", fontSize:11, "&:hover":{ borderColor:P, background:PA(0.08) } }}>
                  {changingEmail ? "Cancel" : "Change"}
                </Button>
              }
            />
            {changingEmail && (
              <Box sx={{ ml:{ md:6 }, mb:2, mt:1, display:"flex", flexDirection:"column", gap:1.5, maxWidth:400 }}>
                {hasGoogle && (
                  <Alert severity="warning" sx={{ py:0.5, fontSize:11 }}>
                    ⚠️ Changing email will unlink your Google account automatically.
                  </Alert>
                )}
                <TextField label="New Email Address" size="small" fullWidth type="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleEmailChange()} sx={fieldSx} />
                {emailError && <Alert severity="error" sx={{ py:0.5, fontSize:12 }}>{emailError}</Alert>}
                <Button variant="contained" size="small" onClick={handleEmailChange} disabled={emailLoading}
                  sx={{ alignSelf:"flex-start", background:`linear-gradient(135deg, ${P}, ${PD})`, fontSize:12 }}>
                  {emailLoading ? <CircularProgress size={16} color="inherit"/> : "Send Confirmation"}
                </Button>
                <Typography sx={{ fontSize:11, color:"#9A8AB0" }}>
                  Confirmation sent to both current and new address.
                </Typography>
              </Box>
            )}

            {/* Google connection */}
            <SettingRow icon={<Google sx={{ fontSize:18 }} />}
              label={hasGoogle ? "Connected: Google" : "Google"}
              description={hasGoogle ? (googleEmail || user.email) : "Link your Google account for easy sign-in"}
              last
              control={
                hasGoogle ? (
                  <Chip label="Connected" size="small" sx={{ background:"rgba(46,204,113,0.12)", color:"#2ECC71", border:"1px solid rgba(46,204,113,0.25)", fontSize:10 }} />
                ) : (
                  <Button size="small" variant="outlined"
                    startIcon={linkingGoogle ? <CircularProgress size={12} color="inherit"/> : <Google sx={{ fontSize:13 }} />}
                    onClick={handleLinkGoogle} disabled={linkingGoogle}
                    sx={{ borderColor:PA(0.35), color:"#F0EAE0", fontSize:11, "&:hover":{ borderColor:P, background:PA(0.08) } }}>
                    {linkingGoogle ? "Linking…" : "Link Google"}
                  </Button>
                )
              }
            />
          </Box>

          {/* Data */}
          <Box sx={{ background:"#12121A", border:`1px solid ${PA(0.15)}`, borderRadius:2, p:{ xs:2, md:3 } }}>
            <Box sx={{ display:"flex", alignItems:"center", gap:1.5, mb:2 }}>
              <Box sx={{ width:4, height:20, background:`linear-gradient(to bottom, ${P}, ${PL})`, borderRadius:2 }} />
              <Typography sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:20, color:"#F0EAE0" }}>DATA</Typography>
            </Box>
            <SettingRow icon={<FileDownload sx={{ fontSize:18 }} />} label="Export All Data" description="Download your full reading history" last
              control={<Button size="small" variant="outlined" startIcon={<FileDownload sx={{ fontSize:13 }} />} sx={{ borderColor:PA(0.3), color:"#F0EAE0", fontSize:11 }}>Export</Button>} />
          </Box>

          {/* Danger zone */}
          <Box sx={{ background:"rgba(220,38,38,0.04)", border:"1px solid rgba(220,38,38,0.25)", borderRadius:2, p:{ xs:2, md:3 }, position:"relative", overflow:"hidden" }}>
            <Box sx={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg, #DC2626, #EF4444, transparent)", opacity:0.7 }} />
            <Typography sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:20, color:"#EF4444", mb:0.5 }}>DANGER ZONE</Typography>
            <Typography sx={{ fontSize:13, color:"#9A8AB0", mb:2.5 }}>These actions are permanent and cannot be undone.</Typography>
            <Box sx={{ display:"flex", gap:2, flexWrap:"wrap" }}>
              <Button variant="outlined" startIcon={<Logout sx={{ fontSize:16 }} />}
                onClick={() => { onLogout(); navigate("/"); }}
                sx={{ borderColor:PA(0.5), color:PL, "&:hover":{ background:PA(0.1), borderColor:P } }}>
                Sign Out
              </Button>
              <Button variant="contained" startIcon={<DeleteForever sx={{ fontSize:16 }} />}
                onClick={() => setDeleteDialog({ open:true, confirmText:"", loading:false, error:"" })}
                sx={{ background:"linear-gradient(135deg, #DC2626, #B91C1C)", "&:hover":{ background:"linear-gradient(135deg, #EF4444, #DC2626)" } }}>
                Delete Account
              </Button>
            </Box>
          </Box>
        </Box>
      )}


      {/* FIX 4: DELETE ACCOUNT DIALOG — type "DELETE" to confirm */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog(d => ({ ...d, open:false }))}
        maxWidth="xs" fullWidth
        PaperProps={{ sx: { background:"#12121A", border:"1px solid rgba(220,38,38,0.3)" } }}>
        <DialogTitle sx={{ color:"#EF4444", fontFamily:"'Bebas Neue', cursive", fontSize:22 }}>
          ⚠️ DELETE ACCOUNT
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb:2, fontSize:12 }}>
            This will permanently delete your account and all your data. This cannot be undone.
          </Alert>
          <Typography sx={{ fontSize:13, color:"#9A8AB0", mb:1.5 }}>
            Type <Box component="span" sx={{ color:"#EF4444", fontWeight:700, fontFamily:"'Bebas Neue', cursive", fontSize:15 }}>DELETE</Box> to confirm:
          </Typography>
          <TextField size="small" fullWidth placeholder="Type DELETE here"
            value={deleteDialog.confirmText}
            onChange={e => setDeleteDialog(d => ({ ...d, confirmText: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && deleteDialog.confirmText === "DELETE" && handleConfirmDelete()}
            sx={{ "& .MuiOutlinedInput-root":{ "& fieldset":{ borderColor:"rgba(220,38,38,0.3)" }, "&:hover fieldset":{ borderColor:"#DC2626" }, "&.Mui-focused fieldset":{ borderColor:"#DC2626" } } }}
          />
          {deleteDialog.error && <Alert severity="error" sx={{ mt:1.5, py:0.5, fontSize:12 }}>{deleteDialog.error}</Alert>}
        </DialogContent>
        <DialogActions sx={{ px:3, pb:2.5, gap:1 }}>
          <Button onClick={() => setDeleteDialog(d => ({ ...d, open:false }))} sx={{ color:"#9A8AB0" }}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmDelete}
            disabled={deleteDialog.loading || deleteDialog.confirmText !== "DELETE"}
            sx={{ background:"linear-gradient(135deg, #DC2626, #B91C1C)" }}>
            {deleteDialog.loading ? <CircularProgress size={16} color="inherit"/> : "Delete My Account"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CROP DIALOG */}
      <CropDialog
        open={cropState.open}
        imageSrc={cropState.src}
        aspect={cropState.type === "avatar" ? 1 : 4}
        circular={cropState.type === "avatar"}
        title={cropState.type === "avatar" ? "CROP AVATAR" : "CROP BANNER"}
        onClose={() => setCropState({ open:false, src:"", type:"" })}
        onCropDone={handleCropDone}
      />

      <Snackbar open={snack.open} autoHideDuration={2500} onClose={() => setSnack({ ...snack, open:false })} anchorOrigin={{ vertical:"bottom", horizontal:"center" }}>
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open:false })} sx={{ background:"#1A1A25", border:`1px solid ${PA(0.3)}`, color:"#F0EAE0" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
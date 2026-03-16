import { useState, useEffect, useRef } from "react";
import {
  Box, Typography, Button, Paper, TextField, Divider,
  CircularProgress, Alert, IconButton, InputAdornment,
} from "@mui/material";
import {
  Google, Email, ArrowDownward,
  Devices, Contrast, Star, Search, TrendingUp,
  TableChart, Notifications, Link, FilterList,
  BarChart, CloudDownload, BookmarkBorder, Speed,
  Visibility, VisibilityOff,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";

const CSS = `
  @keyframes fadeUp      { from{opacity:0;transform:translateY(40px);}  to{opacity:1;transform:translateY(0);} }
  @keyframes fadeLeft    { from{opacity:0;transform:translateX(-60px);} to{opacity:1;transform:translateX(0);} }
  @keyframes fadeRight   { from{opacity:0;transform:translateX(60px);}  to{opacity:1;transform:translateX(0);} }
  @keyframes fadeIn      { from{opacity:0;} to{opacity:1;} }
  @keyframes scaleIn     { from{opacity:0;transform:scale(0.8);}        to{opacity:1;transform:scale(1);}      }
  @keyframes letterDrop  { from{opacity:0;transform:translateY(80px) rotateX(-90deg);} to{opacity:1;transform:translateY(0) rotateX(0);} }
  @keyframes floatA      { 0%,100%{transform:translate(0,0) scale(1);}         33%{transform:translate(40px,-30px) scale(1.08);} 66%{transform:translate(-20px,20px) scale(0.94);} }
  @keyframes floatB      { 0%,100%{transform:translate(0,0) scale(1);}         33%{transform:translate(-50px,30px) scale(1.1);}  66%{transform:translate(30px,-40px) scale(0.9);}  }
  @keyframes floatC      { 0%,100%{transform:translate(0,0) scale(1);}         50%{transform:translate(20px,-50px) scale(1.05);}                                                   }
  @keyframes particle    { 0%{opacity:0;transform:translateY(0) scale(0.5);} 30%{opacity:0.9;transform:translateY(-20px) scale(1.2);} 70%{opacity:0.5;transform:translateY(-40px) scale(0.9);} 100%{opacity:0;transform:translateY(-70px) scale(0.4);} }
  @keyframes dotWave     { 0%,100%{opacity:0.07;transform:scale(0.7);} 50%{opacity:0.55;transform:scale(1.35);} }
  @keyframes gridReveal  { from{opacity:0;transform:scale(0);}  to{opacity:1;transform:scale(1);}  }
  @keyframes pulse       { 0%,100%{box-shadow:0 0 0 0 rgba(127,28,226,0.5);} 50%{box-shadow:0 0 0 12px rgba(127,28,226,0);} }
  @keyframes bounce      { 0%,100%{transform:translateY(0);}  50%{transform:translateY(10px);} }
  @keyframes drawLine    { from{height:0;} to{height:100%;} }

  .scroll-reveal          { opacity:0; transform:translateY(40px);  transition:none; }
  .reveal-left            { opacity:0; transform:translateX(-60px); transition:none; }
  .reveal-right           { opacity:0; transform:translateX(60px);  transition:none; }
  .reveal-scale           { opacity:0; transform:scale(0.8);        transition:none; }
  .step-line              { height:0; }

  .scroll-reveal.in  { animation: fadeUp    0.8s cubic-bezier(0.22,1,0.36,1) var(--d,0s) both; }
  .reveal-left.in    { animation: fadeLeft  0.8s cubic-bezier(0.22,1,0.36,1) var(--d,0s) both; }
  .reveal-right.in   { animation: fadeRight 0.8s cubic-bezier(0.22,1,0.36,1) var(--d,0s) both; }
  .reveal-scale.in   { animation: scaleIn   0.7s cubic-bezier(0.34,1.56,0.64,1) var(--d,0s) both; }
  .step-line.in      { animation: drawLine  1s ease var(--d,0s) both; }

  .scroll-reveal.out { animation: none; opacity:0; transform:translateY(40px);  transition: opacity 0.4s ease, transform 0.4s ease; }
  .reveal-left.out   { animation: none; opacity:0; transform:translateX(-60px); transition: opacity 0.4s ease, transform 0.4s ease; }
  .reveal-right.out  { animation: none; opacity:0; transform:translateX(60px);  transition: opacity 0.4s ease, transform 0.4s ease; }
  .reveal-scale.out  { animation: none; opacity:0; transform:scale(0.8);        transition: opacity 0.4s ease, transform 0.4s ease; }
  .step-line.out     { animation: none; height:0; transition: height 0.4s ease; }

  .feature-card { transition: transform 0.3s ease, box-shadow 0.3s ease !important; }
  .feature-card:hover { transform: translateY(-8px) !important; }
  .cta-btn { transition: transform 0.2s ease, box-shadow 0.2s ease !important; }
  .cta-btn:hover { transform: scale(1.05) translateY(-2px) !important; }
  .step-dot { transition: transform 0.3s, box-shadow 0.3s; }
  .step-dot:hover { transform: translateX(-50%) scale(1.2) !important; }
`;

function ScrollBar() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const fn = () => {
      const el = document.documentElement;
      setP((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return (
    <Box sx={{ position:"fixed", top:0, left:0, zIndex:9999, height:3, background:"linear-gradient(90deg,#7F1CE2,#A855F7,#C084FC)", width:`${p}%`, transition:"width 0.05s linear", boxShadow:"0 0 10px rgba(127,28,226,0.8)" }} />
  );
}

function Counter({ target, suffix = "", duration = 2000 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const num = parseInt(target.replace(/\D/g, ""));
        const tick = (now) => {
          const prog = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - prog, 3);
          setVal(Math.floor(eased * num));
          if (prog < 1) requestAnimationFrame(tick);
          else setVal(num);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

const SectionLabel = ({ text }) => (
  <Box sx={{ display:"inline-flex", alignItems:"center", gap:1, border:"1px solid rgba(127,28,226,0.3)", borderRadius:50, px:2, py:0.6, mb:3, background:"rgba(127,28,226,0.05)" }}>
    <Typography sx={{ fontSize:11, fontWeight:700, letterSpacing:"0.15em", color:"#7F1CE2", textTransform:"uppercase" }}>{text}</Typography>
  </Box>
);

export default function LandingPage() {
  const [authMode, setAuthMode]         = useState("landing");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [isLogin, setIsLogin]           = useState(true);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess]           = useState("");

  // OTP signup flow
  const [otpSent, setOtpSent]   = useState(false);
  const [otp, setOtp]           = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // forgot password flow
  const [forgotMode, setForgotMode]         = useState(false);
  const [forgotEmail, setForgotEmail]       = useState("");
  const [forgotLoading, setForgotLoading]   = useState(false);
  const [forgotSent, setForgotSent]         = useState(false);

  const [mounted, setMounted] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const navigate = useNavigate();

  const bg     = "#0A0A0F";
  const paper  = "rgba(18,18,26,0.92)";
  const tp     = "#F0EAE0";
  const ts     = "#9A8AB0";
  const border = "rgba(127,28,226,0.15)";
  const cardBg = "rgba(18,18,26,0.85)";

  useEffect(() => {
    if (!document.getElementById("lp-css")) {
      const s = document.createElement("style"); s.id = "lp-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const selectors = ".scroll-reveal,.reveal-left,.reveal-right,.reveal-scale,.step-line";
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        const el = e.target;
        const delay = el.dataset.delay || "0s";
        if (e.isIntersecting) {
          el.style.setProperty("--d", delay);
          el.classList.remove("out");
          el.classList.add("in");
        } else {
          el.classList.remove("in");
          el.classList.add("out");
        }
      });
    }, { threshold: 0.12 });
    const els = document.querySelectorAll(selectors);
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [mounted, authMode]);

  const handleVerifyOtp = async () => {
    setOtpLoading(true); setError("");
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "signup" });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleAuth = async () => {
    setLoading(true); setError("");
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setOtpSent(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail || !forgotEmail.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    setForgotLoading(true); setError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setForgotSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  const resetAuthState = () => {
    setError(""); setSuccess(""); setShowPassword(false);
    setOtpSent(false); setOtp("");
    setForgotMode(false); setForgotSent(false); setForgotEmail("");
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    resetAuthState();
  };

  const COLS = 30, ROWS = 14;
  const dots = Array.from({ length: COLS * ROWS }, (_, i) => {
    const col = i % COLS, row = Math.floor(i / COLS);
    const dist = Math.sqrt((col - COLS / 2) ** 2 + (row - ROWS / 2) ** 2);
    const max  = Math.sqrt((COLS / 2) ** 2 + (ROWS / 2) ** 2);
    return { i, rd: (dist / max) * 1000, wd: (dist / max) * 2200 };
  });

  const TitleLine = ({ text, hollow, base = 0.5 }) => (
    <Box component="div" sx={{ display:"block", perspective:"800px" }}>
      {text.split("").map((ch, i) => (
        <Box key={i} component="span" sx={{
          display:"inline-block", whiteSpace: ch === " " ? "pre" : "normal",
          fontFamily:"'Bebas Neue', cursive", fontSize:{ xs:52, sm:76, md:106 }, lineHeight:0.88,
          opacity: mounted ? 1 : 0,
          animation: mounted ? `letterDrop 0.55s cubic-bezier(0.22,1,0.36,1) ${base + i * 0.025}s both` : "none",
          ...(hollow
            ? { WebkitTextStroke:{ xs:"1.5px #7F1CE2", md:"2.5px #7F1CE2" }, color:"transparent" }
            : { color: tp }),
        }}>
          {ch === " " ? "\u00A0" : ch}
        </Box>
      ))}
    </Box>
  );

  // ── AUTH PAGE ─────────────────────────────────────────
  if (authMode === "email") return (
    <Box sx={{ minHeight:"100vh", background:bg, display:"flex", alignItems:"center", justifyContent:"center", px:2, position:"relative", overflow:"hidden" }}>
      <Box sx={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 60% 60% at 50% 50%, rgba(127,28,226,0.15) 0%, transparent 70%)", pointerEvents:"none" }} />
      <Paper sx={{ width:"100%", maxWidth:420, p:{ xs:3, md:4 }, background:paper, border:`1px solid ${border}`, boxShadow:"0 40px 80px rgba(127,28,226,0.2)", backdropFilter:"blur(20px)", animation:"fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) both", position:"relative", zIndex:1 }}>

        <Box sx={{ textAlign:"center", mb:3 }}>
          <Box sx={{ width:52, height:52, borderRadius:2, overflow:"hidden", mx:"auto", mb:2, boxShadow:"0 8px 24px rgba(127,28,226,0.4)", animation:"pulse 2.5s infinite" }}>
            <img src="/src/assets/AsuraSync.png" alt="AsuraSync" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          </Box>
          <Typography variant="h3" sx={{ fontSize:{ xs:30, md:38 }, color:tp, mb:0.5 }}>
            {forgotMode ? "RESET PASSWORD" : isLogin ? "WELCOME BACK" : otpSent ? "VERIFY EMAIL" : "JOIN THE VAULT"}
          </Typography>
          <Typography sx={{ color:ts, fontSize:13 }}>
            {forgotMode
              ? forgotSent ? "Check your inbox for a reset link" : "Enter your email to receive a reset link"
              : isLogin ? "Sign in to your reading list"
              : otpSent ? `Enter the code sent to ${email}`
              : "Start tracking manhwa today"}
          </Typography>
        </Box>

        {/* ── FORGOT PASSWORD MODE ── */}
        {forgotMode ? (
          <Box sx={{ display:"flex", flexDirection:"column", gap:2 }}>
            {forgotSent ? (
              <Alert severity="success" sx={{ fontSize:12 }}>
                Password reset email sent! Check your inbox and follow the link to set a new password.
              </Alert>
            ) : (
              <>
                <TextField fullWidth label="Email Address" value={forgotEmail} size="small"
                  onChange={e => setForgotEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleForgotPassword()}
                />
                {error && <Alert severity="error" sx={{ py:0.5, fontSize:12 }}>{error}</Alert>}
                <Button fullWidth variant="contained" onClick={handleForgotPassword} disabled={forgotLoading} className="cta-btn" sx={{ py:1.4 }}>
                  {forgotLoading ? <CircularProgress size={20} color="inherit"/> : "Send Reset Link"}
                </Button>
              </>
            )}
            <Button size="small" onClick={() => { setForgotMode(false); setForgotSent(false); setError(""); }} sx={{ color:ts, fontSize:12, mt:0.5 }}>
              ← Back to Sign In
            </Button>
          </Box>
        ) : (
          <>
            {/* Google button — hide in OTP step */}
            {!otpSent && (
              <>
                <Button fullWidth variant="contained" startIcon={<Google/>} onClick={handleGoogle} className="cta-btn" sx={{ mb:2.5, py:1.4 }}>
                  Continue with Google
                </Button>
                <Box sx={{ display:"flex", alignItems:"center", gap:2, mb:2.5 }}>
                  <Divider sx={{ flex:1 }}/><Typography sx={{ color:ts, fontSize:12 }}>OR</Typography><Divider sx={{ flex:1 }}/>
                </Box>
              </>
            )}

            <Box sx={{ display:"flex", flexDirection:"column", gap:2 }}>
              {!otpSent ? (
                <>
                  <TextField fullWidth label="Email" value={email} size="small" onChange={e => setEmail(e.target.value)} />
                  <TextField
                    fullWidth label="Password" size="small"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAuth()}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton size="small" edge="end" onClick={() => setShowPassword(v => !v)} sx={{ color:ts, "&:hover":{ color:"#7F1CE2" } }}>
                            {showPassword ? <VisibilityOff sx={{ fontSize:18 }}/> : <Visibility sx={{ fontSize:18 }}/>}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                  />
                  {error && <Alert severity="error" sx={{ py:0.5, fontSize:12 }}>{error}</Alert>}
                  <Button fullWidth variant="contained" onClick={handleAuth} disabled={loading} className="cta-btn" sx={{ py:1.4, mt:0.5 }}>
                    {loading ? <CircularProgress size={20} color="inherit"/> : isLogin ? "Sign In" : "Create Account"}
                  </Button>
                  {/* Forgot password link — only on login */}
                  {isLogin && (
                    <Button size="small" onClick={() => { setForgotMode(true); setForgotEmail(email); setError(""); }}
                      sx={{ color:ts, fontSize:11, alignSelf:"center", mt:-0.5 }}>
                      Forgot password?
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Alert severity="info" sx={{ py:0.5, fontSize:12 }}>Check your email for a 6-digit verification code.</Alert>
                  <TextField
                    fullWidth label="Verification Code" size="small"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    onKeyDown={e => e.key === "Enter" && handleVerifyOtp()}
                    inputProps={{ maxLength:6, style:{ textAlign:"center", letterSpacing:"0.4em", fontSize:22, fontFamily:"'Bebas Neue', cursive" } }}
                  />
                  {error && <Alert severity="error" sx={{ py:0.5, fontSize:12 }}>{error}</Alert>}
                  <Button fullWidth variant="contained" onClick={handleVerifyOtp} disabled={otpLoading || otp.length < 6} className="cta-btn" sx={{ py:1.4 }}>
                    {otpLoading ? <CircularProgress size={20} color="inherit"/> : "Verify & Create Account"}
                  </Button>
                  <Button size="small" onClick={() => { setOtpSent(false); setOtp(""); setError(""); }} sx={{ color:ts, fontSize:12 }}>
                    ← Use different email
                  </Button>
                </>
              )}
            </Box>

            {!otpSent && (
              <Box sx={{ textAlign:"center", mt:2.5 }}>
                <Button size="small" onClick={switchMode} sx={{ color:ts, fontSize:12 }}>
                  {isLogin ? "No account? Sign up" : "Have an account? Sign in"}
                </Button>
              </Box>
            )}
          </>
        )}

        <Button size="small"
          onClick={() => { setAuthMode("landing"); resetAuthState(); }}
          sx={{ display:"flex", mx:"auto", mt:1, color:ts, fontSize:12 }}>
          ← Back
        </Button>
      </Paper>
    </Box>
  );

  // ── LANDING PAGE ─────────────────────────────────────
  return (
    <Box sx={{ background:bg, overflowX:"hidden" }}>
      <ScrollBar />

      {/* HERO */}
      <Box sx={{ minHeight:"100vh", position:"relative", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <Box sx={{ position:"absolute", inset:0, zIndex:0, pointerEvents:"none", display:"grid", gridTemplateColumns:`repeat(${COLS},1fr)`, gridTemplateRows:`repeat(${ROWS},1fr)`, px:1 }}>
          {dots.map(({ i, rd, wd }) => (
            <Box key={i} sx={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Box sx={{ width:2.5, height:2.5, borderRadius:"50%", background:"rgba(127,28,226,0.35)", opacity:0, animation: mounted ? `gridReveal 0.4s ease ${rd}ms forwards, dotWave 3.8s ease-in-out ${rd + wd}ms infinite` : "none" }} />
            </Box>
          ))}
        </Box>
        <Box sx={{ position:"absolute", inset:0, zIndex:0, pointerEvents:"none" }}>
          {[
            { w:600, top:"-20%", left:"-15%",  a:"floatA 9s ease-in-out infinite",      c:"rgba(127,28,226,0.22)", p:0.05 },
            { w:420, top:"45%",  right:"-10%", a:"floatB 11s ease-in-out 1s infinite",  c:"rgba(168,85,247,0.17)", p:0.08 },
            { w:300, bottom:"0", left:"38%",   a:"floatC 8s ease-in-out 2s infinite",   c:"rgba(90,15,176,0.14)",  p:0.04 },
            { w:200, top:"18%",  left:"58%",   a:"floatA 7s ease-in-out 0.5s infinite", c:"rgba(196,132,252,0.11)",p:0.06 },
          ].map((o, i) => (
            <Box key={i} sx={{ position:"absolute", width:o.w, height:o.w, borderRadius:"50%", background:`radial-gradient(circle,${o.c} 0%,transparent 70%)`, filter:"blur(50px)", top:o.top, left:o.left, right:o.right, bottom:o.bottom, animation:o.a, transform:`translateY(${scrollY * o.p}px)` }} />
          ))}
        </Box>
        <Box sx={{ position:"absolute", inset:0, zIndex:0, pointerEvents:"none" }}>
          {Array.from({ length:22 }).map((_, i) => (
            <Box key={i} sx={{ position:"absolute", width:i%3===0?7:i%3===1?4:9, height:i%3===0?7:i%3===1?4:9, borderRadius:i%2===0?"50%":"2px", background:["rgba(127,28,226,0.7)","rgba(168,85,247,0.6)","rgba(90,15,176,0.5)","rgba(196,132,252,0.6)"][i%4], boxShadow:"0 0 10px rgba(127,28,226,0.4)", top:`${8+(i*4.7)%80}%`, left:`${4+(i*6.3)%90}%`, animation:`particle ${3+(i%4)}s ease-in-out ${i*0.3}s infinite` }} />
          ))}
        </Box>
        <Box sx={{ position:"absolute", inset:0, zIndex:0, pointerEvents:"none", background:"radial-gradient(ellipse 70% 55% at 50% 0%,rgba(127,28,226,0.1) 0%,transparent 70%)" }} />

        <Box sx={{ position:"relative", zIndex:10, px:{ xs:3, sm:6, md:10 }, py:{ xs:2.5, md:3 }, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <Box sx={{ display:"flex", alignItems:"center", gap:1.5, opacity:mounted?1:0, animation:mounted?"fadeIn 0.5s ease 0.2s both":"none" }}>
            <Box sx={{ width:40, height:40, borderRadius:1.5, overflow:"hidden", boxShadow:"0 4px 24px rgba(127,28,226,0.5)", animation:"pulse 2.5s infinite", flexShrink:0 }}>
              <img src="/src/assets/AsuraSync.png" alt="AsuraSync" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            </Box>
            <Typography sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:{ xs:20, md:26 }, letterSpacing:"0.1em", color:tp }}>
              ASURA<Box component="span" sx={{ color:"#7F1CE2" }}>SYNC</Box>
            </Typography>
          </Box>
          <Button variant="outlined" size="small" onClick={() => setAuthMode("email")} className="cta-btn"
            sx={{ borderColor:"rgba(127,28,226,0.4)", color:tp, opacity:mounted?1:0, animation:mounted?"fadeIn 0.5s ease 0.4s both":"none", "&:hover":{ borderColor:"#7F1CE2", background:"rgba(127,28,226,0.08)" } }}>
            Sign In
          </Button>
        </Box>

        <Box sx={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", zIndex:10, px:{ xs:3, md:4 }, pb:8 }}>
          <Box sx={{ textAlign:"center", maxWidth:800, width:"100%" }}>
            <Box sx={{ display:"inline-flex", alignItems:"center", gap:1.2, border:"1px solid rgba(127,28,226,0.4)", borderRadius:50, px:2.5, py:0.8, mb:{ xs:3, md:4 }, background:"rgba(127,28,226,0.07)", backdropFilter:"blur(8px)", opacity:mounted?1:0, animation:mounted?"fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.3s both":"none" }}>
              <Box sx={{ width:7, height:7, borderRadius:"50%", background:"#7F1CE2", animation:"pulse 2s infinite" }} />
              <Typography sx={{ fontSize:{ xs:10, md:11 }, fontWeight:700, letterSpacing:"0.18em", color:"#7F1CE2", textTransform:"uppercase" }}>Track · Discover · Never Fall Behind</Typography>
              <Box sx={{ width:7, height:7, borderRadius:"50%", background:"#7F1CE2", animation:"pulse 2s 0.3s infinite" }} />
            </Box>
            <Box sx={{ mb:{ xs:2.5, md:3.5 }, perspective:"800px" }}>
              <TitleLine text="YOUR MANHWA"    base={0.5} />
              <TitleLine text="COMMAND CENTER" hollow base={0.9} />
            </Box>
            <Typography sx={{ fontSize:{ xs:15, md:18 }, color:ts, mb:{ xs:4, md:5 }, lineHeight:1.85, fontFamily:"'Noto Sans', sans-serif", maxWidth:560, mx:"auto", opacity:mounted?1:0, animation:mounted?"fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 1.3s both":"none" }}>
              Track every chapter, never miss a release. Paste any Asura Scans link and we handle the rest — chapter monitoring, push notifications, and one-click Google Sheets export.
            </Typography>
            <Box sx={{ display:"flex", gap:2, justifyContent:"center", flexWrap:"wrap" }}>
              {[
                { label:"Continue with Google", icon:<Google/>, v:"contained", delay:"1.5s", fn:handleGoogle, sx:{ boxShadow:"0 8px 30px rgba(127,28,226,0.4)" } },
                { label:"Use Email",            icon:<Email/>,  v:"outlined",  delay:"1.6s", fn:() => setAuthMode("email"), sx:{ borderColor:"rgba(127,28,226,0.4)", color:tp } },
              ].map(b => (
                <Button key={b.label} variant={b.v} size="large" startIcon={b.icon} onClick={b.fn} className="cta-btn"
                  sx={{ opacity:mounted?1:0, animation:mounted?`fadeUp 0.6s cubic-bezier(0.34,1.56,0.64,1) ${b.delay} both`:"none", px:{ xs:3, md:4 }, py:1.6, fontSize:{ xs:13, md:15 }, flex:{ xs:"1 1 140px", sm:"0 0 auto" }, ...b.sx }}>
                  {b.label}
                </Button>
              ))}
            </Box>
          </Box>
        </Box>

        <Box sx={{ position:"absolute", bottom:28, left:"50%", transform:"translateX(-50%)", zIndex:10, display:"flex", flexDirection:"column", alignItems:"center", gap:0.8, opacity:mounted?1:0, animation:mounted?"fadeIn 1s ease 2s both":"none" }}>
          <Typography sx={{ fontSize:10, fontWeight:700, letterSpacing:"0.2em", color:"#7F1CE2", textTransform:"uppercase" }}>Scroll</Typography>
          <ArrowDownward sx={{ fontSize:22, color:"#7F1CE2", animation:"bounce 1.4s ease-in-out infinite" }} />
        </Box>
      </Box>


      {/* SECTION 2 */}
      <Box sx={{ py:{ xs:10, md:16 }, px:{ xs:3, md:10 }, position:"relative", overflow:"hidden" }}>
        <Box sx={{ maxWidth:1100, mx:"auto" }}>
          <Box className="scroll-reveal" sx={{ textAlign:"center", mb:{ xs:6, md:10 } }}>
            <SectionLabel text="What is AsuraSync?" />
            <Typography sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:{ xs:38, md:60 }, color:tp, lineHeight:1, mb:2.5 }}>
              YOUR READING LIST,{" "}<Box component="span" sx={{ WebkitTextStroke:{ xs:"1.5px #7F1CE2", md:"2px #7F1CE2" }, color:"transparent" }}>SUPERCHARGED</Box>
            </Typography>
            <Typography sx={{ fontSize:{ xs:15, md:17 }, color:ts, maxWidth:560, mx:"auto", lineHeight:1.8, fontFamily:"'Noto Sans', sans-serif" }}>
              Stop losing track of where you left off. AsuraSync keeps every series organized, every chapter counted, and every new release on your radar — automatically.
            </Typography>
          </Box>
          <Box sx={{ display:"grid", gridTemplateColumns:{ xs:"1fr", md:"repeat(3,1fr)" }, gap:3 }}>
            {[
              { Icon:Link,          title:"PASTE ANY URL",     delay:"0s",    text:"Drop an Asura Scans, Asuratoon or Asuracomic link. We instantly pull the series info, chapter count, and cover art." },
              { Icon:Notifications, title:"NEVER MISS A DROP", delay:"0.15s", text:"Get push notifications the moment a new chapter lands. Per-series controls so you only hear about what matters." },
              { Icon:CloudDownload, title:"EXPORT ANYWHERE",   delay:"0.3s",  text:"One click exports your entire reading list to Google Sheets. Share with friends, back up your data, or analyze habits." },
            ].map((f, i) => (
              <Box key={i} className="scroll-reveal feature-card" data-delay={f.delay} sx={{ p:{ xs:3, md:4 }, background:cardBg, border:`1px solid ${border}`, borderRadius:3, backdropFilter:"blur(10px)", cursor:"default", position:"relative", overflow:"hidden" }}>
                <Box sx={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg, transparent, #7F1CE2, transparent)", opacity:0.6 }} />
                <Box sx={{ width:48, height:48, borderRadius:2, background:"rgba(127,28,226,0.12)", border:"1px solid rgba(127,28,226,0.2)", display:"flex", alignItems:"center", justifyContent:"center", mb:2.5 }}>
                  <f.Icon sx={{ fontSize:24, color:"#7F1CE2" }} />
                </Box>
                <Typography sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:22, color:tp, mb:1.5, letterSpacing:"0.05em" }}>{f.title}</Typography>
                <Typography sx={{ fontSize:14, color:ts, lineHeight:1.75, fontFamily:"'Noto Sans', sans-serif" }}>{f.text}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>


      {/* SECTION 3 */}
      <Box sx={{ py:{ xs:10, md:16 }, px:{ xs:3, md:10 }, background:"#0a0a0f" }}>
        <Box sx={{ maxWidth:1100, mx:"auto" }}>
          <Box className="scroll-reveal" sx={{ textAlign:"center", mb:{ xs:8, md:12 } }}>
            <SectionLabel text="How it works" />
            <Typography sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:{ xs:38, md:60 }, color:tp, lineHeight:1 }}>
              THREE STEPS TO{" "}<Box component="span" sx={{ WebkitTextStroke:{ xs:"1.5px #7F1CE2", md:"2px #7F1CE2" }, color:"transparent" }}>ORGANIZED READING</Box>
            </Typography>
          </Box>
          {[
            { step:"01", side:"left",  Icon:BookmarkBorder, title:"ADD YOUR SERIES",       text:"Paste the URL of any manhwa. We fetch the title, cover, chapter count, and metadata in seconds." },
            { step:"02", side:"right", Icon:BarChart,       title:"TRACK YOUR PROGRESS",   text:"Mark chapters as read or use the slider. See your progress bar grow. Know exactly where you left off." },
            { step:"03", side:"left",  Icon:Speed,          title:"GET NOTIFIED & EXPORT",  text:"Turn on notifications per-series. Export everything to Google Sheets for sharing or backups." },
          ].map((s, i) => (
            <Box key={i} sx={{ display:"flex", alignItems:"center", justifyContent:s.side==="left"?"flex-start":"flex-end", mb:{ xs:6, md:10 } }}>
              <Box className={s.side==="left"?"reveal-left":"reveal-right"} data-delay={`${i*0.15}s`} sx={{ width:{ xs:"100%", md:"44%" }, p:{ xs:3, md:4 }, background:cardBg, border:`1px solid ${border}`, borderRadius:3, backdropFilter:"blur(10px)", position:"relative", overflow:"hidden" }}>
                <Box sx={{ position:"absolute", top:0, left:0, right:0, height:2, background:s.side==="left"?"linear-gradient(90deg,#7F1CE2,transparent)":"linear-gradient(90deg,transparent,#7F1CE2)", opacity:0.7 }} />
                <Box sx={{ width:48, height:48, borderRadius:2, background:"rgba(127,28,226,0.12)", border:"1px solid rgba(127,28,226,0.2)", display:"flex", alignItems:"center", justifyContent:"center", mb:2 }}>
                  <s.Icon sx={{ fontSize:24, color:"#7F1CE2" }} />
                </Box>
                <Typography sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:{ xs:22, md:26 }, color:tp, mb:1.5 }}>{s.title}</Typography>
                <Typography sx={{ fontSize:14, color:ts, lineHeight:1.8, fontFamily:"'Noto Sans', sans-serif" }}>{s.text}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>


      {/* SECTION 4 — STATS */}
      <Box sx={{ py:{ xs:10, md:16 }, px:{ xs:3, md:10 } }}>
        <Box sx={{ maxWidth:1000, mx:"auto", textAlign:"center" }}>
          <Box className="scroll-reveal" sx={{ mb:{ xs:8, md:12 } }}>
            <SectionLabel text="By the numbers" />
            <Typography sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:{ xs:38, md:60 }, color:tp, lineHeight:1 }}>
              READERS TRUST{" "}<Box component="span" sx={{ WebkitTextStroke:{ xs:"1.5px #7F1CE2", md:"2px #7F1CE2" }, color:"transparent" }}>ASURASYNC</Box>
            </Typography>
          </Box>
          <Box sx={{ display:"grid", gridTemplateColumns:{ xs:"repeat(2,1fr)", md:"repeat(4,1fr)" }, gap:{ xs:3, md:4 } }}>
            {[
              { value:"12000",  suffix:"+", label:"Active Readers",   delay:"0s",   Icon:Google    },
              { value:"580000", suffix:"+", label:"Chapters Tracked", delay:"0.1s", Icon:TrendingUp },
              { value:"99",     suffix:"%", label:"Uptime",           delay:"0.2s", Icon:Speed      },
              { value:"50",     suffix:"+", label:"Series Supported", delay:"0.3s", Icon:FilterList },
            ].map((st, i) => (
              <Box key={i} className="reveal-scale" data-delay={st.delay} sx={{ p:{ xs:3, md:4 }, background:cardBg, border:`1px solid ${border}`, borderRadius:3, backdropFilter:"blur(10px)", position:"relative", overflow:"hidden" }}>
                <Box sx={{ width:44, height:44, borderRadius:2, background:"rgba(127,28,226,0.12)", border:"1px solid rgba(127,28,226,0.2)", display:"flex", alignItems:"center", justifyContent:"center", mb:2, mx:"auto" }}>
                  <st.Icon sx={{ fontSize:22, color:"#7F1CE2" }} />
                </Box>
                <Typography sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:{ xs:40, md:52 }, color:"#7F1CE2", lineHeight:1, background:"linear-gradient(135deg,#7F1CE2,#A855F7)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                  <Counter target={st.value} suffix={st.suffix} />
                </Typography>
                <Typography sx={{ fontSize:{ xs:11, md:12 }, color:ts, letterSpacing:"0.12em", textTransform:"uppercase", mt:0.5 }}>{st.label}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>


      {/* SECTION 5 — FEATURES */}
      <Box sx={{ py:{ xs:10, md:16 }, px:{ xs:3, md:10 }, background:"rgba(127,28,226,0.02)" }}>
        <Box sx={{ maxWidth:1100, mx:"auto" }}>
          <Box className="scroll-reveal" sx={{ mb:{ xs:8, md:12 }, textAlign:"center" }}>
            <SectionLabel text="Everything you need" />
            <Typography sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:{ xs:38, md:60 }, color:tp, lineHeight:1 }}>
              BUILT FOR{" "}<Box component="span" sx={{ WebkitTextStroke:{ xs:"1.5px #7F1CE2", md:"2px #7F1CE2" }, color:"transparent" }}>SERIOUS READERS</Box>
            </Typography>
          </Box>
          <Box sx={{ display:"grid", gridTemplateColumns:{ xs:"1fr", sm:"repeat(2,1fr)", md:"repeat(3,1fr)" }, gap:3 }}>
            {[
              { Icon:Devices,    title:"ALL YOUR DEVICES",     delay:"0s",   text:"Desktop, tablet, or phone — your library syncs everywhere." },
              { Icon:Contrast,   title:"DARK MODE",            delay:"0.1s", text:"Dark mode only. Easy on the eyes at 2am." },
              { Icon:Star,       title:"FAVORITES & RATINGS",  delay:"0.2s", text:"Star your all-time favourites and rate every series." },
              { Icon:Search,     title:"SEARCH & FILTER",      delay:"0s",   text:"Find any series instantly. Filter by status, progress or reading state." },
              { Icon:TrendingUp, title:"PROGRESS TRACKING",    delay:"0.1s", text:"Visual progress bars and chapter breakdowns for every series." },
              { Icon:TableChart, title:"GOOGLE SHEETS EXPORT", delay:"0.2s", text:"Export your full reading history as a Google Sheets spreadsheet." },
            ].map((f, i) => (
              <Box key={i} className="scroll-reveal feature-card" data-delay={f.delay} sx={{ p:{ xs:3, md:4 }, background:cardBg, border:`1px solid ${border}`, borderRadius:3, backdropFilter:"blur(10px)", cursor:"default", position:"relative", overflow:"hidden", display:"flex", flexDirection:"column", minHeight:{ xs:180, md:210 } }}>
                <Box sx={{ position:"absolute", top:0, left:0, right:0, height:2, background:"linear-gradient(90deg,#7F1CE2,transparent)", opacity:0.65 }} />
                <Box sx={{ width:48, height:48, borderRadius:2, background:"rgba(127,28,226,0.12)", border:"1px solid rgba(127,28,226,0.22)", display:"flex", alignItems:"center", justifyContent:"center", mb:2.5, flexShrink:0 }}>
                  <f.Icon sx={{ fontSize:24, color:"#7F1CE2" }} />
                </Box>
                <Typography sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:{ xs:20, md:22 }, color:tp, mb:1.5, letterSpacing:"0.05em", lineHeight:1.2 }}>{f.title}</Typography>
                <Typography sx={{ fontSize:13, color:ts, lineHeight:1.78, fontFamily:"'Noto Sans', sans-serif", flex:1 }}>{f.text}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>


      {/* CTA */}
      <Box sx={{ py:{ xs:12, md:20 }, px:{ xs:3, md:10 }, position:"relative", overflow:"hidden", textAlign:"center" }}>
        <Box sx={{ position:"relative", zIndex:1, maxWidth:700, mx:"auto" }}>
          <Box className="scroll-reveal"><SectionLabel text="Free to start" /></Box>
          <Typography className="scroll-reveal" data-delay="0.1s" sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:{ xs:46, md:80 }, color:tp, lineHeight:0.9, mb:3 }}>
            READY TO NEVER<br/><Box component="span" sx={{ WebkitTextStroke:{ xs:"2px #7F1CE2", md:"3px #7F1CE2" }, color:"transparent" }}>FALL BEHIND?</Box>
          </Typography>
          <Box className="scroll-reveal" data-delay="0.3s" sx={{ display:"flex", gap:2, justifyContent:"center", flexWrap:"wrap", mb:4 }}>
            <Button variant="contained" size="large" startIcon={<Google/>} onClick={handleGoogle} className="cta-btn" sx={{ px:{ xs:4, md:5 }, py:1.8, fontSize:{ xs:14, md:16 }, boxShadow:"0 10px 40px rgba(127,28,226,0.5)" }}>Start with Google</Button>
            <Button variant="outlined"  size="large" startIcon={<Email/>}  onClick={() => setAuthMode("email")} className="cta-btn" sx={{ px:{ xs:4, md:5 }, py:1.8, fontSize:{ xs:14, md:16 }, borderColor:"rgba(127,28,226,0.4)", color:tp }}>Use Email Instead</Button>
          </Box>
        </Box>
      </Box>


      {/* FOOTER */}
      <Box sx={{ borderTop:`1px solid ${border}`, px:{ xs:3, md:10 }, py:{ xs:3, md:4 }, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:2, background:"rgba(10,10,15,0.6)", backdropFilter:"blur(8px)" }}>
        <Box sx={{ display:"flex", alignItems:"center", gap:1.5 }}>
          <Box sx={{ width:30, height:30, borderRadius:1, overflow:"hidden", flexShrink:0 }}>
            <img src="/src/assets/AsuraSync.png" alt="AsuraSync" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
          </Box>
          <Typography sx={{ fontFamily:"'Bebas Neue', cursive", fontSize:18, letterSpacing:"0.1em", color:tp }}>
            ASURA<Box component="span" sx={{ color:"#7F1CE2" }}>SYNC</Box>
          </Typography>
        </Box>
        <Typography sx={{ fontSize:12, color:ts }}>© 2026 AsuraSync. Built for readers, by a reader.</Typography>
        <Box sx={{ display:"flex", gap:{ xs:2, md:4 } }}>
          {["Privacy","Terms","Contact"].map(l => (
            <Typography key={l} sx={{ fontSize:12, color:ts, cursor:"pointer", "&:hover":{ color:"#7F1CE2" }, transition:"color 0.2s" }}>{l}</Typography>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState("student"); // 'student' or 'instructor'
  const [formData, setFormData] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 🎨 BRAND COLORS
  const brand = {
    blue: "#005EB8",     // Learner Color
    green: "#87C232",    // Instructor Color
    darkText: "#1e293b",
    lightText: "#64748b",
    inputBg: "#f8fafc",
    border: "#e2e8f0"
  };

  // ⚡ Dynamic Theme based on Role
  const activeColor = role === "student" ? brand.blue : brand.green;
  
  // 🔄 Clear inputs when switching modes
  useEffect(() => { setError(""); }, [role, isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        // --- 🔑 LOGIN LOGIC (Standard OAuth2 Format) ---
        const loginParams = new URLSearchParams();
        loginParams.append("username", formData.email);
        loginParams.append("password", formData.password);
        
        const res = await axios.post("http://127.0.0.1:8000/api/v1/login", loginParams);
        
        // Save auth data
        localStorage.setItem("token", res.data.access_token);
        localStorage.setItem("role", res.data.role);
        
        // Navigate based on returned role
        const targetPath = res.data.role === "instructor" ? "/dashboard" : "/student-dashboard";
        navigate(targetPath);

      } else {
        // --- 📝 SIGN UP LOGIC (JSON Format) ---
        await axios.post("http://127.0.0.1:8000/api/v1/users", {
          email: formData.email,
          password: formData.password,
          name: formData.name,   // Sends Full Name to backend
          role: role,
        });
        
        alert("Account created successfully! Please sign in.");
        setIsLogin(true); // Switch to login screen
      }
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.status === 401) {
          setError("Invalid Email or Password. If you reset your database, please register again.");
      } else if (err.response && err.response.status === 400) {
          setError("This email is already registered.");
      } else {
          setError("Connection error. Ensure your backend is running.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100vw", fontFamily: "'Inter', sans-serif", overflow: "hidden", backgroundColor: "white" }}>
      
      {/* 🖼️ LEFT SIDE: Dynamic Brand Showcase */}
      <div 
        className="desktop-only"
        style={{ 
          flex: 1, 
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)", 
          display: "flex", 
          flexDirection: "column", 
          justifyContent: "center", 
          padding: "80px", 
          position: "relative",
          borderRight: `1px solid ${brand.border}`,
          transition: "all 0.5s ease"
        }}
      >
        <img src="/logo.jpg" alt="iQmath" style={{ width: "220px", marginBottom: "60px", mixBlendMode: "multiply" }} />

        {/* Animated Text Container */}
        <div key={role} className="fade-in-slide">
          <h1 style={{ fontSize: "3.5rem", fontWeight: "800", lineHeight: "1.1", marginBottom: "25px", color: activeColor, transition: "color 0.5s ease" }}>
            {role === "student" ? "Learn Without Limits." : "Teach With Impact."}
          </h1>
          
          <div style={{ borderLeft: `5px solid ${activeColor}`, paddingLeft: "25px", transition: "border 0.5s ease" }}>
            <p style={{ fontSize: "1.25rem", color: brand.darkText, lineHeight: "1.6", fontStyle: "italic" }}>
              {role === "student" 
                ? "“Education is the passport to the future, for tomorrow belongs to those who prepare for it today.”"
                : "“The art of teaching is the art of assisting discovery. Empower the next generation.”"
              }
            </p>
          </div>
        </div>
      </div>

      {/* 📝 RIGHT SIDE: Login Form */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px", background: "white" }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          
          <div style={{ marginBottom: "40px" }}>
            <h2 style={{ fontSize: "28px", fontWeight: "700", color: brand.darkText, margin: 0 }}>
              {isLogin ? "Welcome Back" : "Join iQmath"}
            </h2>
            <p style={{ color: brand.lightText, marginTop: "8px", fontSize: "15px" }}>
              Please enter your details to access your 
              <span style={{ color: activeColor, fontWeight: "bold", transition: "color 0.3s" }}> {role === "student" ? "Learner" : "Instructor"} </span> 
              portal.
            </p>
          </div>

          {/* Role Toggle */}
          <div style={{ background: brand.inputBg, padding: "5px", borderRadius: "12px", display: "flex", marginBottom: "30px", border: `1px solid ${brand.border}` }}>
            <button type="button" onClick={() => setRole("student")} style={roleBtnStyle(role === "student", brand.blue)}>Learner</button>
            <button type="button" onClick={() => setRole("instructor")} style={roleBtnStyle(role === "instructor", brand.green)}>Instructor</button>
          </div>

          {error && (
            <div style={{ background: "#fef2f2", color: "#991b1b", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px", borderLeft: "4px solid #991b1b" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {!isLogin && (
              <input 
                type="text" 
                placeholder="Full Name" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                required 
                style={inputStyle()} 
              />
            )}
            <input 
              type="email" 
              placeholder="Email Address" 
              value={formData.email} 
              onChange={(e) => setFormData({...formData, email: e.target.value})} 
              required 
              style={inputStyle()} 
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={formData.password} 
              onChange={(e) => setFormData({...formData, password: e.target.value})} 
              required 
              style={inputStyle()} 
            />
            
            <button 
              disabled={loading} 
              type="submit" 
              className="hover-btn"
              style={{ 
                marginTop: "10px", padding: "16px", background: activeColor, color: "white", border: "none", borderRadius: "12px", fontSize: "16px", fontWeight: "700", cursor: loading ? "not-allowed" : "pointer", 
                transition: "all 0.3s ease", boxShadow: `0 10px 20px -10px ${activeColor}`
              }}
            >
              {loading ? "Processing..." : (isLogin ? "Sign In ➔" : "Create Account")}
            </button>
          </form>

          <p style={{ marginTop: "30px", textAlign: "center", fontSize: "14px", color: brand.lightText }}>
            {isLogin ? "New to iQmath? " : "Already have an account? "}
            <span onClick={() => setIsLogin(!isLogin)} style={{ color: activeColor, fontWeight: "700", cursor: "pointer", transition: "color 0.3s" }}>
              {isLogin ? "Create Account" : "Sign In"}
            </span>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeInSlide {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-slide {
          animation: fadeInSlide 0.5s ease-out forwards;
        }
        .hover-btn:hover {
          transform: translateY(-2px) scale(1.01);
          filter: brightness(1.1);
        }
        @media (max-width: 900px) { .desktop-only { display: none !important; } }
      `}</style>
    </div>
  );
};

// --- STYLES HELPER ---
const roleBtnStyle = (isActive: boolean, color: string) => ({
  flex: 1, padding: "12px", borderRadius: "10px", border: "none", cursor: "pointer", fontWeight: "600", fontSize: "14px", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  background: isActive ? color : "transparent",
  color: isActive ? "white" : "#64748b",
  boxShadow: isActive ? `0 4px 12px ${color}40` : "none",
  transform: isActive ? "scale(1.02)" : "scale(1)"
});

const inputStyle = () => ({
  padding: "14px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "15px", outline: "none", width: "100%", boxSizing: "border-box" as const, transition: "border 0.3s"
});

export default Login;
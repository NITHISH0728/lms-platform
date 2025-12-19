import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  BookOpen, 
  UserPlus, 
  PlusCircle, 
  LogOut, 
  Bell,
  ChevronRight,
  Code // ✅ Imported Code icon
} from "lucide-react"; 

const DashboardLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 🎨 iQmath Brand Palette (Matching your Login Page)
  const brand = {
    blue: "#005EB8",       // Main Brand Color
    blueLight: "#E6F0F9",  // Light Blue Background for active items
    green: "#87C232",      // Accent Green
    sidebarBg: "#FFFFFF",  // White Sidebar
    mainBg: "#F8FAFC",     // Very Light Blue-Grey Background
    textMain: "#1e293b",   // Dark Slate Text
    textLight: "#64748b",  // Muted Text
    border: "#e2e8f0",     // Soft Border
    danger: "#ef4444"      // Logout Red
  };

  // 📝 Simplified Menu Structure
  const menuItems = [
    { 
      label: "Overview", 
      path: "/dashboard", 
      icon: <LayoutDashboard size={20} /> 
    },
    { 
      label: "My Courses", 
      path: "/dashboard/courses", 
      icon: <BookOpen size={20} />,
    },
    // ✅ ADDED CODE ARENA HERE
    { 
      label: "Code Arena", 
      path: "/dashboard/code-arena", 
      icon: <Code size={20} />, 
    },
    { 
      label: "Add Admits", 
      path: "/dashboard/add-admits", 
      icon: <UserPlus size={20} />, 
    },
    { 
      label: "Create Course", 
      path: "/dashboard/create-course", 
      icon: <PlusCircle size={20} /> 
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: brand.mainBg, fontFamily: "'Inter', sans-serif" }}>
      
      {/* 🔵 SIDEBAR NAVIGATION */}
      <aside style={{ 
        width: "280px", 
        background: brand.sidebarBg, 
        borderRight: `1px solid ${brand.border}`, 
        display: "flex", 
        flexDirection: "column",
        position: "relative",
        zIndex: 10,
        boxShadow: "4px 0 24px rgba(0,0,0,0.02)" // Subtle depth
      }}>
        
        {/* Brand Logo Area */}
        <div style={{ padding: "32px 24px", borderBottom: `1px solid ${brand.border}` }}>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: brand.textMain, letterSpacing: "-0.5px", margin: 0 }}>
            <span style={{ color: brand.blue }}>iQ</span>math
          </h2>
          <span style={{ fontSize: "11px", color: brand.green, fontWeight: "700", textTransform: "uppercase", letterSpacing: "1.5px", marginTop: "4px", display: "block" }}>
            Instructor Portal
          </span>
        </div>

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: "24px 16px", display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto" }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname === item.path + "/";
            return (
              <div 
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  cursor: "pointer",
                  color: isActive ? brand.blue : brand.textLight,
                  background: isActive ? brand.blueLight : "transparent",
                  fontWeight: isActive ? "700" : "500",
                  transition: "all 0.2s ease-in-out"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  {item.icon}
                  <span style={{ fontSize: "15px" }}>{item.label}</span>
                </div>
                {isActive && <ChevronRight size={16} color={brand.blue} strokeWidth={3} />}
              </div>
            );
          })}
        </nav>

        {/* User Profile / Logout Section */}
        <div style={{ padding: "20px", borderTop: `1px solid ${brand.border}` }}>
          <div 
            onClick={handleLogout} 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "12px", 
              padding: "12px 16px", 
              color: brand.danger, 
              cursor: "pointer", 
              fontWeight: "600",
              borderRadius: "8px",
              transition: "background 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "#FEF2F2"}
            onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </div>
        </div>
      </aside>

      {/* ⚪ MAIN CONTENT AREA */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        
        {/* Top Header Bar */}
        <header style={{ 
          height: "80px", 
          background: brand.sidebarBg, 
          borderBottom: `1px solid ${brand.border}`, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          padding: "0 40px"
        }}>
          {/* Page Title */}
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: "700", color: brand.textMain }}>
              {menuItems.find(i => i.path === location.pathname)?.label || "Dashboard"}
            </h1>
          </div>

          {/* Header Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button style={{ background: "transparent", border: "none", cursor: "pointer", padding: "8px", borderRadius: "50%" }}>
              <Bell size={22} color={brand.textLight} />
            </button>
            <div style={{ 
              width: "40px", 
              height: "40px", 
              borderRadius: "50%", 
              background: brand.blue, 
              color: "white", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              fontWeight: "700", 
              fontSize: "16px",
              boxShadow: "0 4px 10px rgba(0, 94, 184, 0.3)" 
            }}>
              IN
            </div>
          </div>
        </header>

        {/* Dynamic Page Content Loads Here */}
        <div style={{ flex: 1, padding: "40px", overflowY: "auto" }}>
          <Outlet />
        </div>

      </main>
    </div>
  );
};

export default DashboardLayout;
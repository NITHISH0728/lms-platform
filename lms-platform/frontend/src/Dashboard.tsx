import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Lock, Save, Settings } from "lucide-react"; // Icons

// 🎨 iQmath Professional Theme
const theme = {
  blue: "#0066cc",
  green: "#8cc63f",
  darkBlue: "#004080",
  lightBg: "#f4f6f8",
  white: "#ffffff",
  sidebarBg: "#1a1a1a",
  sidebarText: "#b3b3b3",
  sidebarActive: "#ffffff",
  border: "#e0e0e0"
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview"); 
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({ revenue: 1250, students: 45, courses: 3 });
  const [showModal, setShowModal] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: "", description: "", price: 0 });
  
  // ✅ NEW: Settings State
  const [newPassword, setNewPassword] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  const navigate = useNavigate();

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/v1/courses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(res.data);
      setStats(prev => ({ ...prev, courses: res.data.length }));
    } catch (err) { console.error("Failed to load courses"); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      await axios.post("http://127.0.0.1:8000/api/v1/courses", newCourse, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      fetchCourses();
      setNewCourse({ title: "", description: "", price: 0 });
      setActiveTab("courses");
    } catch (err) { alert("Error creating course"); }
  };

  // ✅ NEW: Password Change Handler
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return alert("Password too short");
    
    setSavingSettings(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://127.0.0.1:8000/api/v1/user/change-password",
        { new_password: newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ Password updated successfully!");
      setNewPassword("");
    } catch (err) {
      alert("Failed to update password.");
    } finally {
      setSavingSettings(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const SidebarItem = ({ id, icon, label }: any) => (
    <div 
      onClick={() => setActiveTab(id)}
      style={{
        padding: "15px 25px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        color: activeTab === id ? theme.sidebarActive : theme.sidebarText,
        backgroundColor: activeTab === id ? theme.blue : "transparent",
        borderLeft: activeTab === id ? `4px solid ${theme.green}` : "4px solid transparent",
        transition: "all 0.2s"
      }}
    >
      <span style={{ marginRight: "15px", fontSize: "18px" }}>{icon}</span>
      <span style={{ fontWeight: activeTab === id ? "bold" : "normal" }}>{label}</span>
    </div>
  );

  const StatCard = ({ label, value, color, icon }: any) => (
    <div style={{
      backgroundColor: theme.white, padding: "25px", borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)", display: "flex", alignItems: "center",
      justifyContent: "space-between", borderBottom: `4px solid ${color}`
    }}>
      <div>
        <p style={{ margin: 0, color: "#888", fontSize: "14px", fontWeight: "bold" }}>{label}</p>
        <h2 style={{ margin: "5px 0 0 0", fontSize: "28px", color: "#333" }}>{value}</h2>
      </div>
      <div style={{ fontSize: "30px", opacity: 0.2 }}>{icon}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial, sans-serif", backgroundColor: theme.lightBg }}>
      
      {/* --- LEFT SIDEBAR --- */}
      <div style={{ width: "260px", backgroundColor: theme.sidebarBg, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "25px", borderBottom: "1px solid #333", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "35px", height: "35px", borderRadius: "50%", backgroundColor: theme.white, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
             <img src="/logo.jpg" alt="Logo" style={{ width: "100%" }} />
          </div>
          <span style={{ color: theme.white, fontSize: "18px", fontWeight: "bold" }}>iQmath Admin</span>
        </div>

        <div style={{ flex: 1, marginTop: "20px" }}>
          <SidebarItem id="overview" icon="📊" label="Overview" />
          <SidebarItem id="courses" icon="📚" label="My Courses" />
          <SidebarItem id="students" icon="👨‍🎓" label="Learners" />
          <SidebarItem id="reports" icon="📈" label="Reports" />
        </div>

        {/* ✅ NEW: Settings & Logout Area */}
        <div style={{ borderTop: "1px solid #333" }}>
          <SidebarItem id="settings" icon="⚙️" label="Settings" />
          <div style={{ padding: "20px" }}>
            <button onClick={logout} style={{ width: "100%", padding: "10px", backgroundColor: "#333", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
        
        <header style={{ backgroundColor: theme.white, padding: "20px 40px", boxShadow: "0 2px 5px rgba(0,0,0,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, color: theme.darkBlue }}>
            {activeTab === 'overview' && "Dashboard Overview"}
            {activeTab === 'courses' && "Course Management"}
            {activeTab === 'students' && "Learner Management"}
            {activeTab === 'settings' && "Account Settings"}
          </h2>
          <div style={{ display: "flex", gap: "15px" }}>
             <button style={{ padding: "10px 20px", borderRadius: "20px", border: "1px solid #ddd", background: "white", cursor: "pointer" }}>🔔</button>
             <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: theme.blue, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>IS</div>
          </div>
        </header>

        <div style={{ padding: "40px" }}>
          
          {/* VIEW 1: OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "25px", marginBottom: "40px" }}>
                <StatCard label="TOTAL REVENUE" value={`$${stats.revenue}`} color={theme.green} icon="💰" />
                <StatCard label="ACTIVE LEARNERS" value={stats.students} color={theme.blue} icon="👥" />
                <StatCard label="LIVE COURSES" value={courses.length} color="orange" icon="🎓" />
              </div>
              <div style={{ backgroundColor: theme.white, borderRadius: "12px", padding: "30px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                <h3 style={{ marginTop: 0 }}>Recent Activity</h3>
                <p style={{ color: "#666" }}>• New student enrolled in "Python Mastery" (2 mins ago)</p>
                <p style={{ color: "#666" }}>• You updated "Digital Electronics" content (1 hour ago)</p>
              </div>
            </>
          )}

          {/* VIEW 2: COURSES TAB */}
          {activeTab === 'courses' && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
                <input placeholder="🔍 Search courses..." style={{ padding: "10px", width: "300px", borderRadius: "8px", border: "1px solid #ddd" }} />
                <button 
                  onClick={() => setShowModal(true)}
                  style={{ backgroundColor: theme.green, color: "white", padding: "12px 25px", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}
                >
                  + Create New Course
                </button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "25px" }}>
                {courses.map((course: any) => (
                  <div key={course.id} style={{ backgroundColor: theme.white, borderRadius: "10px", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)", border: "1px solid #eee" }}>
                    <div style={{ height: "120px", backgroundColor: "#eef", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "40px" }}>📘</div>
                    <div style={{ padding: "20px" }}>
                      <h3 style={{ margin: "0 0 10px 0", fontSize: "18px" }}>{course.title}</h3>
                      <p style={{ color: "#666", fontSize: "13px", height: "40px", overflow: "hidden" }}>{course.description}</p>
                      <div style={{ marginTop: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: "bold", color: theme.blue }}>${course.price}</span>
                        <button style={{ color: theme.blue, background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }}>Manage ➔</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ✅ NEW VIEW: SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div style={{ maxWidth: "600px", margin: "0 auto", animation: "fadeIn 0.3s ease" }}>
                <div style={{ background: "white", borderRadius: "12px", padding: "40px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "30px", paddingBottom: "20px", borderBottom: `1px solid ${theme.border}` }}>
                        <div style={{ padding: "12px", background: "#e0f2fe", borderRadius: "10px", color: theme.blue }}><Lock size={24} /></div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: "18px", color: theme.darkBlue }}>Security Settings</h3>
                            <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#666" }}>Update your instructor account password</p>
                        </div>
                    </div>
                    <form onSubmit={handlePasswordChange}>
                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#333", marginBottom: "8px", textTransform: "uppercase" }}>New Password</label>
                            <input 
                                type="password" 
                                required 
                                minLength={6}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new strong password"
                                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", outline: "none", fontSize: "14px", boxSizing: "border-box" }}
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={savingSettings}
                            style={{ padding: "12px 24px", background: theme.blue, color: "white", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", opacity: savingSettings ? 0.7 : 1 }}
                        >
                            <Save size={18} /> {savingSettings ? "Updating..." : "Update Password"}
                        </button>
                    </form>
                </div>
            </div>
          )}

        </div>
      </div>

      {/* CREATE COURSE MODAL (Same as before) */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "15px", width: "450px", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}>
            <h2 style={{ marginTop: 0, color: theme.blue }}>Create New Course</h2>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <input placeholder="Course Title" value={newCourse.title} onChange={(e) => setNewCourse({...newCourse, title: e.target.value})} required style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }} />
              <textarea placeholder="Description" value={newCourse.description} onChange={(e) => setNewCourse({...newCourse, description: e.target.value})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc", minHeight: "80px" }} />
              <input type="number" placeholder="Price" value={newCourse.price} onChange={(e) => setNewCourse({...newCourse, price: Number(e.target.value)})} style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ccc" }} />
              <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: "12px", border: "none", background: "#f0f0f0", borderRadius: "8px", cursor: "pointer" }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: "12px", border: "none", background: theme.blue, color: "white", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>Create Course</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
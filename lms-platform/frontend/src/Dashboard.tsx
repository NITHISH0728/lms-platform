import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  Lock, Save, Settings, Code, FileText, Download, 
  LayoutDashboard, BookOpen, Users, LogOut, Plus, UserPlus
} from "lucide-react";

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
  
  // Modal States
  const [showModal, setShowModal] = useState(false); // Course Modal
  const [newCourse, setNewCourse] = useState({ title: "", description: "", price: 0 });
  
  // Settings State
  const [newPassword, setNewPassword] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // ✅ CODE ARENA STATE
  const [codeTests, setCodeTests] = useState<any[]>([]);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testForm, setTestForm] = useState({ 
    title: "", 
    pass_key: "", 
    time_limit: 60, 
    problems: [] as any[] 
  });
  const [currentProblem, setCurrentProblem] = useState({ 
    title: "", 
    description: "", 
    difficulty: "Easy", 
    test_cases: JSON.stringify([{input: "", output: ""}]) 
  });
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  const navigate = useNavigate();

  useEffect(() => { 
    fetchCourses(); 
    fetchTests(); 
  }, []);

  const fetchCourses = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/v1/courses", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(res.data);
      setStats(prev => ({ ...prev, courses: res.data.length }));
    } catch (err: any) { 
        if(err.response && err.response.status === 401) {
            localStorage.clear();
            navigate("/");
        }
        console.error("Failed to load courses"); 
    }
  };

  const fetchTests = async () => {
    const token = localStorage.getItem("token");
    try {
        const res = await axios.get("http://127.0.0.1:8000/api/v1/code-tests", {
            headers: { Authorization: `Bearer ${token}` }
        });
        setCodeTests(res.data);
    } catch(err) { console.error("Failed to load tests"); }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
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

  // --- CODE ARENA HANDLERS ---
  const handleCreateTest = async () => {
      const token = localStorage.getItem("token");
      try {
          await axios.post("http://127.0.0.1:8000/api/v1/code-tests", testForm, {
              headers: { Authorization: `Bearer ${token}` }
          });
          alert("✅ Test Created & Students Notified!");
          setShowTestModal(false);
          setTestForm({ title: "", pass_key: "", time_limit: 60, problems: [] });
          fetchTests();
      } catch(err) { alert("Failed to create test"); }
  };

  const addProblemToTest = () => {
      if(!currentProblem.title) return alert("Problem title required");
      setTestForm({...testForm, problems: [...testForm.problems, currentProblem]});
      setCurrentProblem({ 
        title: "", description: "", difficulty: "Easy", 
        test_cases: JSON.stringify([{input: "", output: ""}]) 
      });
      alert("Problem Added! You can add more or click 'Save Test'");
  };

  const fetchResults = async (testId: number) => {
      setSelectedTestId(testId);
      const token = localStorage.getItem("token");
      try {
          const res = await axios.get(`http://127.0.0.1:8000/api/v1/code-tests/${testId}/results`, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setTestResults(res.data);
      } catch(err) { alert("Failed to fetch results"); }
  };

  const downloadResults = () => {
      if(testResults.length === 0) return alert("No results to export");
      const csvContent = "data:text/csv;charset=utf-8,Name,Email,Score,Problems Solved,Time Taken,Date\n" 
          + testResults.map(r => `${r.student_name},${r.email},${r.score},${r.problems_solved},${r.time_taken},${r.submitted_at}`).join("\n");
      const link = document.createElement("a");
      link.href = encodeURI(csvContent);
      link.download = `test_results_${selectedTestId}.csv`;
      document.body.appendChild(link);
      link.click();
  };

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

  // --- SUB-COMPONENTS ---
  const SidebarItem = ({ id, icon, label, onClick }: any) => (
    <div 
      onClick={onClick || (() => setActiveTab(id))}
      style={{
        padding: "15px 25px", cursor: "pointer", display: "flex", alignItems: "center",
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

        <div style={{ flex: 1, marginTop: "20px", overflowY: "auto" }}>
          <SidebarItem id="overview" icon={<LayoutDashboard size={18} />} label="Overview" />
          <SidebarItem id="courses" icon={<BookOpen size={18} />} label="My Courses" />
          
          {/* ✅ FIXED: CODE ARENA IS HERE */}
          <SidebarItem id="arena" icon={<Code size={18} />} label="Code Arena" />
          
          {/* ✅ ADDED: "Add Admits" (Assuming route /dashboard/add-admits) */}
          <SidebarItem id="admits" icon={<UserPlus size={18} />} label="Add Admits" onClick={() => navigate("/dashboard/add-admits")} />

          <SidebarItem id="students" icon={<Users size={18} />} label="Learners" />
        </div>

        {/* Settings & Logout */}
        <div style={{ borderTop: "1px solid #333" }}>
          <SidebarItem id="settings" icon={<Settings size={18} />} label="Settings" />
          <div style={{ padding: "20px" }}>
            <button onClick={logout} style={{ width: "100%", padding: "10px", backgroundColor: "#333", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}>
              <LogOut size={16} /> Logout
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
            {activeTab === 'arena' && "Coding Assessments"}
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

          {/* ✅ VIEW 3: CODE ARENA (INSTRUCTOR) */}
          {activeTab === 'arena' && (
              <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
                      <div>
                          <h3 style={{ margin: "0 0 5px 0" }}>Active Challenges</h3>
                          <p style={{ margin: 0, color: "#666" }}>Manage your coding tests and view results</p>
                      </div>
                      <button onClick={() => setShowTestModal(true)} style={{ background: theme.green, color: "white", padding: "12px 24px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px" }}>
                          <Plus size={18} /> Create Challenge
                      </button>
                  </div>
                  
                  {/* Test List */}
                  <div style={{ display: "grid", gap: "20px" }}>
                      {codeTests.map(test => (
                          <div key={test.id} style={{ background: "white", padding: "20px", borderRadius: "12px", border: "1px solid #e0e0e0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                  <h3 style={{ margin: "0 0 5px 0", color: theme.darkBlue }}>{test.title}</h3>
                                  <div style={{ display: "flex", gap: "15px", fontSize: "14px", color: "#666" }}>
                                      <span>🔑 Pass Key: <b>{test.pass_key}</b></span>
                                      <span>⏱️ Time: {test.time_limit} mins</span>
                                  </div>
                              </div>
                              <button onClick={() => fetchResults(test.id)} style={{ background: theme.blue, color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
                                  View Results
                              </button>
                          </div>
                      ))}
                  </div>

                  {/* Results Table */}
                  {selectedTestId && (
                      <div style={{ marginTop: "40px", background: "white", padding: "30px", borderRadius: "12px", border: "1px solid #e0e0e0", animation: "fadeIn 0.3s ease" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", alignItems: "center" }}>
                              <h3 style={{ margin: 0 }}>Results Log (Test ID: {selectedTestId})</h3>
                              <button onClick={downloadResults} style={{ background: "#1e293b", color: "white", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                                  <Download size={16} /> Export CSV
                              </button>
                          </div>
                          
                          {testResults.length === 0 ? (
                              <p style={{ color: "#999", textAlign: "center", padding: "20px" }}>No submissions yet.</p>
                          ) : (
                              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                  <thead>
                                      <tr style={{ background: "#f8fafc", textAlign: "left", color: "#475569" }}>
                                          <th style={{padding: "15px", borderBottom: "1px solid #eee"}}>Student Name</th>
                                          <th style={{padding: "15px", borderBottom: "1px solid #eee"}}>Email</th>
                                          <th style={{padding: "15px", borderBottom: "1px solid #eee"}}>Score</th>
                                          <th style={{padding: "15px", borderBottom: "1px solid #eee"}}>Solved</th>
                                          <th style={{padding: "15px", borderBottom: "1px solid #eee"}}>Time Taken</th>
                                          <th style={{padding: "15px", borderBottom: "1px solid #eee"}}>Date</th>
                                      </tr>
                                  </thead>
                                  <tbody>
                                      {testResults.map((r, i) => (
                                          <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                                              <td style={{padding: "15px", fontWeight: "600"}}>{r.student_name}</td>
                                              <td style={{padding: "15px", color: "#666"}}>{r.email}</td>
                                              <td style={{padding: "15px", color: theme.green, fontWeight: "bold"}}>{r.score}</td>
                                              <td style={{padding: "15px"}}>{r.problems_solved}</td>
                                              <td style={{padding: "15px"}}>{r.time_taken}</td>
                                              <td style={{padding: "15px", fontSize: "12px", color: "#888"}}>{r.submitted_at}</td>
                                          </tr>
                                      ))}
                                  </tbody>
                              </table>
                          )}
                      </div>
                  )}
              </div>
          )}

          {/* VIEW 4: SETTINGS TAB */}
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
                                type="password" required minLength={6}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new strong password"
                                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", outline: "none", fontSize: "14px", boxSizing: "border-box" }}
                            />
                        </div>
                        <button 
                            type="submit" disabled={savingSettings}
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

      {/* CREATE COURSE MODAL */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.6)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "15px", width: "450px", boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}>
            <h2 style={{ marginTop: 0, color: theme.blue }}>Create New Course</h2>
            <form onSubmit={handleCreateCourse} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
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

      {/* CREATE CODE TEST MODAL */}
      {showTestModal && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}>
              <div style={{ background: "white", width: "800px", height: "85vh", borderRadius: "16px", padding: "30px", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)" }}>
                  <h2 style={{color: theme.darkBlue, borderBottom: "1px solid #eee", paddingBottom: "15px"}}>Define New Algorithm Challenge</h2>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "20px" }}>
                      <div>
                          <label style={{fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "5px"}}>Challenge Title</label>
                          <input value={testForm.title} onChange={e => setTestForm({...testForm, title: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "6px" }} />
                      </div>
                      <div>
                          <label style={{fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "5px"}}>Pass Key</label>
                          <input value={testForm.pass_key} onChange={e => setTestForm({...testForm, pass_key: e.target.value})} placeholder="e.g. SECRET123" style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "6px" }} />
                      </div>
                      <div>
                          <label style={{fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "5px"}}>Time Limit (Mins)</label>
                          <input type="number" value={testForm.time_limit} onChange={e => setTestForm({...testForm, time_limit: Number(e.target.value)})} style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "6px" }} />
                      </div>
                  </div>
                  
                  <div style={{ background: "#f8fafc", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                      <h4 style={{margin: "0 0 15px 0", color: "#333"}}>Add Problem ({testForm.problems.length} added so far)</h4>
                      
                      <div style={{marginBottom: "10px"}}>
                          <input placeholder="Problem Title (e.g. Binary Search)" value={currentProblem.title} onChange={e => setCurrentProblem({...currentProblem, title: e.target.value})} style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ccc" }} />
                          <textarea placeholder="Full Problem Description..." value={currentProblem.description} onChange={e => setCurrentProblem({...currentProblem, description: e.target.value})} style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ccc", minHeight: "80px" }} />
                      </div>
                      
                      <button onClick={addProblemToTest} style={{ background: "#334155", color: "white", padding: "10px 20px", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}>+ Add This Problem to Test</button>
                  </div>

                  <div style={{display: "flex", gap: "10px"}}>
                      <button onClick={handleCreateTest} style={{ flex: 2, padding: "15px", background: theme.green, color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}>Save Problem & Notify Students</button>
                      <button onClick={() => setShowTestModal(false)} style={{ flex: 1, padding: "15px", background: "#e2e8f0", border: "none", color: "#333", cursor: "pointer", borderRadius: "8px", fontWeight: "bold" }}>Cancel</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
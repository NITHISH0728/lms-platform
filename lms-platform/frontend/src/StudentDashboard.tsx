import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, BookOpen, Compass, Award, Settings, LogOut, 
  TrendingUp, BookCheck, Trophy, PlayCircle, ShoppingBag, 
  User, Download, Clock, CreditCard, X 
} from "lucide-react";

// Types
interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  image_url: string;
  instructor_id: number;
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home"); 
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  
  // --- ✅ NEW MODAL STATE ---
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [processing, setProcessing] = useState(false);

  // Mock Data 
  const stats = { assigned: enrolledCourses.length, certificates: 0, rank: 12 };
  const brand = { blue: "#005EB8", green: "#87C232", bg: "#f8fafc", border: "#e2e8f0", textMain: "#1e293b", textLight: "#64748b" };

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role === "instructor") { navigate("/dashboard"); return; }
    fetchData();
  }, [activeTab]); // Added activeTab to dependency to refresh on tab switch

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const allRes = await axios.get("http://127.0.0.1:8000/api/v1/courses", config);
      const myRes = await axios.get("http://127.0.0.1:8000/api/v1/my-courses", config);
      
      const myCourseIds = new Set(myRes.data.map((c: Course) => c.id));
      setAvailableCourses(allRes.data.filter((c: Course) => !myCourseIds.has(c.id)));
      setEnrolledCourses(myRes.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  // --- ✅ NEW: OPEN MODAL ---
  const openEnrollModal = (course: Course) => {
    setSelectedCourse(course);
    setShowModal(true);
  };

  // --- ✅ NEW: 7-DAY TRIAL LOGIC ---
  const handleTrialParams = async () => {
    if (!selectedCourse) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://127.0.0.1:8000/api/v1/enroll/${selectedCourse.id}`, 
        { type: "trial" }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert("🎉 7-Day Free Trial Activated! Enjoy.");
      setShowModal(false);
      setActiveTab("learning"); 
      fetchData(); // Refresh lists
    } catch (err: any) {
      alert("Error activating trial: " + (err.response?.data?.detail || "Unknown error"));
    } finally {
      setProcessing(false);
    }
  };

  // --- ✅ NEW: RAZORPAY LOGIC ---
  const handlePayment = () => {
    if (!selectedCourse) return;
    setProcessing(true);

    const options = {
      key: "rzp_test_Rp3E7Uhj31NKAP", // ⚠️ REPLACE WITH YOUR ACTUAL KEY ID
      amount: selectedCourse.price * 100, 
      currency: "INR",
      name: "iQmath Learning",
      description: `Lifetime Access: ${selectedCourse.title}`,
      image: "https://your-logo-url.com/logo.png",
      handler: async function (response: any) {
        try {
          const token = localStorage.getItem("token");
          await axios.post(
            `http://127.0.0.1:8000/api/v1/enroll/${selectedCourse.id}`, 
            { type: "paid" }, 
            { headers: { Authorization: `Bearer ${token}` } }
          );
          alert("Payment Successful! You have lifetime access.");
          setShowModal(false);
          setActiveTab("learning");
          fetchData();
        } catch (error) {
          alert("Enrollment failed after payment. Contact support.");
        }
      },
      prefill: {
        name: "Student Name",
        email: "student@example.com",
        contact: "9999999999",
      },
      theme: { color: brand.blue },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
    setProcessing(false);
  };

  // ✅ EXISTING: Secure PDF Downloader
  const handleDownloadCertificate = async (courseId: number, courseTitle: string) => {
    setDownloadingId(courseId);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`http://127.0.0.1:8000/api/v1/generate-pdf/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob' 
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${courseTitle.replace(/\s+/g, '_')}_Certificate.pdf`);
      document.body.appendChild(link);
      link.click();
      
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download certificate. Please try logging in again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  // Sub-Components
  const StatCard = ({ title, value, icon, color }: any) => (
    <div style={{ background: "white", padding: "24px", borderRadius: "16px", border: `1px solid ${brand.border}`, flex: 1, display: "flex", flexDirection: "column", gap: "10px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <span style={{ fontSize: "14px", fontWeight: "600", color: brand.textLight }}>{title}</span>
        <div style={{ padding: "8px", borderRadius: "8px", background: `${color}15`, color: color }}>{icon}</div>
      </div>
      <div style={{ fontSize: "28px", fontWeight: "800", color: brand.textMain }}>{value}</div>
      <div style={{ height: "4px", width: "100%", background: "#f1f5f9", borderRadius: "2px", marginTop: "auto" }}>
        <div style={{ height: "100%", width: "60%", background: color, borderRadius: "2px" }}></div>
      </div>
    </div>
  );

  const CourseCard = ({ course, type }: { course: Course, type: "enrolled" | "available" }) => (
    <div style={{ background: "white", borderRadius: "16px", border: `1px solid ${brand.border}`, overflow: "hidden", transition: "transform 0.2s" }}
         onMouseOver={e => e.currentTarget.style.transform = "translateY(-4px)"}
         onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
      <div style={{ height: "160px", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {course.image_url ? <img src={course.image_url} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <BookOpen size={40} color={brand.textLight} />}
        {type === "enrolled" && <div style={{ position: "absolute", top: 10, right: 10, background: brand.green, color: "white", padding: "4px 10px", borderRadius: "20px", fontSize: "10px", fontWeight: "800" }}>ACTIVE</div>}
      </div>
      <div style={{ padding: "20px" }}>
        <h4 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "700", color: brand.textMain }}>{course.title}</h4>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
          <span style={{ fontSize: "18px", fontWeight: "800", color: brand.blue }}>₹{course.price}</span>
          {type === "available" ? (
            // ✅ CHANGED: Now opens Modal instead of direct enroll
            <button onClick={() => openEnrollModal(course)} style={{ background: brand.blue, color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", display: "flex", gap: "6px", alignItems: "center" }}><ShoppingBag size={14} /> Enroll</button>
          ) : (
            <button onClick={() => navigate(`/course/${course.id}/player`)} style={{ background: brand.textMain, color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", fontWeight: "600", cursor: "pointer", display: "flex", gap: "6px", alignItems: "center" }}><PlayCircle size={14} /> Resume</button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: brand.bg, fontFamily: "'Inter', sans-serif" }}>
      
      {/* 🛠️ SIDEBAR */}
      <aside style={{ width: "260px", background: "white", borderRight: `1px solid ${brand.border}`, padding: "24px", display: "flex", flexDirection: "column", position: "fixed", height: "100vh", zIndex: 50, top: 0, left: 0 }}>
        <div style={{ marginBottom: "40px", paddingLeft: "10px" }}>
          <span style={{ fontSize: "22px", fontWeight: "900", color: brand.blue }}>iQmath<span style={{ color: brand.green }}>Pro</span></span>
        </div>
        
        <nav style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Home" active={activeTab === "home"} onClick={() => setActiveTab("home")} brand={brand} />
          <SidebarItem icon={<BookOpen size={20} />} label="My Learning" active={activeTab === "learning"} onClick={() => setActiveTab("learning")} brand={brand} />
          <SidebarItem icon={<Compass size={20} />} label="Explore Courses" active={activeTab === "explore"} onClick={() => setActiveTab("explore")} brand={brand} />
          <SidebarItem icon={<Award size={20} />} label="My Certificates" active={activeTab === "certificates"} onClick={() => setActiveTab("certificates")} brand={brand} />
        </nav>

        <div style={{ borderTop: `1px solid ${brand.border}`, paddingTop: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <SidebarItem icon={<Settings size={20} />} label="Settings" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} brand={brand} />
          <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "10px", background: "#fef2f2", color: "#ef4444", border: "none", fontWeight: "600", cursor: "pointer", width: "100%", marginTop: "5px" }}>
            <LogOut size={20} /> <span style={{fontSize: "15px"}}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 🖥️ MAIN CONTENT */}
      <main style={{ marginLeft: "260px", width: "calc(100% - 260px)", minHeight: "100vh", padding: "40px" }}>
        
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <div>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: brand.textMain }}>
              {activeTab === "home" && "Dashboard Overview"}
              {activeTab === "learning" && "My Learning"}
              {activeTab === "explore" && "Course Marketplace"}
              {activeTab === "certificates" && "Achievements"}
            </h2>
            <p style={{ color: brand.textLight }}>Welcome back, Student</p>
          </div>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: brand.blue, color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <User size={20} />
          </div>
        </header>

        {/* Home Stats */}
        {activeTab === "home" && (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", gap: "24px", marginBottom: "40px" }}>
              <StatCard title="Assigned Courses" value={stats.assigned} icon={<BookCheck size={24} />} color={brand.blue} />
              <StatCard title="Certificates Earned" value={enrolledCourses.length} icon={<Award size={24} />} color={brand.green} />
              <StatCard title="Leaderboard Rank" value={`#${stats.rank}`} icon={<Trophy size={24} />} color="#EAB308" />
            </div>
            
            <div style={{ background: "white", padding: "30px", borderRadius: "20px", border: `1px solid ${brand.border}` }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "20px" }}>Recent Activity</h3>
              {enrolledCourses.length > 0 ? (
                <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                  <div style={{ width: "60px", height: "60px", background: "#f1f5f9", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}><TrendingUp color={brand.blue} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}><span style={{ fontWeight: "700", color: brand.textMain }}>{enrolledCourses[0].title}</span><span style={{ fontWeight: "600", color: brand.blue }}>15% Completed</span></div>
                    <div style={{ width: "100%", height: "8px", background: "#f1f5f9", borderRadius: "4px" }}><div style={{ width: "15%", height: "100%", background: brand.blue, borderRadius: "4px" }}></div></div>
                  </div>
                  <button onClick={() => navigate(`/course/${enrolledCourses[0].id}/player`)} style={{ padding: "10px 20px", background: brand.textMain, color: "white", borderRadius: "8px", border: "none", fontWeight: "600", cursor: "pointer" }}>Resume</button>
                </div>
              ) : <p style={{ color: brand.textLight }}>Start a course to see your progress here.</p>}
            </div>
          </div>
        )}

        {/* Tabs */}
        {activeTab === "learning" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>{enrolledCourses.map(c => <CourseCard key={c.id} course={c} type="enrolled" />)}</div>}
        {activeTab === "explore" && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>{availableCourses.map(c => <CourseCard key={c.id} course={c} type="available" />)}</div>}

        {/* 🏆 CERTIFICATES TAB */}
        {activeTab === "certificates" && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
                <h3 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "24px", color: brand.textMain }}>Your Credentials</h3>
                {enrolledCourses.length > 0 ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "24px" }}>
                        {enrolledCourses.map(course => (
                            <div key={course.id} style={{ background: "white", borderRadius: "16px", border: `1px solid ${brand.border}`, overflow: "hidden", display: "flex", flexDirection: "column", transition: "transform 0.2s" }}
                                 onMouseOver={e => e.currentTarget.style.transform = "translateY(-4px)"}
                                 onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
                                <div style={{ height: "200px", background: "#f8fafc", position: "relative", borderBottom: `1px solid ${brand.border}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <div style={{ width: "80%", height: "80%", background: "white", border: "4px double #e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
                                        <Award size={32} color={brand.green} style={{ marginBottom: "8px" }} />
                                        <div style={{ fontSize: "8px", fontWeight: "700", color: brand.blue, letterSpacing: "1px" }}>CERTIFICATE OF COMPLETION</div>
                                        <div style={{ fontSize: "14px", fontWeight: "800", color: brand.textMain, marginTop: "8px", textAlign: "center", padding: "0 10px" }}>{course.title}</div>
                                    </div>
                                    <div style={{ position: "absolute", inset: 0, background: "rgba(135, 194, 50, 0.1)", opacity: 0, transition: "opacity 0.2s" }} 
                                         onMouseOver={e => e.currentTarget.style.opacity = "1"} 
                                         onMouseOut={e => e.currentTarget.style.opacity = "0"}>
                                    </div>
                                </div>
                                <div style={{ padding: "20px" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                                        <span style={{ fontSize: "12px", fontWeight: "600", color: brand.textLight }}>Issued: {new Date().toLocaleDateString()}</span>
                                        <span style={{ fontSize: "10px", fontWeight: "700", background: "#dcfce7", color: "#166534", padding: "4px 8px", borderRadius: "12px" }}>VERIFIED</span>
                                    </div>
                                    <button 
                                        onClick={() => handleDownloadCertificate(course.id, course.title)}
                                        disabled={downloadingId === course.id}
                                        style={{ width: "100%", padding: "12px", background: brand.blue, color: "white", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", opacity: downloadingId === course.id ? 0.7 : 1 }}
                                    >
                                        <Download size={18} /> {downloadingId === course.id ? "Generating PDF..." : "Download PDF"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: "center", padding: "60px", background: "white", borderRadius: "16px", border: `2px dashed ${brand.border}` }}>
                        <Award size={48} color="#cbd5e1" style={{ marginBottom: "20px" }} />
                        <h3 style={{ color: brand.textLight }}>No certificates earned yet</h3>
                        <p style={{ color: brand.textLight, fontSize: "14px" }}>Enroll in a course to start earning.</p>
                    </div>
                )}
            </div>
        )}
      </main>

      {/* --- ✅ NEW MODAL POPUP --- */}
      {showModal && selectedCourse && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(5px)" }}>
           <div style={{ background: "white", width: "450px", borderRadius: "20px", padding: "30px", position: "relative", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)" }}>
              
              <button onClick={() => setShowModal(false)} style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", cursor: "pointer" }}><X size={24} color="#94a3b8" /></button>
              
              <h2 style={{ margin: "0 0 5px 0", fontSize: "22px", color: brand.textMain }}>Unlock Course</h2>
              <p style={{ margin: "0 0 25px 0", color: "#64748b" }}>{selectedCourse.title}</p>

              {/* 🟢 OPTION 1: FREE TRIAL */}
              <div style={{ border: `2px solid ${brand.green}`, borderRadius: "12px", padding: "20px", background: "#f0fdf4", position: "relative", marginBottom: "25px" }}>
                 <div style={{ position: "absolute", top: "-12px", right: "20px", background: brand.green, color: "white", fontSize: "11px", fontWeight: "800", padding: "4px 12px", borderRadius: "20px", textTransform: "uppercase" }}>Recommended</div>
                 <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <Clock size={24} color={brand.green} />
                    <h3 style={{ margin: 0, fontSize: "18px", color: "#166534" }}>Start 7-Day Free Trial</h3>
                 </div>
                 <p style={{ fontSize: "13px", color: "#15803d", margin: "0 0 15px 0", lineHeight: "1.5" }}>
                    Get full access to all modules and assignments for 7 days. No credit card required. No commitment.
                 </p>
                 <button 
                   onClick={handleTrialParams} 
                   disabled={processing}
                   style={{ width: "100%", padding: "12px", background: brand.green, color: "white", border: "none", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "15px", boxShadow: "0 4px 6px -1px rgba(135, 194, 50, 0.4)" }}
                 >
                   {processing ? "Activating..." : "Start Free Trial"}
                 </button>
              </div>

              {/* DIVIDER */}
              <div style={{ display: "flex", alignItems: "center", gap: "15px", margin: "0 0 25px 0" }}>
                 <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }}></div>
                 <span style={{ fontSize: "12px", fontWeight: "700", color: "#94a3b8" }}>OR</span>
                 <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }}></div>
              </div>

              {/* 🔵 OPTION 2: LIFETIME ACCESS */}
              <button 
                onClick={handlePayment}
                disabled={processing}
                style={{ width: "100%", padding: "14px", background: "white", color: brand.textMain, border: "1px solid #cbd5e1", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", cursor: "pointer", fontSize: "15px", fontWeight: "600", transition: "background 0.2s" }}
                onMouseOver={(e) => e.currentTarget.style.background = "#f8fafc"}
                onMouseOut={(e) => e.currentTarget.style.background = "white"}
              >
                 <CreditCard size={18} />
                 <span>Buy Lifetime Access for <b>₹{selectedCourse.price}</b></span>
              </button>

           </div>
        </div>
      )}
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick, brand }: any) => (
  <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "12px 16px", border: "none", borderRadius: "10px", background: active ? `${brand.blue}10` : "transparent", color: active ? brand.blue : brand.textLight, fontWeight: active ? "700" : "500", cursor: "pointer", transition: "all 0.2s" }}>
    {icon} <span style={{ fontSize: "15px" }}>{label}</span>
  </button>
);

export default StudentDashboard;
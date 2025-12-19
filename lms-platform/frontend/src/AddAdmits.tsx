import { useState, useEffect } from "react";
import axios from "axios";
import { 
  UserPlus, Upload, FileSpreadsheet, CheckCircle, 
  Download 
} from "lucide-react";

// Types
interface Course {
  id: number;
  title: string;
}

const AddAdmits = () => {
  // --- STATE ---
  const [courses, setCourses] = useState<Course[]>([]);
  
  // Single Admit State
  const [singleName, setSingleName] = useState("");
  const [singleEmail, setSingleEmail] = useState("");
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [singleLoading, setSingleLoading] = useState(false);

  // Bulk Admit State
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkCourseId, setBulkCourseId] = useState<number | null>(null); // One course for the whole batch
  const [bulkLoading, setBulkLoading] = useState(false);

  const brand = { blue: "#005EB8", green: "#87C232", bg: "#f8fafc", border: "#e2e8f0" };

  // --- FETCH COURSES ON LOAD ---
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        // We use the instructor's course list so they can assign their own courses
        const res = await axios.get("http://127.0.0.1:8000/api/v1/courses", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCourses(res.data);
      } catch (err) {
        console.error("Error fetching courses", err);
      }
    };
    fetchCourses();
  }, []);

  // --- HANDLER: Single Student ---
  const handleSingleAdmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCourseIds.length === 0) return alert("Please select at least one course.");
    
    setSingleLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        full_name: singleName,
        email: singleEmail,
        course_ids: selectedCourseIds
      };

      const res = await axios.post("http://127.0.0.1:8000/api/v1/admin/admit-student", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`✅ Success! ${res.data.message}`);
      setSingleName("");
      setSingleEmail("");
      setSelectedCourseIds([]);
    } catch (err: any) {
      alert(`Error: ${err.response?.data?.detail || "Failed to admit student"}`);
    } finally {
      setSingleLoading(false);
    }
  };

  // --- HANDLER: Bulk Upload ---
  const handleBulkAdmit = async () => {
    if (!bulkFile) return alert("Please upload an Excel file.");
    if (!bulkCourseId) return alert("Please select a course for this batch.");

    setBulkLoading(true);
    const formData = new FormData();
    formData.append("file", bulkFile);
    formData.append("course_id", bulkCourseId.toString());

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("http://127.0.0.1:8000/api/v1/admin/bulk-admit", formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
      alert(`🎉 Bulk Process Complete! ${res.data.message}`);
      setBulkFile(null);
    } catch (err: any) {
      alert(`Error: ${err.response?.data?.detail || "Upload failed"}`);
    } finally {
      setBulkLoading(false);
    }
  };

  // Helper for Multi-Select (Simple Toggle)
  const toggleCourseSelection = (id: number) => {
    if (selectedCourseIds.includes(id)) {
      setSelectedCourseIds(selectedCourseIds.filter(cid => cid !== id));
    } else {
      setSelectedCourseIds([...selectedCourseIds, id]);
    }
  };

  // Helper to generate Dummy Excel
  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Email\nJohn Doe,john@college.edu\nJane Smith,jane@college.edu";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_template.csv"); 
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1400px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#1e293b", marginBottom: "40px" }}>Add Admits</h1>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
        
        {/* LEFT: SINGLE ADMIT */}
        <div style={cardStyle}>
          <div style={{ borderBottom: `1px solid ${brand.border}`, paddingBottom: "20px", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px" }}>
              <UserPlus size={24} color={brand.blue} /> Single Student Admit
            </h2>
            <p style={{ color: "#64748b", fontSize: "14px", marginTop: "5px" }}>Create account & assign free courses manually.</p>
          </div>

          <form onSubmit={handleSingleAdmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input required value={singleName} onChange={e => setSingleName(e.target.value)} placeholder="Student Name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email Address</label>
              <input required type="email" value={singleEmail} onChange={e => setSingleEmail(e.target.value)} placeholder="student@college.edu" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Assign Free Courses</label>
              <div style={{ border: `1px solid ${brand.border}`, borderRadius: "10px", maxHeight: "150px", overflowY: "auto", padding: "10px", background: "#f8fafc" }}>
                {courses.length === 0 && <p style={{fontSize: "13px", color: "#999"}}>No active courses found.</p>}
                {courses.map(course => (
                  <div key={course.id} onClick={() => toggleCourseSelection(course.id)} style={{ padding: "8px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "10px", background: selectedCourseIds.includes(course.id) ? "#e0f2fe" : "transparent" }}>
                    <div style={{ width: "16px", height: "16px", borderRadius: "4px", border: "1px solid #cbd5e1", background: selectedCourseIds.includes(course.id) ? brand.blue : "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {selectedCourseIds.includes(course.id) && <CheckCircle size={12} color="white" />}
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>{course.title}</span>
                  </div>
                ))}
              </div>
            </div>

            <button disabled={singleLoading} type="submit" style={{ ...btnStyle, background: brand.blue }}>
              {singleLoading ? "Processing..." : "Create Account & Send Email"}
            </button>
          </form>
        </div>

        {/* RIGHT: BULK ADMIT */}
        <div style={cardStyle}>
          <div style={{ borderBottom: `1px solid ${brand.border}`, paddingBottom: "20px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px" }}>
                <FileSpreadsheet size={24} color={brand.green} /> Bulk Upload
              </h2>
              <p style={{ color: "#64748b", fontSize: "14px", marginTop: "5px" }}>Upload Excel to onboard a whole batch.</p>
            </div>
            <button onClick={downloadTemplate} style={{ fontSize: "13px", color: brand.blue, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", fontWeight: "600" }}>
              <Download size={16} /> Template
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%" }}>
            
            {/* 1. Select Course */}
            <div>
              <label style={labelStyle}>Select Batch Course</label>
              <select value={bulkCourseId || ""} onChange={(e) => setBulkCourseId(Number(e.target.value))} style={inputStyle}>
                <option value="">-- Choose Course for Batch --</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <p style={{ fontSize: "12px", color: "#64748b", marginTop: "5px" }}>All students in the Excel file will be enrolled in this course.</p>
            </div>

            {/* 2. Upload Area */}
            <div 
              style={{ flex: 1, border: "2px dashed #cbd5e1", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "200px", background: "#f8fafc", position: "relative" }}
            >
              <input 
                type="file" 
                accept=".xlsx, .xls, .csv" 
                onChange={(e) => setBulkFile(e.target.files ? e.target.files[0] : null)}
                style={{ position: "absolute", width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
              />
              {bulkFile ? (
                <div style={{ textAlign: "center" }}>
                   <FileSpreadsheet size={40} color={brand.green} style={{marginBottom: "10px"}} />
                   <div style={{ fontWeight: "700", color: "#1e293b" }}>{bulkFile.name}</div>
                   <div style={{ fontSize: "12px", color: "#64748b" }}>Ready to upload</div>
                </div>
              ) : (
                <div style={{ textAlign: "center", color: "#94a3b8" }}>
                   <Upload size={40} style={{marginBottom: "10px"}} />
                   <div style={{ fontWeight: "600" }}>Drop Excel File Here</div>
                   <div style={{ fontSize: "12px" }}>or click to browse</div>
                </div>
              )}
            </div>

            <button disabled={bulkLoading} onClick={handleBulkAdmit} style={{ ...btnStyle, background: brand.green }}>
              {bulkLoading ? "Uploading & Processing..." : "Process Batch Upload"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles
const cardStyle = { background: "white", borderRadius: "16px", border: "1px solid #e2e8f0", padding: "30px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" };
const labelStyle = { display: "block", fontSize: "13px", fontWeight: "700", color: "#475569", marginBottom: "8px", textTransform: "uppercase" as const };
const inputStyle = { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", outline: "none" };
const btnStyle = { width: "100%", padding: "14px", color: "white", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: "pointer", transition: "filter 0.2s" };

export default AddAdmits;
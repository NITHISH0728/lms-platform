from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import List, Optional
import models
from database import SessionLocal, engine
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import io
import json
import os
import random
import string
import pandas as pd  # ✅ For Excel Processing

# --- 📄 PDF GENERATION IMPORTS ---
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader

# 1. Initialize Database Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="iQmath Pro LMS API")

# 2. CONFIG: CORS POLICY
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"], 
)

# --- 🔐 SECURITY & AUTH CONFIG ---
SECRET_KEY = "supersecretkey_change_this_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/login") 

# --- 🗄️ DATABASE UTILITIES ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 📋 DATA MODELS ---
class UserCreate(BaseModel):
    email: str; password: str; name: str; role: str

class CourseCreate(BaseModel):
    title: str; description: str; price: int; image_url: Optional[str] = None

class ModuleCreate(BaseModel):
    title: str; order: int

class ContentCreate(BaseModel):
    title: str; type: str; data_url: Optional[str] = None; duration: Optional[int] = None; 
    is_mandatory: bool = False; instructions: Optional[str] = None; test_config: Optional[str] = None; module_id: int

class StatusUpdate(BaseModel):
    status: str 

class Token(BaseModel):
    access_token: str; token_type: str; role: str
    
class AssignmentSubmission(BaseModel):
    link: str; lesson_id: int

# ✅ NEW: Schema for B2B Single Admit
class AdmitStudentRequest(BaseModel):
    full_name: str
    email: str
    course_ids: List[int] # List of Course IDs to give for free

class EnrollmentRequest(BaseModel):
    type: str # 'trial' or 'paid'

# --- 🔑 AUTH LOGIC ---
def verify_password(plain, hashed): return pwd_context.verify(plain, hashed)
def get_password_hash(pw): return pwd_context.hash(pw)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None: raise HTTPException(status_code=401, detail="Invalid session")
    except JWTError: raise HTTPException(status_code=401, detail="Session expired")
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None: raise HTTPException(status_code=401, detail="User not found")
    return user

# --- 🛠️ HELPER: Random Password Generator ---
def generate_random_password(length=8):
    characters = string.ascii_letters + string.digits + "!@#$"
    return ''.join(random.choice(characters) for i in range(length))

# --- 📧 HELPER: Mock Email Sender (Logs to Console) ---
def send_welcome_email(email: str, name: str, password: str, course_names: List[str]):
    print("\n" + "="*50)
    print(f"📧 SENDING EMAIL TO: {email}")
    print(f"👤 Hi {name}, Welcome to iQmath!")
    print(f"🔑 Your Credentials -> Username: {email} | Password: {password}")
    print(f"📚 You have been granted access to: {', '.join(course_names)}")
    print("="*50 + "\n")

# --- 🚀 PROFESSIONAL PDF ENGINE (Restored) ---
def create_certificate_pdf(student_name: str, course_name: str, date_str: str):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=landscape(A4))
    width, height = landscape(A4)
    
    # Brand Colors
    BRAND_BLUE = colors.Color(0/255, 94/255, 184/255)
    BRAND_GREEN = colors.Color(135/255, 194/255, 50/255)

    # 1. BORDERS
    c.setStrokeColor(BRAND_BLUE)
    c.setLineWidth(5)
    c.rect(20, 20, width-40, height-40)
    
    c.setStrokeColor(BRAND_GREEN)
    c.setLineWidth(2)
    c.rect(28, 28, width-56, height-56)

    # 2. LOGO HANDLING
    logo_path = "logo.png"
    if not os.path.exists(logo_path):
        logo_path = "logo.jpg" 

    if os.path.exists(logo_path):
        try:
            logo = ImageReader(logo_path)
            logo_width = 1.5 * inch
            aspect = logo.getSize()[1] / logo.getSize()[0]
            logo_height = logo_width * aspect
            c.drawImage(logo, (width - logo_width) / 2, height - 130, width=logo_width, height=logo_height, mask='auto')
        except:
            print("Error loading logo image")

    # 3. TEXT CONTENT
    center_x = width / 2
    
    c.setFont("Helvetica-Bold", 40)
    c.setFillColor(BRAND_BLUE)
    c.drawCentredString(center_x, height - 180, "CERTIFICATE")
    
    c.setFont("Helvetica", 16)
    c.setFillColor(colors.black)
    c.drawCentredString(center_x, height - 210, "OF COMPLETION")

    c.setFont("Helvetica", 14)
    c.setFillColor(colors.darkgrey)
    c.drawCentredString(center_x, height - 260, "This is to certify that")

    c.setFont("Helvetica-BoldOblique", 32)
    c.setFillColor(colors.black)
    c.drawCentredString(center_x, height - 310, student_name)
    
    c.setLineWidth(1)
    c.setStrokeColor(colors.grey)
    c.line(center_x - 200, height - 320, center_x + 200, height - 320)

    c.setFont("Helvetica", 14)
    c.setFillColor(colors.darkgrey)
    c.drawCentredString(center_x, height - 360, "Has successfully completed the curriculum for")

    c.setFont("Helvetica-Bold", 24)
    c.setFillColor(BRAND_BLUE)
    c.drawCentredString(center_x, height - 400, course_name)

    # 4. FOOTER & SIGNATURES
    c.setFont("Helvetica", 12)
    c.setFillColor(colors.black)
    c.drawString(100, 100, f"Date: {date_str}")
    c.line(100, 95, 250, 95) 

    c.drawString(width - 250, 100, "Instructor Signature")
    c.line(width - 250, 95, width - 100, 95) 
    
    c.setFont("Helvetica-Oblique", 10)
    c.setFillColor(BRAND_GREEN)
    c.drawCentredString(center_x, 60, "Digitally Verified by iQmath LMS")

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer

# --- 🚀 API ENDPOINTS ---

@app.post("/api/v1/users", status_code=201)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = models.User(email=user.email, hashed_password=get_password_hash(user.password), full_name=user.name, role=user.role)
    db.add(new_user); db.commit()
    return {"message": "User created successfully"}

@app.post("/api/v1/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "role": user.role}

# ✅ NEW B2B ENDPOINT 1: Manual Single Admit
@app.post("/api/v1/admin/admit-student")
def admit_single_student(req: AdmitStudentRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403, detail="Only Instructors can admit students")

    # 1. Check if user exists
    existing_user = db.query(models.User).filter(models.User.email == req.email).first()
    raw_password = generate_random_password()
    
    student = existing_user
    if not student:
        # Create new student account automatically
        student = models.User(
            email=req.email,
            full_name=req.full_name,
            hashed_password=get_password_hash(raw_password),
            role="student"
        )
        db.add(student)
        db.commit()
        db.refresh(student)
    
    # 2. Assign Courses (Free Pass Logic)
    enrolled_courses = []
    for cid in req.course_ids:
        # Check if already enrolled
        exists = db.query(models.Enrollment).filter(models.Enrollment.user_id == student.id, models.Enrollment.course_id == cid).first()
        if not exists:
            enrollment = models.Enrollment(user_id=student.id, course_id=cid)
            db.add(enrollment)
            # Get course name for email
            course = db.query(models.Course).filter(models.Course.id == cid).first()
            if course: enrolled_courses.append(course.title)
    
    db.commit()

    # 3. Trigger Email (Console Log for now)
    if not existing_user:
        send_welcome_email(req.email, req.full_name, raw_password, enrolled_courses)
        return {"message": f"Student created and enrolled in {len(enrolled_courses)} courses. Credentials sent."}
    else:
        return {"message": f"Existing student enrolled in {len(enrolled_courses)} new courses."}

# ✅ NEW B2B ENDPOINT 2: Bulk Upload (Excel)
# ✅ UPDATED: Supports both CSV and Excel
@app.post("/api/v1/admin/bulk-admit")
async def bulk_admit_students(
    file: UploadFile = File(...), 
    course_id: int = Form(...), 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "instructor": raise HTTPException(status_code=403)

    # 1. Read File Content
    contents = await file.read()
    
    # 2. Smart Format Detection (CSV or Excel)
    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        print(f"File Error: {e}")
        raise HTTPException(status_code=400, detail="Invalid file. Please upload a valid .csv or .xlsx file")

    # 3. Validation
    # Normalize headers to lowercase to avoid "Name" vs "name" issues
    df.columns = [c.lower().strip() for c in df.columns]
    
    if "name" not in df.columns or "email" not in df.columns:
        raise HTTPException(status_code=400, detail="File must have 'Name' and 'Email' columns")

    success_count = 0
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    course_name = course.title if course else "Course"

    for _, row in df.iterrows():
        name = str(row["name"])
        email = str(row["email"]).strip()
        
        # Skip empty rows
        if not email or email == "nan": continue

        # Create/Find User
        existing_user = db.query(models.User).filter(models.User.email == email).first()
        raw_password = generate_random_password()
        student = existing_user

        if not student:
            student = models.User(
                email=email, full_name=name, hashed_password=get_password_hash(raw_password), role="student"
            )
            db.add(student); db.commit(); db.refresh(student)
            
            # Send "Fake" Email (Logs to console)
            send_welcome_email(email, name, raw_password, [course_name])

        # Enroll
        exists = db.query(models.Enrollment).filter(models.Enrollment.user_id == student.id, models.Enrollment.course_id == course_id).first()
        if not exists:
            enroll = models.Enrollment(user_id=student.id, course_id=course_id)
            db.add(enroll)
            success_count += 1
            
    db.commit()
    return {"message": f"Success! {success_count} students enrolled in {course_name}."}

# ... [Keep your existing course/content/player endpoints below] ...

@app.get("/api/v1/courses")
def get_courses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == "instructor":
        return db.query(models.Course).filter(models.Course.instructor_id == current_user.id).all()
    # ✅ Normal users only see what they bought. 
    # But wait! If they are enrolled (free pass), they should see it in "My Courses" endpoint, not here.
    return db.query(models.Course).filter(models.Course.is_published == True).all()

@app.post("/api/v1/courses")
def create_course(course: CourseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_course = models.Course(**course.dict(), instructor_id=current_user.id)
    db.add(new_course); db.commit(); db.refresh(new_course); return new_course

@app.post("/api/v1/courses/{course_id}/modules")
def create_module(course_id: int, module: ModuleCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403)
    new_module = models.Module(**module.dict(), course_id=course_id)
    db.add(new_module); db.commit(); db.refresh(new_module)
    return new_module

@app.get("/api/v1/courses/{course_id}/modules")
def get_modules(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Module).filter(models.Module.course_id == course_id).order_by(models.Module.order).all()

@app.post("/api/v1/content")
def add_content(content: ContentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403)
    new_content = models.ContentItem(
        title=content.title, type=content.type, content=content.data_url, order=0,
        module_id=content.module_id, duration=content.duration, is_mandatory=content.is_mandatory,
        instructions=content.instructions, test_config=content.test_config
    )
    db.add(new_content); db.commit()
    return {"message": f"{content.type} added successfully"}

@app.patch("/api/v1/courses/{course_id}/publish")
def publish_course(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    course.is_published = True; db.commit()
    return {"message": "Course Live!"}

# ✅ UPDATED PLAYER LOGIC (With Safety Check)
@app.get("/api/v1/courses/{course_id}/player")
def get_course_player(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    if not course: raise HTTPException(status_code=404, detail="Course not found")

    # Check Enrollment
    enrollment = db.query(models.Enrollment).filter(
        models.Enrollment.user_id == current_user.id, 
        models.Enrollment.course_id == course_id
    ).first()
    
    is_owner = (current_user.role == "instructor" and course.instructor_id == current_user.id)

    if not enrollment and not is_owner:
        raise HTTPException(status_code=403, detail="Not enrolled")

    # ✅ TRIAL EXPIRATION CHECK
    if enrollment and enrollment.enrollment_type == "trial":
        if enrollment.expiry_date and datetime.utcnow() > enrollment.expiry_date:
            raise HTTPException(
                status_code=402, # 402 = Payment Required
                detail="Trial Expired. Please purchase the course to continue."
            )

    # ... (Rest of the function remains the same: returning modules/lessons) ...
    return {
        "id": course.id,
        "title": course.title,
        "modules": [
            {
                "id": m.id, "title": m.title,
                "lessons": [{"id": c.id, "title": c.title, "type": c.type, "url": c.content} for c in m.items]
            } for m in course.modules
        ]
    }

@app.post("/api/v1/enroll/{course_id}")
def enroll_student(
    course_id: int, 
    req: EnrollmentRequest, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "student": 
        raise HTTPException(status_code=403, detail="Only students can enroll")
    
    # Check existing
    existing = db.query(models.Enrollment).filter(
        models.Enrollment.user_id == current_user.id, 
        models.Enrollment.course_id == course_id
    ).first()

    if existing:
        # If they are on trial and want to pay, we upgrade them
        if existing.enrollment_type == "trial" and req.type == "paid":
            existing.enrollment_type = "paid"
            existing.expiry_date = None # Lifetime
            db.commit()
            return {"message": "Upgraded to Lifetime Access!"}
        return {"message": "Already enrolled"}

    # Logic for New Enrollment
    new_enrollment = models.Enrollment(user_id=current_user.id, course_id=course_id)
    
    if req.type == "trial":
        new_enrollment.enrollment_type = "trial"
        # ✅ SET EXPIRY TO 7 DAYS FROM NOW
        new_enrollment.expiry_date = datetime.utcnow() + timedelta(days=7)
    else:
        new_enrollment.enrollment_type = "paid"
        new_enrollment.expiry_date = None # Lifetime access

    db.add(new_enrollment)
    db.commit()
    return {"message": f"Enrolled successfully ({req.type} access)"}

@app.get("/api/v1/courses/{course_id}/certification-status")
def check_certification(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return {"eligible": True, "certificate_url": f"http://127.0.0.1:8000/api/v1/generate-pdf/{course_id}"}

@app.get("/api/v1/generate-pdf/{course_id}")
def generate_pdf_endpoint(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    pdf = create_certificate_pdf(current_user.full_name, course.title, datetime.now().strftime("%B %d, %Y"))
    return StreamingResponse(pdf, media_type="application/pdf")

@app.get("/api/v1/instructor/submissions")
def get_instructor_submissions(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403, detail="Not authorized")
    submissions = db.query(models.Submission).join(models.ContentItem).join(models.Module).join(models.Course).filter(models.Course.instructor_id == current_user.id).order_by(models.Submission.submitted_at.desc()).all()
    return [{"id": sub.id, "student_name": sub.student.full_name or sub.student.email, "course_title": sub.assignment.module.course.title, "assignment_title": sub.assignment.title, "link": sub.drive_link, "status": sub.status, "submitted_at": sub.submitted_at.strftime("%Y-%m-%d")} for sub in submissions]

class GradeSchema(BaseModel):
    status: str

@app.get("/api/v1/my-courses")
def get_my_courses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    enrollments = db.query(models.Enrollment).filter(models.Enrollment.user_id == current_user.id).all()
    return [e.course for e in enrollments]

# ✅ NEW: Delete a specific content item (Video, Note, etc.)
@app.delete("/api/v1/content/{content_id}")
def delete_content(content_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": 
        raise HTTPException(status_code=403, detail="Only instructors can delete content")
    
    item = db.query(models.ContentItem).filter(models.ContentItem.id == content_id).first()
    if not item: 
        raise HTTPException(status_code=404, detail="Content not found")
        
    # Security check: Ensure this item belongs to a course owned by this instructor
    course = item.module.course
    if course.instructor_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not own this course")

    db.delete(item)
    db.commit()
    return {"message": "Item deleted successfully"}

# ✅ NEW: Edit a specific content item (Title or URL)
class ContentUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None

@app.patch("/api/v1/content/{content_id}")
def update_content(content_id: int, update: ContentUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": 
        raise HTTPException(status_code=403)
    
    item = db.query(models.ContentItem).filter(models.ContentItem.id == content_id).first()
    if not item: 
        raise HTTPException(status_code=404)
        
    # Check ownership
    if item.module.course.instructor_id != current_user.id:
        raise HTTPException(status_code=403)

    if update.title: item.title = update.title
    if update.url: item.content = update.url # Mapping 'url' to 'content' db column
    
    db.commit()
    return {"message": "Item updated successfully"}

@app.get("/")
def read_root(): return {"status": "online", "message": "iQmath API Active 🟢"}
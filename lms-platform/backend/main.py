from fastapi import FastAPI, Depends, HTTPException, status
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

# --- 📄 PDF GENERATION IMPORTS ---
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import landscape, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.utils import ImageReader
import os
# 1. Initialize Database Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="iQmath Pro LMS API")

# 2. CONFIG: CORS POLICY
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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

# --- 📋 COMPREHENSIVE DATA MODELS ---
class UserCreate(BaseModel):
    email: str; password: str; name: str; role: str

class CourseCreate(BaseModel):
    title: str; description: str; price: int; image_url: Optional[str] = None

class ModuleCreate(BaseModel):
    title: str; order: int

# ✅ UPDATED: Supports 'test_config' for Code Tests
class ContentCreate(BaseModel):
    title: str
    type: str  
    data_url: Optional[str] = None 
    duration: Optional[int] = None  
    is_mandatory: bool = False
    instructions: Optional[str] = None
    test_config: Optional[str] = None # JSON String for Code Test details
    module_id: int

class StatusUpdate(BaseModel):
    status: str 

class Token(BaseModel):
    access_token: str; token_type: str; role: str

# --- 🔑 AUTHENTICATION LOGIC ---
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

# --- 🚀 PROFESSIONAL PDF ENGINE ---
def create_certificate_pdf(student_name: str, course_name: str, date_str: str):
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=landscape(A4))
    width, height = landscape(A4)
    
    # Brand Colors
    BRAND_BLUE = colors.Color(0/255, 94/255, 184/255)
    BRAND_GREEN = colors.Color(135/255, 194/255, 50/255)

    # 1. BORDERS
    # Outer Blue Border
    c.setStrokeColor(BRAND_BLUE)
    c.setLineWidth(5)
    c.rect(20, 20, width-40, height-40)
    
    # Inner Green Border
    c.setStrokeColor(BRAND_GREEN)
    c.setLineWidth(2)
    c.rect(28, 28, width-56, height-56)

    # 2. LOGO HANDLING
    logo_path = "logo.png" # Make sure this file exists in your backend folder!
    if not os.path.exists(logo_path):
        logo_path = "logo.jpg" # Try jpg if png missing

    if os.path.exists(logo_path):
        try:
            logo = ImageReader(logo_path)
            logo_width = 1.5 * inch
            aspect = logo.getSize()[1] / logo.getSize()[0]
            logo_height = logo_width * aspect
            # Draw Logo Centered at Top
            c.drawImage(logo, (width - logo_width) / 2, height - 130, width=logo_width, height=logo_height, mask='auto')
        except:
            print("Error loading logo image")

    # 3. TEXT CONTENT
    center_x = width / 2
    
    # Title
    c.setFont("Helvetica-Bold", 40)
    c.setFillColor(BRAND_BLUE)
    c.drawCentredString(center_x, height - 180, "CERTIFICATE")
    
    c.setFont("Helvetica", 16)
    c.setFillColor(colors.black)
    c.drawCentredString(center_x, height - 210, "OF COMPLETION")

    # Body
    c.setFont("Helvetica", 14)
    c.setFillColor(colors.darkgrey)
    c.drawCentredString(center_x, height - 260, "This is to certify that")

    # Student Name (Big & Bold)
    c.setFont("Helvetica-BoldOblique", 32)
    c.setFillColor(colors.black)
    c.drawCentredString(center_x, height - 310, student_name)
    
    c.setLineWidth(1)
    c.setStrokeColor(colors.grey)
    c.line(center_x - 200, height - 320, center_x + 200, height - 320) # Underline

    # Course Text
    c.setFont("Helvetica", 14)
    c.setFillColor(colors.darkgrey)
    c.drawCentredString(center_x, height - 360, "Has successfully completed the curriculum for")

    # Course Name
    c.setFont("Helvetica-Bold", 24)
    c.setFillColor(BRAND_BLUE)
    c.drawCentredString(center_x, height - 400, course_name)

    # 4. FOOTER & SIGNATURES
    # Date
    c.setFont("Helvetica", 12)
    c.setFillColor(colors.black)
    c.drawString(100, 100, f"Date: {date_str}")
    c.line(100, 95, 250, 95) # Line

    # Signature
    c.drawString(width - 250, 100, "Instructor Signature")
    c.line(width - 250, 95, width - 100, 95) # Line
    
    # Digitally Verified Badge
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

@app.post("/api/v1/courses/{course_id}/modules")
def create_module(course_id: int, module: ModuleCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403)
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.instructor_id == current_user.id).first()
    if not course: raise HTTPException(status_code=404, detail="Course not found")
    new_module = models.Module(**module.dict(), course_id=course_id)
    db.add(new_module); db.commit(); db.refresh(new_module)
    return new_module

# ✅ UPDATED: Handles 'test_config' for Code Tests
@app.post("/api/v1/content")
def add_content(content: ContentCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "instructor": raise HTTPException(status_code=403)
    
    new_content = models.ContentItem(
        title=content.title,
        type=content.type,
        content=content.data_url, 
        order=0,
        module_id=content.module_id,
        duration=content.duration, 
        is_mandatory=content.is_mandatory,
        instructions=content.instructions,
        test_config=content.test_config # ✅ Saving the JSON config
    )
    
    db.add(new_content)
    db.commit()
    return {"message": f"{content.type} added successfully"}

@app.get("/api/v1/courses")
def get_courses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == "instructor":
        return db.query(models.Course).filter(models.Course.instructor_id == current_user.id).all()
    return db.query(models.Course).filter(models.Course.is_published == True).all()

@app.post("/api/v1/courses")
def create_course(course: CourseCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    new_course = models.Course(**course.dict(), instructor_id=current_user.id)
    db.add(new_course); db.commit(); db.refresh(new_course); return new_course

@app.get("/api/v1/courses/{course_id}/modules")
def get_modules(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Module).filter(models.Module.course_id == course_id).order_by(models.Module.order).all()

@app.patch("/api/v1/courses/{course_id}/publish")
def publish_course(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.instructor_id == current_user.id).first()
    if not course: raise HTTPException(status_code=404)
    course.is_published = True; db.commit()
    return {"message": "Course Live!"}

@app.patch("/api/v1/assignments/{sub_id}/status")
def update_submission_status(sub_id: int, update: StatusUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    submission = db.query(models.Submission).filter(models.Submission.id == sub_id).first()
    if not submission: raise HTTPException(status_code=404)
    submission.status = update.status; db.commit()
    return {"message": f"Submission updated to {update.status}"}

# ✅ NEW: Enrollment Logic
@app.post("/api/v1/enroll/{course_id}")
def enroll_student(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "student": raise HTTPException(status_code=403, detail="Only students can enroll")
    existing = db.query(models.Enrollment).filter(models.Enrollment.user_id == current_user.id, models.Enrollment.course_id == course_id).first()
    if existing: return {"message": "Already enrolled"}
    new_enrollment = models.Enrollment(user_id=current_user.id, course_id=course_id)
    db.add(new_enrollment); db.commit()
    return {"message": "Enrollment successful"}

@app.get("/api/v1/my-courses")
def get_my_courses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    enrollments = db.query(models.Enrollment).filter(models.Enrollment.user_id == current_user.id).all()
    return [e.course for e in enrollments]

# ✅ UPDATED PLAYER LOGIC: Prioritizes Live Content
@app.get("/api/v1/courses/{course_id}/player")
def get_player_data(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    
    # 🧠 LOGIC: Sort lessons so Live Classes & Live Tests appear at the top
    def priority_sort(item):
        if item.type == "live_class": return 0
        if item.type == "live_test": return 1
        return 2 

    return {
        "title": course.title,
        "modules": [
            {
                "id": m.id, 
                "title": m.title,
                "lessons": [
                    {
                        "id": item.id,
                        "title": item.title,
                        "type": item.type,
                        "url": item.content,
                        "duration": item.duration,
                        # Pass test_config to frontend if it exists
                        "test_config": json.loads(item.test_config) if item.test_config else None
                    } for item in sorted(m.items, key=priority_sort) # ✅ Sorting applied here
                ]
            } for m in course.modules
        ]
    }

@app.get("/api/v1/courses/{course_id}/certification-status")
def check_certification(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return {"eligible": True, "certificate_url": f"http://127.0.0.1:8000/api/v1/generate-pdf/{course_id}"}

@app.get("/api/v1/generate-pdf/{course_id}")
def generate_pdf_endpoint(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    course = db.query(models.Course).filter(models.Course.id == course_id).first()
    pdf = create_certificate_pdf(current_user.full_name, course.title, datetime.now().strftime("%B %d, %Y"))
    return StreamingResponse(pdf, media_type="application/pdf")

@app.get("/")
def read_root(): return {"status": "online", "message": "iQmath API Active 🟢"}
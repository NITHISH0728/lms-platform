from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    role = Column(String) # 'instructor' or 'student'
    is_active = Column(Boolean, default=True)
    
    # Relationships
    courses = relationship("Course", back_populates="instructor")
    enrollments = relationship("Enrollment", back_populates="student")
    submissions = relationship("Submission", back_populates="student")

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    price = Column(Integer)
    image_url = Column(String, nullable=True)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    instructor_id = Column(Integer, ForeignKey("users.id"))
    instructor = relationship("User", back_populates="courses")
    
    modules = relationship("Module", back_populates="course", cascade="all, delete-orphan")
    enrollments = relationship("Enrollment", back_populates="course")

class Module(Base):
    __tablename__ = "modules"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    order = Column(Integer)
    
    course_id = Column(Integer, ForeignKey("courses.id"))
    course = relationship("Course", back_populates="modules")
    
    items = relationship("ContentItem", back_populates="module", cascade="all, delete-orphan")

class ContentItem(Base):
    __tablename__ = "content_items"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    type = Column(String)  # 'video', 'assignment', 'quiz', 'code_test', 'live_test', 'live_class', 'note', 'heading'
    content = Column(Text, nullable=True) # URL or text data
    order = Column(Integer, default=0)
    
    # New Graphy-style fields
    duration = Column(Integer, nullable=True) # For tests/videos
    is_mandatory = Column(Boolean, default=False)
    instructions = Column(Text, nullable=True)
    
    # ✅ NEW: Stores JSON string for Code Test (Difficulty, Test Cases, Limits)
    test_config = Column(Text, nullable=True) 
    
    module_id = Column(Integer, ForeignKey("modules.id"))
    module = relationship("Module", back_populates="items")
    
    submissions = relationship("Submission", back_populates="assignment")

class Enrollment(Base):
    __tablename__ = "enrollments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())
    progress_percent = Column(Integer, default=0)
    
    student = relationship("User", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True, index=True)
    drive_link = Column(String) # Link to PDF on Drive
    status = Column(String, default="Pending") # Pending, Accepted, Rejected
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user_id = Column(Integer, ForeignKey("users.id"))
    content_item_id = Column(Integer, ForeignKey("content_items.id"))
    
    student = relationship("User", back_populates="submissions")
    assignment = relationship("ContentItem", back_populates="submissions")
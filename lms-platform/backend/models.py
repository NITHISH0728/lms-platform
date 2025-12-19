from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    role = Column(String) 
    
    enrollments = relationship("Enrollment", back_populates="student")
    submissions = relationship("Submission", back_populates="student")

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(String)
    price = Column(Integer)
    image_url = Column(String, nullable=True)
    is_published = Column(Boolean, default=False)
    instructor_id = Column(Integer, ForeignKey("users.id"))
    
    modules = relationship("Module", back_populates="course")
    enrollments = relationship("Enrollment", back_populates="course")

class Module(Base):
    __tablename__ = "modules"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    order = Column(Integer)
    course_id = Column(Integer, ForeignKey("courses.id"))
    
    course = relationship("Course", back_populates="modules")
    items = relationship("ContentItem", back_populates="module")

class ContentItem(Base):
    __tablename__ = "content_items"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    type = Column(String) 
    content = Column(String, nullable=True) 
    duration = Column(Integer, nullable=True)
    is_mandatory = Column(Boolean, default=False)
    order = Column(Integer)
    module_id = Column(Integer, ForeignKey("modules.id"))
    
    instructions = Column(Text, nullable=True) 
    test_config = Column(Text, nullable=True) 
    
    module = relationship("Module", back_populates="items")

class Enrollment(Base):
    __tablename__ = "enrollments"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    enrolled_at = Column(DateTime, default=datetime.utcnow)
    
    # New Columns for Free Trial
    enrollment_type = Column(String, default="paid") 
    expiry_date = Column(DateTime, nullable=True)    
    
    # ✅ FIX IS HERE: back_populates must match the variable name in the OTHER class
    student = relationship("User", back_populates="enrollments") 
    course = relationship("Course", back_populates="enrollments") 

class Submission(Base):
    __tablename__ = "submissions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content_item_id = Column(Integer, ForeignKey("content_items.id"))
    drive_link = Column(String)
    status = Column(String, default="Pending")
    submitted_at = Column(DateTime, default=datetime.utcnow)
    
    student = relationship("User", back_populates="submissions")
    assignment = relationship("ContentItem")
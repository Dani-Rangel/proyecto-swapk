from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AttachmentBase(BaseModel):
    file_url: str
    file_name: str
    file_size: Optional[int]

class CourseBase(BaseModel):
    title: str
    description: Optional[str] = None
    objective: Optional[str] = None
    skills: Optional[str] = None

class CourseCreate(CourseBase):
    category: str
    profession: str
    user_id: int
    image_url: Optional[str] = None

class Course(CourseBase):
    id: int
    category: str
    profession: str
    image_url: Optional[str]
    user_id: int
    is_online: bool
    created_at: datetime
    attachments: List[AttachmentBase] = []
    
    class Config:
        orm_mode = True
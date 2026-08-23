from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import Text
from sqlalchemy import DateTime
from datetime import datetime

from app.database.database import Base


class LogHistory(Base):

    __tablename__ = "log_history"

    id = Column(Integer, primary_key=True, index=True)

    filename = Column(String)

    threat = Column(String)

    severity = Column(String)

    total_detections = Column(Integer)

    ai_report = Column(Text)

    uploaded_at = Column(
        DateTime,
        default=datetime.utcnow,
    )
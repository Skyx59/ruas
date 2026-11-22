import os
from pathlib import Path
from typing import Literal

from pydantic import BaseModel


class Settings(BaseModel):
    db_path: Path = Path("data/ruas.sqlite3")
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"

    @classmethod
    def from_environment(cls) -> "Settings":
        return cls(
            db_path=Path(os.environ.get("RUAS_DB_PATH", "data/ruas.sqlite3")),
            log_level=os.environ.get("RUAS_LOG_LEVEL", "INFO").upper(),
        )

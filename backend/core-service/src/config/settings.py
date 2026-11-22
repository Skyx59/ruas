import os
import re
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, SecretStr, field_validator


class Settings(BaseModel):
    model_config = ConfigDict(hide_input_in_errors=True)

    db_path: Path = Path("data/ruas.sqlite3")
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = "INFO"
    jwt_secret: SecretStr

    @field_validator("jwt_secret")
    @classmethod
    def validate_secret(cls, secret: SecretStr) -> SecretStr:
        value = secret.get_secret_value()
        if not re.fullmatch(r"[0-9a-f]{64}", value) or len(set(value)) < 8:
            raise ValueError("RUAS_JWT_SECRET must be a random 32-byte key encoded as lowercase hex.")
        return secret

    @classmethod
    def from_environment(cls) -> "Settings":
        return cls(
            db_path=Path(os.environ.get("RUAS_DB_PATH", "data/ruas.sqlite3")),
            log_level=os.environ.get("RUAS_LOG_LEVEL", "INFO").upper(),
            jwt_secret=SecretStr(os.environ.get("RUAS_JWT_SECRET", "")),
        )

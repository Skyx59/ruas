import argparse
import re
import sqlite3
import sys
import warnings
from getpass import GetPassWarning, getpass

from src.config.database import initialize_database
from src.config.settings import Settings

from .models import Role
from .repository import UserRepository
from .security import PASSWORD_HASHER


def main() -> None:
    parser = argparse.ArgumentParser(description="Create a RUAS account in the configured database.")
    parser.add_argument("username", help="3–64 ASCII letters, digits, dots, underscores or hyphens")
    parser.add_argument("--role", choices=[role.value for role in Role], default=Role.USER.value)
    args = parser.parse_args()
    if not re.fullmatch(r"[A-Za-z0-9_.-]{3,64}", args.username):
        parser.error("Invalid username format.")
    if not sys.stdin.isatty():
        parser.error("Run this command in an interactive terminal.")
    with warnings.catch_warnings():
        warnings.simplefilter("error", GetPassWarning)
        try:
            password = getpass("Password: ")
            confirmation = getpass("Confirm password: ")
        except (EOFError, GetPassWarning, KeyboardInterrupt):
            parser.exit(1, "Password input cancelled or terminal echo could not be disabled.\n")
    if not 12 <= len(password) <= 128 or password != confirmation:
        parser.error("Use a matching password of 12–128 characters.")

    settings = Settings.from_environment()
    initialize_database(settings.db_path)
    repository = UserRepository(settings.db_path)
    try:
        user = repository.create(args.username, PASSWORD_HASHER.hash(password), Role(args.role))
    except sqlite3.IntegrityError as exc:
        if exc.sqlite_errorcode != sqlite3.SQLITE_CONSTRAINT_UNIQUE:
            raise
        parser.exit(1, "Username already exists.\n")
    print(f"Created {user.role.value} account: {user.username}")


if __name__ == "__main__":
    main()

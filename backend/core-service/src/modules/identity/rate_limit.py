from collections import deque
from collections.abc import Iterator
from contextlib import contextmanager
from math import ceil
from threading import Lock
from time import monotonic

from fastapi import HTTPException


class LoginLimiter:
    def __init__(self) -> None:
        self._attempts: deque[float] = deque()
        self._in_flight = 0
        self._lock = Lock()

    @contextmanager
    def attempt(self) -> Iterator[None]:
        with self._lock:
            now = monotonic()
            while self._attempts and now - self._attempts[0] >= 60:
                self._attempts.popleft()
            if len(self._attempts) >= 20:
                retry_after = max(1, ceil(60 - (now - self._attempts[0])))
            elif self._in_flight >= 2:
                retry_after = 1
            else:
                retry_after = None
            if retry_after is not None:
                raise HTTPException(
                    429, "Too many login attempts.", headers={"Retry-After": str(retry_after)}
                )
            self._attempts.append(now)
            self._in_flight += 1
        try:
            yield
        finally:
            with self._lock:
                self._in_flight -= 1

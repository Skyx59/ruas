FROM python:3.12-slim-trixie

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    RUAS_DB_PATH=/app/data/ruas.sqlite3

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --only-binary=:all: -r requirements.txt \
    && groupadd --gid 10001 ruas \
    && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin ruas \
    && install -d -o ruas -g ruas -m 0750 /app/data

COPY src/ ./src/
USER 10001:10001

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=4s --start-period=5s --start-interval=1s --retries=3 \
    CMD ["python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=3).close()"]

CMD ["uvicorn", "src.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000", "--no-proxy-headers"]

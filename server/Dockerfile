FROM python:3.11-slim

WORKDIR /app

# Copy required files
COPY ./server/requirements.txt .
COPY ./server/data/data.zip /app/data/data.zip
COPY ./server/scripts/ /app/scripts/
COPY ./server/src/ /app/app/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir pandas psycopg2-binary python-dotenv

# Set environment variables
ENV PYTHONPATH=/app

# Run initialization and application
CMD ["sh", "-c", "python scripts/db_init.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
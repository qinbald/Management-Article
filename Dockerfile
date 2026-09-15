# Gunakan image Python slim yang ringan
FROM python:3.10-slim

# Set environment variables
# Mencegah Python menulis file .pyc
ENV PYTHONDONTWRITEBYTECODE=1
# Mencegah Python mem-buffer stdout/stderr (log langsung muncul)
ENV PYTHONUNBUFFERED=1
# Set environment ke production
ENV FLASK_ENV=production

# Buat direktori kerja
WORKDIR /app

# Install dependensi sistem yang mungkin dibutuhkan (misal untuk pg8000/psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Salin requirements dan install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Salin seluruh kode backend
COPY . .

# Buat user non-root untuk keamanan
RUN adduser --disabled-password --gecos '' flaskuser
USER flaskuser

# Expose port 5000
EXPOSE 5000

# Jalankan aplikasi menggunakan Gunicorn (4 worker)
# run:app merujuk pada objek 'app' di dalam file 'run.py'
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--threads", "2", "run:app"]
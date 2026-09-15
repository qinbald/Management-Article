import os
from dotenv import load_dotenv

load_dotenv()

basedir = os.path.abspath(os.path.dirname(__file__))

def fix_db_url(url):
    if not url:
        return 'postgresql+pg8000://postgres:sandipostgres@localhost:5432/management_artikel'
    # Supabase gives postgres:// or postgresql:// without driver
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+pg8000://", 1)
    elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
        url = url.replace("postgresql://", "postgresql+pg8000://", 1)
    return url

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'sandirahasiaartikel_dev_key_change_in_prod'
    
    # Gunakan PostgreSQL (Supabase / Local)
    SQLALCHEMY_DATABASE_URI = fix_db_url(os.environ.get('DATABASE_URL'))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Cookie security
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    SESSION_COOKIE_SECURE = os.environ.get('FLASK_ENV') == 'production' or os.environ.get('COOKIE_SECURE', 'false').lower() in ['true', '1']
    PERMANENT_SESSION_LIFETIME = 86400  # 1 hari

    # Frontend URL untuk CORS & Verifikasi Email
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

    # Konfigurasi Email (Flask-Mail)
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() in ['true', 'on', '1']
    MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'false').lower() in ['true', 'on', '1']
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER') or MAIL_USERNAME
    MAIL_DEBUG = os.environ.get('MAIL_DEBUG', 'false').lower() in ['true', 'on', '1']

class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

class ProductionConfig(Config):
    DEBUG = False
    # Di production, pastikan DATABASE_URL diset
    SQLALCHEMY_DATABASE_URI = fix_db_url(os.environ.get('DATABASE_URL'))
import os

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'sandirahasiaartikel_dev_key_change_in_prod'
    
    # Gunakan PostgreSQL
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'postgresql+pg8000://postgres:sandipostgres@localhost:5432/management_artikel'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Cookie security
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = 86400  # 1 hari

class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

class ProductionConfig(Config):
    DEBUG = False
    # Di production, pastikan DATABASE_URL diset
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
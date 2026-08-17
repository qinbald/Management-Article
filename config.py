import os 

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'sandirahasiaartikel'
    SQLALCHEMY_DATABASE_URI =os.environ.get('management_artikel') or 'postgresql+pg8000://postgres:sandipostgre@localhost:5432/management_artikel'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class DevelopmentConfig(Config):
    DEBUG = True

class TestingConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///test.db'

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
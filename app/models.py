from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

##################################################### DAFTAR CLASS ###############################################
##################################################### DAFTAR CLASS ###############################################

########################### CLASS DATA USER ###########################
class User(db.Model):
    __tablename__ = "data_user"
    id = db.Column(db.Integer, primary_key = True)
    username = db.Column(db.String(255), nullable = False)
    email = db.Column(db.String(255), nullable = False)
    password = db.Column(db.String(255), nullable = False)
    role = db.Column(db.Enum('admin', 'user', name = 'role_types'), nullable = False, default = 'user')

########################### CLASS TABLE DATA ARTIKEL ###########################
class article_db(db.Model):
    __tablename__ = "article_db"
    id = db.Column(db.Integer,primary_key = True)
    title = db.Column(db.String(255), nullable = False)
    author = db.Column(db.String(255), nullable = False)
    description = db.Column(db.String(255), nullable = True)
    user_id = db.Column(db.Integer, db.ForeignKey("data_user.id"), nullable = False)

##################################################### DAFTAR CLASS ###############################################
##################################################### DAFTAR CLASS ###############################################
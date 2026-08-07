from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, SubmitField
from wtforms.validators import DataRequired
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_bcrypt import Bcrypt
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()
app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = "postgresql+pg8000://postgres:sandipostgre@localhost:5432/artikel_db"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True 

db.init_app(app)

##################################################### DAFTAR CLASS ###############################################
##################################################### DAFTAR CLASS ###############################################
########################### CLASS TABLE DATA ARTIKEL ###########################
class article_db(db.Model):
    id = db.Column(db.Integer,primary_key = True)
    title = db.Column(db.String(255), nullable = False)
    author = db.Column(db.String(255), nullable = False)
    description = db.Column(db.String(255), nullable = True)

########################### CLASS DATA USER ###########################
class User(db.Model):
    id = db.Column(db.Integer, primary_key = True)
    username = db.Column(db.String(255), nullable = False)
    email = db.Column(db.String(255), nullable = False)
    password = db.Column(db.String(255), nullable = False)

##################################################### DAFTAR CLASS ###############################################
##################################################### DAFTAR CLASS ###############################################


with app.app_context():
    db.create_all()

##################################################### LANDING PAGE WEBSITE
@app.route('/')
def index():
    # Ini akan otomatis mengarahkan user dari '/' ke '/home'
    return redirect(url_for('home'))

@app.route('/home')
def home():
    return render_template("index.html")

##################################################### FUNGSI MENAMBAHKAN ARTIKEL BARU
@app.route('/add_articel', methods = ['POST'])
def add_article():
    data = request.get_json()

    new_article = article_db(
        title = data.get('title'),
        author = data.get('author'),
        description = data.get('description')
    )
    db.session.add(new_article)
    db.session.commit()

    return jsonify({
        'success' : True,
        'messages' : "Data artikel berhasil ditambahkan",
        'data': {
            'id' : new_article.id,
            'title' : new_article.title,
            'author' : new_article.author,
            'description' : new_article.description
        }
    })

################################################################################ FUNGSI MENGHAPUS ARTIKEL
@app.route('/delete_article/<title>', methods = ['POST'])
def delete_article(title):
    select_title = article_db.query.filter_by(title=title).first_or_404("Artikel tidak ditemukan")
    db.session.delete(select_title)
    db.session.commit()
    return jsonify({
        'success' : True,
        'messages' : "Artikel dihapus"
    }), 200

############################################################################ FUNGSI MENCARI ARTIKEL BERDASARKAN JUDUL
@app.route('/get_title_or_author', methods = ['GET'])
def get_title():

    title = request.args.get('title')
    author = request.args.get('author')

    if title:
        title_data = article_db.query.filter_by(title=title).first_or_404()
        return jsonify({
            'success' : True,
            'title' : title_data.title,
            'author' : title_data.author
        })
    elif author:
        author_data = article_db.query.filter_by(author=author).first_or_404()

        return jsonify({
            'success' : True,
            'title' : author_data.title,
            'author' : author_data.author
        })
    else:
        return jsonify({
            'messages' : "Judul artikel atau penulis tidak ditemukan"
        }), 400

######################################################################### FUNGSI REGISTRASI
@app.route('/registrasi', methods = ['POST'])
def registrasi():
    data = request.get_json()
    hashed_pw = generate_password_hash(data['password'])
    user_info = User(username=data['username'], email=data['email'], password=hashed_pw)
    db.session.add(user_info)
    db.session.commit()

    return jsonify({
        'success' : True,
        'messsages' : "User berhasil ditambahkan"
    })


######################################################################### FUNGSI LOGIN 
@app.route('/login', methods = ['POST'])
def login():
    data = request.get_json()
    get_username = User.query.filter_by(username=data['username']).first()
    if get_username and check_password_hash(get_username.password, data['password']):
        return jsonify({"success" : True, "messages" : "Login berhasil"}), 200
    return jsonify({"success" : False, "messages" : "Username atau password salah"}), 401




######################################## RUN AND DEBUG ##########################################################
if __name__ == '__main__':
    app.run(debug=True)
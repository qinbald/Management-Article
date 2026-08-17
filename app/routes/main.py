from flask import Blueprint, redirect, url_for, render_template

# Blueprint mandiri tanpa url_prefix
main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    return redirect(url_for('main.home'))

@main_bp.route('/home')
def home():
    return render_template("index.html")

@main_bp.route('/login_page')
def login_page():
    # menampilkan halaman/form login
    return render_template("login.html")

@main_bp.route('/register_page')
def register_page():
    # halaman/form registrasi
    return render_template("register.html")

@main_bp.route('/artikel_page')
def artikel_page():
    # menampilkan daftar artikel
    return render_template("article_list.html")

@main_bp.route('/add_article')
def add_article():
    # halaman tambah artikel
    return render_template("add_article.html")

@main_bp.route('/admin_dashboard')
def admin_dashboard():
    # halaman dashboard admin (soon)
    return render_template("admin.html")

@main_bp.route('/user_profile')
def user_profile():
    return render_template("profile.html")
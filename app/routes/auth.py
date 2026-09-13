from flask import request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash 
from app.models import db, User
from . import blueprint_route

######################################################################### FUNGSI REGISTRASI
@blueprint_route.route('/registrasi', methods=['POST'])
def registrasi():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not username or not email or not password:
        return jsonify({
            'success': False,
            'messages': "Semua field (username, email, password) wajib diisi."
        }), 400

    if User.query.filter_by(username=username).first():
        return jsonify({
            'success': False,
            'messages': "Username sudah digunakan, silakan pilih username lain."
        }), 400

    if User.query.filter_by(email=email).first():
        return jsonify({
            'success': False,
            'messages': "Email sudah terdaftar, silakan gunakan email lain."
        }), 400

    # Role selalu 'user' default untuk keamanan, kecuali didaftarkan khusus
    hashed_pw = generate_password_hash(password)
    user_info = User(
        username=username, 
        email=email, 
        password=hashed_pw,
        role='user'
    )
    db.session.add(user_info)
    db.session.commit()

    return jsonify({
        'success': True,
        'messages': "Pendaftaran berhasil, silakan masuk."
    }), 201

######################################################################### FUNGSI LOGIN 
@blueprint_route.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({
            "success": False,
            "messages": "Username dan password wajib diisi."
        }), 400

    user = User.query.filter_by(username=username).first()
    
    if user and check_password_hash(user.password, password):
        session['user_id'] = user.id
        session['role'] = user.role
        session['username'] = user.username
        
        return jsonify({
            "success": True,
            "messages": "Login berhasil.", 
            "role": user.role
        }), 200
        
    return jsonify({
        "success": False,
        "messages": "Username atau password salah."
    }), 401

@blueprint_route.route('/api/logout', methods=['POST'])
def api_logout():
    session.clear()
    return jsonify({"success": True, "messages": "Logout berhasil."}), 200

@blueprint_route.route('/api/me', methods=['GET'])
def api_me():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({"success": False, "messages": "Not authenticated"}), 401
    
    user = User.query.get(user_id)
    if not user:
        session.clear()
        return jsonify({"success": False, "messages": "User not found"}), 401
        
    return jsonify({
        "success": True,
        "data": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role
        }
    }), 200
import os
from datetime import datetime, timedelta
from flask import request, jsonify, session, current_app
from werkzeug.security import generate_password_hash, check_password_hash 
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadTimeSignature
from flask_mail import Message
from app.models import db, User
from app import mail, limiter
from . import blueprint_route

def generate_verification_token(email):
    """Buat token bertanda tangan dengan itsdangerous."""
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return serializer.dumps(email, salt='email-verification-salt')

def verify_token(token, max_age=3600):
    """Verifikasi token. Default kadaluarsa 1 jam (3600 detik)."""
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        email = serializer.loads(token, salt='email-verification-salt', max_age=max_age)
        return email
    except (SignatureExpired, BadTimeSignature):
        return None

def send_verification_email(to_email, token):
    """Kirim email verifikasi nyata via Flask-Mail."""
    # Arahkan ke rute frontend Next.js
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    verification_link = f"{frontend_url}/verify/{token}"
    
    msg = Message(
        subject="[WikiArtikel] Verifikasi Akun Anda",
        recipients=[to_email],
        body=f"""Halo,

Terima kasih telah mendaftar di WikiArtikel!
Silakan klik tautan di bawah ini untuk memverifikasi alamat email dan mengaktifkan akun Anda:

{verification_link}

Tautan ini hanya berlaku selama 1 jam.

Jika Anda tidak merasa mendaftar akun di WikiArtikel, abaikan email ini.
"""
    )
    # Jika kredensial belum diset di development, abaikan pengiriman agar tidak crash
    if current_app.config.get('MAIL_USERNAME'):
        mail.send(msg)
    else:
        print(f"\n[DEV MODE EMAIL] Verification link for {to_email}:\n{verification_link}\n")

######################################################################### FUNGSI REGISTRASI
@blueprint_route.route('/registrasi', methods=['POST'])
@limiter.limit("5 per minute")
def registrasi():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not username or not email or not password:
        return jsonify({
            'success': False,
            'messages': "Semua field (username, email, password) wajib diisi."
        }), 400

    # Pesan generik untuk mencegah User Enumeration
    generic_success_msg = "Jika data valid dan belum terdaftar, tautan verifikasi telah dikirimkan ke email Anda."

    existing_user = User.query.filter((User.username == username) | (User.email == email)).first()
    if existing_user:
        # Jika user sudah ada tapi belum verifikasi, kita bisa kirim ulang token secara diam-diam
        # Jika sudah verifikasi, abaikan (jangan beri tahu penyerang)
        if not existing_user.is_verified:
            if not existing_user.last_email_sent or (datetime.utcnow() - existing_user.last_email_sent) > timedelta(minutes=2):
                existing_user.last_email_sent = datetime.utcnow()
                db.session.commit()
                token = generate_verification_token(existing_user.email)
                try:
                    send_verification_email(existing_user.email, token)
                except Exception as e:
                    current_app.logger.error(f"Gagal mengirim email verifikasi ulang: {e}")
        return jsonify({'success': True, 'messages': generic_success_msg}), 201

    hashed_pw = generate_password_hash(password)
    user_info = User(
        username=username, 
        email=email, 
        password=hashed_pw,
        role='user',
        is_verified=False
    )
    user_info.last_email_sent = datetime.utcnow()
    
    db.session.add(user_info)
    db.session.commit()

    token = generate_verification_token(email)
    try:
        send_verification_email(email, token)
    except Exception as e:
        current_app.logger.error(f"Gagal mengirim email verifikasi: {e}")

    return jsonify({
        'success': True,
        'messages': generic_success_msg
    }), 201

######################################################################### VERIFIKASI TOKEN
@blueprint_route.route('/api/auth/verify/<token>', methods=['GET'])
@limiter.limit("10 per minute")
def verify_email_api(token):
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        email = serializer.loads(token, salt='email-verification-salt', max_age=3600)
    except SignatureExpired:
        return jsonify({'success': False, 'messages': 'Token sudah kedaluwarsa. Silakan minta tautan baru.'}), 400
    except BadTimeSignature:
        return jsonify({'success': False, 'messages': 'Token tidak valid.'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'success': False, 'messages': 'Token tidak valid.'}), 400

    # Single-Use Token: Tolak jika sudah terverifikasi
    if user.is_verified:
        return jsonify({
            'success': False,
            'messages': 'Token sudah digunakan atau tidak valid.'
        }), 400

    user.is_verified = True
    db.session.commit()

    return jsonify({
        'success': True,
        'messages': 'Email berhasil diverifikasi! Akun Anda kini aktif.'
    }), 200

######################################################################### KIRIM ULANG VERIFIKASI (RATE LIMITED)
@blueprint_route.route('/api/auth/resend-verification', methods=['POST'])
@limiter.limit("3 per minute")
def resend_verification_api():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()

    if not email:
        return jsonify({'success': False, 'messages': 'Email wajib diisi.'}), 400

    generic_msg = "Jika email terdaftar dan belum diverifikasi, tautan baru telah dikirim."

    user = User.query.filter_by(email=email).first()
    if not user or user.is_verified:
        # Jangan beri tahu penyerang apakah email ada atau sudah diverifikasi
        return jsonify({'success': True, 'messages': generic_msg}), 200

    # Rate Limiting internal
    if user.last_email_sent:
        elapsed = datetime.utcnow() - user.last_email_sent
        if elapsed < timedelta(minutes=2):
            return jsonify({'success': True, 'messages': generic_msg}), 200

    user.last_email_sent = datetime.utcnow()
    db.session.commit()

    token = generate_verification_token(user.email)
    try:
        send_verification_email(user.email, token)
    except Exception as e:
        current_app.logger.error(f"Gagal mengirim ulang email: {e}")

    return jsonify({'success': True, 'messages': generic_msg}), 200

######################################################################### FUNGSI LOGIN 
@blueprint_route.route('/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({
            "success": False,
            "messages": "Kredensial tidak valid."
        }), 400

    user = User.query.filter_by(username=username).first()
    
    if user and check_password_hash(user.password, password):
        if not user.is_verified:
            return jsonify({
                "success": False,
                "messages": "Kredensial tidak valid atau akun belum diverifikasi."
            }), 401

        if user.is_blocked:
            return jsonify({
                "success": False,
                "messages": "Kredensial tidak valid atau akun diblokir."
            }), 401

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
            "role": user.role,
            "warning_count": user.warning_count,
            "last_warning_message": user.last_warning_message
        }
    }), 200
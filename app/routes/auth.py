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
    if current_app.config.get('MAIL_USERNAME'):
        mail.send(msg)
    else:
        print(f"\n[DEV MODE EMAIL] Verification link for {to_email}:\n{verification_link}\n")

def generate_reset_token(user):
    """Buat token reset password bertanda tangan (Single-Use via pw signature)."""
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    # Embed signature password saat ini: jika password berubah, token lama otomatis invalid
    payload = {
        'email': user.email,
        'pw_sig': user.password[:16]
    }
    return serializer.dumps(payload, salt='password-reset-salt')

def verify_reset_token(token, max_age=900):
    """Verifikasi token reset password. Berlaku 15 menit (900 detik)."""
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        data = serializer.loads(token, salt='password-reset-salt', max_age=max_age)
        email = data.get('email')
        pw_sig = data.get('pw_sig')
        
        user = User.query.filter_by(email=email).first()
        if not user:
            return None
        # Single-Use validation: Jika password sudah berubah, tolak
        if user.password[:16] != pw_sig:
            return None
        return user
    except (SignatureExpired, BadTimeSignature):
        return None

def send_reset_password_email(to_email, token):
    """Kirim email instruksi reset password dengan template HTML responsif."""
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
    reset_link = f"{frontend_url}/reset-password/{token}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }}
        .container {{ max-width: 540px; margin: 40px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
        .header {{ background-color: #059669; padding: 24px; text-align: center; color: #ffffff; }}
        .content {{ padding: 32px 24px; color: #334155; line-height: 1.6; font-size: 15px; }}
        .button {{ display: inline-block; background-color: #059669; color: #ffffff !important; text-decoration: none; padding: 12px 32px; border-radius: 9999px; font-weight: bold; margin: 24px 0; }}
        .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2 style="margin:0; font-size: 20px;">WikiArtikel</h2>
        </div>
        <div class="content">
          <p>Halo,</p>
          <p>Kami menerima permintaan untuk mereset kata sandi akun WikiArtikel Anda.</p>
          <div style="text-align: center;">
            <a href="{reset_link}" class="button">Atur Ulang Kata Sandi</a>
          </div>
          <p>Tautan ini hanya berlaku selama <strong>15 menit</strong> dan hanya dapat digunakan satu kali.</p>
          <p style="font-size: 13px; color: #64748b;">Jika Anda tidak meminta pengaturan ulang kata sandi, abaikan email ini. Akun Anda tetap aman.</p>
        </div>
        <div class="footer">
          &copy; WikiArtikel. Seluruh hak cipta dilindungi.
        </div>
      </div>
    </body>
    </html>
    """

    msg = Message(
        subject="[WikiArtikel] Permintaan Reset Kata Sandi",
        recipients=[to_email],
        body=f"Gunakan tautan berikut untuk mereset kata sandi Anda (berlaku 15 menit): {reset_link}",
        html=html_content
    )

    if current_app.config.get('MAIL_USERNAME'):
        mail.send(msg)
    else:
        print(f"\n[DEV MODE EMAIL] Reset password link for {to_email}:\n{reset_link}\n")

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

######################################################################### LUPA PASSWORD
@blueprint_route.route('/api/auth/forgot-password', methods=['POST'])
@limiter.limit("3 per minute")
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()

    # Pesan generik anti-User Enumeration — selalu 200
    GENERIC_MSG = "Jika email terdaftar, instruksi reset telah dikirim."

    if not email:
        return jsonify({'success': True, 'messages': GENERIC_MSG}), 200

    user = User.query.filter_by(email=email).first()
    if not user or not user.is_verified:
        return jsonify({'success': True, 'messages': GENERIC_MSG}), 200

    # Rate limit internal: 1 email per 2 menit per user
    if user.last_email_sent:
        elapsed = datetime.utcnow() - user.last_email_sent
        if elapsed < timedelta(minutes=2):
            return jsonify({'success': True, 'messages': GENERIC_MSG}), 200

    user.last_email_sent = datetime.utcnow()
    db.session.commit()

    token = generate_reset_token(user)
    try:
        send_reset_password_email(user.email, token)
    except Exception as e:
        current_app.logger.error(f"Gagal mengirim email reset password: {e}")

    return jsonify({'success': True, 'messages': GENERIC_MSG}), 200


######################################################################### RESET PASSWORD
@blueprint_route.route('/api/auth/reset-password/<token>', methods=['POST'])
@limiter.limit("5 per minute")
def reset_password(token):
    data = request.get_json() or {}
    new_password = data.get('password', '')

    if not new_password or len(new_password) < 8:
        return jsonify({'success': False, 'messages': 'Password minimal 8 karakter.'}), 400

    user = verify_reset_token(token)
    if not user:
        return jsonify({'success': False, 'messages': 'Token tidak valid atau sudah kedaluwarsa.'}), 400

    # Hash password baru dan simpan — ini otomatis invalidasi token lama (single-use)
    user.password = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({'success': True, 'messages': 'Kata sandi berhasil diperbarui. Silakan login.'}), 200
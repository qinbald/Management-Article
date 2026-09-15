from flask import Flask, jsonify, request
from app.models import db, User
from flask_migrate import Migrate
from flask_cors import CORS
from flask_mail import Mail
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from datetime import datetime, timedelta

migrate = Migrate()
mail = Mail()
limiter = Limiter(key_func=get_remote_address, default_limits=["200 per day", "50 per hour"])

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')

    # Enable CORS for Next.js frontend (default port 3000)
    CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

    db.init_app(app)
    migrate.init_app(app, db)
    mail.init_app(app)
    limiter.init_app(app)

    from app.routes import blueprint_route
    from app.routes.main import main_bp
    from app.routes.analytics import analytics_bp
    app.register_blueprint(blueprint_route)
    app.register_blueprint(main_bp)
    app.register_blueprint(analytics_bp)

    # ── CLI Command: Cleanup Unverified Users ───────────────────────
    @app.cli.command("clean-unverified")
    def clean_unverified():
        """Hapus user is_verified=False yang usianya > 1 jam."""
        threshold = datetime.utcnow() - timedelta(hours=1)
        deleted = User.query.filter(User.is_verified == False, User.created_at < threshold).delete()
        db.session.commit()
        print(f"Berhasil menghapus {deleted} akun belum terverifikasi yang kedaluwarsa.")

    # ── Centralized error handlers ──────────────────────────────────
    @app.errorhandler(429)
    def ratelimit_handler(e):
        return jsonify({'success': False, 'messages': 'Terlalu banyak permintaan. Coba lagi nanti.'}), 429
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({'success': False, 'message': 'Permintaan tidak valid.'}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({'success': False, 'message': 'Login diperlukan.'}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({'success': False, 'message': 'Akses ditolak.'}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'success': False, 'message': 'Resource tidak ditemukan.'}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({'success': False, 'message': 'Terjadi kesalahan server.'}), 500

    return app
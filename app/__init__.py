from flask import Flask, jsonify, request
from app.models import db
from flask_migrate import Migrate
from flask_cors import CORS

migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')

    # Enable CORS for Next.js frontend (default port 3000)
    CORS(app, supports_credentials=True, origins=["http://localhost:3000"])

    db.init_app(app)
    migrate.init_app(app, db)

    from app.routes import blueprint_route
    from app.routes.main import main_bp
    from app.routes.analytics import analytics_bp
    app.register_blueprint(blueprint_route)
    app.register_blueprint(main_bp)
    app.register_blueprint(analytics_bp)

    # ── Centralized error handlers ──────────────────────────────────
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
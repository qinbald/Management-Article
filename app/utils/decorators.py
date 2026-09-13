"""Reusable auth decorators for route protection."""
from functools import wraps
from flask import session, jsonify


def login_required(f):
    """Tolak request jika user belum login."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('user_id'):
            return jsonify({'success': False, 'message': 'Login diperlukan.'}), 401
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    """Tolak request jika user bukan admin."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('user_id'):
            return jsonify({'success': False, 'message': 'Login diperlukan.'}), 401
        if session.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Akses admin diperlukan.'}), 403
        return f(*args, **kwargs)
    return decorated

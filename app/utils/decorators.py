"""Reusable auth decorators for route protection."""
from functools import wraps
from flask import session, jsonify, request, redirect, url_for


def login_required(f):
    """Tolak request jika user belum login."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('user_id'):
            # API request → JSON, browser request → redirect
            if request.is_json or request.path.startswith('/api/'):
                return jsonify({'success': False, 'message': 'Login diperlukan.'}), 401
            return redirect(url_for('main.login_page'))
        return f(*args, **kwargs)
    return decorated


def admin_required(f):
    """Tolak request jika user bukan admin."""
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get('user_id'):
            if request.is_json or request.path.startswith('/api/'):
                return jsonify({'success': False, 'message': 'Login diperlukan.'}), 401
            return redirect(url_for('main.login_page'))
        if session.get('role') != 'admin':
            return jsonify({'success': False, 'message': 'Akses admin diperlukan.'}), 403
        return f(*args, **kwargs)
    return decorated

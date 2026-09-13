from flask import jsonify
from app.models import User, Article, ReadingSession, VisitLog, db
from app.utils.decorators import admin_required
from . import blueprint_route

@blueprint_route.route('/admin_dashboard', methods=['GET', 'POST'])
@admin_required
def admin_dashboard_api():
    """Endpoint API admin untuk mengambil daftar user dan statistik sistem."""
    semua_user = User.query.order_by(User.id.asc()).all()
    list_user = [{
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': user.role,
        'created_at': user.created_at.strftime('%Y-%m-%d') if hasattr(user, 'created_at') and user.created_at else '-'
    } for user in semua_user]
    
    total_articles = Article.query.count()
    total_users = len(list_user)
    
    return jsonify({
        'success': True,
        'messages': "Data dashboard admin berhasil dimuat.",
        'stats': {
            'total_users': total_users,
            'total_articles': total_articles,
        },
        'data': list_user
    }), 200



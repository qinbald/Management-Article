from app.models import User, Article, Notification, db
from . import blueprint_route
from app.utils.decorators import login_required
from flask import session, jsonify

@blueprint_route.route('/api/notifications', methods=['GET'])
@login_required
def get_notifications():
    user_id = session.get('user_id')
    notifs = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    
    list_notif = [{
        'id': n.id,
        'title': n.title,
        'message': n.message,
        'type': n.type,
        'is_read': n.is_read,
        'created_at': n.created_at.strftime('%Y-%m-%d %H:%M')
    } for n in notifs]
    
    unread_count = sum(1 for n in notifs if not n.is_read)
    
    return jsonify({
        'success': True,
        'data': list_notif,
        'unread_count': unread_count
    })

@blueprint_route.route('/api/notifications/<int:notif_id>/read', methods=['POST'])
@login_required
def read_notification(notif_id):
    user_id = session.get('user_id')
    notif = Notification.query.filter_by(id=notif_id, user_id=user_id).first_or_404()
    notif.is_read = True
    db.session.commit()
    return jsonify({'success': True})

@blueprint_route.route('/api/notifications/read-all', methods=['POST'])
@login_required
def read_all_notifications():
    user_id = session.get('user_id')
    Notification.query.filter_by(user_id=user_id, is_read=False).update({'is_read': True})
    db.session.commit()
    return jsonify({'success': True})

@blueprint_route.route('/profil_user', methods=['GET'])
@login_required
def profil_user():
    user_id = session.get('user_id')
    user = User.query.get_or_404(user_id)

    articles = Article.query.filter_by(user_id=user.id).order_by(Article.published_at.desc()).all()
    list_article = [{
        'id': art.id,
        'title': art.title,
        'category': art.category,
        'published_at': art.published_at.strftime('%Y-%m-%d') if art.published_at else '-'
    } for art in articles]

    return jsonify({
        'success': True,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role,
            'warning_count': user.warning_count,
            'total_articles': len(list_article)
        },
        'articles': list_article
    })

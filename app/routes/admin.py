from flask import jsonify, request
from app.models import User, Article, ReadingSession, VisitLog, Notification, db
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
        'is_blocked': user.is_blocked,
        'warning_count': user.warning_count,
        'created_at': user.created_at.strftime('%Y-%m-%d') if hasattr(user, 'created_at') and user.created_at else '-'
    } for user in semua_user]
    
    semua_artikel = Article.query.order_by(Article.id.desc()).all()
    list_artikel = [{
        'id': art.id,
        'title': art.title,
        'author': art.author,
        'is_locked': art.is_locked,
        'published_at': art.published_at.strftime('%Y-%m-%d') if art.published_at else '-'
    } for art in semua_artikel]
    
    total_articles = len(list_artikel)
    total_users = len(list_user)
    
    return jsonify({
        'success': True,
        'messages': "Data dashboard admin berhasil dimuat.",
        'stats': {
            'total_users': total_users,
            'total_articles': total_articles,
        },
        'data': {
            'users': list_user,
            'articles': list_artikel
        }
    }), 200


############################################################################ ADMIN: MANAJEMEN ARTIKEL
@blueprint_route.route('/api/admin/articles/<int:article_id>/toggle-lock', methods=['POST'])
@admin_required
def admin_toggle_lock(article_id):
    article = Article.query.get_or_404(article_id)
    article.is_locked = not article.is_locked
    db.session.commit()
    status = "dikunci" if article.is_locked else "dibuka"
    return jsonify({'success': True, 'messages': f'Artikel berhasil {status}.'}), 200

@blueprint_route.route('/api/admin/articles/<int:article_id>', methods=['DELETE'])
@admin_required
def admin_delete_article(article_id):
    article = Article.query.get_or_404(article_id)
    db.session.delete(article)
    db.session.commit()
    return jsonify({'success': True, 'messages': 'Artikel berhasil dihapus.'}), 200


############################################################################ ADMIN: MANAJEMEN PENGGUNA
@blueprint_route.route('/api/admin/users/<int:user_id>/warn', methods=['POST'])
@admin_required
def admin_warn_user(user_id):
    user = User.query.get_or_404(user_id)
    if user.role == 'admin':
        return jsonify({'success': False, 'messages': 'Tidak bisa memberi peringatan ke admin.'}), 403
    
    data = request.get_json() or {}
    reason = data.get('reason', '').strip()
    
    user.warning_count += 1
    user.last_warning_message = reason if reason else f"Peringatan ke-{user.warning_count} dari admin."
    
    if user.warning_count >= 3:
        user.is_blocked = True
        msg = f'Peringatan dikirim. Akun otomatis diblokir karena mencapai {user.warning_count} peringatan.'
    else:
        msg = f'Peringatan dikirim. Total peringatan: {user.warning_count}'
        
    # Buat notifikasi permanen
    notif = Notification(
        user_id=user.id,
        title=f"Peringatan Akun ({user.warning_count}/3)",
        message=reason if reason else "Anda mendapat peringatan dari admin.",
        type="warning"
    )
    db.session.add(notif)
        
    db.session.commit()
    return jsonify({'success': True, 'messages': msg}), 200

@blueprint_route.route('/api/admin/users/<int:user_id>/reduce-warning', methods=['POST'])
@admin_required
def admin_reduce_warning(user_id):
    user = User.query.get_or_404(user_id)
    if user.warning_count <= 0:
        return jsonify({'success': False, 'messages': 'Tidak ada peringatan untuk dikurangi.'}), 400
    user.warning_count -= 1
    if user.warning_count == 0:
        user.last_warning_message = None
    # auto-unblock jika sebelumnya terblokir karena 3 peringatan
    if user.warning_count < 3 and user.is_blocked:
        user.is_blocked = False
    notif = Notification(
        user_id=user.id,
        title="Peringatan Dikurangi",
        message=f"Admin mengurangi peringatan Anda. Sisa peringatan: {user.warning_count}",
        type="success"
    )
    db.session.add(notif)
    db.session.commit()
    return jsonify({'success': True, 'messages': f'Peringatan dikurangi. Sisa: {user.warning_count}'}), 200

@blueprint_route.route('/api/admin/users/<int:user_id>/clear-warnings', methods=['POST'])
@admin_required
def admin_clear_warnings(user_id):
    user = User.query.get_or_404(user_id)
    if user.warning_count == 0:
        return jsonify({'success': False, 'messages': 'Tidak ada peringatan untuk dihapus.'}), 400
    user.warning_count = 0
    user.last_warning_message = None
    user.is_blocked = False
    notif = Notification(
        user_id=user.id,
        title="Peringatan Dihapus",
        message="Semua peringatan Anda telah dihapus oleh admin.",
        type="success"
    )
    db.session.add(notif)
    db.session.commit()
    return jsonify({'success': True, 'messages': 'Semua peringatan berhasil dihapus.'}), 200

@blueprint_route.route('/api/admin/users/<int:user_id>/toggle-block', methods=['POST'])
@admin_required
def admin_toggle_block(user_id):
    user = User.query.get_or_404(user_id)
    if user.role == 'admin':
        return jsonify({'success': False, 'messages': 'Tidak bisa memblokir admin.'}), 403
    user.is_blocked = not user.is_blocked
    db.session.commit()
    status = "diblokir" if user.is_blocked else "diaktifkan kembali"
    return jsonify({'success': True, 'messages': f'Akun berhasil {status}.'}), 200

@blueprint_route.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@admin_required
def admin_delete_user(user_id):
    user = User.query.get_or_404(user_id)
    if user.role == 'admin':
        return jsonify({'success': False, 'messages': 'Tidak bisa menghapus admin.'}), 403
    db.session.delete(user)
    db.session.commit()
    return jsonify({'success': True, 'messages': 'Pengguna berhasil dihapus.'}), 200



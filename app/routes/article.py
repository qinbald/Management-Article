import uuid
from datetime import datetime, timedelta
from flask import jsonify, request, session
from app.models import Article, User, ReadingSession, db
from app.utils.decorators import login_required, admin_required
from . import blueprint_route
from app.services.wikipediaapi import search_wiki, get_wiki_summary, fetch_and_store_wiki

##################################################### FUNGSI MENAMBAHKAN ARTIKEL BARU
@blueprint_route.route('/add_articel', methods=['POST'])
@login_required
def add_article():
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    description = data.get('description', '').strip()
    category = data.get('category', 'Umum').strip()
    
    if not title:
        return jsonify({'success': False, 'messages': 'Judul artikel wajib diisi.'}), 400
        
    user_id = session.get('user_id')
    user = User.query.get(user_id)
    author_name = user.username if user else data.get('author', 'Anonim')

    new_article = Article(
        title=title,
        author=author_name,
        category=category,
        description=description,
        user_id=user_id
    )
    db.session.add(new_article)
    db.session.commit()

    return jsonify({
        'success': True,
        'messages': "Data artikel berhasil ditambahkan",
        'data': {
            'id': new_article.id,
            'title': new_article.title,
            'author': new_article.author,
            'category': new_article.category,
            'description': new_article.description
        }
    }), 201

################################################################################ FUNGSI MENGHAPUS ARTIKEL
@blueprint_route.route('/delete_article/<int:article_id>', methods=['POST', 'DELETE'])
@login_required
def delete_article_by_id(article_id):
    article = Article.query.get_or_404(article_id)
    current_user_id = session.get('user_id')
    current_role = session.get('role')

    # Hanya pemilik artikel atau admin yang boleh menghapus
    if current_role != 'admin' and article.user_id != current_user_id:
        return jsonify({
            'success': False,
            'messages': "Anda tidak memiliki izin untuk menghapus artikel ini."
        }), 403

    db.session.delete(article)
    db.session.commit()
    return jsonify({
        'success': True,
        'messages': "Artikel berhasil dihapus."
    }), 200

# Legacy route delete by title (dipertahankan untuk kompatibilitas sementara)
@blueprint_route.route('/delete_article/<title>', methods=['POST'])
@login_required
def delete_article(title):
    article = Article.query.filter_by(title=title).first_or_404()
    current_user_id = session.get('user_id')
    current_role = session.get('role')

    if current_role != 'admin' and article.user_id != current_user_id:
        return jsonify({
            'success': False,
            'messages': "Hanya admin atau pemilik artikel yang bisa menghapus artikel."
        }), 403

    db.session.delete(article)
    db.session.commit()
    return jsonify({
        'success': True,
        'messages': "Artikel dihapus"
    }), 200

############################################################################ FUNGSI MENGAMBIL SEMUA ARTIKEL
@blueprint_route.route('/get_articles', methods=['GET']) 
def get_articles():
    query_str = request.args.get('q', '').strip()
    title = request.args.get('title', '').strip()
    author = request.args.get('author', '').strip()
    category = request.args.get('category', '').strip()
    limit = request.args.get('limit', 50, type=int)

    query = Article.query

    if query_str:
        query = query.filter(Article.title.ilike(f'%{query_str}%') | Article.description.ilike(f'%{query_str}%'))
    if title:
        query = query.filter(Article.title.ilike(f'%{title}%'))
    if author:
        query = query.filter(Article.author.ilike(f'%{author}%'))
    if category and category != 'Semua':
        query = query.filter_by(category=category)

    articles = query.order_by(Article.published_at.desc()).limit(limit).all()
    
    list_artikel = [{
        'id': art.id,
        'title': art.title,
        'author': art.author,
        'category': art.category,
        'description': art.description,
        'published_at': art.published_at.strftime('%Y-%m-%d %H:%M:%S') if art.published_at else None
    } for art in articles]

    return jsonify({
        'success': True,
        'data': list_artikel
    })

@blueprint_route.route('/api/articles/<int:article_id>', methods=['GET'])
def get_article_by_id(article_id):
    article = Article.query.get_or_404(article_id)
    return jsonify({
        'success': True,
        'data': {
            'id': article.id,
            'title': article.title,
            'author': article.author,
            'category': article.category,
            'description': article.description,
            'published_at': article.published_at.strftime('%Y-%m-%d %H:%M:%S') if article.published_at else None
        }
    })

############################################################################ REAL-TIME READING TRACKING API
@blueprint_route.route('/api/articles/<int:article_id>/reading/start', methods=['POST'])
def tracking_start(article_id):
    """Mulai sesi membaca artikel."""
    article = Article.query.get_or_404(article_id)
    data = request.get_json() or {}
    
    visitor_id = data.get('visitor_id') or str(uuid.uuid4())
    session_id = str(uuid.uuid4())
    referrer = data.get('referrer_source', 'Langsung')
    user_id = session.get('user_id')

    rs = ReadingSession(
        article_id=article.id,
        user_id=user_id,
        visitor_id=visitor_id,
        session_id=session_id,
        started_at=datetime.utcnow(),
        last_seen_at=datetime.utcnow(),
        active_seconds=0,
        max_scroll_depth=0,
        interaction_count=0,
        is_bounce=True,
        referrer_source=referrer
    )
    db.session.add(rs)
    db.session.commit()

    return jsonify({
        'success': True,
        'session_id': session_id,
        'visitor_id': visitor_id
    }), 201

@blueprint_route.route('/api/articles/<int:article_id>/reading/heartbeat', methods=['POST'])
def tracking_heartbeat(article_id):
    """Update heartbeat durasi aktif & scroll depth."""
    data = request.get_json() or {}
    session_id = data.get('session_id')
    if not session_id:
        return jsonify({'success': False, 'message': 'session_id wajib.'}), 400

    rs = ReadingSession.query.filter_by(session_id=session_id, article_id=article_id).first()
    if not rs:
        return jsonify({'success': False, 'message': 'Sesi tidak ditemukan.'}), 404

    now = datetime.utcnow()
    # Batasi delta maksimal 30 detik untuk cegah manipulasi durasi
    delta_seconds = min(int((now - rs.last_seen_at).total_seconds()), 30)
    if delta_seconds > 0 and data.get('is_visible', True):
        rs.active_seconds += delta_seconds

    rs.last_seen_at = now
    
    scroll_depth = max(0, min(100, int(data.get('max_scroll_depth', rs.max_scroll_depth))))
    if scroll_depth > rs.max_scroll_depth:
        rs.max_scroll_depth = scroll_depth

    interactions = int(data.get('interaction_count', rs.interaction_count))
    if interactions > rs.interaction_count:
        rs.interaction_count = interactions

    # Bounce check: active < 10 AND interactions == 0 AND scroll < 20
    rs.is_bounce = (rs.active_seconds < 10) and (rs.interaction_count == 0) and (rs.max_scroll_depth < 20)
    
    db.session.commit()
    return jsonify({'success': True, 'active_seconds': rs.active_seconds})

@blueprint_route.route('/api/articles/<int:article_id>/reading/end', methods=['POST'])
def tracking_end(article_id):
    """Tutup sesi membaca."""
    data = request.get_json() or {}
    session_id = data.get('session_id')
    if not session_id:
        return jsonify({'success': False}), 400

    rs = ReadingSession.query.filter_by(session_id=session_id, article_id=article_id).first()
    if rs:
        rs.ended_at = datetime.utcnow()
        rs.last_seen_at = datetime.utcnow()
        db.session.commit()
        
    return jsonify({'success': True})

@blueprint_route.route('/api/articles/<int:article_id>/active_readers', methods=['GET'])
def get_active_readers(article_id):
    """Ambil jumlah pembaca aktif saat ini (last_seen_at >= now - 45s)."""
    threshold = datetime.utcnow() - timedelta(seconds=45)
    count = db.session.query(db.func.count(db.distinct(ReadingSession.session_id))).\
        filter(ReadingSession.article_id == article_id, ReadingSession.last_seen_at >= threshold).scalar()
    
    return jsonify({'success': True, 'active_readers': count or 0})

############################################################################ FUNGSI WIKIPEDIA API
@blueprint_route.route('/api/wiki/search', methods=['GET'])
def api_wiki_search():
    """Endpoint untuk mencari topik di Wikipedia."""
    query = request.args.get('q', '').strip()
    lang = request.args.get('lang', 'id')
    limit = request.args.get('limit', 5, type=int)
    
    if not query:
        return jsonify({'success': False, 'message': 'Query pencarian kosong.'}), 400
        
    results = search_wiki(query, lang=lang, limit=limit)
    return jsonify({'success': True, 'data': results})

@blueprint_route.route('/api/wiki/preview', methods=['GET'])
def api_wiki_preview():
    """Endpoint untuk mendapatkan ringkasan artikel Wikipedia."""
    title = request.args.get('title', '').strip()
    lang = request.args.get('lang', 'id')
    
    if not title:
        return jsonify({'success': False, 'message': 'Judul artikel kosong.'}), 400
        
    summary = get_wiki_summary(title, lang=lang)
    if not summary:
        return jsonify({'success': False, 'message': 'Artikel tidak ditemukan di Wikipedia.'}), 404
        
    return jsonify({'success': True, 'data': summary})

@blueprint_route.route('/api/wiki/import', methods=['POST'])
@login_required
def api_wiki_import():
    """Endpoint untuk mengimpor artikel Wikipedia ke database."""
    data = request.get_json() or {}
    title = data.get('title', '').strip()
    category = data.get('category', 'Umum')
    lang = data.get('lang', 'id')
    full_text = data.get('full_text', False)
    
    if not title:
        return jsonify({'success': False, 'message': 'Judul artikel kosong.'}), 400
        
    user_id = session.get('user_id')
    
    result = fetch_and_store_wiki(
        topic_title=title,
        category_name=category,
        user_id=user_id,
        lang=lang,
        full_text=full_text
    )
    
    status_code = 200 if result.get('success') else 400
    if result.get('action') == 'not_found':
        status_code = 404
        
    return jsonify(result), status_code
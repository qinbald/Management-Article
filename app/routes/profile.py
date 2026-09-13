from app.models import User, Article
from . import blueprint_route
from app.utils.decorators import login_required
from flask import session, jsonify

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
            'total_articles': len(list_article)
        },
        'articles': list_article
    })

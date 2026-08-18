from app.models import User, article_db
from . import blueprint_route
from flask import session, jsonify

@blueprint_route.route('/profil_user', methods = ['POST'])
def profil_user():
    user_id = session.get('user_id')

    if not user_id:
        return jsonify ({
            'success':False,
            'messages': "Silakan login terlebih dahulu"
        }), 400

    user = User.query.filter_by(id = user_id).first_or_404()

    article = article_db.query.filter_by(user_id= user.id).all()

    list_article = []
    for art in article:
        list_article.append({
            'title': art.title
        })

    return jsonify({
        'success': True,
        'user' : {
            'id':user.id,
            'username':user.username,
            'role':user.role
        },
        'article': list_article
    })
     





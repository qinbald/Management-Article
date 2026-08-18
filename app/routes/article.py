from flask import jsonify, request, session
from app.models import article_db, User
from app.models import db
from . import blueprint_route

##################################################### FUNGSI MENAMBAHKAN ARTIKEL BARU
@blueprint_route.route('/add_articel', methods = ['POST'])
def add_article():
    data = request.get_json()
    user_id = session.get('user_id')
    new_article = article_db(
        title = data.get('title'),
        author = data.get('author'),
        description = data.get('description'),
        user_id = user_id
    )
    db.session.add(new_article)
    db.session.commit()

    return jsonify({
        'success' : True,
        'messages' : "Data artikel berhasil ditambahkan",
        'data': {
            'id' : new_article.id,
            'title' : new_article.title,
            'author' : new_article.author,
            'description' : new_article.description
        }
    })

################################################################################ FUNGSI MENGHAPUS ARTIKEL
@blueprint_route.route('/delete_article/<title>', methods = ['POST'])
def delete_article(title):
    select_title = article_db.query.filter_by(title=title).first_or_404("Artikel tidak ditemukan")
    role = session.get('role')
    if select_title and role == 'admin':
        db.session.delete(select_title)
        db.session.commit()
        return jsonify({
            'success' : True,
            'messages' : "Artikel dihapus"
        }), 200
    return jsonify({
        'success': False,
        'messages': "Hanya admin yang bisa menghapus artikel"
    }),403

############################################################################ FUNGSI MENCARI ARTIKEL BERDASARKAN JUDUL
############################################################################ FUNGSI MENCARI ATAU MENGAMBIL SEMUA ARTIKEL
@blueprint_route.route('/get_articles', methods=['GET']) 
def get_articles():
    title = request.args.get('title')
    author = request.args.get('author')

    if title:
        title_data = article_db.query.filter_by(title=title).first_or_404()
        return jsonify({
            'success': True,
            'data': [{
                'title': title_data.title,
                'author': title_data.author,
                'description': title_data.description
            }]
        })
        
    elif author:
        author_data = article_db.query.filter_by(author=author).all()
        list_artikel = []
        for artikel in author_data:
            list_artikel.append({
                'title': artikel.title,
                'author': artikel.author,
                'description': artikel.description
            })
        return jsonify({
            'success': True,
            'data': list_artikel
        })
        
    else:
        semua_artikel = article_db.query.all()
        list_semua = []
        for artikel in semua_artikel:
            list_semua.append({
                'title': artikel.title,
                'author': artikel.author,
                'description': artikel.description
            })
        return jsonify({
            'success': True,
            'data': list_semua
        })
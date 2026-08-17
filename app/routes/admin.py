from flask import jsonify
from app.models import User
from . import blueprint_route

@blueprint_route.route('/admin_dashboard', methods=['POST'])
def admin_dashboard():
    # Mengambil semua data user dari database
    semua_user = User.query.all()
    # Memasukkan data ke dalam list
    list_user = []
    for user in semua_user:
        list_user.append({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': user.role
        })
        
    return jsonify({
        'success': True,
        'messages': "Selamat datang di halaman admin",
        'data': list_user
    }), 200


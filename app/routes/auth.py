from flask import request, jsonify, session
from werkzeug.security import generate_password_hash, check_password_hash 
from app.models import db
from app.models import User
from . import blueprint_route

######################################################################### FUNGSI REGISTRASI
@blueprint_route.route('/registrasi', methods = ['POST'])
def registrasi():
    data = request.get_json()
    user_exist = User.query.filter_by(username=data['username']).first()
    if user_exist:
        return jsonify({
                'success' : False,
                'messages' : "Username sudah ada, silakan input username baru"
            })
    hashed_pw = generate_password_hash(data['password'])
    user_info = User(
        username=data['username'], 
        email=data['email'], 
        password=hashed_pw,
        role=data.get('role'))
    db.session.add(user_info)
    db.session.commit()

    return jsonify({
        'success' : True,
        'messages' : "User berhasil ditambahkan"
    })

######################################################################### FUNGSI LOGIN 
@blueprint_route.route('/login', methods = ['POST'])
def login():
    data = request.get_json()
    get_username = User.query.filter_by(username=data['username']).first()
    #################################### SIMPAN DATA ROLE LOGIN #######################
    session['role'] = get_username.role
    session['id'] = get_username.id
    #################################### SIMPAN DATA ROLE LOGIN #######################
    if get_username and check_password_hash(get_username.password, data['password']):
        return jsonify({"success" : True,
                        "messages" : "Login berhasil", 
                        "role":get_username.role}), 200
    return jsonify({"success" : False,
                    "messages" : "Username atau password salah"}), 401
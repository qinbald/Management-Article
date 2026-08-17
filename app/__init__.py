from flask import Flask
from app.models import db
from flask_migrate import Migrate

migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')

    db.init_app(app)
    migrate.init_app(app, db)

    from app.routes import blueprint_route
    from app.routes.main import main_bp
    app.register_blueprint(blueprint_route)
    app.register_blueprint(main_bp)

    # with app.app_context():
    #     db.create_all()

    return app
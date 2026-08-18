from flask import Blueprint

blueprint_route = Blueprint('module_name', __name__)

from . import article
from . import auth
from . import main 
from . import admin
from . import profile
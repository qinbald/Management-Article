from flask import Blueprint, jsonify
from app.services.analytics import get_engagement_metrics

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/api/analytics')
def analytics_api():
    metrics = get_engagement_metrics()
    if not metrics:
        return jsonify({'success': False, 'message': 'Belum ada data artikel untuk dianalisis.'}), 404
    return jsonify({'success': True, 'data': metrics})

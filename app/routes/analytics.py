from flask import Blueprint, jsonify, request, session
from datetime import datetime, timedelta
from app.models import db, ActiveVisitor
from app.services.analytics import get_engagement_metrics

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/api/analytics')
def analytics_api():
    metrics = get_engagement_metrics()
    if not metrics:
        return jsonify({'success': False, 'message': 'Belum ada data artikel untuk dianalisis.'}), 404
    return jsonify({'success': True, 'data': metrics})

@analytics_bp.route('/api/analytics/ping', methods=['POST'])
def analytics_ping():
    """Heartbeat global — catat visitor online dari halaman manapun."""
    data = request.get_json() or {}
    visitor_id = data.get('visitor_id', '').strip()
    if not visitor_id:
        return jsonify({'success': False}), 400

    user_id = session.get('user_id')

    # Upsert: update last_seen jika sudah ada, insert jika belum
    av = ActiveVisitor.query.filter_by(visitor_id=visitor_id).first()
    if av:
        av.last_seen = datetime.utcnow()
        av.user_id = user_id
    else:
        av = ActiveVisitor(visitor_id=visitor_id, user_id=user_id)
        db.session.add(av)
    db.session.commit()

    # Hitung online saat ini (2 menit terakhir)
    threshold = datetime.utcnow() - timedelta(minutes=2)
    online_count = ActiveVisitor.query.filter(ActiveVisitor.last_seen >= threshold).count()

    return jsonify({'success': True, 'online': online_count})

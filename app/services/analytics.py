"""Engagement analytics — dihitung dari data REAL Article + ReadingSession via SQL & Pandas."""
import pandas as pd
import numpy as np
from sqlalchemy import func
from app.models import db, Article, ReadingSession, ActiveVisitor

from datetime import datetime, timedelta

def get_engagement_metrics():
    articles_count = Article.query.count()
    if articles_count == 0:
        return None

    # ── 0. Real-time Active Users (Global via ActiveVisitor heartbeat) ──
    threshold_online = datetime.utcnow() - timedelta(minutes=2)
    current_active_users = ActiveVisitor.query.filter(ActiveVisitor.last_seen >= threshold_online).count()
        
    total_unique_visitors = db.session.query(func.count(func.distinct(ReadingSession.visitor_id))).scalar() or 0

    # ── 1. Summary global (SQL Aggregation) ────────────────────────
    summary_stats = db.session.query(
        func.count(ReadingSession.id).label('total_visits'),
        func.avg(ReadingSession.active_seconds).label('avg_active'),
        func.avg(ReadingSession.max_scroll_depth).label('avg_scroll'),
        func.avg(ReadingSession.interaction_count).label('avg_interactions'),
        func.sum(func.cast(ReadingSession.is_bounce, db.Integer)).label('total_bounces')
    ).first()

    total_visits = summary_stats.total_visits or 0
    avg_active = float(summary_stats.avg_active or 0)
    bounce_rate = (float(summary_stats.total_bounces or 0) / total_visits * 100) if total_visits > 0 else 0

    summary = {
        'current_active_users': current_active_users,
        'total_unique_visitors': total_unique_visitors,
        'total_articles': articles_count,
        'total_articles_legacy': articles_count,
        'total_visits': total_visits,
        'total_views': total_visits,
        'avg_active_time_sec': round(avg_active, 1),
        'avg_read_time_all': round(avg_active / 60, 2),
        'avg_read_time_min': round(avg_active / 60, 2),
        'avg_bounce_rate_all': round(bounce_rate, 1),
        'bounce_rate_pct': round(bounce_rate, 1),
        'avg_scroll_depth': round(float(summary_stats.avg_scroll or 0), 1),
        'avg_interactions': round(float(summary_stats.avg_interactions or 0), 2),
    }

    # ── 2. Statistik per kategori (SQL Aggregation) ────────────────
    cat_stats = db.session.query(
        Article.category,
        func.count(ReadingSession.id).label('visits'),
        func.count(func.distinct(Article.id)).label('articles'),
        func.avg(ReadingSession.active_seconds).label('avg_active'),
        func.avg(ReadingSession.max_scroll_depth).label('avg_scroll'),
        func.avg(ReadingSession.interaction_count).label('avg_interactions'),
        func.sum(func.cast(ReadingSession.is_bounce, db.Integer)).label('bounces')
    ).join(ReadingSession, Article.id == ReadingSession.article_id).group_by(Article.category).all()

    category_stats = []
    for c in cat_stats:
        c_visits = c.visits or 0
        c_bounces = c.bounces or 0
        c_bounce_rate = (c_bounces / c_visits * 100) if c_visits > 0 else 0
        c_avg_active = float(c.avg_active or 0)
        
        category_stats.append({
            'category': c.category,
            'total_visits': c_visits,
            'total_articles': c.articles,
            'avg_active_time': round(c_avg_active, 1),
            'avg_scroll': round(float(c.avg_scroll or 0), 1),
            'avg_interactions': round(float(c.avg_interactions or 0), 2),
            'bounce_rate': round(c_bounce_rate, 1),
            'avg_read_time': round(c_avg_active / 60, 2),
            'avg_views': int(c_visits / c.articles) if c.articles > 0 else 0,
            'avg_bounce_rate': round(c_bounce_rate, 1),
            'active_time_variance': 0, # Simplified
            'views_variance': 0
        })

    # ── 3. Top 5 artikel terpopuler (SQL Aggregation) ──────────────
    top_stats = db.session.query(
        Article.id, Article.title, Article.author, Article.category,
        func.count(ReadingSession.id).label('views'),
        func.avg(ReadingSession.active_seconds).label('avg_active'),
        func.avg(ReadingSession.max_scroll_depth).label('avg_scroll'),
        func.sum(func.cast(ReadingSession.is_bounce, db.Integer)).label('bounces')
    ).join(ReadingSession, Article.id == ReadingSession.article_id).group_by(Article.id).order_by(func.count(ReadingSession.id).desc()).limit(5).all()

    top_articles = []
    for t in top_stats:
        t_views = t.views or 0
        t_bounces = t.bounces or 0
        t_bounce_rate = (t_bounces / t_views * 100) if t_views > 0 else 0
        top_articles.append({
            'article_id': t.id,
            'title': t.title,
            'author': t.author,
            'category': t.category,
            'views': t_views,
            'avg_active_time': round(float(t.avg_active or 0), 1),
            'avg_scroll': round(float(t.avg_scroll or 0), 1),
            'bounce_rate': round(t_bounce_rate, 1)
        })

    # ── 4. Breakdown referrer_source (SQL Aggregation) ─────────────
    ref_stats = db.session.query(
        ReadingSession.referrer_source,
        func.count(ReadingSession.id).label('visits'),
        func.avg(ReadingSession.active_seconds).label('avg_active'),
        func.sum(func.cast(ReadingSession.is_bounce, db.Integer)).label('bounces')
    ).group_by(ReadingSession.referrer_source).order_by(func.count(ReadingSession.id).desc()).all()

    referrer_stats = []
    for r in ref_stats:
        r_visits = r.visits or 0
        r_bounces = r.bounces or 0
        r_bounce_rate = (r_bounces / r_visits * 100) if r_visits > 0 else 0
        referrer_stats.append({
            'referrer_source': r.referrer_source,
            'visits': r_visits,
            'pct': round((r_visits / total_visits * 100) if total_visits > 0 else 0, 1),
            'avg_active_time': round(float(r.avg_active or 0), 1),
            'bounce_rate': round(r_bounce_rate, 1)
        })

    # ── 5. Tren harian 30 hari + regresi linier (Pandas) ───────────
    # Ambil data harian via SQL untuk efisiensi
    daily_stats = db.session.query(
        func.date(ReadingSession.created_at).label('date'),
        func.count(ReadingSession.id).label('visits'),
        func.avg(ReadingSession.active_seconds).label('avg_active'),
        func.sum(func.cast(ReadingSession.is_bounce, db.Integer)).label('bounces')
    ).group_by(func.date(ReadingSession.created_at)).order_by(func.date(ReadingSession.created_at)).all()

    daily_trend = []
    trend = {'slope': 0, 'direction': 'flat', 'label': 'Belum ada data'}
    
    if daily_stats:
        df = pd.DataFrame([{
            'date_str': str(d.date),
            'visits': d.visits,
            'avg_active_time': round(float(d.avg_active or 0), 1),
            'bounce_rate': round((d.bounces / d.visits * 100) if d.visits > 0 else 0, 1)
        } for d in daily_stats])
        
        daily_trend = df.to_dict('records')

        if len(df) >= 2:
            x = np.arange(len(df))
            y = df['visits'].to_numpy(dtype=float)
            slope, _intercept = np.polyfit(x, y, 1)
            slope = float(slope)
            if slope > 0.5:
                direction, label = 'up', 'Tren Naik — popularitas meningkat'
            elif slope < -0.5:
                direction, label = 'down', 'Tren Turun — popularitas menurun'
            else:
                direction, label = 'flat', 'Stabil — fluktuasi harian wajar'
            trend = {'slope': round(slope, 3), 'direction': direction, 'label': label}

    return {
        'summary': summary,
        'category_stats': category_stats,
        'top_articles': top_articles,
        'referrer_stats': referrer_stats,
        'daily_trend': daily_trend,
        'trend': trend,
        'raw_data': top_articles, # Simplified
    }

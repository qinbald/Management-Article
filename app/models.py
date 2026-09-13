from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# =============================================================================
# MODEL: USER
# =============================================================================
class User(db.Model):
    """Model pengguna aplikasi (pembaca, penulis, admin)."""
    __tablename__ = "data_user"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), unique=True, nullable=False, index=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password = db.Column(db.String(255), nullable=False)
    role = db.Column(
        db.Enum('admin', 'user', name='role_types'),
        nullable=False,
        default='user'
    )
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relasi 1:N -> User memiliki banyak Article
    articles = db.relationship(
        'Article',
        back_populates='author_user',
        lazy=True,
        cascade='all, delete-orphan'
    )

    def __init__(self, username, email, password, role='user'):
        self.username = username
        self.email = email
        self.password = password
        self.role = role

    def __repr__(self):
        return f"<User id={self.id} username='{self.username}' role='{self.role}'>"


# =============================================================================
# MODEL: ARTICLE (PENGGABUNGAN article_db & analytics_article)
# =============================================================================
class Article(db.Model):
    """Model terpadu untuk konten ensiklopedia dan analitik keterlibatan."""
    __tablename__ = "articles"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False, index=True)
    slug = db.Column(db.String(255), unique=True, nullable=True, index=True)
    category = db.Column(db.String(100), nullable=False, default='Umum', index=True)
    author = db.Column(db.String(255), nullable=False, default='Anonim')
    description = db.Column(db.Text, nullable=True)
    published_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)

    # Foreign Key ke User (opsional: jika artikel diimpor bot/Wikipedia, user_id=None)
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("data_user.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Relasi N:1 -> Article dimiliki oleh User
    author_user = db.relationship('User', back_populates='articles')

    # Relasi 1:N -> Article memiliki banyak VisitLog
    visit_logs = db.relationship(
        'VisitLog',
        back_populates='article',
        lazy=True,
        cascade='all, delete-orphan'
    )
    
    # Relasi 1:N -> Article memiliki banyak ReadingSession
    reading_sessions = db.relationship(
        'ReadingSession',
        back_populates='article',
        lazy=True,
        cascade='all, delete-orphan'
    )

    def __init__(self, title, category='Umum', author='Anonim', description=None, user_id=None, slug=None, published_at=None):
        self.title = title
        self.category = category
        self.author = author
        self.description = description
        self.user_id = user_id
        self.slug = slug
        if published_at:
            self.published_at = published_at

    def __repr__(self):
        return f"<Article id={self.id} title='{self.title[:30]}' category='{self.category}'>"


# =============================================================================
# MODEL: READING SESSION (REAL TRACKING)
# =============================================================================
class ReadingSession(db.Model):
    """Log sesi membaca nyata dari browser."""
    __tablename__ = "analytics_reading_session"

    id = db.Column(db.Integer, primary_key=True)
    article_id = db.Column(
        db.Integer,
        db.ForeignKey("articles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id = db.Column(
        db.Integer,
        db.ForeignKey("data_user.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    visitor_id = db.Column(db.String(64), nullable=False, index=True)
    session_id = db.Column(db.String(64), nullable=False, unique=True, index=True)
    
    started_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    last_seen_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    ended_at = db.Column(db.DateTime, nullable=True)
    
    active_seconds = db.Column(db.Integer, nullable=False, default=0)
    max_scroll_depth = db.Column(db.Integer, nullable=False, default=0)
    interaction_count = db.Column(db.Integer, nullable=False, default=0)
    is_bounce = db.Column(db.Boolean, nullable=False, default=True)
    referrer_source = db.Column(db.String(100), nullable=False, default='Langsung')
    
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)

    article = db.relationship('Article', back_populates='reading_sessions')

    def __init__(self, article_id, visitor_id, session_id, user_id=None, started_at=None, last_seen_at=None, active_seconds=0, max_scroll_depth=0, interaction_count=0, is_bounce=True, referrer_source='Langsung', ended_at=None):
        self.article_id = article_id
        self.visitor_id = visitor_id
        self.session_id = session_id
        self.user_id = user_id
        self.active_seconds = active_seconds
        self.max_scroll_depth = max_scroll_depth
        self.interaction_count = interaction_count
        self.is_bounce = is_bounce
        self.referrer_source = referrer_source
        self.ended_at = ended_at
        
        now = datetime.utcnow()
        self.started_at = started_at if started_at else now
        self.last_seen_at = last_seen_at if last_seen_at else now

    def __repr__(self):
        return f"<ReadingSession id={self.id} article_id={self.article_id} active_sec={self.active_seconds}>"


# =============================================================================
# MODEL: VISIT LOG (LEGACY / SEEDER)
# =============================================================================
class VisitLog(db.Model):
    """Log setiap sesi kunjungan pengunjung ke sebuah artikel untuk analisis data."""
    __tablename__ = "analytics_visit_log"

    id = db.Column(db.Integer, primary_key=True)
    article_id = db.Column(
        db.Integer,
        db.ForeignKey("articles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    active_time_seconds = db.Column(db.Integer, nullable=False)   # Durasi aktif (detik)
    max_scroll_depth = db.Column(db.Integer, nullable=False)      # Scroll 0 - 100%
    interaction_count = db.Column(db.Integer, nullable=False)     # Klik/interaksi
    is_bounce = db.Column(db.Boolean, nullable=False, default=False)
    referrer_source = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)

    # Relasi N:1 -> VisitLog merujuk ke satu Article
    article = db.relationship('Article', back_populates='visit_logs')

    def __init__(self, article_id, active_time_seconds, max_scroll_depth, interaction_count, referrer_source, is_bounce=False):
        self.article_id = article_id
        self.active_time_seconds = active_time_seconds
        self.max_scroll_depth = max_scroll_depth
        self.interaction_count = interaction_count
        self.referrer_source = referrer_source
        self.is_bounce = is_bounce

    def __repr__(self):
        return (
            f"<VisitLog id={self.id} article_id={self.article_id} "
            f"bounce={self.is_bounce} duration={self.active_time_seconds}s>"
        )
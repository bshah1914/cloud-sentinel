"""
CloudSentinel Enterprise — Database Seeder
Seeds the database with initial data: owner user, demo org, plans.
"""

from passlib.context import CryptContext
from models.database import (
    SessionLocal, Organization, User, CloudAccount, AlertRule,
    gen_id, utcnow, init_db
)
from services.alerts import create_default_alert_rules

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed_database():
    """Seed database with initial data if empty."""
    init_db()
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(User).filter(User.username == "admin").first():
            print("[Seed] Database already seeded")
            return

        print("[Seed] Seeding database...")

        # 1. Create owner org
        owner_org = Organization(
            id="cloudsentinel",
            name="CloudSentinel",
            slug="cloudsentinel",
            plan="enterprise",
            max_accounts=999,
            max_scans_month=99999,
            max_users=999,
        )
        db.add(owner_org)

        # 2. Create admin user
        admin = User(
            id=gen_id(),
            username="admin",
            email="admin@cloudsentinel.io",
            password_hash=pwd_context.hash("admin123"),
            role="admin",
            user_type="owner",
            org_id="cloudsentinel",
        )
        db.add(admin)

        db.commit()

        print("[Seed] Database seeded successfully")
        print("  Owner: admin / admin123")
        print("  Add clients via Admin Panel")

    except Exception as e:
        db.rollback()
        print(f"[Seed] Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

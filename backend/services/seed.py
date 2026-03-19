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

        # 3. Create demo client org (CNS Technologies)
        cns_org = Organization(
            id="cns_tech",
            name="CNS Technologies",
            slug="cns",
            plan="pro",
            max_accounts=5,
            max_scans_month=50,
            max_users=10,
            email_alerts=True,
            alert_email="admin@cns-tech.com",
        )
        db.add(cns_org)

        # 4. Create client admin user
        cns_admin = User(
            id=gen_id(),
            username="cns_admin",
            email="admin@cns-tech.com",
            password_hash=pwd_context.hash("cns123"),
            role="client_admin",
            user_type="client",
            org_id="cns_tech",
        )
        db.add(cns_admin)

        # 5. Create CNS cloud account
        cns_account = CloudAccount(
            id="cns_aws_1",
            org_id="cns_tech",
            name="CNS",
            provider="aws",
            account_id="315817641850",
            status="active",
            total_resources=670,
            security_score=30,
        )
        db.add(cns_account)

        db.commit()

        # 6. Create default alert rules for CNS
        create_default_alert_rules("cns_tech")

        print("[Seed] Database seeded successfully")
        print("  Owner: admin / admin123")
        print("  Client: cns_admin / cns123")

    except Exception as e:
        db.rollback()
        print(f"[Seed] Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()

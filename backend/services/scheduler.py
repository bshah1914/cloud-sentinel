"""
CloudSentinel Enterprise — Scan Scheduler Service
Manages scheduled/recurring scans using background threads.
"""

import threading
import time
from datetime import datetime, timedelta, timezone

from models.database import SessionLocal, ScanSchedule, Scan, CloudAccount, gen_id, utcnow
from services.scanner import start_scan_async


_scheduler_running = False
_scheduler_thread = None


def _calculate_next_run(schedule_type, last_run=None):
    """Calculate next run time based on schedule type."""
    now = datetime.now(timezone.utc)
    if schedule_type == "hourly":
        return now + timedelta(hours=1)
    elif schedule_type == "daily":
        return now + timedelta(days=1)
    elif schedule_type == "weekly":
        return now + timedelta(weeks=1)
    elif schedule_type == "monthly":
        return now + timedelta(days=30)
    return now + timedelta(days=1)


def _scheduler_loop():
    """Main scheduler loop — checks for due scans every 60 seconds."""
    global _scheduler_running
    while _scheduler_running:
        db = SessionLocal()
        try:
            now = datetime.now(timezone.utc)
            due_schedules = db.query(ScanSchedule).filter(
                ScanSchedule.is_active == True,
                ScanSchedule.next_run_at <= now
            ).all()

            for schedule in due_schedules:
                account = db.query(CloudAccount).filter(
                    CloudAccount.id == schedule.account_id
                ).first()
                if not account or account.status != "active":
                    continue

                # Create scan
                scan = Scan(
                    id=gen_id(), org_id=schedule.org_id,
                    account_id=schedule.account_id,
                    scan_type=schedule.scan_type,
                    triggered_by="scheduler",
                )
                db.add(scan)
                db.commit()

                # Start scan async
                start_scan_async(scan.id, account.id)

                # Update schedule
                schedule.last_run_at = now
                schedule.next_run_at = _calculate_next_run(schedule.schedule_type, now)
                db.commit()

        except Exception as e:
            print(f"[Scheduler] Error: {e}")
            db.rollback()
        finally:
            db.close()

        time.sleep(60)  # Check every 60 seconds


def start_scheduler():
    """Start the background scheduler."""
    global _scheduler_running, _scheduler_thread
    if _scheduler_running:
        return
    _scheduler_running = True
    _scheduler_thread = threading.Thread(target=_scheduler_loop, daemon=True)
    _scheduler_thread.start()
    print("[Scheduler] Started")


def stop_scheduler():
    """Stop the background scheduler."""
    global _scheduler_running
    _scheduler_running = False
    print("[Scheduler] Stopped")


def create_schedule(org_id, account_id, schedule_type="daily", scan_type="full"):
    """Create a new scan schedule."""
    db = SessionLocal()
    try:
        schedule = ScanSchedule(
            id=gen_id(), org_id=org_id, account_id=account_id,
            schedule_type=schedule_type, scan_type=scan_type,
            next_run_at=_calculate_next_run(schedule_type),
        )
        db.add(schedule)
        db.commit()
        return {"id": schedule.id, "schedule_type": schedule_type, "next_run_at": schedule.next_run_at.isoformat()}
    finally:
        db.close()


def list_schedules(org_id):
    """List all scan schedules for an organization."""
    db = SessionLocal()
    try:
        schedules = db.query(ScanSchedule).filter(ScanSchedule.org_id == org_id).all()
        return [{
            "id": s.id, "account_id": s.account_id,
            "schedule_type": s.schedule_type, "scan_type": s.scan_type,
            "is_active": s.is_active,
            "last_run_at": s.last_run_at.isoformat() if s.last_run_at else None,
            "next_run_at": s.next_run_at.isoformat() if s.next_run_at else None,
        } for s in schedules]
    finally:
        db.close()

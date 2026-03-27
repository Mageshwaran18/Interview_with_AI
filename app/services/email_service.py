"""
═════════════════════════════════════════════════════════════════
Email Service — Group Session Invite Emails
═════════════════════════════════════════════════════════════════

Sends candidate invite emails for bulk group sessions.
Uses SMTP (smtplib) with env-based credentials.

Configuration (all optional — if absent, email is skipped gracefully):
    SMTP_HOST       e.g. smtp.gmail.com
    SMTP_PORT       e.g. 587
    SMTP_USER       sender email address
    SMTP_PASS       sender password / app password
    FRONTEND_BASE_URL  e.g. http://localhost:5173 (used for invite links)
"""

import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os

logger = logging.getLogger(__name__)

# ─── Read SMTP config from env (all optional) ───
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")

_SMTP_CONFIGURED = bool(SMTP_HOST and SMTP_USER and SMTP_PASS)


def _format_ist(dt: datetime) -> str:
    """Format a datetime for display in emails (Asia/Kolkata / IST)."""
    try:
        # Add IST offset label; datetimes are stored naive (assumed IST)
        return dt.strftime("%d %b %Y, %I:%M %p IST")
    except Exception:
        return str(dt)


def send_invite_email(
    to_email: str,
    candidate_name: str,
    group_name: str,
    template: str,
    duration_minutes: int,
    start_at: datetime,
    end_at: datetime,
    invite_link: str,
) -> bool:
    """
    Send a session invite email to a candidate.

    Returns True on success, False on failure.
    Logs the error but never raises — partial failures are reported
    in the bulk-create response so the manager can follow up.

    If SMTP is not configured, logs a warning and returns False so callers can
    surface a visible "email_failed" status to the hiring manager.
    """
    if not _SMTP_CONFIGURED:
        logger.warning(
            "SMTP not configured — email not sent to %s. "
            "Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env to enable emails.",
            to_email,
        )
        return False

    subject = f"[Interview with AI] You're invited to: {group_name}"

    body = f"""Hello {candidate_name},

You have been invited to participate in an AI-assisted coding interview.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Session Details
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Group Name    : {group_name}
  Project       : {template}
  Duration      : {duration_minutes} minutes
  Opens at      : {_format_ist(start_at)}
  Closes at     : {_format_ist(end_at)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Your Invite Link
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {invite_link}

⚠️  IMPORTANT — Validity Window
  Your session link is ONLY active between:
      {_format_ist(start_at)}  →  {_format_ist(end_at)}

  Attempting to open the link outside this window will show an
  error message. Please plan accordingly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Good luck!
Interview with AI Platform
"""

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SMTP_USER
        msg["To"] = to_email
        msg.attach(MIMEText(body, "plain"))

        if SMTP_PORT == 465:
            smtp_client = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10)
        else:
            smtp_client = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)

        with smtp_client as server:
            server.ehlo()
            if SMTP_PORT != 465:
                server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, [to_email], msg.as_string())

        logger.info("Invite email sent to %s for group %s", to_email, group_name)
        return True

    except Exception as exc:
        logger.error(
            "Failed to send invite email to %s: %s", to_email, str(exc)
        )
        return False

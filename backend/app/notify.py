"""Real outbound alerts via Twilio (voice call / SMS / WhatsApp).

Credentials come from environment variables — NEVER hardcode them:
  TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
  TWILIO_FROM_NUMBER        (a Twilio voice/SMS number, e.g. +1...)
  TWILIO_WHATSAPP_FROM      (optional, e.g. whatsapp:+14155238886 for the sandbox)

If the keys are absent, every send returns {"simulated": True} and NOTHING is sent —
so the UI works out of the box and goes live the moment the keys are added.
"""
import os
from xml.sax.saxutils import escape

import httpx

TWILIO_BASE = "https://api.twilio.com/2010-04-01"


def _creds():
    return (
        os.getenv("TWILIO_ACCOUNT_SID", ""),
        os.getenv("TWILIO_AUTH_TOKEN", ""),
        os.getenv("TWILIO_FROM_NUMBER", ""),
        os.getenv("TWILIO_WHATSAPP_FROM", ""),
    )


def is_live() -> bool:
    sid, token, frm, _ = _creds()
    return bool(sid and token and frm)


def normalize_number(raw: str, default_cc: str = "+91") -> str:
    """Best-effort E.164 for Indian numbers. '98765 43210' -> '+919876543210'."""
    s = "".join(ch for ch in raw.strip() if ch.isdigit() or ch == "+")
    if s.startswith("+"):
        return s
    s = s.lstrip("0")
    if len(s) == 10:
        return default_cc + s
    if s.startswith("91") and len(s) == 12:
        return "+" + s
    return default_cc + s


def _twiml(hindi: str, english: str) -> str:
    return (
        "<Response>"
        f'<Say voice="Polly.Aditi" language="hi-IN">{escape(hindi)}</Say>'
        "<Pause length=\"1\"/>"
        f'<Say language="en-IN">{escape(english)}</Say>'
        "</Response>"
    )


async def send(to: str, channel: str, english: str, hindi: str) -> dict:
    sid, token, frm, wa_from = _creds()
    number = normalize_number(to)

    if not (sid and token and frm):
        return {"to": number, "channel": channel, "status": "simulated", "simulated": True}

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            if channel == "call":
                r = await client.post(
                    f"{TWILIO_BASE}/Accounts/{sid}/Calls.json",
                    auth=(sid, token),
                    data={"To": number, "From": frm, "Twiml": _twiml(hindi, english)},
                )
            elif channel == "whatsapp":
                if not wa_from:
                    return {"to": number, "channel": channel, "status": "error",
                            "error": "TWILIO_WHATSAPP_FROM not set"}
                r = await client.post(
                    f"{TWILIO_BASE}/Accounts/{sid}/Messages.json",
                    auth=(sid, token),
                    data={"To": f"whatsapp:{number}", "From": wa_from,
                          "Body": f"{english}\n\n{hindi}"},
                )
            else:  # sms
                r = await client.post(
                    f"{TWILIO_BASE}/Accounts/{sid}/Messages.json",
                    auth=(sid, token),
                    data={"To": number, "From": frm, "Body": f"{english}\n\n{hindi}"},
                )
        if r.status_code in (200, 201):
            body = r.json()
            return {"to": number, "channel": channel, "status": "sent",
                    "sid": body.get("sid")}
        # Twilio returns a helpful message in JSON
        msg = ""
        try:
            msg = r.json().get("message", "")
        except Exception:
            msg = r.text[:200]
        return {"to": number, "channel": channel, "status": "error", "error": msg}
    except Exception as e:  # network etc.
        return {"to": number, "channel": channel, "status": "error", "error": str(e)}

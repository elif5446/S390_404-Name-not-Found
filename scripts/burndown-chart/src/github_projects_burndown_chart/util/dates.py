from datetime import datetime, timedelta, timezone
from dateutil import parser
from typing import List


def parse_to_utc(date_string: str) -> datetime:
    """
    Parse a date string and ensure it is in UTC.
    """
    dt = parser.parse(date_string)
    if dt.tzinfo is None:
        # If no timezone info, assume local and convert to UTC
        dt = dt.astimezone(timezone.utc)
    else:
        dt = dt.astimezone(timezone.utc)
    return dt


def parse_to_local(datetime_utc: datetime) -> datetime:
    """
    Convert a UTC datetime object to the system's local time.
    """
    if datetime_utc is None:
        return None
    return datetime_utc.astimezone()


def date_range(start_date: datetime, end_date: datetime) -> List[datetime]:
    """
    Generates a list of datetimes representing each day in the range.
    """
    # Normalize to midnight to avoid offset issues
    start = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end = end_date.replace(hour=0, minute=0, second=0, microsecond=0)

    num_days = (end - start).days + 1
    return [start + timedelta(days=x) for x in range(num_days)]


TODAY_UTC: datetime = datetime.now(timezone.utc).replace(
    hour=0, minute=0, second=0, microsecond=0
)

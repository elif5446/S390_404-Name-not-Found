from datetime import datetime, timedelta
from typing import List
from gh.project import Card


class PointsCalculator:

    def __init__(self, cards: List[Card]):
        self.cards: List[Card] = cards

    def points_as_of(self, date: datetime):
        raise NotImplementedError()


class ClosedPointsCalculator(PointsCalculator):

    def points_as_of(self, date: datetime) -> float:
        return sum(
            card.points
            for card in self.cards
            if isinstance(card.closed, datetime) and card.closed <= date
        )


class AssignedPointsCalculator(PointsCalculator):

    def points_as_of(self, date: datetime) -> float:
        return sum(
            card.points
            for card in self.cards
            if isinstance(card.assigned, datetime) and card.assigned <= date
        )


class CreatedPointsCalculator(PointsCalculator):

    def points_as_of(self, date: datetime) -> float:
        return sum(
            card.points
            for card in self.cards
            if isinstance(card.created, datetime) and card.created <= date
        )


class TaigaPointsCalculator(PointsCalculator):
    """
    Weighted calculation: 100% points for closed, 50% for assigned/in-progress.
    Useful for showing 'Work in Progress' value.
    """

    def points_as_of(self, date: datetime) -> float:
        closed_by_date = [
            card
            for card in self.cards
            if isinstance(getattr(card, "closed"), datetime)
            and getattr(card, "closed") <= date
        ]
        closed_points = sum(card.points for card in closed_by_date)
        assigned_by_date = [
            card
            for card in self.cards
            if isinstance(getattr(card, "assigned"), datetime)
            and getattr(card, "assigned") <= date
            and card not in closed_by_date
        ]
        in_progress_points = sum(card.points / 2 for card in assigned_by_date)
        return float(closed_points + in_progress_points)


class BurndownCalculator(PointsCalculator):
    """
    Calculates the actual burndown line:
    (Total Scope as of date) - (Total Completed as of date)
    """

    def points_as_of(self, date: datetime) -> float:
        total_scope = sum(
            card.points for card in self.cards if card.created and card.created <= date
        )
        completed = sum(
            card.points for card in self.cards if card.closed and card.closed <= date
        )
        return float(total_scope - completed)

    def get_velocity(self, days: int = 7) -> float:
        """
        Calculates average points closed per day over the last 'n' days.
        """
        now = (
            datetime.now(self.cards[0].created.tzinfo) if self.cards else datetime.now()
        )
        start_date = now - timedelta(days=days)

        points_at_start = sum(
            card.points
            for card in self.cards
            if card.closed and card.closed <= start_date
        )
        points_now = sum(
            card.points for card in self.cards if card.closed and card.closed <= now
        )

        return (points_now - points_at_start) / days

    def estimate_completion(self) -> datetime:
        """
        Predicts completion date based on current velocity and remaining points.
        """
        remaining = self.points_as_of(datetime.now(self.cards[0].created.tzinfo))
        velocity = self.get_velocity(days=14)  # 2-week average

        if velocity <= 0:
            return None  # Infinite time

        days_to_complete = remaining / velocity
        return datetime.now() + timedelta(days=days_to_complete)

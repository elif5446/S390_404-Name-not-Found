from datetime import datetime, timedelta
from typing import Dict, Iterable, Optional
from gh.project import *
from util.dates import TODAY_UTC, date_range
from util.calculators import PointsCalculator, BurndownCalculator


class ProjectStats:

    def __init__(self, project: Project, start_date: datetime, end_date: datetime):
        self.start_date: datetime = start_date
        self.end_date: datetime = end_date
        self.project: Project = project

    @property
    def total_points(self) -> int:
        return self.project.total_points

    def points_by_date(self, calculator: PointsCalculator) -> Dict[datetime, float]:
        """
        Maps each date in the sprint to a cumulative point value.
        """
        points = {}
        sprint_dates: Iterable[datetime] = date_range(self.start_date, self.end_date)
        for date in sprint_dates:
            # Get the issues completed before midnight on the given date.
            end_of_day = date.replace(hour=23, minute=59, second=59, tzinfo=date.tzinfo)
            points[date] = calculator.points_as_of(end_of_day)
        return points

    def remaining_points_by_date(self) -> Dict[datetime, Optional[float]]:
        """
        Calculates the actual burndown (Remaining = Scope - Completed).
        Returns None for future dates so the chart stops at 'Today'.
        """
        burndown_calc = BurndownCalculator(self.project.cards)
        sprint_dates = date_range(self.start_date, self.end_date)

        # Buffer today slightly to ensure today's progress is included
        cutoff_date = TODAY_UTC.replace(hour=23, minute=59)

        remaining_points = {}
        for date in sprint_dates:
            if date <= cutoff_date:
                end_of_day = date.replace(
                    hour=23, minute=59, second=59, tzinfo=date.tzinfo
                )
                remaining_points[date] = burndown_calc.points_as_of(end_of_day)
            else:
                # Future dates are not plotted
                remaining_points[date] = None

        return remaining_points

    def get_ideal_burndown(self) -> Dict[datetime, float]:
        """
        Calculates the 'Ideal' straight line from start to finish.
        """
        start_points = BurndownCalculator(self.project.cards).points_as_of(
            self.start_date
        )
        sprint_dates = date_range(self.start_date, self.end_date)
        total_days = len(sprint_dates) - 1

        ideal = {}
        for i, date in enumerate(sprint_dates):
            # linearly decrease from start_points to 0
            ideal[date] = max(0, start_points - (start_points * (i / total_days)))
        return ideal

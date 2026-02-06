import argparse
from datetime import datetime, timezone
import sys

from chart.burndown import BurndownChart, BurndownChartData, BurndownChartDataSeries
from config import config
from discord import webhook
from gh.api_wrapper import (
    get_organization_project,
    get_repository_project,
    get_project_v2,
    get_sprint_dates,
)
from gh.project import Project
from util import colors
from util.dates import date_range
from util.stats import ProjectStats
from util.calculators import (
    ClosedPointsCalculator,
    AssignedPointsCalculator,
    CreatedPointsCalculator,
    TaigaPointsCalculator,
    BurndownCalculator,
)


def parse_cli_args():
    parser = argparse.ArgumentParser(
        description="Generate a burndown chart for a GitHub project."
    )
    parser.add_argument(
        "--type",
        "-t",
        default="user",
        choices=["repository", "organization", "user"],
        help="The type of project to generate a burndown chart for. Can be either 'organization' or 'repository' or 'user'.",
        required=True,
    )
    parser.add_argument(
        "--name",
        "-n",
        help="The name of the project as it appears in the config.json",
        required=True,
    )
    parser.add_argument("--sprint", "-s", help="The name of the sprint.", required=True)
    parser.add_argument(
        "--filepath",
        help="The filepath where the burndown chart is saved.",
        default="./burndown.png",
    )
    parser.add_argument(
        "--discord",
        action="store_true",
        help="If present, posts the burndown chart to the configured webhook",
    )
    parser.add_argument(
        "--no-cache",
        "-nc",
        action="store_false",
        dest="use_cache",
        help="Force fetch fresh data from github api. Ignore previously cached results.",
    )
    return parser.parse_args()


def download_project_data(
    project_type: str, project_version: int, sprint: str, use_cache: bool = True
) -> Project:
    if project_version == 2:
        return get_project_v2(project_type, sprint, use_cache)

    if project_type == "repository":
        return get_repository_project(use_cache)
    elif project_type == "organization":
        return get_organization_project(use_cache)
    else:
        raise ValueError(f"Unknown project type: {project_type}")


def get_calculator(calc_type: str, cards):
    """Factory to instantiate the correct calculator."""
    calculators = {
        "closed": ClosedPointsCalculator,
        "assigned": AssignedPointsCalculator,
        "created": CreatedPointsCalculator,
        "taiga": TaigaPointsCalculator,
        "burndown": BurndownCalculator,
    }

    calculator_class = calculators.get(calc_type)
    if calculator_class:
        return calculator_class(cards)
    return None


def prepare_chart_data(stats: ProjectStats):
    color_gen = colors()
    series_list = []

    calc_types = config["settings"].get("calculators", ["burndown"])
    for pts_type in calc_types:
        calculator = get_calculator(pts_type, stats.project.cards)
        if not calculator:
            print(f"Warning: Unknown calculator type '{pts_type}'. Skipping.")
            continue

        # Logic: If using the 'BurndownCalculator', it returns the exact remaining value.
        # For others (like 'closed'), we assume the user wants (Total - Closed).
        if isinstance(calculator, BurndownCalculator):
            points_data = stats.remaining_points_by_date()
        else:
            # legacy behavior: Subtract calculated value from Total
            # cumulative_data = stats.points_by_date(calculator)
            # points_data = {
            #     d: stats.total_points - val for d, val in cumulative_data.items()
            # }
            points_data = stats.points_by_date(calculator)

        series_list.append(
            BurndownChartDataSeries(
                name=pts_type.capitalize(),
                data=points_data,
                format=dict(color=next(color_gen)),
            )
        )

    # construct the Data Object
    points_label = config["settings"].get("points_label", "Points")
    if not points_label:
        points_label = "Issues"

    data = BurndownChartData(
        sprint_name=stats.project.name,
        utc_chart_start=config.utc_sprint_start(),
        utc_chart_end=config.utc_chart_end() or config.utc_sprint_end(),
        utc_sprint_start=config.utc_sprint_start(),
        utc_sprint_end=config.utc_sprint_end(),
        total_points=stats.total_points,
        series=series_list,
        points_label=f"Outstanding {points_label}",
    )
    return data


if __name__ == "__main__":
    args = parse_cli_args()
    config.set_project(args.type, args.name)

    start, end = get_sprint_dates(args.sprint)
    if start and end:
        config["settings"]["sprint_start_date"] = start
        config["settings"]["sprint_end_date"] = end
    else:
        config["settings"]["sprint_start_date"] = "2026-01-12"
        config["settings"]["sprint_end_date"] = (
            datetime.now(timezone.utc)
            .replace(hour=0, minute=0, second=0, microsecond=0)
            .strftime("%Y-%m-%d")
        )

    try:
        print(f"Fetching data for {args.name}...")
        project = download_project_data(
            args.type, config["settings"].get("version", 2), args.sprint, args.use_cache
        )

        # Calculate Stats
        stats = ProjectStats(
            project,
            config.utc_sprint_start(),
            config.utc_chart_end() or config.utc_sprint_end(),
        )

        print(
            f"Project: {args.name} : {args.type} : {project.total_points} total points."
        )
        print(f"Sprint Start: {config.utc_sprint_start()}")
        print(f"Sprint End:   {config.utc_sprint_end()}")
        if args.use_cache:
            print(f"WARNING: using cached json data from system tmp directory.")
        burndown_chart = BurndownChart(prepare_chart_data(stats))

        if args.discord:
            chart_path = "./tmp/chart.png"
            burndown_chart.generate_chart(chart_path)
            print(f"Posting to Discord...")
            webhook.post_burndown_chart(chart_path)
        else:
            burndown_chart.generate_chart(args.filepath)
            print(f"Saved to {args.filepath}")
        print("Done.")

    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

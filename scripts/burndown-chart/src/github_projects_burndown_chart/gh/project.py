from datetime import datetime
from dateutil.parser import isoparse
from config import config


class Project:
    columns = None

    @property
    def total_points(self):
        return sum([column.get_total_points() for column in self.columns])

    @property
    def cards(self):
        return [card for column in self.columns for card in column.cards]


class ProjectV1(Project):
    def __init__(self, project_data):
        self.name = project_data["name"]
        self.columns = self.__parse_columns(project_data)

    def __parse_columns(self, project_data):
        columns_data = project_data["columns"]["nodes"]
        columns = [
            Column(self.__parse_cards(column_data)) for column_data in columns_data
        ]
        return columns

    def __parse_cards(self, column_data):
        cards_data = column_data["cards"]["nodes"]
        cards = [Card(card_data) for card_data in cards_data]
        return cards


class ProjectV2(Project):
    def __init__(self, project_data):
        if not project_data:
            raise ValueError(
                "project_data is None. Verify your GraphQL query and permissions."
            )
        self.name = project_data.get("title", "Project")
        self.columns = self.__parse_columns(project_data)

    def __parse_columns(self, project_data):
        column_dict = {None: []}

        field_data = project_data.get("field", {}) or {}
        options = field_data.get("options", [])
        for option in options:
            column_dict[option["name"]] = []

        items_nodes = project_data.get("items", {}).get("nodes", [])
        for item_data in items_nodes:
            status = (item_data.get("fieldValueByName") or {}).get("name")

            card = Card(item_data)
            if status in column_dict:
                column_dict[status].append(card)
            else:
                column_dict[None].append(card)

        return [Column(cards) for cards in column_dict.values()]


class Column:
    def __init__(self, cards):
        self.cards = cards

    def get_total_points(self):
        return sum([card.points for card in self.cards])


class Card:
    def __init__(self, card_data):
        # In V2, project-specific fields (like Estimate) are on the item,
        # while dates are on the 'content' (the Issue/PR).
        self.raw_data = card_data
        content = card_data.get("content") or {}

        self.created = self.__parse_createdAt(content)
        self.assigned = self.__parse_assignedAt(content)
        self.closed = self.__parse_closedAt(content)
        self.points = self.__parse_points(card_data)

    def __parse_assignedAt(self, content) -> datetime:
        assigned_dates = content.get("timelineItems", {}).get("nodes", [])
        if assigned_dates:
            return isoparse(assigned_dates[0]["createdAt"])
        return None

    def __parse_createdAt(self, content) -> datetime:
        if content and content.get("createdAt"):
            return isoparse(content["createdAt"])
        return None

    def __parse_closedAt(self, content) -> datetime:
        if content and content.get("closedAt"):
            return isoparse(content["closedAt"])
        return None

    def __parse_points(self, item_data) -> int:
        """
        Reads points from the GitHub Project 'Estimate' field.
        Falls back to 1 if not set, or 0
        """
        # Try to find the 'Estimate' field value (Project V2 style)
        # This assumes your GraphQL query uses 'fieldValueByName(name: "Estimate")'
        estimate = item_data.get("estimateField")
        if estimate and "number" in estimate:
            return int(estimate["number"])
        return 0

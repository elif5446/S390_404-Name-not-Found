import json
import os
import logging
from datetime import datetime
from typing import Optional, Dict, Any

from util.dates import parse_to_utc

# Set up logging
logger = logging.getLogger(__name__)
handler = logging.StreamHandler()
handler.setFormatter(
    logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
)
logger.addHandler(handler)
logger.setLevel(logging.INFO)

# File I/O inspired by https://stackoverflow.com/a/4060259/14765128
__location__ = os.path.realpath(os.path.join(os.getcwd(), os.path.dirname(__file__)))


class Config:

    def __init__(self):
        self._raw_config: Dict[str, Any] = self._load_json("config.json", required=True)
        self._secrets: Dict[str, Any] = self._load_json("secrets.json", required=True)

        # State for the active project
        self._project_config: Optional[Dict[str, Any]] = None
        self._project_type: Optional[str] = None
        self._project_name: Optional[str] = None

    def _load_json(self, filename: str, required: bool = True) -> Dict[str, Any]:
        """
        Robustly attempts to find a JSON file in the config directory,
        project root, or current working directory.
        """
        # Calculate paths relative to this file (__file__ = src/.../config/__init__.py)
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(current_dir, "../../.."))

        search_paths = [
            current_dir,  # src/.../config/
            os.path.join(current_dir, ".."),  # src/.../
            project_root,  # Project Root
            os.getcwd(),  # Current CLI execution path
        ]

        for path in search_paths:
            file_path = os.path.join(path, filename)
            if os.path.exists(file_path):
                try:
                    with open(file_path, "r") as f:
                        return json.load(f)
                except json.JSONDecodeError as e:
                    logger.critical(f"Error parsing {filename} at {file_path}: {e}")
                    exit(1)

        if required:
            logger.critical(f"Could not find {filename}.")
            logger.critical(f"Searched in: {search_paths}")
            logger.critical("Please create the file based on the example .dist files.")
            exit(1)

        return {}

    def set_project(self, project_type: str, project_name: str):
        self.project_type = project_type
        self.project_name = project_name

        if project_type not in self._raw_config:
            logger.critical(f"Project type '{project_type}' not found in config.json.")
            logger.critical(f"Available types: {list(self._raw_config.keys())}")
            exit(1)

        # Validate Project Name
        if project_name not in self._raw_config[project_type]:
            logger.critical(
                f"Project '{project_name}' not found under '{project_type}' in config.json."
            )
            logger.critical(
                f"Available projects: {list(self._raw_config[project_type].keys())}"
            )
            exit(1)

        self._project_config = self._raw_config[project_type][project_name]

    def __getitem__(self, key: str):
        if not hasattr(self, "project_type"):
            raise AttributeError("No project has been set.")
        if not hasattr(self, "project_name"):
            raise AttributeError("No project has been set.")
        self._ensure_project_set()
        return self._project_config[key]

    def get(self, key: str, default=None):
        """Allows safe access: config.get('settings')"""
        if self._project_config is None:
            return default
        return self._project_config.get(key, default)

    def _ensure_project_set(self):
        if self._project_config is None:
            raise RuntimeError(
                "Project not set. You must call config.set_project(type, name) before accessing values."
            )

    def utc_sprint_start(self) -> datetime:
        # Tries 'sprint_start_date' first, falls back to 'sprint_start'
        return self.__get_date("sprint_start_date") or self.__get_date("sprint_start")

    def utc_sprint_end(self) -> datetime:
        return self.__get_date("sprint_end_date") or self.__get_date("sprint_end")

    def utc_chart_end(self) -> Optional[datetime]:
        return self.__get_date("chart_end_date") or self.__get_date("chart_end")

    def __get_date(self, key_name: str) -> Optional[datetime]:
        if not self._project_config:
            return None

        settings = self._project_config.get("settings", {})
        date_str = settings.get(key_name)

        if not date_str:
            return None

        dt = parse_to_utc(date_str)
        # normalize to midnight to prevent 'x not in list' errors
        return dt.replace(hour=0, minute=0, second=0, microsecond=0)

    @property
    def secrets(self):
        return self._secrets

    def __repr__(self):
        if self._project_config:
            return f"<Config: {self._project_type}/{self._project_name}>"
        return "<Config: Uninitialized>"


config = Config()
secrets = config.secrets

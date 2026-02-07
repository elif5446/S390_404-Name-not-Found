import logging
import os
import requests
from datetime import date
import hashlib
import json
import tempfile

from config import config, secrets
from .project import Project, ProjectV1, ProjectV2
from .queries import (
    OrganizationProject,
    OrganizationProjectV2,
    RepositoryProject,
    RepositoryProjectV2,
    UserProjectV2,
)

# Set up logging
__logger = logging.getLogger(__name__)
__ch = logging.StreamHandler()
__ch.setFormatter(
    logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
)
__logger.addHandler(__ch)


__project_v2_queries = {
    "repository": RepositoryProjectV2,
    "organization": OrganizationProjectV2,
    "user": UserProjectV2,
}


def get_repository_project(use_cache: bool = True) -> Project:
    # query_variables = config["query_variables"]
    # query_response = gh_api_query(RepositoryProject, query_variables)
    # project_data = query_response["data"]["repository"]["project"]
    # return ProjectV1(project_data)
    return get_project_v2("repository", use_cache)


def get_organization_project(use_cache: bool = True) -> Project:
    # query_variables = config["query_variables"]
    # query_response = gh_api_query(OrganizationProject, query_variables)
    # project_data = query_response["data"]["organization"]["project"]
    # return ProjectV1(project_data)
    return get_project_v2("organization", use_cache)


def get_project_v2(project_type, use_cache: bool = True) -> Project:
    query = __project_v2_queries[project_type]
    query_variables = config["query_variables"].copy()
    query_response = gh_api_query(query, query_variables, use_cache)

    if "errors" in query_response:
        __logger.critical(f"GraphQL Errors: {query_response['errors']}")
        exit(1)

    data_root = query_response.get("data", {}).get(project_type, {})
    if data_root and "projectV2" not in data_root:
        # Check if maybe it returned null explicitly
        print(f"DEBUG: Found {project_type} data, but 'projectV2' is missing.")
        print(f"DEBUG: Available keys in response: {data_root.keys()}")
        # Sometimes it returns 'projectV2': None
        if "projectV2" in data_root and data_root["projectV2"] is None:
            print(
                f"DEBUG: GitHub explicitly returned null for project number {query_variables.get('project_number')}"
            )
            print(
                "HINT: Are you sure this is a Repository project? Most V2 projects belong to the Organization."
            )
            print(
                "TRY: Switch 'project_type' to 'organization' in your command line args."
            )
    if not data_root:
        __logger.critical(
            f"Could not find {project_type} data. Check your config names."
        )
        exit(1)
    project_data = data_root.get("projectV2")
    if not project_data:
        __logger.critical(f"ProjectV2 not found. Check project_number in config.")
        exit(1)

    page_info = project_data["items"]["pageInfo"]
    while page_info["hasNextPage"]:
        query_variables["cursor"] = page_info["endCursor"]
        query_response = gh_api_query(query, query_variables, use_cache)
        items = query_response["data"][project_type]["projectV2"]["items"]
        project_data["items"]["nodes"].extend(items["nodes"])
        page_info = items["pageInfo"]

    return ProjectV2(project_data)


def gh_api_query(query: str, variables: dict, use_cache: bool = True) -> dict:
    response = None
    if use_cache:
        response = __get_from_cache(query, variables)
    if not response:
        response = __get_from_api(query, variables)
        __cache_response(query, variables, response)
    return response


def prepare_payload(query, variables):
    return {"query": query, "variables": variables}


def __get_from_api(query, variables):
    headers = (
        {"Authorization": "bearer %s" % secrets["github_token"]}
        if "github_token" in secrets
        else {}
    )

    response = requests.post(
        "https://api.github.com/graphql",
        headers=headers,
        json=prepare_payload(query, variables),
    ).json()

    # Gracefully report failures due to bad credentials
    if response.get("message") and response["message"] == "Bad credentials":
        __logger.critical(response["message"])
        __logger.critical(
            "Failed to extract project data from GitHub due "
            "to an invalid access token."
        )
        __logger.critical(
            "Please set the `github_token` key in the "
            "`src/secrets.json` file to a valid access token with access "
            "to the repo specified in the `src/config.json` file."
        )
        exit(1)
    # Gracefully report failures due to errors
    elif response.get("errors"):
        __logger.critical(
            "Failed to extract project data from GitHub due to " "an error."
        )
        __logger.critical(response["errors"])
        exit(1)
    return response


def __get_from_cache(query, variables):
    temp_path = __temp_path(query, variables)
    if os.path.exists(temp_path):
        with open(temp_path, "r") as f:
            return json.load(f)
    return None


def __cache_response(query, variables, response):
    temp_path = __temp_path(query, variables)
    with open(temp_path, "w") as f:
        json.dump(response, f)


def __temp_path(query, variables):
    temp_dir = tempfile.gettempdir()
    payload = prepare_payload(query, variables)
    payload.update({"today": str(date.today())})
    filename = f"{hashlib.sha256(json.dumps(payload).encode('utf-8')).hexdigest()}.json"
    temp_path = os.path.join(temp_dir, filename)
    return temp_path

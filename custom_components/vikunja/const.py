import logging

DOMAIN = "vikunja"
INTEGRATION_NAME = "Vikunja Task Hub"
VERSION = "0.24.0"

CONF_BASE_URL = "url"
CONF_TOKEN = "api_key"
CONF_TOKEN_NOT_CHANGED = "__**token_not_changed**__"
CONF_STRICT_SSL = "strict_ssl"

LEGACY_CONFIG_KEYS = (
    "seconds_interval",
    "hide_done",
    "selected_projects",
    "tasks_as_devices",
)

LOGGER = logging.getLogger(__package__)

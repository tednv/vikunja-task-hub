"""Vikunja Task Hub integration setup."""

from urllib.parse import urlparse

import httpx
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryNotReady
from homeassistant.helpers.httpx_client import get_async_client
from homeassistant.helpers.storage import Store
from pyvikunja.api import APIError, VikunjaAPI

from .const import (
    CONF_BASE_URL,
    CONF_STRICT_SSL,
    CONF_TOKEN,
    DOMAIN,
    INTEGRATION_NAME,
    LEGACY_CONFIG_KEYS,
    LOGGER,
    VERSION,
)
from .dashboard import async_complete_scheduled_timer, async_register_dashboard_commands
from .frontend import async_register_frontend
from .time_tracking import TaskTimeTracker


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Set up integration-wide frontend resources."""
    domain_data = hass.data.setdefault(DOMAIN, {})
    tracker = TaskTimeTracker(
        Store(hass, 1, f"{DOMAIN}.time_tracking"),
        on_change=lambda entry_id, task_id: hass.bus.async_fire(
            "vikunja_time_tracking_updated",
            {"entry_id": entry_id, "task_id": task_id},
        ),
        on_complete=lambda entry_id, task_id, elapsed, completed_at, note: (
            async_complete_scheduled_timer(hass, entry_id, task_id, elapsed, completed_at, note)
        ),
    )
    await tracker.async_load()
    domain_data["time_tracker"] = tracker
    async_register_dashboard_commands(hass)
    await async_register_frontend(hass, VERSION)
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up a Vikunja connection."""
    base_url = entry.data.get(CONF_BASE_URL) or ""
    token = entry.data.get(CONF_TOKEN) or ""
    strict_ssl = entry.data.get(CONF_STRICT_SSL, True)

    if not base_url or not token:
        raise ConfigEntryNotReady("Vikunja URL or API token is missing")

    client = get_async_client(hass, verify_ssl=strict_ssl)
    vikunja_api = VikunjaAPI(base_url, token, strict_ssl, client)

    try:
        await vikunja_api.ping()
    except (httpx.HTTPError, APIError) as err:
        raise ConfigEntryNotReady("Unable to connect to Vikunja") from err

    host = urlparse(vikunja_api.web_ui_link).netloc
    entry_title = f"{INTEGRATION_NAME} ({host})" if host else INTEGRATION_NAME
    if entry.title != entry_title:
        hass.config_entries.async_update_entry(entry, title=entry_title)

    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = {
        "api": vikunja_api,
        "entry_id": entry.entry_id,
    }
    LOGGER.debug("Vikunja Task Hub connection is ready")
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a Vikunja connection."""
    domain_data = hass.data.get(DOMAIN, {})
    domain_data.pop(entry.entry_id, None)
    return True


async def async_migrate_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Remove settings used by the retired entity/device implementation."""
    new_data = {**entry.data}
    new_version = entry.version

    if entry.version < 5:
        for legacy_key in LEGACY_CONFIG_KEYS:
            new_data.pop(legacy_key, None)
        new_data.setdefault(CONF_STRICT_SSL, True)
        new_version = 5

    hass.config_entries.async_update_entry(entry, data=new_data, version=new_version)
    return True

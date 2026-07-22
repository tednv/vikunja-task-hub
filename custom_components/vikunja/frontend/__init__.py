"""Register the Vikunja dashboard card frontend."""

from pathlib import Path

from homeassistant.components.http import StaticPathConfig
from homeassistant.core import HomeAssistant

from ..const import LOGGER

STATIC_URL_BASE = "/vikunja-static"
CARD_FILENAME = "vikunja-todo-card.js"
CARD_RESOURCE_NAMESPACE = f"{STATIC_URL_BASE}/{CARD_FILENAME}"
FRONTEND_DIR = Path(__file__).parent


async def async_register_frontend(hass: HomeAssistant, version: str) -> None:
    """Serve and register the Vikunja dashboard card."""
    await hass.http.async_register_static_paths(
        [StaticPathConfig(STATIC_URL_BASE, str(FRONTEND_DIR), True)]
    )

    lovelace = hass.data.get("lovelace")
    resources = getattr(lovelace, "resources", None)
    if resources is None:
        LOGGER.warning("Lovelace resources are unavailable; card registration skipped")
        return

    if not hasattr(resources, "store") or resources.store is None:
        LOGGER.info(
            "Lovelace is using YAML resources; add %s manually",
            CARD_RESOURCE_NAMESPACE,
        )
        return

    if resources.store.key != "lovelace_resources" or resources.store.version != 1:
        LOGGER.warning("Unsupported Lovelace resource storage; card registration skipped")
        return

    if not resources.loaded:
        await resources.async_load()

    resource_url = f"{CARD_RESOURCE_NAMESPACE}?v={version}"
    for item in resources.async_items():
        if item["url"].startswith(CARD_RESOURCE_NAMESPACE):
            if item["url"] != resource_url:
                await resources.async_update_item(item["id"], {"url": resource_url})
                LOGGER.info("Updated Vikunja dashboard card resource")
            return

    await resources.async_create_item({"res_type": "module", "url": resource_url})
    LOGGER.info("Registered Vikunja dashboard card resource")

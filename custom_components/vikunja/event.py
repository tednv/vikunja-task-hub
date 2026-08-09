"""Stable Home Assistant event targets for Vikunja Task Hub activity."""

from __future__ import annotations

from homeassistant.components.event import EventEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

from .automation import AUTOMATION_EVENT, CLEAN_EVENT_TYPES, clean_entity_events
from .const import DOMAIN


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up stable automation targets for one connection."""
    async_add_entities(
        [VikunjaAutomationTarget(entry, event_type) for event_type in CLEAN_EVENT_TYPES]
    )


class VikunjaAutomationTarget(EventEntity):
    """Expose one reliable target for one friendly event type."""

    _attr_has_entity_name = False

    def __init__(self, entry: ConfigEntry, event_type: str) -> None:
        """Initialize the event entity."""
        self._entry_id = entry.entry_id
        self._event_type = event_type
        self._attr_event_types = [event_type]
        self._attr_name = f"Vikunja Task Hub {event_type.replace('_', ' ').capitalize()}"
        self._attr_unique_id = f"{entry.entry_id}_{event_type}"

    async def async_added_to_hass(self) -> None:
        """Subscribe to successful integration actions."""
        self.async_on_remove(
            self.hass.bus.async_listen(AUTOMATION_EVENT, self._handle_action)
        )

    @callback
    def _handle_action(self, event: Event) -> None:
        """Translate matching action events into entity events."""
        if event.data.get("entry_id") != self._entry_id:
            return
        current_user_id = self.hass.data[DOMAIN][self._entry_id].get("current_user_id")
        for event_type, attributes in clean_entity_events(event.data, current_user_id):
            if event_type != self._event_type:
                continue
            self._trigger_event(event_type, attributes)
            self.async_write_ha_state()

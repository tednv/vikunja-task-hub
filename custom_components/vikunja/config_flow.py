"""Connection-only configuration flow for Vikunja."""

import httpx
import voluptuous as vol
from homeassistant import config_entries
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers import selector
from homeassistant.helpers.httpx_client import get_async_client
from pyvikunja.api import APIError, VikunjaAPI

from .const import (
    CONF_BASE_URL,
    CONF_STRICT_SSL,
    CONF_TOKEN,
    CONF_TOKEN_NOT_CHANGED,
    DOMAIN,
    INTEGRATION_NAME,
)


class VikunjaConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Configure the Vikunja connection used by the dashboard card."""

    VERSION = 5

    async def async_step_user(self, user_input=None) -> FlowResult:
        errors = {}
        if user_input is not None:
            if await self._connection_works(user_input):
                return self.async_create_entry(title=INTEGRATION_NAME, data=user_input)
            errors["base"] = "cannot_connect"

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_BASE_URL): str,
                    vol.Required(CONF_TOKEN): selector.TextSelector(
                        selector.TextSelectorConfig(type=selector.TextSelectorType.PASSWORD)
                    ),
                    vol.Optional(CONF_STRICT_SSL, default=True): bool,
                }
            ),
            errors=errors,
        )

    async def async_step_reconfigure(self, user_input=None) -> FlowResult:
        errors = {}
        entry = self.hass.config_entries.async_get_entry(self.context["entry_id"])
        if user_input is not None:
            token = (
                entry.data[CONF_TOKEN]
                if user_input[CONF_TOKEN] == CONF_TOKEN_NOT_CHANGED
                else user_input[CONF_TOKEN]
            )
            updated = {
                CONF_BASE_URL: user_input[CONF_BASE_URL],
                CONF_TOKEN: token,
                CONF_STRICT_SSL: user_input[CONF_STRICT_SSL],
            }
            if await self._connection_works(updated):
                return self.async_update_reload_and_abort(entry, data=updated)
            errors["base"] = "cannot_connect"

        return self.async_show_form(
            step_id="reconfigure",
            data_schema=vol.Schema(
                {
                    vol.Required(CONF_BASE_URL, default=entry.data.get(CONF_BASE_URL, "")): str,
                    vol.Required(CONF_TOKEN, default=CONF_TOKEN_NOT_CHANGED): selector.TextSelector(
                        selector.TextSelectorConfig(type=selector.TextSelectorType.PASSWORD)
                    ),
                    vol.Optional(
                        CONF_STRICT_SSL,
                        default=entry.data.get(CONF_STRICT_SSL, True),
                    ): bool,
                }
            ),
            errors=errors,
        )

    async def _connection_works(self, data: dict) -> bool:
        try:
            strict_ssl = data.get(CONF_STRICT_SSL, True)
            api = VikunjaAPI(
                data[CONF_BASE_URL],
                data[CONF_TOKEN],
                strict_ssl,
                get_async_client(self.hass, verify_ssl=strict_ssl),
            )
            await api.ping()
            return True
        except (httpx.HTTPError, APIError):
            return False

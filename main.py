import sys
import os
import asyncio
import decky
from settings import SettingsManager

sys.path.append(os.path.dirname(__file__))
from memscan import Memscan

class Plugin:
    async def _main(self):
        self.settings = SettingsManager(name="setting", settings_directory=decky.DECKY_PLUGIN_SETTINGS_DIR)
        self.frozen_values = {}
        self._freeze_task = None
        self._running = True
        self._freeze_task = asyncio.create_task(self._freeze_loop())

    async def _freeze_loop(self):
        """Reescreve os valores congelados a cada 100ms."""
        while self._running:
            if self.frozen_values:
                value_groups = {}
                for idx, val in list(self.frozen_values.items()):
                    value_groups.setdefault(val, []).append(idx)

                for val, indexes in value_groups.items():
                    try:
                        Memscan.change_values(val, indexes)
                    except Exception as e:
                        decky.logger.error(f"Erro ao congelar valores: {e}")
            await asyncio.sleep(0.1)

    async def toggle_freeze(self, index: int, value: str, freeze: bool):
        if freeze:
            self.frozen_values[index] = str(value)
        else:
            self.frozen_values.pop(index, None)
        return {"success": True, "frozen": freeze}

    async def clear_frozen(self):
        self.frozen_values.clear()
        return {"success": True}

    async def get_frozen_indices(self):
        return list(self.frozen_values.keys())

    async def set_render_results_threshold(self, value):
        Memscan.set_render_results_threshold(value)

    async def get_setting(self, key, fallback):
        return self.settings.getSetting(key, fallback)

    async def set_setting(self, key, value):
        self.settings.setSetting(key, value)

    async def version(self):
        return Memscan.version()

    async def clear(self):
        self.frozen_values.clear()
        return Memscan.clear()

    async def reset_scan(self):
        self.frozen_values.clear()
        return Memscan.reset_scan()

    async def get_game_processes(self, appid: int):
        return Memscan.get_game_processes(appid)

    async def select_game_process(self, appid: int, pid: int):
        return Memscan.select_game_process(appid, pid)

    async def auto_select_game_process(self, appid: int):
        return Memscan.auto_select_game_process(appid)

    async def first_scan(self, appid: int, value: str, value_type: int, option: int):
        self.frozen_values.clear()
        return Memscan.first_scan(appid, value, value_type, option)

    async def next_scan(self, value: str):
        self.frozen_values.clear()
        return Memscan.next_scan(value)

    async def undo_scan(self):
        self.frozen_values.clear()
        return Memscan.undo_scan()

    async def change_values(self, value: str, indexes: list):
        return Memscan.change_values(value, indexes)

    async def refresh_values(self):
        return Memscan.refresh_values()

    async def _unload(self):
        self._running = False
        if self._freeze_task:
            self._freeze_task.cancel()

    async def _uninstall(self):
        pass

    async def _migration(self):
        pass
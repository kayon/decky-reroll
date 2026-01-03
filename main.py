import sys
import os
import decky
from settings import SettingsManager

sys.path.append(os.path.dirname(__file__))
from memscan import Memscan

class Plugin:
    async def _main(self):
        self.settings = SettingsManager(name="setting", settings_directory=decky.DECKY_PLUGIN_SETTINGS_DIR)

    async def set_render_results_threshold(self, value):
        Memscan.set_render_results_threshold(value)

    async def get_setting(self, key, fallback):
        return self.settings.getSetting(key, fallback)

    async def set_setting(self, key, value):
        self.settings.setSetting(key, value)

    async def version(self):
        return Memscan.version()

    async def clear(self):
        return Memscan.clear()

    async def reset_scan(self):
        return Memscan.reset_scan()

    async def get_game_processes(self, appid: int):
        return Memscan.get_game_processes(appid)

    async def select_game_process(self, appid: int, pid: int):
        return Memscan.select_game_process(appid, pid)

    async def auto_select_game_process(self, appid: int):
        return Memscan.auto_select_game_process(appid)

    async def first_scan(self, appid: int, value: str, value_type: int, option: int):
        return Memscan.first_scan(appid, value, value_type, option)

    async def next_scan(self, value: str):
        return Memscan.next_scan(value)

    async def undo_scan(self):
        return Memscan.undo_scan()

    async def change_values(self, value: str, indexes: list):
        return Memscan.change_values(value, indexes)

    async def refresh_values(self):
        return Memscan.refresh_values()

    async def _unload(self):
        pass

    async def _uninstall(self):
        pass

    async def _migration(self):
        pass

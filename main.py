import sys
import os
import asyncio
import decky
from settings import SettingsManager

sys.path.append(os.path.dirname(__file__))
from memscan import Memscan

# the multi-type API needs this backend version at least
MIN_BACKEND_VERSION = (0, 5, 0)


def _version_tuple(version):
    try:
        return tuple(int(part) for part in str(version).split('.')[:3])
    except ValueError:
        return (0, 0, 0)


class Plugin:
    async def _main(self):
        self.settings = SettingsManager(name="setting", settings_directory=decky.DECKY_PLUGIN_SETTINGS_DIR)
        # frozen values, by position in the results of the last scan
        self.frozen_values = {}
        # same for the multi-type scan, by (slot, type number, position)
        self.frozen_multi = {}
        self._freeze_task = None
        self._running = True
        self._freeze_task = asyncio.create_task(self._freeze_loop())

        version = Memscan.version()
        if _version_tuple(version) < MIN_BACKEND_VERSION:
            decky.logger.error(f"memscan backend {version} is older than the required "
                               f"{'.'.join(map(str, MIN_BACKEND_VERSION))}")
        else:
            decky.logger.info(f"memscan backend {version}")

    def _clear_frozen(self):
        self.frozen_values.clear()
        self.frozen_multi.clear()

    def _clear_frozen_slot(self, slot: int):
        self.frozen_multi = {key: val for key, val in self.frozen_multi.items() if key[0] != slot}

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
            if self.frozen_multi:
                multi_groups = {}
                for (slot, value_type, idx), val in list(self.frozen_multi.items()):
                    multi_groups.setdefault((slot, value_type, val), []).append(idx)

                for (slot, value_type, val), indexes in multi_groups.items():
                    try:
                        Memscan.change_values_multi(slot, value_type, val, indexes)
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
        self._clear_frozen()
        return {"success": True}

    async def get_frozen_indices(self):
        return list(self.frozen_values.keys())

    async def toggle_freeze_multi(self, slot: int, value_type: int, index: int, value: str, freeze: bool):
        if freeze:
            self.frozen_multi[(slot, value_type, index)] = str(value)
        else:
            self.frozen_multi.pop((slot, value_type, index), None)
        return {"success": True, "frozen": freeze}

    async def freeze_all_multi(self, slot: int, value_type: int, values: list, freeze: bool):
        # every result of the type at once
        for key in [k for k in self.frozen_multi if k[0] == slot and k[1] == value_type]:
            del self.frozen_multi[key]
        if freeze:
            for index, value in enumerate(values):
                self.frozen_multi[(slot, value_type, index)] = str(value)
        return [idx for (s, t, idx) in self.frozen_multi.keys() if s == slot and t == value_type]

    async def get_frozen_indices_multi(self, slot: int, value_type: int):
        return [idx for (s, t, idx) in self.frozen_multi.keys() if s == slot and t == value_type]

    async def set_render_results_threshold(self, value):
        Memscan.set_render_results_threshold(value)

    async def get_setting(self, key, fallback):
        return self.settings.getSetting(key, fallback)

    async def set_setting(self, key, value):
        self.settings.setSetting(key, value)

    async def version(self):
        return Memscan.version()

    async def clear(self):
        self._clear_frozen()
        return Memscan.clear()

    async def reset_scan(self):
        self._clear_frozen()
        return Memscan.reset_scan()

    async def reset_slot(self, slot: int):
        # only this search is forgotten, the others (and what they freeze) stay
        self._clear_frozen_slot(slot)
        return Memscan.reset_slot(slot)

    async def get_game_processes(self, appid: int):
        return Memscan.get_game_processes(appid)

    async def select_game_process(self, appid: int, pid: int):
        return Memscan.select_game_process(appid, pid)

    async def auto_select_game_process(self, appid: int):
        return Memscan.auto_select_game_process(appid)

    # -- single-type scan ----------------------------------------------------

    async def first_scan(self, appid: int, value: str, value_type: int, option: int, emulator: bool = False):
        self._clear_frozen()
        return Memscan.first_scan(appid, value, value_type, option, emulator)

    async def next_scan(self, value: str):
        self._clear_frozen()
        return Memscan.next_scan(value)

    async def undo_scan(self):
        self._clear_frozen()
        return Memscan.undo_scan()

    async def change_values(self, value: str, indexes: list):
        return Memscan.change_values(value, indexes)

    async def refresh_values(self):
        return Memscan.refresh_values()

    # -- multi-type scan

    async def first_scan_multi(self, slot: int, appid: int, value: str, option: int, emulator: bool = False,
                               types_mask: int = 0):
        self._clear_frozen_slot(slot)
        return Memscan.first_scan_multi(slot, appid, value, option, emulator, types_mask)

    async def next_scan_multi(self, slot: int, value: str):
        self._clear_frozen_slot(slot)
        return Memscan.next_scan_multi(slot, value)

    async def undo_scan_multi(self, slot: int):
        self._clear_frozen_slot(slot)
        return Memscan.undo_scan_multi(slot)

    async def keep_only_multi(self, slot: int, types_mask: int):
        results = Memscan.keep_only_multi(slot, types_mask)
        if results is not None:
            # the dropped types have nothing to rewrite any more
            self.frozen_multi = {
                (s, value_type, idx): val
                for (s, value_type, idx), val in self.frozen_multi.items()
                if s != slot or types_mask & (1 << value_type)
            }
        return results

    async def change_values_multi(self, slot: int, value_type: int, value: str, indexes: list):
        return Memscan.change_values_multi(slot, value_type, value, indexes)

    async def change_values_gradient(self, slot: int, value_type: int, values: list, indexes: list):
        # one value per result (a gradient)
        groups = {}
        for value, index in zip(values, indexes):
            groups.setdefault(str(value), []).append(index)
        results = None
        for value, group in groups.items():
            results = Memscan.change_values_multi(slot, value_type, value, group)
            if results is None:
                return None
        return results

    async def refresh_values_multi(self, slot: int):
        return Memscan.refresh_values_multi(slot)

    async def _unload(self):
        self._running = False
        if self._freeze_task:
            self._freeze_task.cancel()

    async def _uninstall(self):
        pass

    async def _migration(self):
        pass

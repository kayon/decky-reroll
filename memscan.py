import ctypes
import json
import os

lib_path = os.path.join(os.path.dirname(__file__), "bin", "memscan.so")
lib = ctypes.CDLL(lib_path)

lib.Version.argtypes = []
lib.Version.restype = ctypes.c_void_p

lib.SetRenderResultsThreshold.argtypes = [ctypes.c_int]
lib.SetRenderResultsThreshold.restype = None

lib.Clear.argtypes = []
lib.Clear.restype = None

lib.ResetScan.argtypes = []
lib.ResetScan.restype = None

lib.GetGameProcesses.argtypes = [ctypes.c_int64]
lib.GetGameProcesses.restype = ctypes.c_void_p

lib.SelectGameProcess.argtypes = [ctypes.c_int64, ctypes.c_int]
lib.SelectGameProcess.restype = ctypes.c_void_p

lib.AutoSelectGameProcess.argtypes = [ctypes.c_int64]
lib.AutoSelectGameProcess.restype = ctypes.c_void_p

lib.FirstScan.argtypes = [ctypes.c_int64, ctypes.c_char_p, ctypes.c_int, ctypes.c_int]
lib.FirstScan.restype = ctypes.c_void_p

lib.NextScan.argtypes = [ctypes.c_char_p]
lib.NextScan.restype = ctypes.c_void_p

lib.UndoScan.argtypes = []
lib.UndoScan.restype = ctypes.c_void_p

lib.ChangeValues.argtypes = [ctypes.c_char_p, ctypes.POINTER(ctypes.c_int32), ctypes.c_int]
lib.ChangeValues.restype = ctypes.c_void_p

lib.RefreshValues.argtypes = []
lib.RefreshValues.restype = ctypes.c_void_p

lib.FreeString.argtypes = [ctypes.c_void_p]
lib.FreeString.restype = None

class Memscan:
    @staticmethod
    def __call(func, *args):
        ptr = func(*args)
        if not ptr:
            return None
        try:
            res_str = ctypes.string_at(ptr).decode('utf-8')
            return json.loads(res_str)
        finally:
            lib.FreeString(ptr)

    @staticmethod
    def version():
        return Memscan.__call(lib.Version)

    @staticmethod
    def set_render_results_threshold(value: int):
        Memscan.__call(lib.SetRenderResultsThreshold, value)

    @staticmethod
    def clear():
        lib.Clear()

    @staticmethod
    def reset_scan():
        lib.ResetScan()

    @staticmethod
    def get_game_processes(appid: int):
        return Memscan.__call(lib.GetGameProcesses, appid)

    @staticmethod
    def select_game_process(appid: int, pid: int):
        return Memscan.__call(lib.SelectGameProcess, appid, pid)

    @staticmethod
    def auto_select_game_process(appid: int):
        return Memscan.__call(lib.AutoSelectGameProcess, appid)

    @staticmethod
    def first_scan(appid: int, value: str, value_type: int, option: int):
        return Memscan.__call(lib.FirstScan, appid, value.encode('utf-8'), value_type, option)

    @staticmethod
    def next_scan(value: str):
        return Memscan.__call(lib.NextScan, value.encode('utf-8'))

    @staticmethod
    def undo_scan():
        return Memscan.__call(lib.UndoScan)

    @staticmethod
    def change_values(value: str, indexes: list):
        count = len(indexes)
        c_array = (ctypes.c_int32 * count)(*indexes)
        return Memscan.__call(lib.ChangeValues, value.encode('utf-8'), c_array, count)

    @staticmethod
    def refresh_values():
        return Memscan.__call(lib.RefreshValues)

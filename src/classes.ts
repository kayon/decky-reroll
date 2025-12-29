export enum InternalRouting {
  Main = 0,
  ProcessDetails = 1,
  Settings = 2
}

export enum ValueTypes {
  Int8 = 1,
  Int16 = 2,
  Int32 = 3,
  Int64 = 4,
  Float32 = 5,
  Float64 = 6,
}

export interface Results {
  Count: number
  List: string[][]
  Round: number
  Time: string
}

export interface Process {
  AppID: number
  PID: number
  PPID: number
  PGRP: number
  Comm: string
  Command: string
  State: number
  RSS: number
}

export interface RollerConfig {
  length: number
  charset: string[]
  hasDecimal: boolean
}

export interface AppGame {
  appid: number
  gameid: string
  display_name: string
  icon_hash: string
  local_cache_version: number
}

export enum ScanOptions {
  FloatUnrounded = 0,
  FloatRounded = 1,
  FloatExtreme = 2,
  FloatTruncated = 3,
}

export const MIN_RESULTS_THRESHOLD = 10
export const MAX_RESULTS_THRESHOLD = 50

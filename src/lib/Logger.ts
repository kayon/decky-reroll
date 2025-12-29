export const log = (name: string, ...args: unknown[]) => {
  console.log(
    `%c Reroll %c ${name} %c`,
    'background: #08667e; color: black;',
    'background: #007d9c; color: black;',
    'background: transparent;',
    ...args
  )
}

export const debug = (name: string, ...args: unknown[]) => {
  console.debug(
    `%c Reroll %c ${name} %c`,
    'background: #08667e; color: black;',
    'background: #007d9c; color: black;',
    'color: blue;',
    ...args
  )
}

export const warn = (name: string, ...args: unknown[]) => {
  console.warn(
    `%c Reroll %c ${name} %c`,
    'background: #08667e; color: black;',
    'background: #ffbb00; color: black;',
    'color: blue;',
    ...args
  )
}

export const error = (name: string, ...args: unknown[]) => {
  console.error(
    `%c Reroll %c ${name} %c`,
    'background: #08667e; color: black;',
    'background: #FF0000;',
    'background: transparent;',
    ...args
  )
}

class Logger {
  static log(name: string, ...args: unknown[]) {
    log(name, ...args)
  }

  static debug(name: string, ...args: unknown[]) {
    debug(name, ...args)
  }

  static warn(name: string, ...args: unknown[]) {
    warn(name, ...args)
  }

  static error(name: string, ...args: unknown[]) {
    error(name, ...args)
  }
}

export default Logger

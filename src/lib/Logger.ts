export const log = (name: string, ...args: any[]) => {
  console.log(
    `%c Reroll %c ${name} %c`,
    'background: #08667e; color: black;',
    'background: #007d9c; color: black;',
    'background: transparent;',
    ...args
  )
}

export const debug = (name: string, ...args: any[]) => {
  console.debug(
    `%c Reroll %c ${name} %c`,
    'background: #08667e; color: black;',
    'background: #007d9c; color: black;',
    'color: blue;',
    ...args
  )
}

export const warn = (name: string, ...args: any[]) => {
  console.warn(
    `%c Reroll %c ${name} %c`,
    'background: #08667e; color: black;',
    'background: #ffbb00; color: black;',
    'color: blue;',
    ...args
  )
}

export const error = (name: string, ...args: any[]) => {
  console.error(
    `%c Reroll %c ${name} %c`,
    'background: #08667e; color: black;',
    'background: #FF0000;',
    'background: transparent;',
    ...args
  )
}

class Logger {
  static log(name: string, ...args: any[]) {
    log(name, ...args)
  }

  static debug(name: string, ...args: any[]) {
    debug(name, ...args)
  }

  static warn(name: string, ...args: any[]) {
    warn(name, ...args)
  }

  static error(name: string, ...args: any[]) {
    error(name, ...args)
  }
}

export default Logger

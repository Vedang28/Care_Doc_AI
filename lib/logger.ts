import * as Sentry from '@sentry/nextjs'

type LogLevel = 'error' | 'warn' | 'info'

interface LogContext {
  [key: string]: unknown
}

function log(level: LogLevel, message: string, context?: LogContext) {
  if (process.env.NODE_ENV === 'development') {
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    fn(`[${level.toUpperCase()}] ${message}`, context ?? '')
  }
}

export const logger = {
  error(message: string, error?: unknown, context?: LogContext) {
    log('error', message, context)
    if (error instanceof Error) {
      Sentry.captureException(error, { extra: context })
    } else {
      Sentry.captureMessage(message, { level: 'error', extra: { error, ...context } })
    }
  },

  warn(message: string, context?: LogContext) {
    log('warn', message, context)
    Sentry.captureMessage(message, { level: 'warning', extra: context })
  },

  info(message: string, context?: LogContext) {
    log('info', message, context)
  },
}

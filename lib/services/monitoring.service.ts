export class MonitoringService {
  private static initialized = false;

  static initialize() {
    if (this.initialized) return;

    const sentryDsn = process.env.SENTRY_DSN;
    if (sentryDsn) {
      console.log('Sentry initialized for error tracking');
    }

    this.initialized = true;
  }

  static captureException(error: Error, context?: Record<string, any>) {
    console.error('Error captured:', error.message, context);

    const sentryDsn = process.env.SENTRY_DSN;
    if (!sentryDsn) return;

    this.sendToSentry({
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date(),
      level: 'error',
    });
  }

  static captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    console.log(`[${level}]`, message);

    const sentryDsn = process.env.SENTRY_DSN;
    if (!sentryDsn) return;

    this.sendToSentry({
      message,
      level,
      timestamp: new Date(),
    });
  }

  private static async sendToSentry(data: any) {
    try {
      const dsn = process.env.SENTRY_DSN;
      if (!dsn) return;

      const url = new URL(dsn);
      const projectId = url.pathname.split('/').pop();
      const key = url.username;

      await fetch(`https://sentry.io/api/${projectId}/store/`, {
        method: 'POST',
        headers: {
          'X-Sentry-Auth': `Sentry sentry_key=${key}, sentry_version=7`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: data.message || data.error,
          level: data.level,
          timestamp: data.timestamp,
          extra: data.context,
          exception: data.stack ? { values: [{ stacktrace: { frames: [] } }] } : undefined,
        }),
      });
    } catch (error) {
      console.error('Failed to send to Sentry:', error);
    }
  }

  static recordMetric(name: string, value: number, tags?: Record<string, string>) {
    console.log(`Metric: ${name} = ${value}`, tags);
  }

  static recordApiLatency(endpoint: string, latencyMs: number) {
    this.recordMetric(`api.latency.${endpoint}`, latencyMs, { endpoint });
  }

  static recordQueueJob(queueName: string, jobType: string, durationMs: number, status: 'success' | 'failed') {
    this.recordMetric(`queue.${queueName}.duration`, durationMs, { jobType, status });
  }
}

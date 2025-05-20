export function redactSensitiveData(obj: object | string): void {
  if (typeof obj !== 'object' || obj == undefined) return;

  const sensitiveKeys = ['password', 'idToken', 'newPassword'];

  for (const key in obj) {
    if (sensitiveKeys.includes(key)) {
      obj[key] = '[REDACTED]';
      continue;
    }

    redactSensitiveData(obj[key]);
  }
}

export function redactWsSensitiveData(obj: object | string): void {
  if (typeof obj !== 'object' || obj == undefined) return;

  const sensitiveKeys = ['password', 'idToken', 'newPassword', 'token', 'message'];

  for (const key in obj) {
    if (sensitiveKeys.includes(key)) {
      obj[key] = '[REDACTED]';
      continue;
    }

    redactSensitiveData(obj[key]);
  }
}

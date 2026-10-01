const EMAIL_SETTING_SOURCES = Object.freeze({
  EMAIL_HOST: ['EMAIL_HOST', 'SMTP_HOST', 'MAIL_HOST'],
  EMAIL_PORT: ['EMAIL_PORT', 'SMTP_PORT'],
  EMAIL_USER: ['EMAIL_USER', 'SMTP_USER', 'MAIL_USER'],
  EMAIL_PASS: ['EMAIL_PASS', 'EMAIL_PASSWORD', 'SMTP_PASS', 'MAIL_PASSWORD'],
  EMAIL_FROM: ['EMAIL_FROM'],
});

function firstConfiguredValue(env, names) {
  for (const name of names) {
    const value = env[name];
    if (typeof value === 'string' && value.trim() !== '') {
      return { value: value.trim(), source: name };
    }
  }
  return { value: undefined, source: undefined };
}

function resolveEmailConfig(env = process.env) {
  const resolved = Object.fromEntries(
    Object.entries(EMAIL_SETTING_SOURCES).map(([setting, names]) => [
      setting,
      firstConfiguredValue(env, names),
    ])
  );

  const missing = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS']
    .filter((setting) => !resolved[setting].value);
  const configuredPort = resolved.EMAIL_PORT.value;
  const port = configuredPort === undefined ? 587 : Number(configuredPort);
  const invalid = [];

  if (configuredPort !== undefined && (!Number.isInteger(port) || port < 1 || port > 65535)) {
    invalid.push('EMAIL_PORT');
  }

  const aliases = Object.entries(resolved)
    .filter(([setting, result]) => result.source && result.source !== setting)
    .map(([setting, result]) => ({ setting, source: result.source }));

  return {
    host: resolved.EMAIL_HOST.value,
    port,
    user: resolved.EMAIL_USER.value,
    pass: resolved.EMAIL_PASS.value,
    from: resolved.EMAIL_FROM.value || resolved.EMAIL_USER.value,
    sources: Object.fromEntries(
      Object.entries(resolved).map(([setting, result]) => [setting, result.source || null])
    ),
    missing,
    invalid,
    aliases,
    configured: missing.length === 0 && invalid.length === 0,
  };
}

function getTransportOptions(config) {
  return {
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    requireTLS: config.port === 587,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  };
}

module.exports = { resolveEmailConfig, getTransportOptions };

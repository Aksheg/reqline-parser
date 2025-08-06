const appLogger = {
  info: (message, data = null) => {
    console.log(`[INFO] ${new Date().toISOString()}: ${message}`, data || '');
  },
  error: (message, error = null) => {
    console.error(`[ERROR] ${new Date().toISOString()}: ${message}`, error || '');
  },
  warn: (message, data = null) => {
    console.warn(`[WARN] ${new Date().toISOString()}: ${message}`, data || '');
  }
};

const timeLogger = {
  start: (label) => {
    console.time(label);
  },
  end: (label) => {
    console.timeEnd(label);
  }
};

module.exports = {
  appLogger,
  timeLogger
};
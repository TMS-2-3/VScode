const STAMP_LOG_STORAGE_KEY = "auto-scroll-action:stamp-log";
const stampDateFormatter = new Intl.DateTimeFormat("ja-JP", {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export function createStampCollection({
  storage = getDefaultStorage(),
  now = () => new Date(),
} = {}) {
  let collected = false;
  let completed = false;
  let latestLog = loadLog(storage);

  function collect() {
    if (collected || completed) {
      return false;
    }

    collected = true;
    return true;
  }

  function finishRun() {
    if (completed) {
      return null;
    }

    completed = true;
    if (!collected) {
      return null;
    }

    latestLog = { gameOverAt: now().toISOString() };
    try {
      // Replace a single record; starting another run does not erase it.
      storage?.setItem(STAMP_LOG_STORAGE_KEY, JSON.stringify(latestLog));
    } catch {
      // The latest record remains available for this session without storage.
    }
    return { ...latestLog };
  }

  function reset() {
    collected = false;
    completed = false;
  }

  return {
    collect,
    finishRun,
    getLatestLog: () => latestLog ? { ...latestLog } : null,
    hasStamp: () => collected,
    reset,
  };
}

export function formatStampTimestamp(timestamp) {
  return stampDateFormatter.format(new Date(timestamp));
}

function getDefaultStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function loadLog(storage) {
  try {
    const record = JSON.parse(storage?.getItem(STAMP_LOG_STORAGE_KEY) ?? "null");
    if (
      !record ||
      Array.isArray(record) ||
      typeof record.gameOverAt !== "string" ||
      !Number.isFinite(Date.parse(record.gameOverAt))
    ) {
      return null;
    }
    return { gameOverAt: new Date(record.gameOverAt).toISOString() };
  } catch {
    return null;
  }
}

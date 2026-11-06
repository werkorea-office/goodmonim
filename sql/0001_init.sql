-- 굿모님 기본 테이블
CREATE TABLE IF NOT EXISTS plays (
  device TEXT NOT NULL,
  day TEXT NOT NULL,          -- 한국 날짜 YYYY-MM-DD
  gen TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  oks TEXT NOT NULL,          -- 문제별 정답 여부 JSON 예: [1,0,1,1,1,0]
  streak INTEGER,
  ref TEXT,                   -- 초대한 사람(기기 앞 10자리)
  created_at INTEGER NOT NULL,
  PRIMARY KEY (device, day)
);
CREATE INDEX IF NOT EXISTS plays_day_gen ON plays(day, gen);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day TEXT NOT NULL,
  type TEXT NOT NULL,         -- visit, invite_open, share_brag, share_invite, copy
  device TEXT,
  gen TEXT,
  ref TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS events_day_type ON events(day, type);

-- 리그 자동 독립 기록 (한 번 독립하면 유지)
CREATE TABLE IF NOT EXISTS league_splits (gen TEXT PRIMARY KEY, since TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);

export async function up(pgm) {
  pgm.sql(`
    CREATE TABLE users (
      id uuid PRIMARY KEY,
      name varchar(120) NOT NULL,
      email varchar(254) NOT NULL UNIQUE,
      password_hash text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE goals (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title varchar(200) NOT NULL,
      description varchar(2000) NOT NULL DEFAULT '',
      deadline date NOT NULL,
      priority varchar(6) NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
      target_hours double precision NOT NULL CHECK (target_hours > 0 AND target_hours <= 168),
      scheduled_hours double precision NOT NULL DEFAULT 0 CHECK (scheduled_hours >= 0),
      status varchar(8) NOT NULL CHECK (status IN ('On track', 'At risk')),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX goals_user_deadline_idx ON goals (user_id, deadline);

    CREATE TABLE commitments (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title varchar(200) NOT NULL,
      days text[] NOT NULL CHECK (
        cardinality(days) > 0 AND
        days <@ ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']::text[]
      ),
      start_time varchar(5) NOT NULL CHECK (start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
      end_time varchar(5) NOT NULL CHECK (end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
      protected boolean NOT NULL,
      type varchar(9) NOT NULL CHECK (type IN ('Fixed', 'Protected', 'Personal')),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CHECK (start_time <> end_time)
    );
    CREATE INDEX commitments_user_idx ON commitments (user_id);

    CREATE TABLE schedules (
      id uuid PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      week_of date NOT NULL CHECK (EXTRACT(ISODOW FROM week_of) = 1),
      sessions jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(sessions) = 'array'),
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (user_id, week_of)
    );
  `);
}

export async function down(pgm) {
  pgm.sql(`
    DROP TABLE schedules;
    DROP TABLE commitments;
    DROP TABLE goals;
    DROP TABLE users;
  `);
}
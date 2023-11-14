\echo
\'Delete and recreate event_app db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE event_app;
CREATE DATABASE event_app;
\connect event_app

\i event_app-schema.sql
-- \i event_app-seed.sql

\echo 'Delete and recreate event_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE event_test;
CREATE DATABASE event_test;
\connect event_test

\i event_app-schema.sql

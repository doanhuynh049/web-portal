/**
 * Database connection for the Web Portal — Neon PostgreSQL via HTTP driver.
 *
 * Uses neon-http (HTTP/fetch-based) not websockets — works in serverless and
 * all environments including those that restrict WebSocket connections.
 *
 * Tables are auto-created on first request (idempotent DDL per table).
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn(
    "[web-portal] DATABASE_URL not set — using local JSON file store."
  );
}

const sqlHttp = DATABASE_URL ? neon(DATABASE_URL) : null;

/** Drizzle client — undefined when DATABASE_URL is missing. */
export const db = sqlHttp ? drizzle(sqlHttp, { schema }) : null;

/** True when Neon DB is configured. */
export const hasDb = !!db;

// ── DDL: each table as a separate statement (neon HTTP = one stmt at a time) ─

let tablesInitialized = false;

export async function ensureTables(): Promise<void> {
  if (!DATABASE_URL || !sqlHttp || tablesInitialized) return;
  try {
    // Execute each CREATE TABLE separately — neon HTTP supports one stmt/call
    await sqlHttp`
      CREATE TABLE IF NOT EXISTS portal_categories (
        id           TEXT    PRIMARY KEY,
        name         TEXT    NOT NULL,
        color        TEXT    NOT NULL,
        description  TEXT,
        "order"      INTEGER NOT NULL DEFAULT 0
      )
    `;
    await sqlHttp`
      CREATE TABLE IF NOT EXISTS portal_links (
        id              TEXT    PRIMARY KEY,
        title           TEXT    NOT NULL,
        url             TEXT    NOT NULL,
        category_id     TEXT    NOT NULL,
        link_type       TEXT    NOT NULL,
        purpose         TEXT    DEFAULT '',
        usage_guide     TEXT    DEFAULT '',
        known_issues    TEXT    DEFAULT '',
        tags            TEXT    DEFAULT '[]',
        status          TEXT    NOT NULL DEFAULT 'unchecked',
        last_checked_at TEXT,
        pinned          BOOLEAN NOT NULL DEFAULT FALSE,
        last_opened_at  TEXT,
        project_id      TEXT,
        created_at      TEXT    NOT NULL,
        updated_at      TEXT    NOT NULL
      )
    `;
    await sqlHttp`
      CREATE TABLE IF NOT EXISTS portal_projects (
        id           TEXT PRIMARY KEY,
        name         TEXT NOT NULL,
        description  TEXT DEFAULT '',
        category_id  TEXT NOT NULL,
        link_ids     TEXT DEFAULT '[]',
        tech_stack   TEXT DEFAULT '[]',
        backlog      TEXT DEFAULT '[]',
        dev_notes    TEXT DEFAULT '',
        created_at   TEXT NOT NULL,
        updated_at   TEXT NOT NULL
      )
    `;
    await sqlHttp`
      CREATE TABLE IF NOT EXISTS portal_settings (
        id                   INTEGER PRIMARY KEY DEFAULT 1,
        theme                TEXT    NOT NULL DEFAULT 'dark',
        default_view         TEXT    NOT NULL DEFAULT 'links',
        profile_name         TEXT    NOT NULL DEFAULT 'Quoc Thien',
        profile_initial      TEXT    NOT NULL DEFAULT 'Q',
        profile_avatar_color TEXT    NOT NULL DEFAULT '#3b82f6',
        profile_role         TEXT    NOT NULL DEFAULT 'Software Developer',
        profile_avatar_icon  TEXT    DEFAULT '',
        version              INTEGER NOT NULL DEFAULT 2
      )
    `;
    await sqlHttp`
      ALTER TABLE portal_settings ADD COLUMN IF NOT EXISTS profile_avatar_icon TEXT DEFAULT ''
    `;
    await sqlHttp`
      CREATE TABLE IF NOT EXISTS portal_users (
        id            TEXT PRIMARY KEY,
        email         TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name          TEXT NOT NULL DEFAULT '',
        created_at    TEXT NOT NULL
      )
    `;
    tablesInitialized = true;
    console.log("[web-portal] DB tables ready ✓");
  } catch (err) {
    console.error("[web-portal] Failed to initialize DB tables:", err);
    throw err;
  }
}

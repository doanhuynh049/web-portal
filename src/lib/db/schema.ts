/**
 * Drizzle ORM schema — Neon PostgreSQL tables for the Web Portal.
 *
 * Tables:
 *  portal_categories  — link categories with display order
 *  portal_links       — individual links with all metadata
 *  portal_projects    — project groups (aggregate multiple links)
 *  portal_settings    — single-row portal-wide settings
 */
import {
  pgTable,
  text,
  boolean,
  integer,
} from "drizzle-orm/pg-core";

export const portalCategories = pgTable("portal_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  description: text("description"),
  order: integer("order").notNull().default(0),
});

export const portalLinks = pgTable("portal_links", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  categoryId: text("category_id").notNull(),
  linkType: text("link_type").notNull(),
  purpose: text("purpose").default(""),
  usageGuide: text("usage_guide").default(""),
  knownIssues: text("known_issues").default(""),
  /** Stored as JSON string: string[] */
  tags: text("tags").default("[]"),
  status: text("status").notNull().default("unchecked"),
  lastCheckedAt: text("last_checked_at"),
  pinned: boolean("pinned").notNull().default(false),
  lastOpenedAt: text("last_opened_at"),
  projectId: text("project_id"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const portalProjects = pgTable("portal_projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").default(""),
  categoryId: text("category_id").notNull(),
  /** Stored as JSON string: string[] */
  linkIds: text("link_ids").default("[]"),
  /** Stored as JSON string: string[] */
  techStack: text("tech_stack").default("[]"),
  /** Stored as JSON string: string[] */
  backlog: text("backlog").default("[]"),
  devNotes: text("dev_notes").default(""),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const portalUsers = pgTable("portal_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default(""),
  createdAt: text("created_at").notNull(),
});

export const portalSettings = pgTable("portal_settings", {
  id: integer("id").primaryKey().default(1),
  theme: text("theme").notNull().default("dark"),
  defaultView: text("default_view").notNull().default("links"),
  profileName: text("profile_name").notNull().default("Quoc Thien"),
  profileInitial: text("profile_initial").notNull().default("Q"),
  profileAvatarColor: text("profile_avatar_color").notNull().default("#3b82f6"),
  profileRole: text("profile_role").notNull().default("Software Developer"),
  profileAvatarIcon: text("profile_avatar_icon").default(""),
  version: integer("version").notNull().default(2),
});

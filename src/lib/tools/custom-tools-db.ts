"use client";

import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import type { CustomToolDefinition } from "./types";

interface CustomToolsDB extends DBSchema {
  tools: {
    key: string;
    value: CustomToolDefinition;
    indexes: {
      "by-created": number;
      "by-slug": string;
    };
  };
}

const DB_NAME = "orle-custom-tools";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<CustomToolsDB>> | null = null;

function getDB(): Promise<IDBPDatabase<CustomToolsDB>> {
  if (!dbPromise) {
    dbPromise = openDB<CustomToolsDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore("tools", { keyPath: "id" });
        store.createIndex("by-created", "createdAt");
        store.createIndex("by-slug", "slug", { unique: true });
      },
    });
  }
  return dbPromise;
}

/**
 * Save a custom tool to IndexedDB
 */
export async function saveCustomTool(
  tool: CustomToolDefinition,
): Promise<void> {
  const db = await getDB();
  await db.put("tools", tool);
}

/**
 * Get a custom tool by ID
 */
export async function getCustomTool(
  id: string,
): Promise<CustomToolDefinition | undefined> {
  const db = await getDB();
  return db.get("tools", id);
}

/**
 * Get a custom tool by slug
 */
export async function getCustomToolBySlug(
  slug: string,
): Promise<CustomToolDefinition | undefined> {
  const db = await getDB();
  return db.getFromIndex("tools", "by-slug", slug);
}

/**
 * List all custom tools, ordered by creation date (newest first)
 */
export async function listCustomTools(): Promise<CustomToolDefinition[]> {
  const db = await getDB();
  const tools = await db.getAllFromIndex("tools", "by-created");
  return tools.reverse(); // Newest first
}

/**
 * Delete a custom tool by ID
 */
export async function deleteCustomTool(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("tools", id);
}

/**
 * Check if a slug is already taken
 */
export async function isSlugTaken(slug: string): Promise<boolean> {
  const tool = await getCustomToolBySlug(slug);
  return tool !== undefined;
}

/**
 * Update a custom tool
 */
export async function updateCustomTool(
  id: string,
  updates: Partial<Omit<CustomToolDefinition, "id" | "createdAt" | "isCustom">>,
): Promise<CustomToolDefinition | undefined> {
  const db = await getDB();
  const existing = await db.get("tools", id);
  if (!existing) return undefined;

  const updated: CustomToolDefinition = {
    ...existing,
    ...updates,
    updatedAt: Date.now(),
  };
  await db.put("tools", updated);
  return updated;
}

/**
 * Generate a unique slug by appending a number if needed
 */
export async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (await isSlugTaken(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Export all custom tools as JSON
 */
export async function exportCustomTools(): Promise<string> {
  const tools = await listCustomTools();
  return JSON.stringify(tools, null, 2);
}

/**
 * Import custom tools from JSON
 */
export async function importCustomTools(json: string): Promise<number> {
  const tools = JSON.parse(json) as CustomToolDefinition[];
  const db = await getDB();
  let imported = 0;

  for (const tool of tools) {
    // Generate new ID and unique slug to avoid conflicts
    const newTool: CustomToolDefinition = {
      ...tool,
      id: crypto.randomUUID(),
      slug: await generateUniqueSlug(tool.slug),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isCustom: true,
    };
    await db.put("tools", newTool);
    imported++;
  }

  return imported;
}

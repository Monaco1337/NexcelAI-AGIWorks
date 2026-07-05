/**
 * NEXCEL AI / AGI WORKS · Systems Store
 * Postgres-backed CRUD für Systemkarten — statischer Fallback auf systems-data.tsx.
 */

import { db } from "@/lib/pg";
import { SYSTEMS } from "@/lib/systems-data";

// ─── Public type ─────────────────────────────────────────────────────────────

export type SystemCardEntry = {
  id: string;
  slug: string;
  category: string;
  title: string;
  tagline: string;
  desc: string;
  longDesc: string;
  bullets: string[];
  details: string[];
  image: string;
  alt: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt?: string;
};

// ─── DB row shape ─────────────────────────────────────────────────────────────

type DbSystem = {
  id: string;
  slug: string;
  category: string;
  title: string;
  tagline: string;
  desc: string;
  long_desc: string;
  bullets: string[];
  details: string[];
  image: string;
  alt: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
};

function rowToEntry(r: DbSystem): SystemCardEntry {
  return {
    id: r.id,
    slug: r.slug,
    category: r.category,
    title: r.title,
    tagline: r.tagline,
    desc: r.desc,
    longDesc: r.long_desc,
    bullets: r.bullets ?? [],
    details: r.details ?? [],
    image: r.image,
    alt: r.alt,
    sortOrder: r.sort_order,
    isPublished: r.is_published,
    createdAt: r.created_at,
  };
}

/** Map the category to a slug for slug inference */
const CATEGORY_SLUGS: Record<string, string> = {
  vertrieb: "vertrieb",
  kunden: "kunden",
  unternehmen: "unternehmen",
  ki: "ki",
  plattformen: "plattformen",
};

/** Convert static SYSTEMS entries to SystemCardEntry */
function staticToEntry(s: (typeof SYSTEMS)[number], idx: number): SystemCardEntry {
  // Derive category from which CATEGORY bucket this slug belongs to
  let category = "unternehmen";
  if (["lead-funnels-crm", "vertriebsplattform-partnerportal", "angebots-beratungssystem"].includes(s.slug)) category = "vertrieb";
  else if (["kundenportal-self-service", "buchungs-beauty-systeme", "mitglieder-clubverwaltung", "service-supportportal", "omnichannel-kommunikation"].includes(s.slug)) category = "kunden";
  else if (["ki-automatisierung", "ki-telefonagent-voice"].includes(s.slug)) category = "ki";
  else if (["premium-websysteme", "branchen-plattformen", "saas-plattform-multi-tenant", "akademie-lernplattform", "schnittstellen-integrationen"].includes(s.slug)) category = "plattformen";

  return {
    id: `static_${s.slug}`,
    slug: s.slug,
    category,
    title: s.title,
    tagline: s.tagline,
    desc: s.desc,
    longDesc: s.longDesc,
    bullets: s.bullets,
    details: s.details,
    image: s.image,
    alt: s.alt,
    sortOrder: idx,
    isPublished: true,
  };
}

/** Seed static systems into DB (idempotent) */
async function seedIfEmpty(client: Awaited<ReturnType<typeof db>>) {
  if (!client) return;
  const rows = await client`SELECT id FROM systems_cards LIMIT 1`;
  if (rows.length > 0) return;
  for (let i = 0; i < SYSTEMS.length; i++) {
    const s = SYSTEMS[i];
    const entry = staticToEntry(s, i);
    await client`
      INSERT INTO systems_cards
        (id, slug, category, title, tagline, desc, long_desc,
         bullets, details, image, alt, sort_order, is_published, created_at, updated_at)
      VALUES (
        ${entry.id}, ${entry.slug}, ${entry.category}, ${entry.title}, ${entry.tagline},
        ${entry.desc}, ${entry.longDesc},
        ${JSON.stringify(entry.bullets)}, ${JSON.stringify(entry.details)},
        ${entry.image}, ${entry.alt}, ${entry.sortOrder}, ${entry.isPublished},
        NOW(), NOW()
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getAllSystems(): Promise<SystemCardEntry[]> {
  const client = await db();
  if (!client) return SYSTEMS.map(staticToEntry);
  await seedIfEmpty(client);
  const rows = await client<DbSystem[]>`
    SELECT * FROM systems_cards ORDER BY sort_order ASC, created_at ASC
  `;
  return rows.map(rowToEntry);
}

export async function getPublishedSystems(): Promise<SystemCardEntry[]> {
  const client = await db();
  if (!client) return SYSTEMS.map(staticToEntry).filter((s) => s.isPublished);
  await seedIfEmpty(client);
  const rows = await client<DbSystem[]>`
    SELECT * FROM systems_cards
    WHERE is_published = TRUE
    ORDER BY sort_order ASC, created_at ASC
  `;
  return rows.map(rowToEntry);
}

export async function getSystemById(id: string): Promise<SystemCardEntry | null> {
  const client = await db();
  if (!client) return SYSTEMS.map(staticToEntry).find((s) => s.id === id) ?? null;
  const rows = await client<DbSystem[]>`
    SELECT * FROM systems_cards WHERE id = ${id} LIMIT 1
  `;
  return rows.length ? rowToEntry(rows[0]) : null;
}

export async function getSystemBySlug(slug: string): Promise<SystemCardEntry | null> {
  const client = await db();
  if (!client) return SYSTEMS.map(staticToEntry).find((s) => s.slug === slug) ?? null;
  await seedIfEmpty(client);
  const rows = await client<DbSystem[]>`
    SELECT * FROM systems_cards WHERE slug = ${slug} LIMIT 1
  `;
  return rows.length ? rowToEntry(rows[0]) : null;
}

export type CreateSystemInput = Omit<SystemCardEntry, "id" | "createdAt">;

export async function createSystem(id: string, input: CreateSystemInput): Promise<boolean> {
  const client = await db();
  if (!client) return false;
  await client`
    INSERT INTO systems_cards
      (id, slug, category, title, tagline, desc, long_desc,
       bullets, details, image, alt, sort_order, is_published, created_at, updated_at)
    VALUES (
      ${id}, ${input.slug}, ${input.category}, ${input.title}, ${input.tagline},
      ${input.desc}, ${input.longDesc},
      ${JSON.stringify(input.bullets)}, ${JSON.stringify(input.details)},
      ${input.image}, ${input.alt}, ${input.sortOrder}, ${input.isPublished},
      NOW(), NOW()
    )
  `;
  return true;
}

export type UpdateSystemInput = Partial<CreateSystemInput>;

export async function updateSystem(id: string, input: UpdateSystemInput): Promise<boolean> {
  const client = await db();
  if (!client) return false;
  await client`
    UPDATE systems_cards SET
      slug        = COALESCE(${input.slug ?? null}, slug),
      category    = COALESCE(${input.category ?? null}, category),
      title       = COALESCE(${input.title ?? null}, title),
      tagline     = COALESCE(${input.tagline ?? null}, tagline),
      desc        = COALESCE(${input.desc ?? null}, desc),
      long_desc   = COALESCE(${input.longDesc ?? null}, long_desc),
      bullets     = COALESCE(${input.bullets ? JSON.stringify(input.bullets) : null}::jsonb, bullets),
      details     = COALESCE(${input.details ? JSON.stringify(input.details) : null}::jsonb, details),
      image       = COALESCE(${input.image ?? null}, image),
      alt         = COALESCE(${input.alt ?? null}, alt),
      sort_order  = COALESCE(${input.sortOrder ?? null}, sort_order),
      is_published = COALESCE(${input.isPublished ?? null}, is_published),
      updated_at  = NOW()
    WHERE id = ${id}
  `;
  return true;
}

export async function deleteSystem(id: string): Promise<boolean> {
  const client = await db();
  if (!client) return false;
  await client`DELETE FROM systems_cards WHERE id = ${id}`;
  return true;
}

export async function updateSystemCoverImage(
  id: string,
  data: Buffer,
  contentType: string,
): Promise<boolean> {
  const client = await db();
  if (!client) return false;
  await client`
    UPDATE systems_cards
    SET cover_image_data   = ${data},
        cover_content_type = ${contentType},
        image              = ${`/api/admin/systems/${id}/cover`},
        updated_at         = NOW()
    WHERE id = ${id}
  `;
  return true;
}

export async function updateSystemSortOrders(
  order: { id: string; sortOrder: number }[],
): Promise<boolean> {
  const client = await db();
  if (!client) return false;
  for (const { id, sortOrder } of order) {
    await client`
      UPDATE systems_cards SET sort_order = ${sortOrder}, updated_at = NOW() WHERE id = ${id}
    `;
  }
  return true;
}

export { CATEGORY_SLUGS };

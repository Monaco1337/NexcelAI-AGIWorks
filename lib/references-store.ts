/**
 * NEXCEL AI / AGI WORKS · References Store
 * Postgres-backed CRUD mit statischem Fallback.
 */

import { db } from "@/lib/pg";
import { STATIC_REFERENCES, ReferenceEntry } from "@/lib/references-data";

export type { ReferenceEntry };

export type DbReference = {
  id: string;
  slug: string;
  title: string;
  client_name: string;
  short_description: string;
  full_description: string;
  type: string;
  tags: string[];
  modules: string[];
  website_url: string | null;
  status: string;
  cover_image: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

function rowToEntry(r: DbReference): ReferenceEntry {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    clientName: r.client_name,
    shortDescription: r.short_description,
    fullDescription: r.full_description,
    type: r.type,
    tags: r.tags ?? [],
    modules: r.modules ?? [],
    websiteUrl: r.website_url ?? undefined,
    status: r.status as ReferenceEntry["status"],
    coverImage: r.cover_image,
    sortOrder: r.sort_order,
    isPublished: r.is_published,
    createdAt: r.created_at,
  };
}

/** Ensure the 9 static references exist in DB (idempotent) */
async function seedIfEmpty(client: Awaited<ReturnType<typeof db>>) {
  if (!client) return;
  const rows = await client`SELECT id FROM references_projects LIMIT 1`;
  if (rows.length > 0) return;
  for (const ref of STATIC_REFERENCES) {
    await client`
      INSERT INTO references_projects
        (id, slug, title, client_name, short_description, full_description,
         type, tags, modules, website_url, status, cover_image,
         sort_order, is_published, created_at, updated_at)
      VALUES (
        ${ref.id}, ${ref.slug}, ${ref.title}, ${ref.clientName},
        ${ref.shortDescription}, ${ref.fullDescription},
        ${ref.type}, ${ref.tags}, ${ref.modules},
        ${ref.websiteUrl ?? null}, ${ref.status}, ${ref.coverImage},
        ${ref.sortOrder}, ${ref.isPublished},
        ${ref.createdAt}, ${ref.createdAt}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

export async function getPublishedReferences(): Promise<ReferenceEntry[]> {
  const client = await db();
  if (!client) return STATIC_REFERENCES.filter((r) => r.isPublished);
  await seedIfEmpty(client);
  const rows = await client<DbReference[]>`
    SELECT * FROM references_projects
    WHERE is_published = TRUE
    ORDER BY sort_order ASC, created_at ASC
  `;
  return rows.map(rowToEntry);
}

export async function getAllReferences(): Promise<ReferenceEntry[]> {
  const client = await db();
  if (!client) return STATIC_REFERENCES;
  await seedIfEmpty(client);
  const rows = await client<DbReference[]>`
    SELECT * FROM references_projects
    ORDER BY sort_order ASC, created_at ASC
  `;
  return rows.map(rowToEntry);
}

export async function getReferenceBySlug(slug: string): Promise<ReferenceEntry | null> {
  const client = await db();
  if (!client) return STATIC_REFERENCES.find((r) => r.slug === slug) ?? null;
  await seedIfEmpty(client);
  const rows = await client<DbReference[]>`
    SELECT * FROM references_projects WHERE slug = ${slug} LIMIT 1
  `;
  return rows.length ? rowToEntry(rows[0]) : null;
}

export async function getReferenceById(id: string): Promise<ReferenceEntry | null> {
  const client = await db();
  if (!client) return STATIC_REFERENCES.find((r) => r.id === id) ?? null;
  const rows = await client<DbReference[]>`
    SELECT * FROM references_projects WHERE id = ${id} LIMIT 1
  `;
  return rows.length ? rowToEntry(rows[0]) : null;
}

export type CreateReferenceInput = {
  id: string;
  slug: string;
  title: string;
  clientName: string;
  shortDescription: string;
  fullDescription: string;
  type: string;
  tags: string[];
  modules: string[];
  websiteUrl?: string;
  status: string;
  coverImage: string;
  sortOrder: number;
  isPublished: boolean;
};

export async function createReference(input: CreateReferenceInput): Promise<boolean> {
  const client = await db();
  if (!client) return false;
  await client`
    INSERT INTO references_projects
      (id, slug, title, client_name, short_description, full_description,
       type, tags, modules, website_url, status, cover_image,
       sort_order, is_published, created_at, updated_at)
    VALUES (
      ${input.id}, ${input.slug}, ${input.title}, ${input.clientName},
      ${input.shortDescription}, ${input.fullDescription},
      ${input.type}, ${input.tags}, ${input.modules},
      ${input.websiteUrl ?? null}, ${input.status}, ${input.coverImage},
      ${input.sortOrder}, ${input.isPublished},
      NOW(), NOW()
    )
  `;
  return true;
}

export type UpdateReferenceInput = Partial<Omit<CreateReferenceInput, "id" | "slug">>;

export async function updateReference(id: string, input: UpdateReferenceInput): Promise<boolean> {
  const client = await db();
  if (!client) return false;
  await client`
    UPDATE references_projects SET
      title             = COALESCE(${input.title ?? null}, title),
      client_name       = COALESCE(${input.clientName ?? null}, client_name),
      short_description = COALESCE(${input.shortDescription ?? null}, short_description),
      full_description  = COALESCE(${input.fullDescription ?? null}, full_description),
      type              = COALESCE(${input.type ?? null}, type),
      tags              = COALESCE(${input.tags ?? null}::text[], tags),
      modules           = COALESCE(${input.modules ?? null}::text[], modules),
      website_url       = ${input.websiteUrl !== undefined ? (input.websiteUrl || null) : client`website_url`},
      status            = COALESCE(${input.status ?? null}, status),
      cover_image       = COALESCE(${input.coverImage ?? null}, cover_image),
      sort_order        = COALESCE(${input.sortOrder ?? null}, sort_order),
      is_published      = COALESCE(${input.isPublished ?? null}, is_published),
      updated_at        = NOW()
    WHERE id = ${id}
  `;
  return true;
}

export async function deleteReference(id: string): Promise<boolean> {
  const client = await db();
  if (!client) return false;
  await client`DELETE FROM references_projects WHERE id = ${id}`;
  return true;
}

export async function updateSortOrders(items: { id: string; sortOrder: number }[]): Promise<boolean> {
  const client = await db();
  if (!client) return false;
  for (const item of items) {
    await client`
      UPDATE references_projects SET sort_order = ${item.sortOrder}, updated_at = NOW()
      WHERE id = ${item.id}
    `;
  }
  return true;
}

// ──────────────── Reference Images ────────────────

export type ReferenceImageEntry = {
  id: string;
  referenceId: string;
  url: string;
  alt: string;
  sortOrder: number;
};

export async function getReferenceImages(referenceId: string): Promise<ReferenceImageEntry[]> {
  const client = await db();
  if (!client) return [];
  const rows = await client<{ id: string; reference_id: string; alt: string; sort_order: number }[]>`
    SELECT id, reference_id, alt, sort_order FROM reference_images
    WHERE reference_id = ${referenceId}
    ORDER BY sort_order ASC
  `;
  return rows.map((r) => ({
    id: r.id,
    referenceId: r.reference_id,
    url: `/api/admin/references/${referenceId}/images/${r.id}`,
    alt: r.alt,
    sortOrder: r.sort_order,
  }));
}

export async function addReferenceImage(
  id: string,
  referenceId: string,
  imageData: Buffer,
  contentType: string,
  alt: string,
  sortOrder: number,
): Promise<boolean> {
  const client = await db();
  if (!client) return false;
  await client`
    INSERT INTO reference_images (id, reference_id, image_data, content_type, alt, sort_order)
    VALUES (${id}, ${referenceId}, ${imageData}, ${contentType}, ${alt}, ${sortOrder})
  `;
  return true;
}

export async function deleteReferenceImage(id: string): Promise<boolean> {
  const client = await db();
  if (!client) return false;
  await client`DELETE FROM reference_images WHERE id = ${id}`;
  return true;
}

export async function updateReferenceCoverImage(
  id: string,
  imageData: Buffer,
  contentType: string,
): Promise<boolean> {
  const client = await db();
  if (!client) return false;
  const coverPath = `/api/admin/references/${id}/cover`;
  await client`
    UPDATE references_projects SET
      cover_image      = ${coverPath},
      cover_image_data = ${imageData},
      cover_content_type = ${contentType},
      updated_at       = NOW()
    WHERE id = ${id}
  `;
  return true;
}

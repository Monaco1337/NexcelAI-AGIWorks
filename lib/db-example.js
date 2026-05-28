// Beispiel: Wie man lib/db.js verwendet

import sql from './db.js'

// Beispiel 1: Einfache Query
async function getContacts() {
  const contacts = await sql`
    SELECT * FROM contact_requests 
    ORDER BY created_at DESC
  `
  return contacts
}

// Beispiel 2: Insert
async function createContact(contactData) {
  const [contact] = await sql`
    INSERT INTO contact_requests (
      vorname, nachname, email, telefon, 
      unternehmen, betreff, nachricht
    ) VALUES (
      ${contactData.vorname},
      ${contactData.nachname},
      ${contactData.email},
      ${contactData.telefon},
      ${contactData.unternehmen},
      ${contactData.betreff},
      ${contactData.nachricht}
    )
    RETURNING *
  `
  return contact
}

// Beispiel 3: Update
async function updateContact(id, updates) {
  const [contact] = await sql`
    UPDATE contact_requests
    SET ${sql(updates, 'read', 'archived')}
    WHERE id = ${id}
    RETURNING *
  `
  return contact
}

// Beispiel 4: Delete
async function deleteContact(id) {
  await sql`DELETE FROM contact_requests WHERE id = ${id}`
}

export { getContacts, createContact, updateContact, deleteContact }


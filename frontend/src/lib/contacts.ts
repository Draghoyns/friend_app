import { Capacitor } from '@capacitor/core'
import type { ImportedContact } from '@/types'

export type ContactsResult =
  | { ok: true; contacts: ImportedContact[] }
  | { ok: false; reason: 'denied' | 'unsupported' | 'error'; message: string }

/** True only where the address book can actually be read — the phone build. */
export const contactsAvailable = () => Capacitor.isNativePlatform()

/**
 * Read the address book, whole, so the import modal can search it locally.
 *
 * Phone only. The browser's Contact Picker API hands back one OS-sheet
 * selection rather than a list, which made for a second, worse import flow on
 * a build nobody adds friends from — so the web simply has no import.
 */
export async function loadContacts(): Promise<ContactsResult> {
  if (!contactsAvailable()) {
    return {
      ok: false,
      reason: 'unsupported',
      message: 'Importing contacts only works in the phone app. Add the friend by hand instead.',
    }
  }
  try {
    const { Contacts } = await import('@capacitor-community/contacts')
    const perm = await Contacts.requestPermissions()
    if (perm.contacts !== 'granted') {
      return { ok: false, reason: 'denied', message: 'Orbit needs contacts permission to import friends.' }
    }
    const { contacts } = await Contacts.getContacts({
      projection: { name: true, phones: true, emails: true },
    })
    const mapped = contacts
      .map((c, i): ImportedContact => ({
        key:   c.contactId ?? String(i),
        name:  c.name?.display?.trim() || [c.name?.given, c.name?.family].filter(Boolean).join(' ').trim(),
        phone: c.phones?.[0]?.number ?? undefined,
        email: c.emails?.[0]?.address ?? undefined,
      }))
      .filter(c => c.name)
      .sort((a, b) => a.name.localeCompare(b.name))
    return { ok: true, contacts: mapped }
  } catch (e) {
    return { ok: false, reason: 'error', message: e instanceof Error ? e.message : String(e) }
  }
}

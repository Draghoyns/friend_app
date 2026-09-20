import { Capacitor } from '@capacitor/core'
import type { ImportedContact } from '@/types'

export type ContactsResult =
  | { ok: true; contacts: ImportedContact[] }
  | { ok: false; reason: 'denied' | 'unsupported' | 'error'; message: string }

/**
 * Read the address book.
 *
 * On a phone this pulls the whole book at once (via @capacitor-community/contacts)
 * so the import modal can search it locally. In a browser there is no such API —
 * the Contact Picker API only hands back what the user picks in the OS sheet, so
 * on web the "search" is the OS sheet itself and we get back the selection.
 */
export async function loadContacts(): Promise<ContactsResult> {
  if (Capacitor.isNativePlatform()) return loadNativeContacts()
  return loadWebContacts()
}

async function loadNativeContacts(): Promise<ContactsResult> {
  try {
    const { Contacts } = await import('@capacitor-community/contacts')
    const perm = await Contacts.requestPermissions()
    if (perm.contacts !== 'granted') {
      return { ok: false, reason: 'denied', message: 'Orbit needs contacts permission to import friends.' }
    }
    const { contacts } = await Contacts.getContacts({
      projection: { name: true, phones: true, emails: true, image: true },
    })
    const mapped = contacts
      .map((c, i): ImportedContact => ({
        key:   c.contactId ?? String(i),
        name:  c.name?.display?.trim() || [c.name?.given, c.name?.family].filter(Boolean).join(' ').trim(),
        phone: c.phones?.[0]?.number ?? undefined,
        email: c.emails?.[0]?.address ?? undefined,
        photo: c.image?.base64String ? `data:image/jpeg;base64,${c.image.base64String}` : undefined,
      }))
      .filter(c => c.name)
      .sort((a, b) => a.name.localeCompare(b.name))
    return { ok: true, contacts: mapped }
  } catch (e) {
    return { ok: false, reason: 'error', message: e instanceof Error ? e.message : String(e) }
  }
}

interface ContactPickerNavigator extends Navigator {
  contacts?: {
    select: (props: string[], opts?: { multiple?: boolean }) => Promise<
      Array<{ name?: string[]; tel?: string[]; email?: string[] }>
    >
  }
}

async function loadWebContacts(): Promise<ContactsResult> {
  const picker = (navigator as ContactPickerNavigator).contacts
  if (!picker) {
    return {
      ok: false,
      reason: 'unsupported',
      message: 'This browser has no contacts API. Install Orbit on your phone, or add the friend by hand.',
    }
  }
  try {
    const picked = await picker.select(['name', 'tel', 'email'], { multiple: true })
    return {
      ok: true,
      contacts: picked
        .map((c, i): ImportedContact => ({
          key:   String(i),
          name:  c.name?.[0]?.trim() ?? '',
          phone: c.tel?.[0],
          email: c.email?.[0],
        }))
        .filter(c => c.name),
    }
  } catch (e) {
    return { ok: false, reason: 'error', message: e instanceof Error ? e.message : String(e) }
  }
}

/** True when the OS sheet is the picker — i.e. we cannot search in-app. */
export const contactsAreOsPicked = () => !Capacitor.isNativePlatform()

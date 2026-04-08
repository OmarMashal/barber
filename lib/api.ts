/**
 * lib/api.ts — Client-side typed API helpers
 *
 * Centralises all fetch calls from admin pages.
 * Each function returns { data, error } — callers handle errors via the
 * error field rather than try/catch.
 *
 * Usage:
 *   const { data, error } = await api.bookings.list('today')
 *   if (error) { setError(error); return }
 */

import type { Booking, Service, BookingStatus } from '@/types'

// ── Generic fetch wrapper ─────────────────────────────────────

type Ok<T>  = { data: T;    error: null;   code?: never }
type Err    = { data: null; error: string; code?: string }
type Result<T> = Ok<T> | Err

async function apiFetch<T>(url: string, init?: RequestInit): Promise<Result<T>> {
  try {
    const res  = await fetch(url, init)
    const json = await res.json()
    if (!res.ok) return { data: null, error: json.error ?? 'Unknown error', code: json.code }
    return { data: json as T, error: null }
  } catch {
    return { data: null, error: 'Network error' }
  }
}

const JSON_HEADERS = { 'Content-Type': 'application/json' }

// ── Bookings ──────────────────────────────────────────────────

export interface BookingWithService extends Booking {
  services: { name: string; price: number; color: string } | null
}

export const bookingsApi = {
  list(filter: 'today' | 'upcoming' | 'all' = 'all') {
    return apiFetch<{ bookings: BookingWithService[] }>(
      `/api/admin/bookings?filter=${filter}`
    )
  },

  create(data: {
    customer_name: string
    customer_phone: string
    service_id: string
    starts_at: string
    notes?: string
  }) {
    return apiFetch<{ id: string }>('/api/admin/bookings', {
      method:  'POST',
      headers: JSON_HEADERS,
      body:    JSON.stringify(data),
    })
  },

  update(id: string, data: { status?: BookingStatus; starts_at?: string }) {
    return apiFetch<{ success: true }>(`/api/admin/bookings/${id}`, {
      method:  'PATCH',
      headers: JSON_HEADERS,
      body:    JSON.stringify(data),
    })
  },

  delete(id: string) {
    return apiFetch<{ success: true }>(`/api/admin/bookings/${id}`, {
      method: 'DELETE',
    })
  },
}

// ── Services ──────────────────────────────────────────────────

type ServicePayload = Pick<Service, 'name' | 'description' | 'duration' | 'price' | 'color' | 'is_active'>

export const servicesApi = {
  list() {
    return apiFetch<{ services: Service[] }>('/api/admin/services')
  },

  create(data: ServicePayload) {
    return apiFetch<{ id: string }>('/api/admin/services', {
      method:  'POST',
      headers: JSON_HEADERS,
      body:    JSON.stringify(data),
    })
  },

  update(id: string, data: Partial<ServicePayload>) {
    return apiFetch<{ success: true }>(`/api/admin/services/${id}`, {
      method:  'PATCH',
      headers: JSON_HEADERS,
      body:    JSON.stringify(data),
    })
  },

  delete(id: string) {
    return apiFetch<{ success: true; soft?: boolean }>(`/api/admin/services/${id}`, {
      method: 'DELETE',
    })
  },
}

// ── Availability ──────────────────────────────────────────────

export interface DaySchedule {
  day_of_week: number
  name_ar:     string
  is_open:     boolean
  open_time:   string
  close_time:  string
}

export interface AvailabilitySettings {
  booking_open:          boolean
  slot_interval_minutes: number
  min_notice_hours:      number
}

export interface BlockedTime {
  id:          string
  reason:      string | null
  starts_at:   string
  ends_at:     string
  is_full_day: boolean
  created_at:  string
}

export const availabilityApi = {
  get() {
    return apiFetch<{ schedule: DaySchedule[]; settings: AvailabilitySettings }>(
      '/api/admin/availability'
    )
  },

  save(schedule: DaySchedule[], settings: Partial<AvailabilitySettings>) {
    return apiFetch<{ success: true }>('/api/admin/availability', {
      method:  'PUT',
      headers: JSON_HEADERS,
      body:    JSON.stringify({ schedule, settings }),
    })
  },

  blocks: {
    list() {
      return apiFetch<{ blocks: BlockedTime[] }>('/api/admin/availability/blocks')
    },

    create(data: { reason?: string; starts_at: string; ends_at: string; is_full_day: boolean }) {
      return apiFetch<{ id: string }>('/api/admin/availability/blocks', {
        method:  'POST',
        headers: JSON_HEADERS,
        body:    JSON.stringify(data),
      })
    },

    delete(id: string) {
      return apiFetch<{ success: true }>(`/api/admin/availability/blocks/${id}`, {
        method: 'DELETE',
      })
    },
  },
}

// ── Gallery ───────────────────────────────────────────────────

export interface GalleryImage {
  id:           string
  storage_path: string
  url:          string
  alt_text:     string | null
  created_at:   string
}

export const galleryApi = {
  list() {
    return apiFetch<{ images: GalleryImage[] }>('/api/admin/gallery')
  },

  save(data: { storage_path: string; url: string; alt_text?: string }) {
    return apiFetch<{ id: string }>('/api/admin/gallery', {
      method:  'POST',
      headers: JSON_HEADERS,
      body:    JSON.stringify(data),
    })
  },

  delete(id: string) {
    return apiFetch<{ success: true }>(`/api/admin/gallery/${id}`, {
      method: 'DELETE',
    })
  },
}

// ── Reviews ───────────────────────────────────────────────────

export interface Review {
  id:            string
  customer_name: string
  rating:        number
  comment:       string | null
  is_approved:   boolean
  created_at:    string
  booking_id:    string | null
}

export const reviewsApi = {
  list() {
    return apiFetch<{ reviews: Review[] }>('/api/admin/reviews')
  },

  toggleApproval(id: string, is_approved: boolean) {
    return apiFetch<{ success: true }>(`/api/admin/reviews/${id}`, {
      method:  'PATCH',
      headers: JSON_HEADERS,
      body:    JSON.stringify({ is_approved }),
    })
  },

  delete(id: string) {
    return apiFetch<{ success: true }>(`/api/admin/reviews/${id}`, {
      method: 'DELETE',
    })
  },
}

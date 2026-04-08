export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'no_show'

export interface Service {
  id: string
  name: string
  description: string | null
  duration: number   // minutes
  price: number
  color: string
  sort_order: number
  is_active?: boolean
}

export interface Booking {
  id: string
  customer_name: string
  customer_phone: string
  service_id: string
  duration: number
  starts_at: string  // ISO 8601 timestamptz
  ends_at: string
  status: BookingStatus
  notes: string | null
  created_at: string
  updated_at: string
  // Joined from services (optional, when fetched with select)
  services?: Pick<Service, 'name' | 'price' | 'duration'>
}

export interface Slot {
  slot_time: string     // local time label e.g. "09:00"
  starts_at: string     // ISO timestamptz (UTC)
  ends_at: string       // ISO timestamptz (UTC)
  is_available: boolean
}

export interface BookingFormData {
  customer_name: string
  customer_phone: string
  service_id: string
  date: string          // YYYY-MM-DD (local date, combined server-side)
  time: string          // HH:MM (local time label from slot)
  starts_at: string     // UTC timestamptz built from slot
  duration: number
  notes: string
}

export interface CalendarDay {
  day_of_week: number   // 0=Sun … 6=Sat
  name_ar: string
  is_open: boolean
  open_time: string
  close_time: string
}

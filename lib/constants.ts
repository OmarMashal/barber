// Static shop identity constants.
// Services, time slots, and working hours are managed in the database
// (services + calendar_settings tables) and fetched via API.

export const SHOP_NAME     = 'صالون الأناقة'
export const BARBER_NAME   = 'محمد العمري'
export const BARBER_PHONE  = '+972 50 000 0000'
export const BARBER_INSTAGRAM = '@salon.handle'
export const SHOP_ADDRESS  = 'القدس، فلسطين'

// Color options for service cards in the admin panel
export const SERVICE_COLORS: { value: string; label: string }[] = [
  { value: '#d4a843', label: 'ذهبي'   },
  { value: '#10b981', label: 'أخضر'   },
  { value: '#6366f1', label: 'بنفسجي' },
  { value: '#ec4899', label: 'وردي'   },
  { value: '#14b8a6', label: 'فيروزي' },
  { value: '#f97316', label: 'برتقالي' },
  { value: '#3b82f6', label: 'أزرق'   },
  { value: '#ef4444', label: 'أحمر'   },
]

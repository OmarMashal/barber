-- =============================================================
-- BARBER BOOKING — COMPLETE DATABASE SCHEMA
-- =============================================================
-- Run in: Supabase Dashboard › SQL Editor › New query
-- Order matters — run the whole file at once.
-- =============================================================


-- =============================================================
-- 0. EXTENSIONS
-- =============================================================

-- btree_gist: required for the GiST index on tstzrange
--             (powers the overlap exclusion trigger)
create extension if not exists btree_gist with schema extensions;


-- =============================================================
-- 1. TABLES
-- =============================================================

-- ── business_settings ─────────────────────────────────────────
-- Single configuration row for the shop.
-- Enforced single-row via CHECK (id = 1).
create table public.business_settings (
  id                     int  primary key default 1,
  constraint single_row  check (id = 1),

  shop_name              text        not null default 'صالون الأناقة',
  phone                  text,
  address                text,
  instagram              text,
  twitter                text,
  about                  text,
  logo_url               text,

  -- Locale
  timezone               text        not null default 'Asia/Jerusalem',
  currency               text        not null default 'ILS',

  -- Booking rules
  slot_interval_minutes  int         not null default 30
                           check (slot_interval_minutes > 0),
  min_notice_hours       int         not null default 1
                           check (min_notice_hours >= 0),
  max_advance_days       int         not null default 30
                           check (max_advance_days > 0),

  -- Global on/off switch — admin can close bookings instantly
  booking_open           boolean     not null default true,

  updated_at             timestamptz not null default now()
);

comment on table  public.business_settings                       is 'Global shop configuration — always exactly one row';
comment on column public.business_settings.slot_interval_minutes is 'Granularity of bookable time slots in minutes (e.g. 30 = slots at :00 and :30)';
comment on column public.business_settings.min_notice_hours      is 'Customers cannot book a slot starting sooner than now + this many hours';
comment on column public.business_settings.max_advance_days      is 'Customers cannot book more than this many days in the future';


-- ── calendar_settings ─────────────────────────────────────────
-- One row per day of the week.
-- day_of_week matches PostgreSQL extract(dow …): 0=Sun … 6=Sat.
create table public.calendar_settings (
  day_of_week  int         primary key check (day_of_week between 0 and 6),
  name_ar      text        not null,
  is_open      boolean     not null default true,
  open_time    time        not null default '09:00',
  close_time   time        not null default '21:00',

  updated_at   timestamptz not null default now(),

  constraint valid_hours check (close_time > open_time)
);

comment on table  public.calendar_settings             is 'Weekly schedule — one row per day (0=Sun … 6=Sat)';
comment on column public.calendar_settings.day_of_week is 'Matches PostgreSQL extract(dow from date): 0=Sunday, 6=Saturday';


-- ── services ──────────────────────────────────────────────────
create table public.services (
  id           uuid        primary key default gen_random_uuid(),
  name         text        not null,
  description  text,
  duration     int         not null check (duration > 0),   -- minutes
  price        numeric(8,2) not null check (price >= 0),
  color        text        not null default '#f59e0b',       -- hex, used in calendar
  is_active    boolean     not null default true,
  sort_order   int         not null default 0,
  created_at   timestamptz not null default now()
);

comment on column public.services.duration is 'Service duration in minutes — snapshotted onto booking at time of creation';
comment on column public.services.color    is 'Hex colour for calendar UI rendering';


-- ── bookings ──────────────────────────────────────────────────
-- NOTE: ends_at and booking_range are NOT generated columns.
-- PostgreSQL requires IMMUTABLE expressions for generated columns,
-- but (timestamptz + interval) is only STABLE (depends on TimeZone GUC).
-- Instead, a BEFORE INSERT OR UPDATE trigger (fn_compute_booking_times)
-- keeps these in sync — same guarantee, no immutability requirement.
create table public.bookings (
  id               uuid        primary key default gen_random_uuid(),

  -- Customer
  customer_name    text        not null,
  customer_phone   text        not null,

  -- Service reference + snapshotted duration
  service_id       uuid        not null
                     references public.services (id) on delete restrict,
  duration         int         not null check (duration > 0),  -- minutes

  -- Timing — ends_at and booking_range are set by trigger
  starts_at        timestamptz not null,
  ends_at          timestamptz,               -- set by trigger
  booking_range    tstzrange,                 -- set by trigger, used by GiST index

  -- Status lifecycle: pending → confirmed | cancelled | no_show
  status           text        not null default 'pending'
                     check (status in ('pending', 'confirmed', 'cancelled', 'no_show')),

  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on column public.bookings.duration      is 'Snapshotted from services.duration at booking time';
comment on column public.bookings.ends_at       is 'Computed by trigger: starts_at + duration. Never set manually.';
comment on column public.bookings.booking_range is 'Computed tstzrange used for GiST overlap detection. Never set manually.';


-- ── blocked_times ─────────────────────────────────────────────
-- Admin can block arbitrary time ranges (holidays, breaks, etc.)
create table public.blocked_times (
  id             uuid        primary key default gen_random_uuid(),
  reason         text,
  starts_at      timestamptz not null,
  ends_at        timestamptz not null,

  -- When true, the entire calendar day is closed.
  is_full_day    boolean     not null default false,

  -- Set by trigger — mirrors bookings.booking_range for consistent GiST queries
  blocked_range  tstzrange,

  created_at     timestamptz not null default now(),

  constraint valid_range check (ends_at > starts_at)
);


-- ── blocked_customers ─────────────────────────────────────────
-- Prevent specific phone numbers from booking.
create table public.blocked_customers (
  id         uuid        primary key default gen_random_uuid(),
  phone      text        not null unique,
  reason     text,
  blocked_at timestamptz not null default now()
);

comment on table public.blocked_customers is 'Deny-list by phone number — checked in API before accepting a booking';


-- ── gallery_images ────────────────────────────────────────────
create table public.gallery_images (
  id            uuid        primary key default gen_random_uuid(),
  storage_path  text        not null,  -- Supabase Storage object path
  url           text        not null,  -- public CDN URL
  alt_text      text,
  sort_order    int         not null default 0,
  is_active     boolean     not null default true,
  created_at    timestamptz not null default now()
);


-- ── reviews ───────────────────────────────────────────────────
create table public.reviews (
  id             uuid        primary key default gen_random_uuid(),
  booking_id     uuid        references public.bookings (id) on delete set null,
  customer_name  text        not null,
  rating         int         not null check (rating between 1 and 5),
  comment        text,
  is_approved    boolean     not null default false,
  created_at     timestamptz not null default now()
);

comment on column public.reviews.is_approved is 'Admin must approve before review appears on public site';


-- ── sms_settings ──────────────────────────────────────────────
create table public.sms_settings (
  id                    int         primary key default 1,
  constraint single_row check (id = 1),

  provider              text        default 'unifonic',
  api_key               text,
  api_secret            text,
  sender_id             text        default 'BARBER',

  send_confirmation     boolean     not null default true,
  send_reminder         boolean     not null default true,
  send_cancellation     boolean     not null default true,

  reminder_hours_before int         not null default 24,

  template_confirmation text        not null
    default 'مرحباً {name}، تم استلام حجزك لـ {service} يوم {date} الساعة {time}. سنتواصل معك للتأكيد.',
  template_reminder     text        not null
    default 'تذكير: لديك موعد {service} غداً الساعة {time}. نتطلع لرؤيتك.',
  template_cancellation text        not null
    default 'تم إلغاء حجزك لـ {service} يوم {date}. للحجز مجدداً تفضل بزيارة الموقع.',

  updated_at            timestamptz not null default now()
);


-- =============================================================
-- 2. INDEXES
-- =============================================================

-- GiST index on booking ranges — active bookings only.
-- Powers the overlap trigger and availability queries.
create index bookings_range_gist_idx
  on public.bookings using gist (booking_range)
  where status not in ('cancelled', 'no_show');

-- GiST index on blocked time ranges
create index blocked_times_range_gist_idx
  on public.blocked_times using gist (blocked_range);

-- Common booking lookups
create index bookings_starts_at_idx   on public.bookings (starts_at);
create index bookings_status_idx      on public.bookings (status);
create index bookings_phone_idx       on public.bookings (customer_phone);
create index bookings_service_id_idx  on public.bookings (service_id);

-- Deny-list lookup (called on every booking attempt)
create index blocked_customers_phone_idx on public.blocked_customers (phone);


-- =============================================================
-- 3. TRIGGERS
-- =============================================================

-- ── Compute ends_at + booking_range on bookings ───────────────
-- Replaces generated columns (which require IMMUTABLE expressions,
-- but timestamptz + interval is only STABLE).
-- Runs first so booking_range is populated before the
-- double-booking check trigger reads it.
create or replace function public.fn_compute_booking_times()
returns trigger
language plpgsql
as $$
begin
  new.ends_at       := new.starts_at + (new.duration * interval '1 minute');
  new.booking_range := tstzrange(new.starts_at, new.ends_at, '[)');
  return new;
end;
$$;

create trigger trg_compute_booking_times
  before insert or update of starts_at, duration
  on public.bookings
  for each row
  execute function public.fn_compute_booking_times();


-- ── Compute blocked_range on blocked_times ────────────────────
create or replace function public.fn_compute_blocked_range()
returns trigger
language plpgsql
as $$
begin
  new.blocked_range := tstzrange(new.starts_at, new.ends_at, '[)');
  return new;
end;
$$;

create trigger trg_compute_blocked_range
  before insert or update of starts_at, ends_at
  on public.blocked_times
  for each row
  execute function public.fn_compute_blocked_range();


-- ── Auto-update updated_at ────────────────────────────────────
create or replace function public.fn_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_bookings_updated_at
  before update on public.bookings
  for each row
  execute function public.fn_set_updated_at();

create trigger trg_business_settings_updated_at
  before update on public.business_settings
  for each row
  execute function public.fn_set_updated_at();

create trigger trg_calendar_settings_updated_at
  before update on public.calendar_settings
  for each row
  execute function public.fn_set_updated_at();

create trigger trg_sms_settings_updated_at
  before update on public.sms_settings
  for each row
  execute function public.fn_set_updated_at();


-- ── Double-booking prevention ─────────────────────────────────
-- Runs BEFORE INSERT OR UPDATE on bookings.
-- Raises an exception if any other active booking overlaps
-- the new/updated booking's time range.
--
-- IMPORTANT: must run AFTER trg_compute_booking_times so that
-- new.booking_range is already populated when this trigger fires.
-- PostgreSQL fires triggers in alphabetical order by name within
-- the same timing (BEFORE) and event — "trg_compute_*" sorts
-- before "trg_prevent_*", so order is guaranteed.
create or replace function public.fn_prevent_double_booking()
returns trigger
language plpgsql
as $$
begin
  -- A booking being cancelled/no-showed never causes a conflict.
  if new.status in ('cancelled', 'no_show') then
    return new;
  end if;

  if exists (
    select 1
    from   public.bookings
    where  id            <> new.id          -- exclude self (for UPDATE)
      and  status        not in ('cancelled', 'no_show')
      and  booking_range && new.booking_range
  ) then
    raise exception 'DOUBLE_BOOKING'
      using
        hint    = 'This time slot overlaps with an existing booking',
        errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger trg_prevent_double_booking
  before insert or update of starts_at, duration, status
  on public.bookings
  for each row
  execute function public.fn_prevent_double_booking();


-- =============================================================
-- 4. HELPER FUNCTIONS
-- =============================================================

-- ── is_customer_blocked ───────────────────────────────────────
-- Called from the API route before accepting a booking.
create or replace function public.is_customer_blocked(p_phone text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from   public.blocked_customers
    where  phone = p_phone
  );
$$;


-- =============================================================
-- 5. AVAILABILITY FUNCTION
-- =============================================================
--
-- get_available_slots(p_date, p_service_id)
-- ─────────────────────────────────────────
-- Returns every possible slot for the given date and service,
-- flagging each as available or taken.
--
-- ALGORITHM
-- ─────────
-- 1. Load business_settings (timezone, slot_interval_minutes,
--    min_notice_hours).
-- 2. Resolve the day-of-week from p_date → calendar_settings row.
--    If is_open = false  →  return empty (no slots today).
-- 3. Check blocked_times for a full-day block on p_date.
--    If found  →  return empty.
-- 4. Generate candidate slots:
--      slot 0 = open_time
--      slot N = slot (N-1) + slot_interval_minutes
--      Stop when slot_start + service.duration > close_time
-- 5. For each candidate slot, the slot [slot_start, slot_end) is
--    UNAVAILABLE if any of the following overlaps with it:
--      a. An active booking  (status ≠ cancelled / no_show)
--      b. A partial blocked_time  (is_full_day = false)
--      c. The slot is in the past relative to now() + min_notice_hours
-- 6. Return all slots with their is_available flag.
-- ─────────────────────────────────────────
create or replace function public.get_available_slots(
  p_date       date,
  p_service_id uuid
)
returns table (
  slot_time    time,         -- local time label (e.g. '09:00')
  starts_at    timestamptz,  -- UTC start of slot
  ends_at      timestamptz,  -- UTC end of slot
  is_available boolean
)
language plpgsql
stable
as $$
declare
  v_settings      public.business_settings%rowtype;
  v_schedule      public.calendar_settings%rowtype;
  v_service       public.services%rowtype;
  v_tz            text;
  v_day_of_week   int;
  v_earliest_ok   timestamptz;
  v_current_time  time;
  v_slot_start    timestamptz;
  v_slot_end      timestamptz;
  v_slot_range    tstzrange;
  v_interval_mins int;
begin
  -- ── 1. Load settings ──────────────────────────────────────
  select * into v_settings from public.business_settings where id = 1;
  v_tz            := coalesce(v_settings.timezone, 'Asia/Jerusalem');
  v_interval_mins := coalesce(v_settings.slot_interval_minutes, 30);

  -- Earliest bookable moment (now + min notice)
  v_earliest_ok := now() + (coalesce(v_settings.min_notice_hours, 1) * interval '1 hour');

  -- ── 2. Load service ───────────────────────────────────────
  select * into v_service
  from   public.services
  where  id = p_service_id and is_active = true;

  if not found then
    raise exception 'SERVICE_NOT_FOUND'
      using hint = 'Service does not exist or is inactive', errcode = 'P0002';
  end if;

  -- ── 3. Load day schedule ──────────────────────────────────
  -- extract(dow …) returns 0=Sun … 6=Sat, matching calendar_settings.day_of_week
  v_day_of_week := extract(dow from p_date)::int;

  select * into v_schedule
  from   public.calendar_settings
  where  day_of_week = v_day_of_week;

  -- Day is closed (no schedule row, or is_open = false)
  if not found or not v_schedule.is_open then
    return;
  end if;

  -- ── 4. Check full-day blocks ──────────────────────────────
  if exists (
    select 1
    from   public.blocked_times
    where  is_full_day = true
      and  blocked_range && tstzrange(
             (p_date::text || ' 00:00:00')::timestamp at time zone v_tz,
             (p_date::text || ' 23:59:59')::timestamp at time zone v_tz,
             '[)'
           )
  ) then
    return;
  end if;

  -- ── 5. Generate and evaluate slots ───────────────────────
  v_current_time := v_schedule.open_time;

  loop
    -- Stop when adding service duration would exceed closing time
    exit when v_current_time + (v_service.duration * interval '1 minute')
              > v_schedule.close_time;

    -- Build UTC timestamps for this slot
    v_slot_start := ((p_date::text || ' ' || v_current_time::text)::timestamp)
                    at time zone v_tz;
    v_slot_end   := v_slot_start + (v_service.duration * interval '1 minute');
    v_slot_range := tstzrange(v_slot_start, v_slot_end, '[)');

    slot_time := v_current_time;
    starts_at := v_slot_start;
    ends_at   := v_slot_end;

    -- Slot is available only when ALL conditions pass:
    is_available :=
      -- (a) Not in the past / within min-notice window
      v_slot_start >= v_earliest_ok
      -- (b) No active booking overlaps this range
      and not exists (
        select 1
        from   public.bookings b
        where  b.status not in ('cancelled', 'no_show')
          and  b.booking_range && v_slot_range
      )
      -- (c) No partial blocked_time overlaps this range
      and not exists (
        select 1
        from   public.blocked_times bt
        where  not bt.is_full_day
          and  bt.blocked_range && v_slot_range
      );

    return next;

    -- Advance by slot_interval (not service duration) so slots
    -- are evenly spaced at the configured granularity
    v_current_time := v_current_time + (v_interval_mins * interval '1 minute');
  end loop;
end;
$$;

comment on function public.get_available_slots is
'Returns all time slots for a given date + service.
 Each row includes starts_at (UTC), ends_at (UTC), and is_available.
 Availability is false when: slot is in the past, overlaps an active
 booking, or overlaps a blocked_times entry.
 Example: SELECT * FROM get_available_slots(''2025-04-10'', ''<service-uuid>'');';


-- =============================================================
-- 6. ROW LEVEL SECURITY
-- =============================================================

alter table public.business_settings  enable row level security;
alter table public.calendar_settings  enable row level security;
alter table public.services           enable row level security;
alter table public.bookings           enable row level security;
alter table public.blocked_times      enable row level security;
alter table public.blocked_customers  enable row level security;
alter table public.gallery_images     enable row level security;
alter table public.reviews            enable row level security;
alter table public.sms_settings       enable row level security;

-- ── Public read (non-sensitive) ───────────────────────────────
create policy "public_read_services"
  on public.services for select
  to anon, authenticated
  using (is_active = true);

create policy "public_read_business_settings"
  on public.business_settings for select
  to anon, authenticated
  using (true);

create policy "public_read_calendar_settings"
  on public.calendar_settings for select
  to anon, authenticated
  using (true);

create policy "public_read_gallery"
  on public.gallery_images for select
  to anon, authenticated
  using (is_active = true);

create policy "public_read_approved_reviews"
  on public.reviews for select
  to anon, authenticated
  using (is_approved = true);

-- ── Bookings: public can create; anyone can read by id ────────
create policy "public_insert_bookings"
  on public.bookings for insert
  to anon, authenticated
  with check (true);

-- Open read lets the confirmation page fetch a booking without auth.
create policy "public_read_bookings"
  on public.bookings for select
  to anon, authenticated
  using (true);

-- ── Admin full access (authenticated = the single barber admin) ──
create policy "admin_all_bookings"          on public.bookings           for all to authenticated using (true) with check (true);
create policy "admin_all_services"          on public.services           for all to authenticated using (true) with check (true);
create policy "admin_all_blocked_times"     on public.blocked_times      for all to authenticated using (true) with check (true);
create policy "admin_all_blocked_customers" on public.blocked_customers  for all to authenticated using (true) with check (true);
create policy "admin_all_business_settings" on public.business_settings  for all to authenticated using (true) with check (true);
create policy "admin_all_calendar_settings" on public.calendar_settings  for all to authenticated using (true) with check (true);
create policy "admin_all_gallery"           on public.gallery_images     for all to authenticated using (true) with check (true);
create policy "admin_all_reviews"           on public.reviews            for all to authenticated using (true) with check (true);
create policy "admin_all_sms_settings"      on public.sms_settings       for all to authenticated using (true) with check (true);

-- Public can submit reviews (admin approves before display)
create policy "public_insert_reviews"
  on public.reviews for insert
  to anon, authenticated
  with check (true);


-- =============================================================
-- 7. SEED DATA
-- =============================================================

-- ── business_settings ─────────────────────────────────────────
insert into public.business_settings (
  id, shop_name, phone, address, instagram,
  timezone, currency,
  slot_interval_minutes, min_notice_hours, max_advance_days, booking_open
) values (
  1,
  'صالون الأناقة',
  '+972 50 000 0000',
  'القدس، فلسطين',
  '@salon.handle',
  'Asia/Jerusalem',
  'ILS',
  30,   -- slots every 30 minutes
  1,    -- must book at least 1 hour ahead
  30,   -- can book up to 30 days in advance
  true  -- booking_open: accepting bookings by default
);

-- ── sms_settings (defaults only) ──────────────────────────────
insert into public.sms_settings (id) values (1);

-- ── calendar_settings ─────────────────────────────────────────
-- Sun–Thu + Sat open 9am–9pm; Friday closed
insert into public.calendar_settings
  (day_of_week, name_ar, is_open, open_time, close_time)
values
  (0, 'الأحد',    true,  '09:00', '21:00'),
  (1, 'الاثنين',  true,  '09:00', '21:00'),
  (2, 'الثلاثاء', true,  '09:00', '21:00'),
  (3, 'الأربعاء', true,  '09:00', '21:00'),
  (4, 'الخميس',  true,  '09:00', '21:00'),
  (5, 'الجمعة',  false, '14:00', '21:00'),
  (6, 'السبت',   true,  '09:00', '21:00');

-- ── services ──────────────────────────────────────────────────
insert into public.services
  (name, description, duration, price, color, sort_order)
values
  (
    'قص شعر',
    'قص احترافي بأحدث الأساليب',
    30,
    50.00,
    '#d4a843',
    1
  ),
  (
    'حلاقة لحية',
    'تشكيل وتهذيب اللحية بدقة عالية',
    20,
    30.00,
    '#10b981',
    2
  ),
  (
    'قص شعر + لحية',
    'الباقة الكاملة للإطلالة المثالية',
    50,
    70.00,
    '#6366f1',
    3
  ),
  (
    'قص شعر أطفال',
    'للأطفال دون سن ١٢ سنة',
    20,
    35.00,
    '#ec4899',
    4
  ),
  (
    'علاج الشعر',
    'قناع ومعالجة متعمقة للشعر وفروة الرأس',
    45,
    80.00,
    '#14b8a6',
    5
  );

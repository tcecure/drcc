alter table public.lab_capacity_settings
alter column standard_duration_days set default 14;

update public.lab_capacity_settings
set standard_duration_days = 14,
    updated_at = now()
where standard_duration_days = 7;

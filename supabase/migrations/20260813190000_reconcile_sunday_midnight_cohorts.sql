with cohort_schedule as (
  select
    id,
    (
      date '2026-08-16' +
      case
        when cohort_number = 1 then 0
        else 21 + ((cohort_number - 2) * 14)
      end
    ) as local_start_date
  from public.student_cohort_assignments
  where status not in ('completed', 'cancelled')
), active_schedule as (
  select
    id,
    local_start_date::timestamp at time zone 'America/New_York' as access_starts_at,
    (local_start_date + 14)::timestamp at time zone 'America/New_York' as access_ends_at
  from cohort_schedule
)
update public.student_cohort_assignments as assignment
set
  access_starts_at = schedule.access_starts_at,
  access_ends_at = schedule.access_ends_at,
  notification_send_at = schedule.access_starts_at
from active_schedule as schedule
where assignment.id = schedule.id
  and schedule.access_ends_at > now()
  and (
    assignment.access_starts_at is distinct from schedule.access_starts_at
    or assignment.access_ends_at is distinct from schedule.access_ends_at
    or assignment.notification_send_at is distinct from schedule.access_starts_at
  );

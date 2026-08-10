alter table public.access_requests
drop constraint if exists access_requests_request_type_check;

alter table public.access_requests
add constraint access_requests_request_type_check
check (
  request_type in (
    'cmmc_level_1_training',
    'hands_on_lab',
    'student_resources',
    'instructor_access',
    'customer_delivery_zone',
    'administrative_access'
  )
);

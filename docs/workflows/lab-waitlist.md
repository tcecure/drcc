# Hands-On Lab Waitlist

Sprint 6 adds the hands-on lab request and waitlist workflow.

## Eligibility

Students can request hands-on lab access only after completing a required Moodle course. The portal derives this from `moodle_enrollments` joined to active `moodle_courses` where `required_for_lab = true`; it does not add another portal role.

## Student Flow

1. Student completes required Moodle training.
2. Student opens `/dashboard/labs/request`.
3. Student selects a lab track, confirms acceptable use, confirms connectivity, and submits availability.
4. The portal creates a `lab_requests` record and a `lab_queue_entries` record.
5. Student views their queue status at `/dashboard/labs/queue`.

Queue position is calculated from active eligible entries and is not stored as a permanent public number.

## Admin Flow

Admins and approvers manage queue entries at `/admin/lab-queue`.

They can:

- filter by track and status
- request readiness confirmation
- pause or remove queue entries
- change priority group and manual priority with a required reason
- review queue entry details

Manual priority changes create audit events with old and new values.

## Capacity Boundary

Sprint 6 establishes the request and waitlist. Sprint 7 enforces reservation and active lab capacity, including the 20 concurrent hands-on user limit.

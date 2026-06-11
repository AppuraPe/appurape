Legacy frontend files intentionally kept:

- `src/app/core/models/restaurant.models.ts`
- `src/app/core/models/restaurants.models.ts`
- `src/app/core/models/admin.models.ts`
- `src/app/core/services/admin-api.service.ts`
- `src/app/core/services/zones-api.service.ts`
- `src/app/features/restaurants/components/*`

Reason:

- They still act as compatibility sources for shared aliases, driver/auth flows, or reused UI pieces while the `business`/`businesses` migration finishes.

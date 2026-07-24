CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE TABLE users (
        "Id" uuid NOT NULL,
        "FirstName" character varying(100) NOT NULL,
        "LastName" character varying(100) NOT NULL,
        "Phone" character varying(20) NOT NULL,
        "Email" character varying(256) NOT NULL,
        "PasswordHash" character varying(500) NOT NULL,
        "Role" integer NOT NULL,
        "Status" integer NOT NULL,
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "UpdatedAtUtc" timestamp with time zone,
        CONSTRAINT "PK_users" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE TABLE zones (
        "Id" uuid NOT NULL,
        "Name" character varying(120) NOT NULL,
        "DeliveryFee" numeric(10,2) NOT NULL,
        "IsActive" boolean NOT NULL,
        CONSTRAINT "PK_zones" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE TABLE customer_profiles (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        CONSTRAINT "PK_customer_profiles" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_customer_profiles_users_UserId" FOREIGN KEY ("UserId") REFERENCES users ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE TABLE driver_profiles (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "VehicleType" integer NOT NULL,
        "Plate" character varying(20) NOT NULL,
        "ZoneId" uuid NOT NULL,
        "ApprovalStatus" integer NOT NULL,
        "IsAvailable" boolean NOT NULL,
        "IdentityDocumentUrl" character varying(500),
        "VehiclePhotoUrl" character varying(500),
        CONSTRAINT "PK_driver_profiles" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_driver_profiles_users_UserId" FOREIGN KEY ("UserId") REFERENCES users ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_driver_profiles_zones_ZoneId" FOREIGN KEY ("ZoneId") REFERENCES zones ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE TABLE restaurants (
        "Id" uuid NOT NULL,
        "OwnerUserId" uuid NOT NULL,
        "Name" character varying(150) NOT NULL,
        "Description" character varying(1000) NOT NULL,
        "Address" character varying(300) NOT NULL,
        "Reference" character varying(300) NOT NULL,
        "ZoneId" uuid NOT NULL,
        "ApprovalStatus" integer NOT NULL,
        "OpenTime" interval NOT NULL,
        "CloseTime" interval NOT NULL,
        "LogoUrl" character varying(500),
        "IsActive" boolean NOT NULL,
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "UpdatedAtUtc" timestamp with time zone,
        CONSTRAINT "PK_restaurants" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_restaurants_users_OwnerUserId" FOREIGN KEY ("OwnerUserId") REFERENCES users ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_restaurants_zones_ZoneId" FOREIGN KEY ("ZoneId") REFERENCES zones ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE TABLE customer_addresses (
        "Id" uuid NOT NULL,
        "CustomerProfileId" uuid NOT NULL,
        "ZoneId" uuid NOT NULL,
        "AddressLine" character varying(300) NOT NULL,
        "Reference" character varying(300) NOT NULL,
        "Latitude" numeric(9,6),
        "Longitude" numeric(9,6),
        "IsDefault" boolean NOT NULL,
        CONSTRAINT "PK_customer_addresses" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_customer_addresses_customer_profiles_CustomerProfileId" FOREIGN KEY ("CustomerProfileId") REFERENCES customer_profiles ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_customer_addresses_zones_ZoneId" FOREIGN KEY ("ZoneId") REFERENCES zones ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE TABLE menu_categories (
        "Id" uuid NOT NULL,
        "RestaurantId" uuid NOT NULL,
        "Name" character varying(150) NOT NULL,
        "IsActive" boolean NOT NULL,
        "SortOrder" integer NOT NULL,
        CONSTRAINT "PK_menu_categories" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_menu_categories_restaurants_RestaurantId" FOREIGN KEY ("RestaurantId") REFERENCES restaurants ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE TABLE orders (
        "Id" uuid NOT NULL,
        "CustomerId" uuid NOT NULL,
        "RestaurantId" uuid NOT NULL,
        "DriverId" uuid,
        "ZoneId" uuid NOT NULL,
        "Status" integer NOT NULL,
        "PaymentMethod" integer NOT NULL,
        "Subtotal" numeric(10,2) NOT NULL,
        "DeliveryFee" numeric(10,2) NOT NULL,
        "Total" numeric(10,2) NOT NULL,
        "DeliveryAddress" character varying(300) NOT NULL,
        "DeliveryReference" character varying(300) NOT NULL,
        "Notes" character varying(1000),
        "AcceptedAtUtc" timestamp with time zone,
        "ReadyAtUtc" timestamp with time zone,
        "PickedUpAtUtc" timestamp with time zone,
        "DeliveredAtUtc" timestamp with time zone,
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "UpdatedAtUtc" timestamp with time zone,
        CONSTRAINT "PK_orders" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_orders_customer_profiles_CustomerId" FOREIGN KEY ("CustomerId") REFERENCES customer_profiles ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_orders_driver_profiles_DriverId" FOREIGN KEY ("DriverId") REFERENCES driver_profiles ("Id") ON DELETE SET NULL,
        CONSTRAINT "FK_orders_restaurants_RestaurantId" FOREIGN KEY ("RestaurantId") REFERENCES restaurants ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_orders_zones_ZoneId" FOREIGN KEY ("ZoneId") REFERENCES zones ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE TABLE menu_items (
        "Id" uuid NOT NULL,
        "RestaurantId" uuid NOT NULL,
        "CategoryId" uuid NOT NULL,
        "Name" character varying(150) NOT NULL,
        "Description" character varying(1000) NOT NULL,
        "Price" numeric(10,2) NOT NULL,
        "ImageUrl" character varying(500),
        "IsAvailable" boolean NOT NULL,
        "IsActive" boolean NOT NULL,
        CONSTRAINT "PK_menu_items" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_menu_items_menu_categories_CategoryId" FOREIGN KEY ("CategoryId") REFERENCES menu_categories ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_menu_items_restaurants_RestaurantId" FOREIGN KEY ("RestaurantId") REFERENCES restaurants ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE TABLE order_incidents (
        "Id" uuid NOT NULL,
        "OrderId" uuid NOT NULL,
        "Type" character varying(100) NOT NULL,
        "Description" character varying(1000) NOT NULL,
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "UpdatedAtUtc" timestamp with time zone,
        CONSTRAINT "PK_order_incidents" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_order_incidents_orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES orders ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE TABLE order_items (
        "Id" uuid NOT NULL,
        "OrderId" uuid NOT NULL,
        "MenuItemId" uuid NOT NULL,
        "ProductName" character varying(150) NOT NULL,
        "UnitPrice" numeric(10,2) NOT NULL,
        "Quantity" integer NOT NULL,
        "Subtotal" numeric(10,2) NOT NULL,
        CONSTRAINT "PK_order_items" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_order_items_menu_items_MenuItemId" FOREIGN KEY ("MenuItemId") REFERENCES menu_items ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_order_items_orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES orders ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE INDEX "IX_customer_addresses_CustomerProfileId" ON customer_addresses ("CustomerProfileId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE INDEX "IX_customer_addresses_ZoneId" ON customer_addresses ("ZoneId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_customer_profiles_UserId" ON customer_profiles ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_driver_profiles_UserId" ON driver_profiles ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE INDEX "IX_driver_profiles_ZoneId" ON driver_profiles ("ZoneId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE INDEX "IX_menu_categories_RestaurantId" ON menu_categories ("RestaurantId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE INDEX "IX_menu_items_CategoryId" ON menu_items ("CategoryId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE INDEX "IX_menu_items_RestaurantId" ON menu_items ("RestaurantId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE INDEX "IX_order_incidents_OrderId" ON order_incidents ("OrderId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE INDEX "IX_order_items_MenuItemId" ON order_items ("MenuItemId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE INDEX "IX_order_items_OrderId" ON order_items ("OrderId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE INDEX "IX_orders_CustomerId" ON orders ("CustomerId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE INDEX "IX_orders_DriverId" ON orders ("DriverId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE INDEX "IX_orders_RestaurantId" ON orders ("RestaurantId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE INDEX "IX_orders_ZoneId" ON orders ("ZoneId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE INDEX "IX_restaurants_OwnerUserId" ON restaurants ("OwnerUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE INDEX "IX_restaurants_ZoneId" ON restaurants ("ZoneId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_users_Email" ON users ("Email");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420164839_InitialCreate') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260420164839_InitialCreate', '9.0.0');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420205317_AddPendingCustomerRegistrations') THEN
    CREATE TABLE pending_customer_registrations (
        "Id" uuid NOT NULL,
        "FirstName" character varying(100) NOT NULL,
        "LastName" character varying(100) NOT NULL,
        "Phone" character varying(20) NOT NULL,
        "Email" character varying(256) NOT NULL,
        "VerificationCodeHash" character varying(500) NOT NULL,
        "CodeExpiresAtUtc" timestamp with time zone NOT NULL,
        "IsVerified" boolean NOT NULL,
        "VerifiedAtUtc" timestamp with time zone,
        "IsCompleted" boolean NOT NULL,
        "SendCount" integer NOT NULL,
        "VerifyAttempts" integer NOT NULL,
        "LastSentAtUtc" timestamp with time zone,
        "CompletedAtUtc" timestamp with time zone,
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "UpdatedAtUtc" timestamp with time zone,
        CONSTRAINT "PK_pending_customer_registrations" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420205317_AddPendingCustomerRegistrations') THEN
    CREATE INDEX "IX_pending_customer_registrations_Email" ON pending_customer_registrations ("Email");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420205317_AddPendingCustomerRegistrations') THEN
    CREATE INDEX "IX_pending_customer_registrations_Email_IsCompleted" ON pending_customer_registrations ("Email", "IsCompleted");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420205317_AddPendingCustomerRegistrations') THEN
    CREATE INDEX "IX_pending_customer_registrations_Email_IsVerified_IsCompleted" ON pending_customer_registrations ("Email", "IsVerified", "IsCompleted");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420205317_AddPendingCustomerRegistrations') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260420205317_AddPendingCustomerRegistrations', '9.0.0');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260421030750_AddPendingRestaurantAndDriverRegistrations') THEN
    CREATE TABLE pending_driver_registrations (
        "Id" uuid NOT NULL,
        "VehicleType" integer NOT NULL,
        "Plate" character varying(20) NOT NULL,
        "ZoneId" uuid NOT NULL,
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "UpdatedAtUtc" timestamp with time zone,
        "FirstName" character varying(100) NOT NULL,
        "LastName" character varying(100) NOT NULL,
        "Phone" character varying(20) NOT NULL,
        "Email" character varying(256) NOT NULL,
        "VerificationCodeHash" character varying(500) NOT NULL,
        "CodeExpiresAtUtc" timestamp with time zone NOT NULL,
        "IsVerified" boolean NOT NULL,
        "VerifiedAtUtc" timestamp with time zone,
        "IsCompleted" boolean NOT NULL,
        "SendCount" integer NOT NULL,
        "VerifyAttempts" integer NOT NULL,
        "LastSentAtUtc" timestamp with time zone,
        "CompletedAtUtc" timestamp with time zone,
        CONSTRAINT "PK_pending_driver_registrations" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260421030750_AddPendingRestaurantAndDriverRegistrations') THEN
    CREATE TABLE pending_restaurant_registrations (
        "Id" uuid NOT NULL,
        "RestaurantName" character varying(150) NOT NULL,
        "Description" character varying(1000) NOT NULL,
        "Address" character varying(300) NOT NULL,
        "Reference" character varying(300) NOT NULL,
        "ZoneId" uuid NOT NULL,
        "OpenTime" interval NOT NULL,
        "CloseTime" interval NOT NULL,
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "UpdatedAtUtc" timestamp with time zone,
        "FirstName" character varying(100) NOT NULL,
        "LastName" character varying(100) NOT NULL,
        "Phone" character varying(20) NOT NULL,
        "Email" character varying(256) NOT NULL,
        "VerificationCodeHash" character varying(500) NOT NULL,
        "CodeExpiresAtUtc" timestamp with time zone NOT NULL,
        "IsVerified" boolean NOT NULL,
        "VerifiedAtUtc" timestamp with time zone,
        "IsCompleted" boolean NOT NULL,
        "SendCount" integer NOT NULL,
        "VerifyAttempts" integer NOT NULL,
        "LastSentAtUtc" timestamp with time zone,
        "CompletedAtUtc" timestamp with time zone,
        CONSTRAINT "PK_pending_restaurant_registrations" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260421030750_AddPendingRestaurantAndDriverRegistrations') THEN
    CREATE INDEX "IX_pending_driver_registrations_Email" ON pending_driver_registrations ("Email");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260421030750_AddPendingRestaurantAndDriverRegistrations') THEN
    CREATE INDEX "IX_pending_driver_registrations_Email_IsCompleted" ON pending_driver_registrations ("Email", "IsCompleted");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260421030750_AddPendingRestaurantAndDriverRegistrations') THEN
    CREATE INDEX "IX_pending_driver_registrations_Email_IsVerified_IsCompleted" ON pending_driver_registrations ("Email", "IsVerified", "IsCompleted");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260421030750_AddPendingRestaurantAndDriverRegistrations') THEN
    CREATE INDEX "IX_pending_restaurant_registrations_Email" ON pending_restaurant_registrations ("Email");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260421030750_AddPendingRestaurantAndDriverRegistrations') THEN
    CREATE INDEX "IX_pending_restaurant_registrations_Email_IsCompleted" ON pending_restaurant_registrations ("Email", "IsCompleted");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260421030750_AddPendingRestaurantAndDriverRegistrations') THEN
    CREATE INDEX "IX_pending_restaurant_registrations_Email_IsVerified_IsComplet~" ON pending_restaurant_registrations ("Email", "IsVerified", "IsCompleted");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260421030750_AddPendingRestaurantAndDriverRegistrations') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260421030750_AddPendingRestaurantAndDriverRegistrations', '9.0.0');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260604190941_AddPendingRegistrationFileUrls') THEN
    ALTER TABLE pending_restaurant_registrations ADD "LogoUrl" character varying(500);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260604190941_AddPendingRegistrationFileUrls') THEN
    ALTER TABLE pending_driver_registrations ADD "IdentityDocumentUrl" character varying(500);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260604190941_AddPendingRegistrationFileUrls') THEN
    ALTER TABLE pending_driver_registrations ADD "VehiclePhotoUrl" character varying(500);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260604190941_AddPendingRegistrationFileUrls') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260604190941_AddPendingRegistrationFileUrls', '9.0.0');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260604213208_AddDriverTrustLevel') THEN
    ALTER TABLE driver_profiles ADD "TrustLevel" integer NOT NULL DEFAULT 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260604213208_AddDriverTrustLevel') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260604213208_AddDriverTrustLevel', '9.0.0');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260604214426_AddDriverTrustScore') THEN
    ALTER TABLE driver_profiles ADD "CompletedDeliveriesCount" integer NOT NULL DEFAULT 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260604214426_AddDriverTrustScore') THEN
    ALTER TABLE driver_profiles ADD "TrustScore" numeric(5,2) NOT NULL DEFAULT 0.0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260604214426_AddDriverTrustScore') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260604214426_AddDriverTrustScore', '9.0.0');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260604215443_AddOrderDriverRating') THEN
    ALTER TABLE orders ADD "DriverFeedback" character varying(1000);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260604215443_AddOrderDriverRating') THEN
    ALTER TABLE orders ADD "DriverRating" integer;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260604215443_AddOrderDriverRating') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260604215443_AddOrderDriverRating', '9.0.0');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260605143625_AddCommunityCollaboration') THEN
    CREATE TABLE community_collaborators (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "IsAvailable" boolean NOT NULL,
        "AvailabilityStatus" integer NOT NULL,
        "CurrentLatitude" numeric(9,6),
        "CurrentLongitude" numeric(9,6),
        "AvailabilityRadiusKm" numeric(5,2) NOT NULL,
        "AvailableFromUtc" timestamp with time zone,
        "AvailableUntilUtc" timestamp with time zone,
        "TrustScore" numeric(5,2) NOT NULL,
        "CompletedCollaborations" integer NOT NULL,
        "CollaborationRating" numeric(3,2) NOT NULL,
        "CommunityAcceptanceRate" numeric(5,2) NOT NULL,
        "CommunityCancellationRate" numeric(5,2) NOT NULL,
        "CollaborationLevel" integer NOT NULL,
        CONSTRAINT "PK_community_collaborators" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_community_collaborators_users_UserId" FOREIGN KEY ("UserId") REFERENCES users ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260605143625_AddCommunityCollaboration') THEN
    CREATE TABLE community_routes (
        "Id" uuid NOT NULL,
        "CommunityCollaboratorId" uuid NOT NULL,
        "OriginLabel" character varying(200) NOT NULL,
        "OriginLatitude" numeric(9,6) NOT NULL,
        "OriginLongitude" numeric(9,6) NOT NULL,
        "DestinationLabel" character varying(200) NOT NULL,
        "DestinationLatitude" numeric(9,6) NOT NULL,
        "DestinationLongitude" numeric(9,6) NOT NULL,
        "EstimatedMinutes" integer NOT NULL,
        "DeviationRadiusKm" numeric(5,2) NOT NULL,
        "IsActive" boolean NOT NULL,
        "StartsAtUtc" timestamp with time zone,
        "EndsAtUtc" timestamp with time zone,
        CONSTRAINT "PK_community_routes" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_community_routes_community_collaborators_CommunityCollabora~" FOREIGN KEY ("CommunityCollaboratorId") REFERENCES community_collaborators ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260605143625_AddCommunityCollaboration') THEN
    CREATE TABLE community_requests (
        "Id" uuid NOT NULL,
        "CreatedByUserId" uuid NOT NULL,
        "Type" integer NOT NULL,
        "Title" character varying(150) NOT NULL,
        "Description" character varying(2000) NOT NULL,
        "OriginLabel" character varying(200) NOT NULL,
        "OriginLatitude" numeric(9,6),
        "OriginLongitude" numeric(9,6),
        "DestinationLabel" character varying(200) NOT NULL,
        "DestinationLatitude" numeric(9,6),
        "DestinationLongitude" numeric(9,6),
        "CompensationAmount" numeric(10,2) NOT NULL,
        "DeadlineUtc" timestamp with time zone,
        "Status" integer NOT NULL,
        "AssignedCollaboratorId" uuid,
        "AssignedRouteId" uuid,
        "MatchScore" numeric(5,2) NOT NULL,
        "ConfirmationCode" character varying(20),
        "ConfirmationCodeExpiresAtUtc" timestamp with time zone,
        "ProofImageUrl" character varying(500),
        "CollaboratorRating" integer,
        "CollaboratorFeedback" character varying(1000),
        "AcceptedAtUtc" timestamp with time zone,
        "StartedAtUtc" timestamp with time zone,
        "DeliveredAtUtc" timestamp with time zone,
        "ClientConfirmedAtUtc" timestamp with time zone,
        "CancelledAtUtc" timestamp with time zone,
        "CancellationReason" character varying(500),
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "UpdatedAtUtc" timestamp with time zone,
        CONSTRAINT "PK_community_requests" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_community_requests_community_collaborators_AssignedCollabor~" FOREIGN KEY ("AssignedCollaboratorId") REFERENCES community_collaborators ("Id") ON DELETE SET NULL,
        CONSTRAINT "FK_community_requests_community_routes_AssignedRouteId" FOREIGN KEY ("AssignedRouteId") REFERENCES community_routes ("Id"),
        CONSTRAINT "FK_community_requests_users_CreatedByUserId" FOREIGN KEY ("CreatedByUserId") REFERENCES users ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260605143625_AddCommunityCollaboration') THEN
    CREATE UNIQUE INDEX "IX_community_collaborators_UserId" ON community_collaborators ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260605143625_AddCommunityCollaboration') THEN
    CREATE INDEX "IX_community_requests_AssignedCollaboratorId" ON community_requests ("AssignedCollaboratorId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260605143625_AddCommunityCollaboration') THEN
    CREATE INDEX "IX_community_requests_AssignedRouteId" ON community_requests ("AssignedRouteId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260605143625_AddCommunityCollaboration') THEN
    CREATE INDEX "IX_community_requests_CreatedByUserId" ON community_requests ("CreatedByUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260605143625_AddCommunityCollaboration') THEN
    CREATE INDEX "IX_community_requests_Status" ON community_requests ("Status");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260605143625_AddCommunityCollaboration') THEN
    CREATE INDEX "IX_community_routes_CommunityCollaboratorId" ON community_routes ("CommunityCollaboratorId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260605143625_AddCommunityCollaboration') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260605143625_AddCommunityCollaboration', '9.0.0');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608195500_AddGoogleCustomerLogin') THEN
    ALTER TABLE users ADD "GoogleSubject" character varying(128);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608195500_AddGoogleCustomerLogin') THEN
    CREATE UNIQUE INDEX "IX_users_GoogleSubject" ON users ("GoogleSubject");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260608195500_AddGoogleCustomerLogin') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260608195500_AddGoogleCustomerLogin', '9.0.0');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609044237_AddPasswordResetRequests') THEN
    CREATE TABLE password_reset_requests (
        "Id" uuid NOT NULL,
        "Email" character varying(256) NOT NULL,
        "CodeHash" character varying(500) NOT NULL,
        "CodeExpiresAtUtc" timestamp with time zone NOT NULL,
        "SendCount" integer NOT NULL,
        "VerifyAttempts" integer NOT NULL,
        "LastSentAtUtc" timestamp with time zone,
        "CompletedAtUtc" timestamp with time zone,
        "IsCompleted" boolean NOT NULL,
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "UpdatedAtUtc" timestamp with time zone,
        CONSTRAINT "PK_password_reset_requests" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609044237_AddPasswordResetRequests') THEN
    CREATE INDEX "IX_password_reset_requests_Email" ON password_reset_requests ("Email");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609044237_AddPasswordResetRequests') THEN
    CREATE INDEX "IX_password_reset_requests_Email_IsCompleted" ON password_reset_requests ("Email", "IsCompleted");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609044237_AddPasswordResetRequests') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260609044237_AddPasswordResetRequests', '9.0.0');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609113800_AddBusinessTypes') THEN
    ALTER TABLE restaurants ADD "BusinessTypeId" uuid;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609113800_AddBusinessTypes') THEN
    ALTER TABLE pending_restaurant_registrations ADD "BusinessTypeId" uuid;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609113800_AddBusinessTypes') THEN
    CREATE TABLE business_types (
        "Id" uuid NOT NULL,
        "Code" character varying(50) NOT NULL,
        "Name" character varying(100) NOT NULL,
        "Description" character varying(500),
        "IsActive" boolean NOT NULL,
        CONSTRAINT "PK_business_types" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609113800_AddBusinessTypes') THEN
    INSERT INTO business_types ("Id", "Code", "Name", "Description", "IsActive")
    VALUES ('3e34d05a-4e80-4e6d-b3e9-9b80f1a10f15', 'Restaurant', 'Restaurant', 'Legacy-compatible business type for the current restaurant marketplace.', TRUE);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609113800_AddBusinessTypes') THEN
    UPDATE restaurants SET "BusinessTypeId" = '3e34d05a-4e80-4e6d-b3e9-9b80f1a10f15' WHERE "BusinessTypeId" IS NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609113800_AddBusinessTypes') THEN
    UPDATE pending_restaurant_registrations SET "BusinessTypeId" = '3e34d05a-4e80-4e6d-b3e9-9b80f1a10f15' WHERE "BusinessTypeId" IS NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609113800_AddBusinessTypes') THEN
    CREATE INDEX "IX_restaurants_BusinessTypeId" ON restaurants ("BusinessTypeId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609113800_AddBusinessTypes') THEN
    CREATE INDEX "IX_pending_restaurant_registrations_BusinessTypeId" ON pending_restaurant_registrations ("BusinessTypeId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609113800_AddBusinessTypes') THEN
    CREATE UNIQUE INDEX "IX_business_types_Code" ON business_types ("Code");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609113800_AddBusinessTypes') THEN
    CREATE UNIQUE INDEX "IX_business_types_Name" ON business_types ("Name");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609113800_AddBusinessTypes') THEN
    ALTER TABLE pending_restaurant_registrations ADD CONSTRAINT "FK_pending_restaurant_registrations_business_types_BusinessTyp~" FOREIGN KEY ("BusinessTypeId") REFERENCES business_types ("Id") ON DELETE RESTRICT;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609113800_AddBusinessTypes') THEN
    ALTER TABLE restaurants ADD CONSTRAINT "FK_restaurants_business_types_BusinessTypeId" FOREIGN KEY ("BusinessTypeId") REFERENCES business_types ("Id") ON DELETE RESTRICT;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609113800_AddBusinessTypes') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260609113800_AddBusinessTypes', '9.0.0');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609120751_AddGeneralCatalogStock') THEN
    ALTER TABLE menu_items ADD "Sku" character varying(80);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609120751_AddGeneralCatalogStock') THEN
    ALTER TABLE menu_items ADD "StockQuantity" integer;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609120751_AddGeneralCatalogStock') THEN
    ALTER TABLE menu_items ADD "TrackStock" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609120751_AddGeneralCatalogStock') THEN
    ALTER TABLE menu_items ADD "UnitLabel" character varying(50);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609120751_AddGeneralCatalogStock') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260609120751_AddGeneralCatalogStock', '9.0.0');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609121803_AddCollaboratorProfiles') THEN
    CREATE TABLE collaborator_profiles (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "ApprovalStatus" integer NOT NULL,
        "IsIdentityVerified" boolean NOT NULL,
        "IsPhoneVerified" boolean NOT NULL,
        "IdentityDocumentNumber" character varying(30),
        "IdentityDocumentUrl" character varying(500),
        "ProfilePhotoUrl" character varying(500),
        "Notes" character varying(1000),
        CONSTRAINT "PK_collaborator_profiles" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_collaborator_profiles_users_UserId" FOREIGN KEY ("UserId") REFERENCES users ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609121803_AddCollaboratorProfiles') THEN
    CREATE UNIQUE INDEX "IX_collaborator_profiles_UserId" ON collaborator_profiles ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609121803_AddCollaboratorProfiles') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260609121803_AddCollaboratorProfiles', '9.0.0');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609134657_AddCourierAssignmentCompatibility') THEN
    ALTER TABLE orders ADD "AssignedCourierType" integer;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609134657_AddCourierAssignmentCompatibility') THEN
    ALTER TABLE orders ADD "AssignedCourierUserId" uuid;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609134657_AddCourierAssignmentCompatibility') THEN
    UPDATE orders AS o
    SET "AssignedCourierUserId" = d."UserId",
        "AssignedCourierType" = 0
    FROM driver_profiles AS d
    WHERE o."DriverId" = d."Id"
      AND o."AssignedCourierUserId" IS NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609134657_AddCourierAssignmentCompatibility') THEN
    CREATE INDEX "IX_orders_AssignedCourierUserId" ON orders ("AssignedCourierUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609134657_AddCourierAssignmentCompatibility') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260609134657_AddCourierAssignmentCompatibility', '9.0.0');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609135832_AddCommunityRequestApplications') THEN
    CREATE TABLE community_request_applications (
        "Id" uuid NOT NULL,
        "CommunityRequestId" uuid NOT NULL,
        "CollaboratorId" uuid NOT NULL,
        "RouteId" uuid,
        "MatchScore" numeric(5,2) NOT NULL,
        "DistanceKm" numeric(7,2) NOT NULL,
        "EstimatedMinutes" integer NOT NULL,
        "HasRouteMatch" boolean NOT NULL,
        "Status" integer NOT NULL,
        "AppliedAtUtc" timestamp with time zone NOT NULL,
        "ReviewedAtUtc" timestamp with time zone,
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "UpdatedAtUtc" timestamp with time zone,
        CONSTRAINT "PK_community_request_applications" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_community_request_applications_community_collaborators_Coll~" FOREIGN KEY ("CollaboratorId") REFERENCES community_collaborators ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_community_request_applications_community_requests_Community~" FOREIGN KEY ("CommunityRequestId") REFERENCES community_requests ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_community_request_applications_community_routes_RouteId" FOREIGN KEY ("RouteId") REFERENCES community_routes ("Id") ON DELETE SET NULL
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609135832_AddCommunityRequestApplications') THEN
    CREATE INDEX "IX_community_request_applications_CollaboratorId" ON community_request_applications ("CollaboratorId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609135832_AddCommunityRequestApplications') THEN
    CREATE UNIQUE INDEX "IX_community_request_applications_CommunityRequestId_Collabora~" ON community_request_applications ("CommunityRequestId", "CollaboratorId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609135832_AddCommunityRequestApplications') THEN
    CREATE INDEX "IX_community_request_applications_RouteId" ON community_request_applications ("RouteId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609135832_AddCommunityRequestApplications') THEN
    CREATE INDEX "IX_community_request_applications_Status" ON community_request_applications ("Status");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609135832_AddCommunityRequestApplications') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260609135832_AddCommunityRequestApplications', '9.0.0');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    ALTER TABLE orders ADD "BusinessCommissionAmount" numeric(10,2) NOT NULL DEFAULT 0.0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    ALTER TABLE orders ADD "BusinessNetAmount" numeric(10,2) NOT NULL DEFAULT 0.0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    ALTER TABLE orders ADD "CourierEarningAmount" numeric(10,2) NOT NULL DEFAULT 0.0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    ALTER TABLE orders ADD "DeliveryPlatformCommissionAmount" numeric(10,2) NOT NULL DEFAULT 0.0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    ALTER TABLE orders ADD "DiscountAmount" numeric(10,2) NOT NULL DEFAULT 0.0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    ALTER TABLE orders ADD "PlatformRevenueAmount" numeric(10,2) NOT NULL DEFAULT 0.0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    ALTER TABLE orders ADD "PricingSnapshotJson" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    ALTER TABLE orders ADD "ServiceFeeAmount" numeric(10,2) NOT NULL DEFAULT 0.0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    ALTER TABLE community_requests ADD "CollaboratorEarningAmount" numeric(10,2) NOT NULL DEFAULT 0.0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    ALTER TABLE community_requests ADD "EstimatedPurchaseAmount" numeric(10,2) NOT NULL DEFAULT 0.0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    ALTER TABLE community_requests ADD "FavorPlatformCommissionAmount" numeric(10,2) NOT NULL DEFAULT 0.0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    ALTER TABLE community_requests ADD "PlatformRevenueAmount" numeric(10,2) NOT NULL DEFAULT 0.0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    ALTER TABLE community_requests ADD "PricingSnapshotJson" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    ALTER TABLE community_requests ADD "TotalClientAmount" numeric(10,2) NOT NULL DEFAULT 0.0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    CREATE TABLE commission_rules (
        "Id" uuid NOT NULL,
        "Code" character varying(100) NOT NULL,
        "Name" character varying(150) NOT NULL,
        "Description" character varying(1000),
        "Scope" integer NOT NULL,
        "ValueType" integer NOT NULL,
        "Value" numeric(10,2) NOT NULL,
        "MinAmount" numeric(10,2),
        "MaxAmount" numeric(10,2),
        "Priority" integer NOT NULL,
        "IsEnabled" boolean NOT NULL,
        "EffectiveFromUtc" timestamp with time zone,
        "EffectiveToUtc" timestamp with time zone,
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "UpdatedAtUtc" timestamp with time zone,
        CONSTRAINT "PK_commission_rules" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    CREATE TABLE financial_movements (
        "Id" uuid NOT NULL,
        "OrderId" uuid,
        "CommunityRequestId" uuid,
        "RestaurantId" uuid,
        "UserId" uuid,
        "Type" integer NOT NULL,
        "Status" integer NOT NULL,
        "Amount" numeric(10,2) NOT NULL,
        "CurrencyCode" character varying(8) NOT NULL,
        "OccurredAtUtc" timestamp with time zone NOT NULL,
        "AvailableAtUtc" timestamp with time zone,
        "SettledAtUtc" timestamp with time zone,
        "Reference" character varying(120),
        "Description" character varying(1000),
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "UpdatedAtUtc" timestamp with time zone,
        CONSTRAINT "PK_financial_movements" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_financial_movements_community_requests_CommunityRequestId" FOREIGN KEY ("CommunityRequestId") REFERENCES community_requests ("Id") ON DELETE SET NULL,
        CONSTRAINT "FK_financial_movements_orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES orders ("Id") ON DELETE SET NULL,
        CONSTRAINT "FK_financial_movements_restaurants_RestaurantId" FOREIGN KEY ("RestaurantId") REFERENCES restaurants ("Id") ON DELETE SET NULL,
        CONSTRAINT "FK_financial_movements_users_UserId" FOREIGN KEY ("UserId") REFERENCES users ("Id") ON DELETE SET NULL
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    CREATE UNIQUE INDEX "IX_commission_rules_Code" ON commission_rules ("Code");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    CREATE INDEX "IX_commission_rules_Scope" ON commission_rules ("Scope");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    CREATE INDEX "IX_financial_movements_CommunityRequestId" ON financial_movements ("CommunityRequestId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    CREATE INDEX "IX_financial_movements_OrderId" ON financial_movements ("OrderId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    CREATE INDEX "IX_financial_movements_RestaurantId" ON financial_movements ("RestaurantId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    CREATE INDEX "IX_financial_movements_Status" ON financial_movements ("Status");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    CREATE INDEX "IX_financial_movements_Type" ON financial_movements ("Type");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    CREATE INDEX "IX_financial_movements_UserId" ON financial_movements ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    UPDATE orders
    SET "BusinessCommissionAmount" = 0,
        "BusinessNetAmount" = "Subtotal",
        "CourierEarningAmount" = "DeliveryFee",
        "DeliveryPlatformCommissionAmount" = 0,
        "DiscountAmount" = 0,
        "PlatformRevenueAmount" = 0,
        "ServiceFeeAmount" = GREATEST(0, "Total" - "Subtotal" - "DeliveryFee")
    WHERE "BusinessNetAmount" = 0
      AND "Subtotal" >= 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    UPDATE community_requests
    SET "EstimatedPurchaseAmount" = 0,
        "FavorPlatformCommissionAmount" = 0,
        "CollaboratorEarningAmount" = "CompensationAmount",
        "TotalClientAmount" = "CompensationAmount",
        "PlatformRevenueAmount" = 0
    WHERE "TotalClientAmount" = 0
      AND "CompensationAmount" >= 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    INSERT INTO commission_rules ("Id", "Code", "Name", "Description", "Scope", "ValueType", "Value", "MinAmount", "MaxAmount", "Priority", "IsEnabled", "EffectiveFromUtc", "EffectiveToUtc", "CreatedAtUtc", "UpdatedAtUtc")
    VALUES
        ('840b73ab-9d8e-4a51-b95e-34a8f3a4f101', 'Commercial.BusinessCommission', 'Commercial business commission', 'Percentage commission charged to the business subtotal on commercial orders.', 0, 0, 12.00, NULL, NULL, 10, TRUE, NULL, NULL, NOW(), NULL),
        ('840b73ab-9d8e-4a51-b95e-34a8f3a4f102', 'Commercial.DeliveryPlatformCommission', 'Commercial delivery platform commission', 'Percentage retained by the platform from the delivery fee.', 0, 0, 15.00, NULL, NULL, 20, TRUE, NULL, NULL, NOW(), NULL),
        ('840b73ab-9d8e-4a51-b95e-34a8f3a4f103', 'Commercial.ServiceFee', 'Commercial service fee', 'Optional service fee added to commercial orders. Seeded at zero for compatibility.', 0, 1, 0.00, NULL, NULL, 30, FALSE, NULL, NULL, NOW(), NULL),
        ('840b73ab-9d8e-4a51-b95e-34a8f3a4f104', 'Community.FavorPlatformCommission', 'Community favor platform commission', 'Percentage retained by the platform from the collaborator reward.', 1, 0, 10.00, NULL, NULL, 10, TRUE, NULL, NULL, NOW(), NULL)
    ON CONFLICT ("Code") DO NOTHING;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260609142442_AddCommissionEngineFoundations') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260609142442_AddCommissionEngineFoundations', '9.0.0');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260611120000_AddPlatformSettingsBranding') THEN
    CREATE TABLE platform_settings (
        "Id" uuid NOT NULL,
        "Key" character varying(50) NOT NULL,
        "AppName" character varying(120) NOT NULL,
        "Tagline" character varying(240),
        "LogoUrl" character varying(1000),
        "AppIconUrl" character varying(1000),
        "SplashImageUrl" character varying(1000),
        "PrimaryColor" character varying(20),
        "SecondaryColor" character varying(20),
        "SupportEmail" character varying(200),
        "SupportPhone" character varying(50),
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "UpdatedAtUtc" timestamp with time zone,
        CONSTRAINT "PK_platform_settings" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260611120000_AddPlatformSettingsBranding') THEN
    CREATE UNIQUE INDEX "IX_platform_settings_Key" ON platform_settings ("Key");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260611120000_AddPlatformSettingsBranding') THEN
    INSERT INTO platform_settings ("Id", "Key", "AppName", "Tagline", "PrimaryColor", "SecondaryColor", "CreatedAtUtc")
    VALUES ('f2a08bb5-6e0a-4da7-b9a9-494f3d0df201', 'default', 'AppuraPe', 'Entrega local para negocios y comunidad', '#E51B23', '#F59E0B', NOW())
    ON CONFLICT ("Key") DO NOTHING;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260611120000_AddPlatformSettingsBranding') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260611120000_AddPlatformSettingsBranding', '9.0.0');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260612184709_AddBusinessDiscoveryMobileHome') THEN
    ALTER TABLE business_types ADD "IconKey" character varying(80);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260612184709_AddBusinessDiscoveryMobileHome') THEN
    ALTER TABLE business_types ADD "Slug" character varying(120) NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260612184709_AddBusinessDiscoveryMobileHome') THEN
    ALTER TABLE business_types ADD "SortOrder" integer NOT NULL DEFAULT 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260612184709_AddBusinessDiscoveryMobileHome') THEN
    CREATE UNIQUE INDEX "IX_business_types_Slug" ON business_types ("Slug");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260612184709_AddBusinessDiscoveryMobileHome') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260612184709_AddBusinessDiscoveryMobileHome', '9.0.0');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260616192746_AddOrderClientRequestId') THEN
    ALTER TABLE orders ADD "ClientRequestId" character varying(80);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260616192746_AddOrderClientRequestId') THEN
    CREATE UNIQUE INDEX "IX_orders_CustomerId_ClientRequestId" ON orders ("CustomerId", "ClientRequestId") WHERE "ClientRequestId" IS NOT NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260616192746_AddOrderClientRequestId') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260616192746_AddOrderClientRequestId', '9.0.0');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260617143521_AddPaymentsPhase1') THEN
    CREATE TABLE payments (
        "Id" uuid NOT NULL,
        "OrderId" uuid NOT NULL,
        "Method" integer NOT NULL,
        "Status" integer NOT NULL,
        "Amount" numeric(10,2) NOT NULL,
        "Currency" character varying(3) NOT NULL,
        "Provider" character varying(80),
        "ExternalReference" character varying(120),
        "ManualReference" character varying(120),
        "ConfirmedByUserId" uuid,
        "PaidAtUtc" timestamp with time zone,
        "ConfirmedAtUtc" timestamp with time zone,
        "RejectedAtUtc" timestamp with time zone,
        "FailureReason" character varying(500),
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "UpdatedAtUtc" timestamp with time zone,
        CONSTRAINT "PK_payments" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_payments_orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES orders ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_payments_users_ConfirmedByUserId" FOREIGN KEY ("ConfirmedByUserId") REFERENCES users ("Id") ON DELETE SET NULL
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260617143521_AddPaymentsPhase1') THEN
    CREATE INDEX "IX_payments_ConfirmedByUserId" ON payments ("ConfirmedByUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260617143521_AddPaymentsPhase1') THEN
    CREATE UNIQUE INDEX "IX_payments_OrderId" ON payments ("OrderId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260617143521_AddPaymentsPhase1') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260617143521_AddPaymentsPhase1', '9.0.0');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260709170925_AddUserDeviceTokensPhase1') THEN
    CREATE TABLE user_device_tokens (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Role" integer NOT NULL,
        "Token" character varying(512) NOT NULL,
        "Platform" character varying(32) NOT NULL,
        "DeviceId" character varying(160),
        "AppVersion" character varying(32),
        "IsActive" boolean NOT NULL,
        "LastSeenAtUtc" timestamp with time zone NOT NULL,
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "UpdatedAtUtc" timestamp with time zone,
        CONSTRAINT "PK_user_device_tokens" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_user_device_tokens_users_UserId" FOREIGN KEY ("UserId") REFERENCES users ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260709170925_AddUserDeviceTokensPhase1') THEN
    CREATE INDEX "IX_user_device_tokens_IsActive" ON user_device_tokens ("IsActive");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260709170925_AddUserDeviceTokensPhase1') THEN
    CREATE INDEX "IX_user_device_tokens_Role" ON user_device_tokens ("Role");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260709170925_AddUserDeviceTokensPhase1') THEN
    CREATE UNIQUE INDEX "IX_user_device_tokens_Token" ON user_device_tokens ("Token");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260709170925_AddUserDeviceTokensPhase1') THEN
    CREATE INDEX "IX_user_device_tokens_UserId" ON user_device_tokens ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260709170925_AddUserDeviceTokensPhase1') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260709170925_AddUserDeviceTokensPhase1', '9.0.0');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717152933_AddCustomerAddressesPhase1') THEN
    DROP INDEX "IX_customer_addresses_CustomerProfileId";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717152933_AddCustomerAddressesPhase1') THEN
    ALTER TABLE customer_addresses ADD "CreatedAtUtc" timestamp with time zone NOT NULL DEFAULT TIMESTAMPTZ '-infinity';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717152933_AddCustomerAddressesPhase1') THEN
    ALTER TABLE customer_addresses ADD "IsActive" boolean NOT NULL DEFAULT TRUE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717152933_AddCustomerAddressesPhase1') THEN
    ALTER TABLE customer_addresses ADD "Label" character varying(80) NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717152933_AddCustomerAddressesPhase1') THEN
    ALTER TABLE customer_addresses ADD "RecipientName" character varying(150) NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717152933_AddCustomerAddressesPhase1') THEN
    ALTER TABLE customer_addresses ADD "RecipientPhone" character varying(30) NOT NULL DEFAULT '';
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717152933_AddCustomerAddressesPhase1') THEN
    ALTER TABLE customer_addresses ADD "UpdatedAtUtc" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717152933_AddCustomerAddressesPhase1') THEN
    CREATE INDEX "IX_customer_addresses_CustomerProfileId_IsActive_IsDefault" ON customer_addresses ("CustomerProfileId", "IsActive", "IsDefault");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260717152933_AddCustomerAddressesPhase1') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260717152933_AddCustomerAddressesPhase1', '9.0.0');
    END IF;
END $EF$;
COMMIT;


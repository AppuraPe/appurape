START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807150109_AddInternalCommerceMvp') THEN
    ALTER TABLE restaurants ADD "HasOwnDelivery" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807150109_AddInternalCommerceMvp') THEN
    ALTER TABLE restaurants ADD "OwnDeliveryFee" numeric(10,2);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807150109_AddInternalCommerceMvp') THEN
    ALTER TABLE restaurants ADD "OwnDeliveryNote" character varying(500);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807150109_AddInternalCommerceMvp') THEN
    ALTER TABLE orders ADD "DeliveryMinimumAmount" numeric(10,2) NOT NULL DEFAULT 0.0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807150109_AddInternalCommerceMvp') THEN
    ALTER TABLE orders ADD "DeliveryMode" integer NOT NULL DEFAULT 0;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807150109_AddInternalCommerceMvp') THEN
    CREATE TABLE collaborator_verifications (
        "Id" uuid NOT NULL,
        "UserId" uuid NOT NULL,
        "Status" integer NOT NULL,
        "VerificationFeeAmount" numeric(10,2) NOT NULL,
        "PaymentId" uuid,
        "SubmittedAtUtc" timestamp with time zone NOT NULL,
        "ReviewedAtUtc" timestamp with time zone,
        "ReviewedByAdminId" uuid,
        "RejectReason" character varying(1000),
        "ExpiresAtUtc" timestamp with time zone,
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "UpdatedAtUtc" timestamp with time zone,
        CONSTRAINT "PK_collaborator_verifications" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_collaborator_verifications_payments_PaymentId" FOREIGN KEY ("PaymentId") REFERENCES payments ("Id") ON DELETE SET NULL,
        CONSTRAINT "FK_collaborator_verifications_users_ReviewedByAdminId" FOREIGN KEY ("ReviewedByAdminId") REFERENCES users ("Id") ON DELETE SET NULL,
        CONSTRAINT "FK_collaborator_verifications_users_UserId" FOREIGN KEY ("UserId") REFERENCES users ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807150109_AddInternalCommerceMvp') THEN
    CREATE TABLE settlement_batches (
        "Id" uuid NOT NULL,
        "TargetType" integer NOT NULL,
        "BusinessId" uuid,
        "DriverId" uuid,
        "CollaboratorUserId" uuid,
        "PeriodStartUtc" timestamp with time zone NOT NULL,
        "PeriodEndUtc" timestamp with time zone NOT NULL,
        "GrossAmount" numeric(10,2) NOT NULL,
        "CommissionAmount" numeric(10,2) NOT NULL,
        "ServiceFeeAmount" numeric(10,2) NOT NULL,
        "NetAmount" numeric(10,2) NOT NULL,
        "Status" integer NOT NULL,
        "ConfirmedAtUtc" timestamp with time zone,
        "ConfirmedByAdminId" uuid,
        "Notes" character varying(1000),
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "UpdatedAtUtc" timestamp with time zone,
        CONSTRAINT "PK_settlement_batches" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_settlement_batches_driver_profiles_DriverId" FOREIGN KEY ("DriverId") REFERENCES driver_profiles ("Id") ON DELETE SET NULL,
        CONSTRAINT "FK_settlement_batches_restaurants_BusinessId" FOREIGN KEY ("BusinessId") REFERENCES restaurants ("Id") ON DELETE SET NULL,
        CONSTRAINT "FK_settlement_batches_users_CollaboratorUserId" FOREIGN KEY ("CollaboratorUserId") REFERENCES users ("Id") ON DELETE SET NULL,
        CONSTRAINT "FK_settlement_batches_users_ConfirmedByAdminId" FOREIGN KEY ("ConfirmedByAdminId") REFERENCES users ("Id") ON DELETE SET NULL
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807150109_AddInternalCommerceMvp') THEN
    CREATE TABLE settlement_items (
        "Id" uuid NOT NULL,
        "SettlementBatchId" uuid NOT NULL,
        "FinancialMovementId" uuid NOT NULL,
        "GrossAmount" numeric(10,2) NOT NULL,
        "CommissionAmount" numeric(10,2) NOT NULL,
        "ServiceFeeAmount" numeric(10,2) NOT NULL,
        "NetAmount" numeric(10,2) NOT NULL,
        "CreatedAtUtc" timestamp with time zone NOT NULL,
        "UpdatedAtUtc" timestamp with time zone,
        CONSTRAINT "PK_settlement_items" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_settlement_items_financial_movements_FinancialMovementId" FOREIGN KEY ("FinancialMovementId") REFERENCES financial_movements ("Id") ON DELETE RESTRICT,
        CONSTRAINT "FK_settlement_items_settlement_batches_SettlementBatchId" FOREIGN KEY ("SettlementBatchId") REFERENCES settlement_batches ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807150109_AddInternalCommerceMvp') THEN
    CREATE UNIQUE INDEX "IX_financial_movements_CommunityRequestId_Type" ON financial_movements ("CommunityRequestId", "Type") WHERE "CommunityRequestId" IS NOT NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807150109_AddInternalCommerceMvp') THEN
    CREATE UNIQUE INDEX "IX_financial_movements_OrderId_Type" ON financial_movements ("OrderId", "Type") WHERE "OrderId" IS NOT NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807150109_AddInternalCommerceMvp') THEN
    CREATE INDEX "IX_collaborator_verifications_PaymentId" ON collaborator_verifications ("PaymentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807150109_AddInternalCommerceMvp') THEN
    CREATE INDEX "IX_collaborator_verifications_ReviewedByAdminId" ON collaborator_verifications ("ReviewedByAdminId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807150109_AddInternalCommerceMvp') THEN
    CREATE INDEX "IX_collaborator_verifications_Status" ON collaborator_verifications ("Status");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807150109_AddInternalCommerceMvp') THEN
    CREATE UNIQUE INDEX "IX_collaborator_verifications_UserId" ON collaborator_verifications ("UserId") WHERE "Status" IN (1, 2);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807150109_AddInternalCommerceMvp') THEN
    CREATE INDEX "IX_settlement_batches_BusinessId" ON settlement_batches ("BusinessId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807150109_AddInternalCommerceMvp') THEN
    CREATE INDEX "IX_settlement_batches_CollaboratorUserId" ON settlement_batches ("CollaboratorUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807150109_AddInternalCommerceMvp') THEN
    CREATE INDEX "IX_settlement_batches_ConfirmedByAdminId" ON settlement_batches ("ConfirmedByAdminId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807150109_AddInternalCommerceMvp') THEN
    CREATE INDEX "IX_settlement_batches_DriverId" ON settlement_batches ("DriverId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807150109_AddInternalCommerceMvp') THEN
    CREATE INDEX "IX_settlement_batches_Status" ON settlement_batches ("Status");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807150109_AddInternalCommerceMvp') THEN
    CREATE INDEX "IX_settlement_batches_TargetType" ON settlement_batches ("TargetType");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807150109_AddInternalCommerceMvp') THEN
    CREATE INDEX "IX_settlement_items_FinancialMovementId" ON settlement_items ("FinancialMovementId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807150109_AddInternalCommerceMvp') THEN
    CREATE UNIQUE INDEX "IX_settlement_items_SettlementBatchId_FinancialMovementId" ON settlement_items ("SettlementBatchId", "FinancialMovementId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260807150109_AddInternalCommerceMvp') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260807150109_AddInternalCommerceMvp', '9.0.0');
    END IF;
END $EF$;
COMMIT;


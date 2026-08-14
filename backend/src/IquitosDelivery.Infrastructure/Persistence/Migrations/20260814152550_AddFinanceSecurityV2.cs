using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IquitosDelivery.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFinanceSecurityV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_settlement_items_FinancialMovementId",
                table: "settlement_items");

            migrationBuilder.DropIndex(
                name: "IX_settlement_items_SettlementBatchId_FinancialMovementId",
                table: "settlement_items");

            migrationBuilder.AlterColumn<Guid>(
                name: "FinancialMovementId",
                table: "settlement_items",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<Guid>(
                name: "FinancialObligationId",
                table: "settlement_items",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "settlement_items",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAtUtc",
                table: "settlement_batches",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ApprovedByAdminId",
                table: "settlement_batches",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreatedByAdminId",
                table: "settlement_batches",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CreditorEntityId",
                table: "settlement_batches",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CreditorType",
                table: "settlement_batches",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DebtorEntityId",
                table: "settlement_batches",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DebtorType",
                table: "settlement_batches",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentEvidenceObjectPath",
                table: "settlement_batches",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentEvidenceSha256",
                table: "settlement_batches",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentOperationNumber",
                table: "settlement_batches",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PaymentReportedAtUtc",
                table: "settlement_batches",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PaymentReportedByAdminId",
                table: "settlement_batches",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "settlement_batches",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "payments",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.AddColumn<bool>(
                name: "IsImmutable",
                table: "financial_movements",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ReconciliationStatus",
                table: "financial_movements",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ConfirmationCodeFailedAttempts",
                table: "community_requests",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "ConfirmationCodeLockedAtUtc",
                table: "community_requests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ConfirmationCodeRegenerations",
                table: "community_requests",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ConfirmationCodeVersion",
                table: "community_requests",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PickupCodeFailedAttempts",
                table: "community_requests",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "PickupCodeLockedAtUtc",
                table: "community_requests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PickupCodeVersion",
                table: "community_requests",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "financial_audit_events",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ActorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Action = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntityType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EntityId = table.Column<Guid>(type: "uuid", nullable: false),
                    IdempotencyKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DataJson = table.Column<string>(type: "jsonb", nullable: false),
                    IpAddress = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    UserAgent = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_financial_audit_events", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "payment_evidence",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PaymentId = table.Column<Guid>(type: "uuid", nullable: false),
                    Method = table.Column<int>(type: "integer", nullable: false),
                    OperationNumber = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    DeclaredAmount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    PaidAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PrivateObjectPath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ContentSha256 = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SubmittedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    DuplicateOverrideReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DuplicateOverrideByAdminId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payment_evidence", x => x.Id);
                    table.ForeignKey(
                        name: "FK_payment_evidence_payments_PaymentId",
                        column: x => x.PaymentId,
                        principalTable: "payments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_payment_evidence_users_SubmittedByUserId",
                        column: x => x.SubmittedByUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "refund_requests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    PaymentId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    CurrencyCode = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    Reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    RequestedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    RequestedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    BusinessReportedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CustomerConfirmedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DisputedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResolvedByAdminId = table.Column<Guid>(type: "uuid", nullable: true),
                    ResolutionReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_refund_requests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_refund_requests_orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_refund_requests_payments_PaymentId",
                        column: x => x.PaymentId,
                        principalTable: "payments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "financial_obligations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: true),
                    CommunityRequestId = table.Column<Guid>(type: "uuid", nullable: true),
                    RefundRequestId = table.Column<Guid>(type: "uuid", nullable: true),
                    DebtorType = table.Column<int>(type: "integer", nullable: false),
                    DebtorEntityId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreditorType = table.Column<int>(type: "integer", nullable: false),
                    CreditorEntityId = table.Column<Guid>(type: "uuid", nullable: true),
                    Concept = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    CurrencyCode = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    DueAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AvailableAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SettledAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SnapshotJson = table.Column<string>(type: "jsonb", nullable: false),
                    Reference = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    ReversalOfId = table.Column<Guid>(type: "uuid", nullable: true),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_financial_obligations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_financial_obligations_community_requests_CommunityRequestId",
                        column: x => x.CommunityRequestId,
                        principalTable: "community_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_financial_obligations_financial_obligations_ReversalOfId",
                        column: x => x.ReversalOfId,
                        principalTable: "financial_obligations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_financial_obligations_orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_financial_obligations_refund_requests_RefundRequestId",
                        column: x => x.RefundRequestId,
                        principalTable: "refund_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "refund_evidence",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RefundRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    OperationNumber = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    RefundedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PrivateObjectPath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ContentSha256 = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    SubmittedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_refund_evidence", x => x.Id);
                    table.ForeignKey(
                        name: "FK_refund_evidence_refund_requests_RefundRequestId",
                        column: x => x.RefundRequestId,
                        principalTable: "refund_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // FinanceV2 never silently reuses the ambiguous historical ledger. Admin must
            // reconcile every legacy row before it can become a current obligation.
            migrationBuilder.Sql("""
                UPDATE financial_movements
                SET "ReconciliationStatus" = 1, "IsImmutable" = TRUE;

                WITH duplicates AS (
                    SELECT "Id", ROW_NUMBER() OVER (
                        PARTITION BY "FinancialMovementId" ORDER BY "Id") AS row_number
                    FROM settlement_items
                    WHERE "FinancialMovementId" IS NOT NULL AND "IsActive" = TRUE
                )
                UPDATE settlement_items AS item
                SET "IsActive" = FALSE
                FROM duplicates
                WHERE item."Id" = duplicates."Id" AND duplicates.row_number > 1;

                UPDATE community_requests
                SET "ConfirmationCode" = NULL,
                    "ConfirmationCodeVersion" = CASE WHEN "ConfirmationCodeVersion" < 1 THEN 1 ELSE "ConfirmationCodeVersion" END,
                    "PickupCode" = NULL,
                    "PickupCodeVersion" = CASE WHEN "PickupCodeVersion" < 1 THEN 1 ELSE "PickupCodeVersion" END
                WHERE "Status" IN (0, 1, 2, 3, 4);
                """);

            migrationBuilder.CreateIndex(
                name: "IX_settlement_items_FinancialMovementId",
                table: "settlement_items",
                column: "FinancialMovementId",
                unique: true,
                filter: "\"FinancialMovementId\" IS NOT NULL AND \"IsActive\" = TRUE");

            migrationBuilder.CreateIndex(
                name: "IX_settlement_items_FinancialObligationId",
                table: "settlement_items",
                column: "FinancialObligationId",
                unique: true,
                filter: "\"FinancialObligationId\" IS NOT NULL AND \"IsActive\" = TRUE");

            migrationBuilder.CreateIndex(
                name: "IX_settlement_items_SettlementBatchId",
                table: "settlement_items",
                column: "SettlementBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_financial_audit_events_ActorUserId_Action_IdempotencyKey",
                table: "financial_audit_events",
                columns: new[] { "ActorUserId", "Action", "IdempotencyKey" },
                unique: true,
                filter: "\"IdempotencyKey\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_financial_obligations_CommunityRequestId_Concept",
                table: "financial_obligations",
                columns: new[] { "CommunityRequestId", "Concept" },
                unique: true,
                filter: "\"CommunityRequestId\" IS NOT NULL AND \"ReversalOfId\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_financial_obligations_CreditorType_CreditorEntityId_Status",
                table: "financial_obligations",
                columns: new[] { "CreditorType", "CreditorEntityId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_financial_obligations_DebtorType_DebtorEntityId_Status",
                table: "financial_obligations",
                columns: new[] { "DebtorType", "DebtorEntityId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_financial_obligations_OrderId_Concept",
                table: "financial_obligations",
                columns: new[] { "OrderId", "Concept" },
                unique: true,
                filter: "\"OrderId\" IS NOT NULL AND \"ReversalOfId\" IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_financial_obligations_RefundRequestId",
                table: "financial_obligations",
                column: "RefundRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_financial_obligations_ReversalOfId",
                table: "financial_obligations",
                column: "ReversalOfId");

            migrationBuilder.CreateIndex(
                name: "IX_payment_evidence_ContentSha256",
                table: "payment_evidence",
                column: "ContentSha256",
                unique: true,
                filter: "\"IsActive\" = TRUE");

            migrationBuilder.CreateIndex(
                name: "IX_payment_evidence_Method_OperationNumber",
                table: "payment_evidence",
                columns: new[] { "Method", "OperationNumber" },
                unique: true,
                filter: "\"IsActive\" = TRUE");

            migrationBuilder.CreateIndex(
                name: "IX_payment_evidence_PaymentId",
                table: "payment_evidence",
                column: "PaymentId",
                unique: true,
                filter: "\"IsActive\" = TRUE");

            migrationBuilder.CreateIndex(
                name: "IX_payment_evidence_SubmittedByUserId",
                table: "payment_evidence",
                column: "SubmittedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_refund_evidence_ContentSha256",
                table: "refund_evidence",
                column: "ContentSha256",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_refund_evidence_RefundRequestId",
                table: "refund_evidence",
                column: "RefundRequestId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_refund_requests_OrderId",
                table: "refund_requests",
                column: "OrderId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_refund_requests_PaymentId",
                table: "refund_requests",
                column: "PaymentId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_settlement_items_financial_obligations_FinancialObligationId",
                table: "settlement_items",
                column: "FinancialObligationId",
                principalTable: "financial_obligations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_settlement_items_financial_obligations_FinancialObligationId",
                table: "settlement_items");

            migrationBuilder.DropTable(
                name: "financial_audit_events");

            migrationBuilder.DropTable(
                name: "financial_obligations");

            migrationBuilder.DropTable(
                name: "payment_evidence");

            migrationBuilder.DropTable(
                name: "refund_evidence");

            migrationBuilder.DropTable(
                name: "refund_requests");

            migrationBuilder.DropIndex(
                name: "IX_settlement_items_FinancialMovementId",
                table: "settlement_items");

            migrationBuilder.DropIndex(
                name: "IX_settlement_items_FinancialObligationId",
                table: "settlement_items");

            migrationBuilder.DropIndex(
                name: "IX_settlement_items_SettlementBatchId",
                table: "settlement_items");

            migrationBuilder.DropColumn(
                name: "FinancialObligationId",
                table: "settlement_items");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "settlement_items");

            migrationBuilder.DropColumn(
                name: "ApprovedAtUtc",
                table: "settlement_batches");

            migrationBuilder.DropColumn(
                name: "ApprovedByAdminId",
                table: "settlement_batches");

            migrationBuilder.DropColumn(
                name: "CreatedByAdminId",
                table: "settlement_batches");

            migrationBuilder.DropColumn(
                name: "CreditorEntityId",
                table: "settlement_batches");

            migrationBuilder.DropColumn(
                name: "CreditorType",
                table: "settlement_batches");

            migrationBuilder.DropColumn(
                name: "DebtorEntityId",
                table: "settlement_batches");

            migrationBuilder.DropColumn(
                name: "DebtorType",
                table: "settlement_batches");

            migrationBuilder.DropColumn(
                name: "PaymentEvidenceObjectPath",
                table: "settlement_batches");

            migrationBuilder.DropColumn(
                name: "PaymentEvidenceSha256",
                table: "settlement_batches");

            migrationBuilder.DropColumn(
                name: "PaymentOperationNumber",
                table: "settlement_batches");

            migrationBuilder.DropColumn(
                name: "PaymentReportedAtUtc",
                table: "settlement_batches");

            migrationBuilder.DropColumn(
                name: "PaymentReportedByAdminId",
                table: "settlement_batches");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "settlement_batches");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "payments");

            migrationBuilder.DropColumn(
                name: "IsImmutable",
                table: "financial_movements");

            migrationBuilder.DropColumn(
                name: "ReconciliationStatus",
                table: "financial_movements");

            migrationBuilder.DropColumn(
                name: "ConfirmationCodeFailedAttempts",
                table: "community_requests");

            migrationBuilder.DropColumn(
                name: "ConfirmationCodeLockedAtUtc",
                table: "community_requests");

            migrationBuilder.DropColumn(
                name: "ConfirmationCodeRegenerations",
                table: "community_requests");

            migrationBuilder.DropColumn(
                name: "ConfirmationCodeVersion",
                table: "community_requests");

            migrationBuilder.DropColumn(
                name: "PickupCodeFailedAttempts",
                table: "community_requests");

            migrationBuilder.DropColumn(
                name: "PickupCodeLockedAtUtc",
                table: "community_requests");

            migrationBuilder.DropColumn(
                name: "PickupCodeVersion",
                table: "community_requests");

            migrationBuilder.AlterColumn<Guid>(
                name: "FinancialMovementId",
                table: "settlement_items",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_settlement_items_FinancialMovementId",
                table: "settlement_items",
                column: "FinancialMovementId");

            migrationBuilder.CreateIndex(
                name: "IX_settlement_items_SettlementBatchId_FinancialMovementId",
                table: "settlement_items",
                columns: new[] { "SettlementBatchId", "FinancialMovementId" },
                unique: true);
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IquitosDelivery.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInternalCommerceMvp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasOwnDelivery",
                table: "restaurants",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "OwnDeliveryFee",
                table: "restaurants",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OwnDeliveryNote",
                table: "restaurants",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DeliveryMinimumAmount",
                table: "orders",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "DeliveryMode",
                table: "orders",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "collaborator_verifications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    VerificationFeeAmount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    PaymentId = table.Column<Guid>(type: "uuid", nullable: true),
                    SubmittedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReviewedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReviewedByAdminId = table.Column<Guid>(type: "uuid", nullable: true),
                    RejectReason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ExpiresAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_collaborator_verifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_collaborator_verifications_payments_PaymentId",
                        column: x => x.PaymentId,
                        principalTable: "payments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_collaborator_verifications_users_ReviewedByAdminId",
                        column: x => x.ReviewedByAdminId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_collaborator_verifications_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "settlement_batches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetType = table.Column<int>(type: "integer", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: true),
                    DriverId = table.Column<Guid>(type: "uuid", nullable: true),
                    CollaboratorUserId = table.Column<Guid>(type: "uuid", nullable: true),
                    PeriodStartUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PeriodEndUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    GrossAmount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    CommissionAmount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    ServiceFeeAmount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    NetAmount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ConfirmedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ConfirmedByAdminId = table.Column<Guid>(type: "uuid", nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_settlement_batches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_settlement_batches_driver_profiles_DriverId",
                        column: x => x.DriverId,
                        principalTable: "driver_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_settlement_batches_restaurants_BusinessId",
                        column: x => x.BusinessId,
                        principalTable: "restaurants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_settlement_batches_users_CollaboratorUserId",
                        column: x => x.CollaboratorUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_settlement_batches_users_ConfirmedByAdminId",
                        column: x => x.ConfirmedByAdminId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "settlement_items",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SettlementBatchId = table.Column<Guid>(type: "uuid", nullable: false),
                    FinancialMovementId = table.Column<Guid>(type: "uuid", nullable: false),
                    GrossAmount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    CommissionAmount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    ServiceFeeAmount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    NetAmount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_settlement_items", x => x.Id);
                    table.ForeignKey(
                        name: "FK_settlement_items_financial_movements_FinancialMovementId",
                        column: x => x.FinancialMovementId,
                        principalTable: "financial_movements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_settlement_items_settlement_batches_SettlementBatchId",
                        column: x => x.SettlementBatchId,
                        principalTable: "settlement_batches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_financial_movements_CommunityRequestId_Type",
                table: "financial_movements",
                columns: new[] { "CommunityRequestId", "Type" },
                unique: true,
                filter: "\"CommunityRequestId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_financial_movements_OrderId_Type",
                table: "financial_movements",
                columns: new[] { "OrderId", "Type" },
                unique: true,
                filter: "\"OrderId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_collaborator_verifications_PaymentId",
                table: "collaborator_verifications",
                column: "PaymentId");

            migrationBuilder.CreateIndex(
                name: "IX_collaborator_verifications_ReviewedByAdminId",
                table: "collaborator_verifications",
                column: "ReviewedByAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_collaborator_verifications_Status",
                table: "collaborator_verifications",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_collaborator_verifications_UserId",
                table: "collaborator_verifications",
                column: "UserId",
                unique: true,
                filter: "\"Status\" IN (1, 2)");

            migrationBuilder.CreateIndex(
                name: "IX_settlement_batches_BusinessId",
                table: "settlement_batches",
                column: "BusinessId");

            migrationBuilder.CreateIndex(
                name: "IX_settlement_batches_CollaboratorUserId",
                table: "settlement_batches",
                column: "CollaboratorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_settlement_batches_ConfirmedByAdminId",
                table: "settlement_batches",
                column: "ConfirmedByAdminId");

            migrationBuilder.CreateIndex(
                name: "IX_settlement_batches_DriverId",
                table: "settlement_batches",
                column: "DriverId");

            migrationBuilder.CreateIndex(
                name: "IX_settlement_batches_Status",
                table: "settlement_batches",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_settlement_batches_TargetType",
                table: "settlement_batches",
                column: "TargetType");

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "collaborator_verifications");

            migrationBuilder.DropTable(
                name: "settlement_items");

            migrationBuilder.DropTable(
                name: "settlement_batches");

            migrationBuilder.DropIndex(
                name: "IX_financial_movements_CommunityRequestId_Type",
                table: "financial_movements");

            migrationBuilder.DropIndex(
                name: "IX_financial_movements_OrderId_Type",
                table: "financial_movements");

            migrationBuilder.DropColumn(
                name: "HasOwnDelivery",
                table: "restaurants");

            migrationBuilder.DropColumn(
                name: "OwnDeliveryFee",
                table: "restaurants");

            migrationBuilder.DropColumn(
                name: "OwnDeliveryNote",
                table: "restaurants");

            migrationBuilder.DropColumn(
                name: "DeliveryMinimumAmount",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "DeliveryMode",
                table: "orders");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IquitosDelivery.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCommissionEngineFoundations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "BusinessCommissionAmount",
                table: "orders",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "BusinessNetAmount",
                table: "orders",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "CourierEarningAmount",
                table: "orders",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "DeliveryPlatformCommissionAmount",
                table: "orders",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountAmount",
                table: "orders",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PlatformRevenueAmount",
                table: "orders",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "PricingSnapshotJson",
                table: "orders",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ServiceFeeAmount",
                table: "orders",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "CollaboratorEarningAmount",
                table: "community_requests",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "EstimatedPurchaseAmount",
                table: "community_requests",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "FavorPlatformCommissionAmount",
                table: "community_requests",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PlatformRevenueAmount",
                table: "community_requests",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "PricingSnapshotJson",
                table: "community_requests",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalClientAmount",
                table: "community_requests",
                type: "numeric(10,2)",
                precision: 10,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "commission_rules",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Scope = table.Column<int>(type: "integer", nullable: false),
                    ValueType = table.Column<int>(type: "integer", nullable: false),
                    Value = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    MinAmount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    MaxAmount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    EffectiveFromUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EffectiveToUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_commission_rules", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "financial_movements",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: true),
                    CommunityRequestId = table.Column<Guid>(type: "uuid", nullable: true),
                    RestaurantId = table.Column<Guid>(type: "uuid", nullable: true),
                    UserId = table.Column<Guid>(type: "uuid", nullable: true),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    CurrencyCode = table.Column<string>(type: "character varying(8)", maxLength: 8, nullable: false),
                    OccurredAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    AvailableAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SettledAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Reference = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_financial_movements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_financial_movements_community_requests_CommunityRequestId",
                        column: x => x.CommunityRequestId,
                        principalTable: "community_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_financial_movements_orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_financial_movements_restaurants_RestaurantId",
                        column: x => x.RestaurantId,
                        principalTable: "restaurants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_financial_movements_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_commission_rules_Code",
                table: "commission_rules",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_commission_rules_Scope",
                table: "commission_rules",
                column: "Scope");

            migrationBuilder.CreateIndex(
                name: "IX_financial_movements_CommunityRequestId",
                table: "financial_movements",
                column: "CommunityRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_financial_movements_OrderId",
                table: "financial_movements",
                column: "OrderId");

            migrationBuilder.CreateIndex(
                name: "IX_financial_movements_RestaurantId",
                table: "financial_movements",
                column: "RestaurantId");

            migrationBuilder.CreateIndex(
                name: "IX_financial_movements_Status",
                table: "financial_movements",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_financial_movements_Type",
                table: "financial_movements",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_financial_movements_UserId",
                table: "financial_movements",
                column: "UserId");

            migrationBuilder.Sql("""
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
                """);

            migrationBuilder.Sql("""
                UPDATE community_requests
                SET "EstimatedPurchaseAmount" = 0,
                    "FavorPlatformCommissionAmount" = 0,
                    "CollaboratorEarningAmount" = "CompensationAmount",
                    "TotalClientAmount" = "CompensationAmount",
                    "PlatformRevenueAmount" = 0
                WHERE "TotalClientAmount" = 0
                  AND "CompensationAmount" >= 0;
                """);

            migrationBuilder.Sql("""
                INSERT INTO commission_rules ("Id", "Code", "Name", "Description", "Scope", "ValueType", "Value", "MinAmount", "MaxAmount", "Priority", "IsEnabled", "EffectiveFromUtc", "EffectiveToUtc", "CreatedAtUtc", "UpdatedAtUtc")
                VALUES
                    ('840b73ab-9d8e-4a51-b95e-34a8f3a4f101', 'Commercial.BusinessCommission', 'Commercial business commission', 'Percentage commission charged to the business subtotal on commercial orders.', 0, 0, 12.00, NULL, NULL, 10, TRUE, NULL, NULL, NOW(), NULL),
                    ('840b73ab-9d8e-4a51-b95e-34a8f3a4f102', 'Commercial.DeliveryPlatformCommission', 'Commercial delivery platform commission', 'Percentage retained by the platform from the delivery fee.', 0, 0, 15.00, NULL, NULL, 20, TRUE, NULL, NULL, NOW(), NULL),
                    ('840b73ab-9d8e-4a51-b95e-34a8f3a4f103', 'Commercial.ServiceFee', 'Commercial service fee', 'Optional service fee added to commercial orders. Seeded at zero for compatibility.', 0, 1, 0.00, NULL, NULL, 30, FALSE, NULL, NULL, NOW(), NULL),
                    ('840b73ab-9d8e-4a51-b95e-34a8f3a4f104', 'Community.FavorPlatformCommission', 'Community favor platform commission', 'Percentage retained by the platform from the collaborator reward.', 1, 0, 10.00, NULL, NULL, 10, TRUE, NULL, NULL, NOW(), NULL)
                ON CONFLICT ("Code") DO NOTHING;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "commission_rules");

            migrationBuilder.DropTable(
                name: "financial_movements");

            migrationBuilder.DropColumn(
                name: "BusinessCommissionAmount",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "BusinessNetAmount",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "CourierEarningAmount",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "DeliveryPlatformCommissionAmount",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "DiscountAmount",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "PlatformRevenueAmount",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "PricingSnapshotJson",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "ServiceFeeAmount",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "CollaboratorEarningAmount",
                table: "community_requests");

            migrationBuilder.DropColumn(
                name: "EstimatedPurchaseAmount",
                table: "community_requests");

            migrationBuilder.DropColumn(
                name: "FavorPlatformCommissionAmount",
                table: "community_requests");

            migrationBuilder.DropColumn(
                name: "PlatformRevenueAmount",
                table: "community_requests");

            migrationBuilder.DropColumn(
                name: "PricingSnapshotJson",
                table: "community_requests");

            migrationBuilder.DropColumn(
                name: "TotalClientAmount",
                table: "community_requests");
        }
    }
}

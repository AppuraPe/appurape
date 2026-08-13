using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IquitosDelivery.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderDeliveryConfirmation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DeliveryConfirmationExpiresAtUtc",
                table: "orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DeliveryConfirmationFailedAttempts",
                table: "orders",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeliveryConfirmationLockedAtUtc",
                table: "orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DeliveryConfirmationRegenerations",
                table: "orders",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DeliveryConfirmationVersion",
                table: "orders",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeliveryConfirmedAtUtc",
                table: "orders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DeliveryConfirmedByUserId",
                table: "orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FavorPaidAtUtc",
                table: "community_requests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FavorPaymentMethod",
                table: "community_requests",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "FavorPaymentStatus",
                table: "community_requests",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "order_delivery_confirmation_audits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    ActorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Action = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    CodeVersion = table.Column<int>(type: "integer", nullable: false),
                    Reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_order_delivery_confirmation_audits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_order_delivery_confirmation_audits_orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_order_delivery_confirmation_audits_users_ActorUserId",
                        column: x => x.ActorUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_order_delivery_confirmation_audits_ActorUserId",
                table: "order_delivery_confirmation_audits",
                column: "ActorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_order_delivery_confirmation_audits_OrderId_CreatedAtUtc",
                table: "order_delivery_confirmation_audits",
                columns: new[] { "OrderId", "CreatedAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "order_delivery_confirmation_audits");

            migrationBuilder.DropColumn(
                name: "DeliveryConfirmationExpiresAtUtc",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "DeliveryConfirmationFailedAttempts",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "DeliveryConfirmationLockedAtUtc",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "DeliveryConfirmationRegenerations",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "DeliveryConfirmationVersion",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "DeliveryConfirmedAtUtc",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "DeliveryConfirmedByUserId",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "FavorPaidAtUtc",
                table: "community_requests");

            migrationBuilder.DropColumn(
                name: "FavorPaymentMethod",
                table: "community_requests");

            migrationBuilder.DropColumn(
                name: "FavorPaymentStatus",
                table: "community_requests");
        }
    }
}

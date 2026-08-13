using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IquitosDelivery.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class LinkOrderCollaboratorPickup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "OrderId",
                table: "community_requests",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PickupCode",
                table: "community_requests",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PickupCodeExpiresAtUtc",
                table: "community_requests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PickupConfirmedAtUtc",
                table: "community_requests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SourceType",
                table: "community_requests",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_community_requests_OrderId",
                table: "community_requests",
                column: "OrderId",
                unique: true,
                filter: "\"OrderId\" IS NOT NULL AND \"Status\" <> 6");

            migrationBuilder.AddForeignKey(
                name: "FK_community_requests_orders_OrderId",
                table: "community_requests",
                column: "OrderId",
                principalTable: "orders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_community_requests_orders_OrderId",
                table: "community_requests");

            migrationBuilder.DropIndex(
                name: "IX_community_requests_OrderId",
                table: "community_requests");

            migrationBuilder.DropColumn(
                name: "OrderId",
                table: "community_requests");

            migrationBuilder.DropColumn(
                name: "PickupCode",
                table: "community_requests");

            migrationBuilder.DropColumn(
                name: "PickupCodeExpiresAtUtc",
                table: "community_requests");

            migrationBuilder.DropColumn(
                name: "PickupConfirmedAtUtc",
                table: "community_requests");

            migrationBuilder.DropColumn(
                name: "SourceType",
                table: "community_requests");
        }
    }
}

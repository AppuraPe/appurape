using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IquitosDelivery.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerAddressesPhase1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_customer_addresses_CustomerProfileId",
                table: "customer_addresses");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAtUtc",
                table: "customer_addresses",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "customer_addresses",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "Label",
                table: "customer_addresses",
                type: "character varying(80)",
                maxLength: 80,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RecipientName",
                table: "customer_addresses",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RecipientPhone",
                table: "customer_addresses",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "customer_addresses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_customer_addresses_CustomerProfileId_IsActive_IsDefault",
                table: "customer_addresses",
                columns: new[] { "CustomerProfileId", "IsActive", "IsDefault" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_customer_addresses_CustomerProfileId_IsActive_IsDefault",
                table: "customer_addresses");

            migrationBuilder.DropColumn(
                name: "CreatedAtUtc",
                table: "customer_addresses");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "customer_addresses");

            migrationBuilder.DropColumn(
                name: "Label",
                table: "customer_addresses");

            migrationBuilder.DropColumn(
                name: "RecipientName",
                table: "customer_addresses");

            migrationBuilder.DropColumn(
                name: "RecipientPhone",
                table: "customer_addresses");

            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "customer_addresses");

            migrationBuilder.CreateIndex(
                name: "IX_customer_addresses_CustomerProfileId",
                table: "customer_addresses",
                column: "CustomerProfileId");
        }
    }
}

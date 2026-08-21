using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IquitosDelivery.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdentityAndPhoneUniqueness : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IdentityDocumentNumber",
                table: "users",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IdentityDocumentNumberNormalized",
                table: "users",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IdentityDocumentType",
                table: "users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "DNI");

            migrationBuilder.AddColumn<bool>(
                name: "IsPhoneVerified",
                table: "users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PhoneNormalized",
                table: "users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PhoneVerifiedAtUtc",
                table: "users",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IdentityDocumentNumber",
                table: "pending_restaurant_registrations",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "IdentityDocumentNumberNormalized",
                table: "pending_restaurant_registrations",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IdentityDocumentType",
                table: "pending_restaurant_registrations",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "DNI");

            migrationBuilder.AddColumn<string>(
                name: "PhoneNormalized",
                table: "pending_restaurant_registrations",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IdentityDocumentNumber",
                table: "pending_driver_registrations",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "IdentityDocumentNumberNormalized",
                table: "pending_driver_registrations",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IdentityDocumentType",
                table: "pending_driver_registrations",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "DNI");

            migrationBuilder.AddColumn<string>(
                name: "PhoneNormalized",
                table: "pending_driver_registrations",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IdentityDocumentNumber",
                table: "pending_customer_registrations",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "IdentityDocumentNumberNormalized",
                table: "pending_customer_registrations",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IdentityDocumentType",
                table: "pending_customer_registrations",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "DNI");

            migrationBuilder.AddColumn<string>(
                name: "PhoneNormalized",
                table: "pending_customer_registrations",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_IdentityDocumentNumberNormalized",
                table: "users",
                column: "IdentityDocumentNumberNormalized",
                unique: true,
                filter: "\"IdentityDocumentNumberNormalized\" IS NOT NULL AND \"IdentityDocumentNumberNormalized\" <> ''");

            migrationBuilder.CreateIndex(
                name: "IX_users_PhoneNormalized",
                table: "users",
                column: "PhoneNormalized",
                unique: true,
                filter: "\"PhoneNormalized\" IS NOT NULL AND \"PhoneNormalized\" <> ''");

            migrationBuilder.CreateIndex(
                name: "IX_pending_restaurant_registrations_IdentityDocumentNumberNorm~",
                table: "pending_restaurant_registrations",
                columns: new[] { "IdentityDocumentNumberNormalized", "IsCompleted" });

            migrationBuilder.CreateIndex(
                name: "IX_pending_restaurant_registrations_PhoneNormalized_IsCompleted",
                table: "pending_restaurant_registrations",
                columns: new[] { "PhoneNormalized", "IsCompleted" });

            migrationBuilder.CreateIndex(
                name: "IX_pending_driver_registrations_IdentityDocumentNumberNormaliz~",
                table: "pending_driver_registrations",
                columns: new[] { "IdentityDocumentNumberNormalized", "IsCompleted" });

            migrationBuilder.CreateIndex(
                name: "IX_pending_driver_registrations_PhoneNormalized_IsCompleted",
                table: "pending_driver_registrations",
                columns: new[] { "PhoneNormalized", "IsCompleted" });

            migrationBuilder.CreateIndex(
                name: "IX_pending_customer_registrations_IdentityDocumentNumberNormal~",
                table: "pending_customer_registrations",
                columns: new[] { "IdentityDocumentNumberNormalized", "IsCompleted" });

            migrationBuilder.CreateIndex(
                name: "IX_pending_customer_registrations_PhoneNormalized_IsCompleted",
                table: "pending_customer_registrations",
                columns: new[] { "PhoneNormalized", "IsCompleted" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_users_IdentityDocumentNumberNormalized",
                table: "users");

            migrationBuilder.DropIndex(
                name: "IX_users_PhoneNormalized",
                table: "users");

            migrationBuilder.DropIndex(
                name: "IX_pending_restaurant_registrations_IdentityDocumentNumberNorm~",
                table: "pending_restaurant_registrations");

            migrationBuilder.DropIndex(
                name: "IX_pending_restaurant_registrations_PhoneNormalized_IsCompleted",
                table: "pending_restaurant_registrations");

            migrationBuilder.DropIndex(
                name: "IX_pending_driver_registrations_IdentityDocumentNumberNormaliz~",
                table: "pending_driver_registrations");

            migrationBuilder.DropIndex(
                name: "IX_pending_driver_registrations_PhoneNormalized_IsCompleted",
                table: "pending_driver_registrations");

            migrationBuilder.DropIndex(
                name: "IX_pending_customer_registrations_IdentityDocumentNumberNormal~",
                table: "pending_customer_registrations");

            migrationBuilder.DropIndex(
                name: "IX_pending_customer_registrations_PhoneNormalized_IsCompleted",
                table: "pending_customer_registrations");

            migrationBuilder.DropColumn(
                name: "IdentityDocumentNumber",
                table: "users");

            migrationBuilder.DropColumn(
                name: "IdentityDocumentNumberNormalized",
                table: "users");

            migrationBuilder.DropColumn(
                name: "IdentityDocumentType",
                table: "users");

            migrationBuilder.DropColumn(
                name: "IsPhoneVerified",
                table: "users");

            migrationBuilder.DropColumn(
                name: "PhoneNormalized",
                table: "users");

            migrationBuilder.DropColumn(
                name: "PhoneVerifiedAtUtc",
                table: "users");

            migrationBuilder.DropColumn(
                name: "IdentityDocumentNumber",
                table: "pending_restaurant_registrations");

            migrationBuilder.DropColumn(
                name: "IdentityDocumentNumberNormalized",
                table: "pending_restaurant_registrations");

            migrationBuilder.DropColumn(
                name: "IdentityDocumentType",
                table: "pending_restaurant_registrations");

            migrationBuilder.DropColumn(
                name: "PhoneNormalized",
                table: "pending_restaurant_registrations");

            migrationBuilder.DropColumn(
                name: "IdentityDocumentNumber",
                table: "pending_driver_registrations");

            migrationBuilder.DropColumn(
                name: "IdentityDocumentNumberNormalized",
                table: "pending_driver_registrations");

            migrationBuilder.DropColumn(
                name: "IdentityDocumentType",
                table: "pending_driver_registrations");

            migrationBuilder.DropColumn(
                name: "PhoneNormalized",
                table: "pending_driver_registrations");

            migrationBuilder.DropColumn(
                name: "IdentityDocumentNumber",
                table: "pending_customer_registrations");

            migrationBuilder.DropColumn(
                name: "IdentityDocumentNumberNormalized",
                table: "pending_customer_registrations");

            migrationBuilder.DropColumn(
                name: "IdentityDocumentType",
                table: "pending_customer_registrations");

            migrationBuilder.DropColumn(
                name: "PhoneNormalized",
                table: "pending_customer_registrations");
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IquitosDelivery.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPendingRegistrationFileUrls : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LogoUrl",
                table: "pending_restaurant_registrations",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IdentityDocumentUrl",
                table: "pending_driver_registrations",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VehiclePhotoUrl",
                table: "pending_driver_registrations",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LogoUrl",
                table: "pending_restaurant_registrations");

            migrationBuilder.DropColumn(
                name: "IdentityDocumentUrl",
                table: "pending_driver_registrations");

            migrationBuilder.DropColumn(
                name: "VehiclePhotoUrl",
                table: "pending_driver_registrations");
        }
    }
}

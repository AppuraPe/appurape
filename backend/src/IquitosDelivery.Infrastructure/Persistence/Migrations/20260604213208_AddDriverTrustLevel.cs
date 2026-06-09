using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IquitosDelivery.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDriverTrustLevel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TrustLevel",
                table: "driver_profiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TrustLevel",
                table: "driver_profiles");
        }
    }
}

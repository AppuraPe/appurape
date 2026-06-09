using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IquitosDelivery.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGoogleCustomerLogin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GoogleSubject",
                table: "users",
                type: "character varying(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_GoogleSubject",
                table: "users",
                column: "GoogleSubject",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_users_GoogleSubject",
                table: "users");

            migrationBuilder.DropColumn(
                name: "GoogleSubject",
                table: "users");
        }
    }
}

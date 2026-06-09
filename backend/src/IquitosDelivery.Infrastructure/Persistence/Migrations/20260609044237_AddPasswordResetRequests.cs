using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IquitosDelivery.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPasswordResetRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "password_reset_requests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    CodeHash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CodeExpiresAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SendCount = table.Column<int>(type: "integer", nullable: false),
                    VerifyAttempts = table.Column<int>(type: "integer", nullable: false),
                    LastSentAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_password_reset_requests", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_password_reset_requests_Email",
                table: "password_reset_requests",
                column: "Email");

            migrationBuilder.CreateIndex(
                name: "IX_password_reset_requests_Email_IsCompleted",
                table: "password_reset_requests",
                columns: new[] { "Email", "IsCompleted" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "password_reset_requests");
        }
    }
}

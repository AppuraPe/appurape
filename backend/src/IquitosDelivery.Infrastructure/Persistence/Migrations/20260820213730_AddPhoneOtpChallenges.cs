using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IquitosDelivery.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPhoneOtpChallenges : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "phone_otp_challenges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PhoneNormalized = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Purpose = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CodeHash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    CodeExpiresAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsVerified = table.Column<bool>(type: "boolean", nullable: false),
                    VerifiedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsCompleted = table.Column<bool>(type: "boolean", nullable: false),
                    SendCount = table.Column<int>(type: "integer", nullable: false),
                    VerifyAttempts = table.Column<int>(type: "integer", nullable: false),
                    LastSentAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Channel = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ProviderMessageId = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_phone_otp_challenges", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_phone_otp_challenges_PhoneNormalized",
                table: "phone_otp_challenges",
                column: "PhoneNormalized");

            migrationBuilder.CreateIndex(
                name: "IX_phone_otp_challenges_PhoneNormalized_Purpose_IsCompleted",
                table: "phone_otp_challenges",
                columns: new[] { "PhoneNormalized", "Purpose", "IsCompleted" });

            migrationBuilder.CreateIndex(
                name: "IX_phone_otp_challenges_PhoneNormalized_Purpose_IsVerified_IsC~",
                table: "phone_otp_challenges",
                columns: new[] { "PhoneNormalized", "Purpose", "IsVerified", "IsCompleted" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "phone_otp_challenges");
        }
    }
}

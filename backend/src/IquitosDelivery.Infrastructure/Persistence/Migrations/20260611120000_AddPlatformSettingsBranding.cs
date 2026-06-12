using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IquitosDelivery.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPlatformSettingsBranding : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "platform_settings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Key = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    AppName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Tagline = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: true),
                    LogoUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    AppIconUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    SplashImageUrl = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    PrimaryColor = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    SecondaryColor = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    SupportEmail = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    SupportPhone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_platform_settings", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_platform_settings_Key",
                table: "platform_settings",
                column: "Key",
                unique: true);

            migrationBuilder.Sql("""
                INSERT INTO platform_settings ("Id", "Key", "AppName", "Tagline", "PrimaryColor", "SecondaryColor", "CreatedAtUtc")
                VALUES ('f2a08bb5-6e0a-4da7-b9a9-494f3d0df201', 'default', 'AppuraPe', 'Entrega local para negocios y comunidad', '#E51B23', '#F59E0B', NOW())
                ON CONFLICT ("Key") DO NOTHING;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "platform_settings");
        }
    }
}

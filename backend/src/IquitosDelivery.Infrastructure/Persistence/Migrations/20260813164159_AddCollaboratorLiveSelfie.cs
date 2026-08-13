using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IquitosDelivery.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCollaboratorLiveSelfie : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LiveSelfieCapturedAtUtc",
                table: "collaborator_profiles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LiveSelfieUrl",
                table: "collaborator_profiles",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LiveSelfieCapturedAtUtc",
                table: "collaborator_profiles");

            migrationBuilder.DropColumn(
                name: "LiveSelfieUrl",
                table: "collaborator_profiles");
        }
    }
}

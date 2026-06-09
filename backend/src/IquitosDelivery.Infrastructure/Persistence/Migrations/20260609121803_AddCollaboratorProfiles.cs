using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IquitosDelivery.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCollaboratorProfiles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "collaborator_profiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    ApprovalStatus = table.Column<int>(type: "integer", nullable: false),
                    IsIdentityVerified = table.Column<bool>(type: "boolean", nullable: false),
                    IsPhoneVerified = table.Column<bool>(type: "boolean", nullable: false),
                    IdentityDocumentNumber = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    IdentityDocumentUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ProfilePhotoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_collaborator_profiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_collaborator_profiles_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_collaborator_profiles_UserId",
                table: "collaborator_profiles",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "collaborator_profiles");
        }
    }
}

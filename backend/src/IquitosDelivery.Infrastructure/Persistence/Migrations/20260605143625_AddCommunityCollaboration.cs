using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IquitosDelivery.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCommunityCollaboration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "community_collaborators",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsAvailable = table.Column<bool>(type: "boolean", nullable: false),
                    AvailabilityStatus = table.Column<int>(type: "integer", nullable: false),
                    CurrentLatitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: true),
                    CurrentLongitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: true),
                    AvailabilityRadiusKm = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    AvailableFromUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    AvailableUntilUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TrustScore = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    CompletedCollaborations = table.Column<int>(type: "integer", nullable: false),
                    CollaborationRating = table.Column<decimal>(type: "numeric(3,2)", precision: 3, scale: 2, nullable: false),
                    CommunityAcceptanceRate = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    CommunityCancellationRate = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    CollaborationLevel = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_community_collaborators", x => x.Id);
                    table.ForeignKey(
                        name: "FK_community_collaborators_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "community_routes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CommunityCollaboratorId = table.Column<Guid>(type: "uuid", nullable: false),
                    OriginLabel = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    OriginLatitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: false),
                    OriginLongitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: false),
                    DestinationLabel = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DestinationLatitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: false),
                    DestinationLongitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: false),
                    EstimatedMinutes = table.Column<int>(type: "integer", nullable: false),
                    DeviationRadiusKm = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    StartsAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EndsAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_community_routes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_community_routes_community_collaborators_CommunityCollabora~",
                        column: x => x.CommunityCollaboratorId,
                        principalTable: "community_collaborators",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "community_requests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    OriginLabel = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    OriginLatitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: true),
                    OriginLongitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: true),
                    DestinationLabel = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DestinationLatitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: true),
                    DestinationLongitude = table.Column<decimal>(type: "numeric(9,6)", precision: 9, scale: 6, nullable: true),
                    CompensationAmount = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    DeadlineUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    AssignedCollaboratorId = table.Column<Guid>(type: "uuid", nullable: true),
                    AssignedRouteId = table.Column<Guid>(type: "uuid", nullable: true),
                    MatchScore = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    ConfirmationCode = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    ConfirmationCodeExpiresAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ProofImageUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CollaboratorRating = table.Column<int>(type: "integer", nullable: true),
                    CollaboratorFeedback = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    AcceptedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    StartedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DeliveredAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ClientConfirmedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancelledAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancellationReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_community_requests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_community_requests_community_collaborators_AssignedCollabor~",
                        column: x => x.AssignedCollaboratorId,
                        principalTable: "community_collaborators",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_community_requests_community_routes_AssignedRouteId",
                        column: x => x.AssignedRouteId,
                        principalTable: "community_routes",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_community_requests_users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_community_collaborators_UserId",
                table: "community_collaborators",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_community_requests_AssignedCollaboratorId",
                table: "community_requests",
                column: "AssignedCollaboratorId");

            migrationBuilder.CreateIndex(
                name: "IX_community_requests_AssignedRouteId",
                table: "community_requests",
                column: "AssignedRouteId");

            migrationBuilder.CreateIndex(
                name: "IX_community_requests_CreatedByUserId",
                table: "community_requests",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_community_requests_Status",
                table: "community_requests",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_community_routes_CommunityCollaboratorId",
                table: "community_routes",
                column: "CommunityCollaboratorId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "community_requests");

            migrationBuilder.DropTable(
                name: "community_routes");

            migrationBuilder.DropTable(
                name: "community_collaborators");
        }
    }
}

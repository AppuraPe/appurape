using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IquitosDelivery.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCommunityRequestApplications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "community_request_applications",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CommunityRequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    CollaboratorId = table.Column<Guid>(type: "uuid", nullable: false),
                    RouteId = table.Column<Guid>(type: "uuid", nullable: true),
                    MatchScore = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    DistanceKm = table.Column<decimal>(type: "numeric(7,2)", precision: 7, scale: 2, nullable: false),
                    EstimatedMinutes = table.Column<int>(type: "integer", nullable: false),
                    HasRouteMatch = table.Column<bool>(type: "boolean", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    AppliedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ReviewedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_community_request_applications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_community_request_applications_community_collaborators_Coll~",
                        column: x => x.CollaboratorId,
                        principalTable: "community_collaborators",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_community_request_applications_community_requests_Community~",
                        column: x => x.CommunityRequestId,
                        principalTable: "community_requests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_community_request_applications_community_routes_RouteId",
                        column: x => x.RouteId,
                        principalTable: "community_routes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_community_request_applications_CollaboratorId",
                table: "community_request_applications",
                column: "CollaboratorId");

            migrationBuilder.CreateIndex(
                name: "IX_community_request_applications_CommunityRequestId_Collabora~",
                table: "community_request_applications",
                columns: new[] { "CommunityRequestId", "CollaboratorId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_community_request_applications_RouteId",
                table: "community_request_applications",
                column: "RouteId");

            migrationBuilder.CreateIndex(
                name: "IX_community_request_applications_Status",
                table: "community_request_applications",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "community_request_applications");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IquitosDelivery.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCourierAssignmentCompatibility : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AssignedCourierType",
                table: "orders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "AssignedCourierUserId",
                table: "orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE orders AS o
                SET "AssignedCourierUserId" = d."UserId",
                    "AssignedCourierType" = 0
                FROM driver_profiles AS d
                WHERE o."DriverId" = d."Id"
                  AND o."AssignedCourierUserId" IS NULL;
                """);

            migrationBuilder.CreateIndex(
                name: "IX_orders_AssignedCourierUserId",
                table: "orders",
                column: "AssignedCourierUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_orders_AssignedCourierUserId",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "AssignedCourierType",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "AssignedCourierUserId",
                table: "orders");
        }
    }
}

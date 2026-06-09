using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IquitosDelivery.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddBusinessTypes : Migration
    {
        private static readonly Guid RestaurantBusinessTypeId = Guid.Parse("3E34D05A-4E80-4E6D-B3E9-9B80F1A10F15");

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "BusinessTypeId",
                table: "restaurants",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "BusinessTypeId",
                table: "pending_restaurant_registrations",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "business_types",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_business_types", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "business_types",
                columns: new[] { "Id", "Code", "Name", "Description", "IsActive" },
                values: new object[]
                {
                    RestaurantBusinessTypeId,
                    "Restaurant",
                    "Restaurant",
                    "Legacy-compatible business type for the current restaurant marketplace.",
                    true
                });

            migrationBuilder.Sql(
                $"UPDATE restaurants SET \"BusinessTypeId\" = '{RestaurantBusinessTypeId}' WHERE \"BusinessTypeId\" IS NULL;");

            migrationBuilder.Sql(
                $"UPDATE pending_restaurant_registrations SET \"BusinessTypeId\" = '{RestaurantBusinessTypeId}' WHERE \"BusinessTypeId\" IS NULL;");

            migrationBuilder.CreateIndex(
                name: "IX_restaurants_BusinessTypeId",
                table: "restaurants",
                column: "BusinessTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_pending_restaurant_registrations_BusinessTypeId",
                table: "pending_restaurant_registrations",
                column: "BusinessTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_business_types_Code",
                table: "business_types",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_business_types_Name",
                table: "business_types",
                column: "Name",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_pending_restaurant_registrations_business_types_BusinessTyp~",
                table: "pending_restaurant_registrations",
                column: "BusinessTypeId",
                principalTable: "business_types",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_restaurants_business_types_BusinessTypeId",
                table: "restaurants",
                column: "BusinessTypeId",
                principalTable: "business_types",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_pending_restaurant_registrations_business_types_BusinessTyp~",
                table: "pending_restaurant_registrations");

            migrationBuilder.DropForeignKey(
                name: "FK_restaurants_business_types_BusinessTypeId",
                table: "restaurants");

            migrationBuilder.DeleteData(
                table: "business_types",
                keyColumn: "Id",
                keyValue: RestaurantBusinessTypeId);

            migrationBuilder.DropTable(
                name: "business_types");

            migrationBuilder.DropIndex(
                name: "IX_restaurants_BusinessTypeId",
                table: "restaurants");

            migrationBuilder.DropIndex(
                name: "IX_pending_restaurant_registrations_BusinessTypeId",
                table: "pending_restaurant_registrations");

            migrationBuilder.DropColumn(
                name: "BusinessTypeId",
                table: "restaurants");

            migrationBuilder.DropColumn(
                name: "BusinessTypeId",
                table: "pending_restaurant_registrations");
        }
    }
}

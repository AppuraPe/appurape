using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace IquitosDelivery.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddGeneralCatalogStock : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Sku",
                table: "menu_items",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "StockQuantity",
                table: "menu_items",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "TrackStock",
                table: "menu_items",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "UnitLabel",
                table: "menu_items",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Sku",
                table: "menu_items");

            migrationBuilder.DropColumn(
                name: "StockQuantity",
                table: "menu_items");

            migrationBuilder.DropColumn(
                name: "TrackStock",
                table: "menu_items");

            migrationBuilder.DropColumn(
                name: "UnitLabel",
                table: "menu_items");
        }
    }
}

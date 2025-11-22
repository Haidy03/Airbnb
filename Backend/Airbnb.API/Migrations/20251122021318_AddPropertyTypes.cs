using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Airbnb.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPropertyTypes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PropertyType",
                table: "Properties");

            migrationBuilder.AddColumn<int>(
                name: "PropertyTypeId",
                table: "Properties",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "PropertyTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Code = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IconType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PropertyTypes", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "PropertyTypes",
                columns: new[] { "Id", "Category", "Code", "Description", "DisplayOrder", "IconType", "IsActive", "Name" },
                values: new object[,]
                {
                    { 1, "RESIDENTIAL", "HOUSE", "A standalone house", 1, "house", true, "House" },
                    { 2, "RESIDENTIAL", "APARTMENT", "A unit in a multi-unit building", 2, "apartment", true, "Apartment" },
                    { 3, "UNIQUE", "BARN", "A converted barn", 3, "barn", true, "Barn" },
                    { 4, "RESIDENTIAL", "BED_BREAKFAST", "A small lodging establishment", 4, "bed-breakfast", true, "Bed & breakfast" },
                    { 5, "UNIQUE", "BOAT", "A watercraft for accommodation", 5, "boat", true, "Boat" },
                    { 6, "OUTDOOR", "CABIN", "A small house in a rural area", 6, "cabin", true, "Cabin" },
                    { 7, "OUTDOOR", "CAMPER", "A recreational vehicle", 7, "camper", true, "Camper/RV" },
                    { 8, "RESIDENTIAL", "CASA_PARTICULAR", "A Cuban home stay", 8, "casa", true, "Casa particular" },
                    { 9, "UNIQUE", "CASTLE", "A historic castle", 9, "castle", true, "Castle" },
                    { 10, "UNIQUE", "CAVE", "A natural cave dwelling", 10, "cave", true, "Cave" },
                    { 11, "UNIQUE", "CONTAINER", "A shipping container home", 11, "container", true, "Container" },
                    { 12, "UNIQUE", "CYCLADIC_HOME", "A traditional Greek island home", 12, "cycladic", true, "Cycladic home" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Properties_PropertyTypeId",
                table: "Properties",
                column: "PropertyTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_PropertyTypes_Category",
                table: "PropertyTypes",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_PropertyTypes_Code",
                table: "PropertyTypes",
                column: "Code",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Properties_PropertyTypes_PropertyTypeId",
                table: "Properties",
                column: "PropertyTypeId",
                principalTable: "PropertyTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Properties_PropertyTypes_PropertyTypeId",
                table: "Properties");

            migrationBuilder.DropTable(
                name: "PropertyTypes");

            migrationBuilder.DropIndex(
                name: "IX_Properties_PropertyTypeId",
                table: "Properties");

            migrationBuilder.DropColumn(
                name: "PropertyTypeId",
                table: "Properties");

            migrationBuilder.AddColumn<string>(
                name: "PropertyType",
                table: "Properties",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");
        }
    }
}

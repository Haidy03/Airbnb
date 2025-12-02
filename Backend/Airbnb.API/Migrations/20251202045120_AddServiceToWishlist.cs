using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Airbnb.API.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceToWishlist : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ServiceId",
                table: "Wishlists",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Wishlists_ServiceId",
                table: "Wishlists",
                column: "ServiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Wishlists_Services_ServiceId",
                table: "Wishlists",
                column: "ServiceId",
                principalTable: "Services",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Wishlists_Services_ServiceId",
                table: "Wishlists");

            migrationBuilder.DropIndex(
                name: "IX_Wishlists_ServiceId",
                table: "Wishlists");

            migrationBuilder.DropColumn(
                name: "ServiceId",
                table: "Wishlists");
        }
    }
}

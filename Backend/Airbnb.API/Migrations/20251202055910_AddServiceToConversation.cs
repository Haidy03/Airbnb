using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Airbnb.API.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceToConversation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ServiceId",
                table: "Conversations",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_ServiceId",
                table: "Conversations",
                column: "ServiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Conversations_Services_ServiceId",
                table: "Conversations",
                column: "ServiceId",
                principalTable: "Services",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Conversations_Services_ServiceId",
                table: "Conversations");

            migrationBuilder.DropIndex(
                name: "IX_Conversations_ServiceId",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "ServiceId",
                table: "Conversations");
        }
    }
}

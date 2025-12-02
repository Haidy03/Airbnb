using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Airbnb.API.Migrations
{
    /// <inheritdoc />
    public partial class AddExperienceToConversation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ExperienceId",
                table: "Conversations",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_ExperienceId",
                table: "Conversations",
                column: "ExperienceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Conversations_Experiences_ExperienceId",
                table: "Conversations",
                column: "ExperienceId",
                principalTable: "Experiences",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Conversations_Experiences_ExperienceId",
                table: "Conversations");

            migrationBuilder.DropIndex(
                name: "IX_Conversations_ExperienceId",
                table: "Conversations");

            migrationBuilder.DropColumn(
                name: "ExperienceId",
                table: "Conversations");
        }
    }
}

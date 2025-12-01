using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Airbnb.API.Migrations
{
    /// <inheritdoc />
    public partial class four : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CleanlinessRating",
                table: "ExperienceReviews",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LocationRating",
                table: "ExperienceReviews",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CleanlinessRating",
                table: "ExperienceReviews");

            migrationBuilder.DropColumn(
                name: "LocationRating",
                table: "ExperienceReviews");
        }
    }
}

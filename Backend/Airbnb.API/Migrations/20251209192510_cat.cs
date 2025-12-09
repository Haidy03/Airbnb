using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Airbnb.API.Migrations
{
    /// <inheritdoc />
    public partial class cat : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ExperienceCategories",
                keyColumn: "Id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "ExperienceCategories",
                keyColumn: "Id",
                keyValue: 19);

            migrationBuilder.UpdateData(
                table: "ExperienceCategories",
                keyColumn: "Id",
                keyValue: 1,
                column: "Name",
                value: "Food ");

            migrationBuilder.UpdateData(
                table: "ExperienceCategories",
                keyColumn: "Id",
                keyValue: 2,
                column: "Name",
                value: "Art ");

            migrationBuilder.UpdateData(
                table: "ExperienceCategories",
                keyColumn: "Id",
                keyValue: 12,
                column: "Name",
                value: "Master chefs");

            migrationBuilder.UpdateData(
                table: "ExperienceCategories",
                keyColumn: "Id",
                keyValue: 13,
                column: "Name",
                value: "Traditional meals");

            migrationBuilder.UpdateData(
                table: "ExperienceCategories",
                keyColumn: "Id",
                keyValue: 15,
                column: "Name",
                value: "Walking");

            migrationBuilder.UpdateData(
                table: "ExperienceCategories",
                keyColumn: "Id",
                keyValue: 16,
                columns: new[] { "Icon", "Name" },
                values: new object[] { "🎨", "Culuture" });

            migrationBuilder.UpdateData(
                table: "ExperienceCategories",
                keyColumn: "Id",
                keyValue: 17,
                columns: new[] { "Icon", "Name" },
                values: new object[] { "👨‍🍳", "Cooking" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "ExperienceCategories",
                keyColumn: "Id",
                keyValue: 1,
                column: "Name",
                value: "Food & Drink");

            migrationBuilder.UpdateData(
                table: "ExperienceCategories",
                keyColumn: "Id",
                keyValue: 2,
                column: "Name",
                value: "Art & Culture");

            migrationBuilder.UpdateData(
                table: "ExperienceCategories",
                keyColumn: "Id",
                keyValue: 12,
                column: "Name",
                value: "Chefs");

            migrationBuilder.UpdateData(
                table: "ExperienceCategories",
                keyColumn: "Id",
                keyValue: 13,
                column: "Name",
                value: "Prepared meals");

            migrationBuilder.UpdateData(
                table: "ExperienceCategories",
                keyColumn: "Id",
                keyValue: 15,
                column: "Name",
                value: "Training");

            migrationBuilder.UpdateData(
                table: "ExperienceCategories",
                keyColumn: "Id",
                keyValue: 16,
                columns: new[] { "Icon", "Name" },
                values: new object[] { "💄", "Makeup" });

            migrationBuilder.UpdateData(
                table: "ExperienceCategories",
                keyColumn: "Id",
                keyValue: 17,
                columns: new[] { "Icon", "Name" },
                values: new object[] { "💇", "Hair" });

            migrationBuilder.InsertData(
                table: "ExperienceCategories",
                columns: new[] { "Id", "Description", "DisplayOrder", "Icon", "IsActive", "Name" },
                values: new object[,]
                {
                    { 18, "Spa and facial treatments", 8, "🧖", true, "Spa treatments" },
                    { 19, "Event catering services", 9, "🥂", true, "Catering" }
                });
        }
    }
}

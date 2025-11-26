using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Airbnb.API.Migrations
{
    /// <inheritdoc />
    public partial class addinstantbook : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsInstantBook",
                table: "Properties",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsInstantBook",
                table: "Properties");
        }
    }
}

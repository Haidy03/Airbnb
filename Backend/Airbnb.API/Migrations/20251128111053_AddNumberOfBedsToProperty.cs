using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Airbnb.API.Migrations
{
    /// <inheritdoc />
    public partial class AddNumberOfBedsToProperty : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "NumberOfBeds",
                table: "Properties",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NumberOfBeds",
                table: "Properties");
        }
    }
}

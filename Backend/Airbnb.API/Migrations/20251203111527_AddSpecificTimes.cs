using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Airbnb.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSpecificTimes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<TimeSpan>(
                name: "SpecificCheckInTime",
                table: "PropertyAvailabilities",
                type: "time",
                nullable: true);

            migrationBuilder.AddColumn<TimeSpan>(
                name: "SpecificCheckOutTime",
                table: "PropertyAvailabilities",
                type: "time",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SpecificCheckInTime",
                table: "PropertyAvailabilities");

            migrationBuilder.DropColumn(
                name: "SpecificCheckOutTime",
                table: "PropertyAvailabilities");
        }
    }
}

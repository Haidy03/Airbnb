using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Airbnb.API.Migrations
{
    /// <inheritdoc />
    public partial class third : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserVerification_AspNetUsers_UserId",
                table: "UserVerification");

            migrationBuilder.DropPrimaryKey(
                name: "PK_UserVerification",
                table: "UserVerification");

            migrationBuilder.RenameTable(
                name: "UserVerification",
                newName: "UserVerifications");

            migrationBuilder.RenameIndex(
                name: "IX_UserVerification_UserId",
                table: "UserVerifications",
                newName: "IX_UserVerifications_UserId");

            migrationBuilder.Sql("UPDATE Bookings SET Status = 0 WHERE Status = 'Pending'");
            migrationBuilder.Sql("UPDATE Bookings SET Status = 1 WHERE Status = 'Confirmed'");
            migrationBuilder.Sql("UPDATE Bookings SET Status = 2 WHERE Status = 'Cancelled'");
            migrationBuilder.Sql("UPDATE Bookings SET Status = 3 WHERE Status = 'Completed'");
            migrationBuilder.Sql("UPDATE Bookings SET Status = 4 WHERE Status = 'Rejected'");

            migrationBuilder.AlterColumn<int>(
                name: "Status",
                table: "Bookings",
                type: "int",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AddPrimaryKey(
                name: "PK_UserVerifications",
                table: "UserVerifications",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_UserVerifications_AspNetUsers_UserId",
                table: "UserVerifications",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserVerifications_AspNetUsers_UserId",
                table: "UserVerifications");

            migrationBuilder.DropPrimaryKey(
                name: "PK_UserVerifications",
                table: "UserVerifications");

            migrationBuilder.RenameTable(
                name: "UserVerifications",
                newName: "UserVerification");

            migrationBuilder.RenameIndex(
                name: "IX_UserVerifications_UserId",
                table: "UserVerification",
                newName: "IX_UserVerification_UserId");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Bookings",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldMaxLength: 50);

            migrationBuilder.AddPrimaryKey(
                name: "PK_UserVerification",
                table: "UserVerification",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_UserVerification_AspNetUsers_UserId",
                table: "UserVerification",
                column: "UserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

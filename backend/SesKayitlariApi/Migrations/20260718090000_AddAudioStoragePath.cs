using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SesKayitlariApi.Migrations
{
    /// <inheritdoc />
    public partial class AddAudioStoragePath : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AudioStoragePath",
                table: "CallRecords",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AudioStoragePath",
                table: "CallRecords");
        }
    }
}
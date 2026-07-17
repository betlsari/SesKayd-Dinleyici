using Microsoft.EntityFrameworkCore;

namespace SesKayitlariApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<CompanyEntity> Companies => Set<CompanyEntity>();
    public DbSet<CallRecordEntity> CallRecords => Set<CallRecordEntity>();
    public DbSet<UserCompanyAssignmentEntity> UserCompanyAssignments => Set<UserCompanyAssignmentEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CompanyEntity>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).IsRequired().HasMaxLength(200);
        });

        modelBuilder.Entity<CallRecordEntity>(entity =>
        {
            entity.HasKey(r => r.Id);
            entity.Property(r => r.Id).HasMaxLength(64);
            entity.Property(r => r.CallerNumber).IsRequired().HasMaxLength(32);
            entity.Property(r => r.CalledNumber).IsRequired().HasMaxLength(32);
            entity.Property(r => r.AgentName).IsRequired().HasMaxLength(200);
            entity.Property(r => r.AgentEmail).IsRequired().HasMaxLength(320);
            entity.Property(r => r.Username).IsRequired().HasMaxLength(100);
            entity.Property(r => r.CallId).IsRequired().HasMaxLength(64);
            entity.Property(r => r.Format).IsRequired().HasMaxLength(16);
            entity.Property(r => r.Format).IsRequired().HasMaxLength(16);
            entity.Property(r => r.AudioStoragePath).HasMaxLength(500);

            entity
                .HasOne(r => r.Company)
                .WithMany(c => c.Records)
                .HasForeignKey(r => r.CompanyId)
                // GÜVENLİK/VERİ BÜTÜNLÜĞÜ: bir şirket, o şirkete ait
                // kayıtlar varken silinemesin diye Restrict — yanlışlıkla
                // cascade delete ile ses kayıtlarının kaybolmasını
                // engeller.
                .OnDelete(DeleteBehavior.Restrict);

            // RecordsController.GetRecords hemen hemen HER İSTEKTE
            // companyId + tarih aralığına göre filtreler ve sıralar —
            // bu index'ler olmadan tablo büyüdükçe sorgu yavaşlar.
            entity.HasIndex(r => r.CompanyId);
            entity.HasIndex(r => new { r.CompanyId, r.DateTime });
            entity.HasIndex(r => r.CallId);
        });

        modelBuilder.Entity<UserCompanyAssignmentEntity>(entity =>
        {
            entity.HasKey(a => a.Id);
            entity.Property(a => a.UserId).IsRequired().HasMaxLength(64);

            // Aynı kullanıcı aynı şirkete iki kez atanmasın; ayrıca
            // ICompanyAccessService.UserHasAccessAsync'in AnyAsync
            // sorgusu bu index'i kullanır.
            entity.HasIndex(a => new { a.UserId, a.CompanyId }).IsUnique();

            entity
                .HasOne(a => a.Company)
                .WithMany(c => c.UserAssignments)
                // Bir şirket silinirse o şirkete ait atamalar da
                // silinsin (ama CallRecordEntity için YUKARIDA Restrict
                // seçildi — kayıtları korumak, atamaları korumaktan
                // daha kritik).
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
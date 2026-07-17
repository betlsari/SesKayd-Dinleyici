using Microsoft.EntityFrameworkCore;
using SesKayitlariApi.Controllers;
using SesKayitlariApi.Data;

namespace SesKayitlariApi.Services;

public class CompanyAccessService : ICompanyAccessService
{
    private readonly AppDbContext _db;

    public CompanyAccessService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<bool> UserHasAccessAsync(
        string userId,
        int companyId,
        CancellationToken cancellationToken)
    {
        return await _db.UserCompanyAssignments
            .AsNoTracking()
            .AnyAsync(
                a => a.UserId == userId && a.CompanyId == companyId,
                cancellationToken);
    }

    public async Task<IReadOnlyList<CompanyDto>> GetAccessibleCompaniesAsync(
        string userId,
        CancellationToken cancellationToken)
    {
        return await _db.UserCompanyAssignments
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderBy(a => a.Company.Name)
            .Select(a => new CompanyDto
            {
                Id = a.Company.Id,
                Name = a.Company.Name,
            })
            .ToListAsync(cancellationToken);
    }

    // ---- Şirket CRUD (SADECE Yönetici — controller'daki policy ile korunur) ----

    public async Task<IReadOnlyList<CompanyDto>> GetAllCompaniesAsync(
        CancellationToken cancellationToken)
    {
        // GetAccessibleCompaniesAsync'ten FARKLI: kullanıcının atamalarına
        // bakmaksızın SİSTEMDEKİ TÜM şirketleri döner. "Şirketler" yönetim
        // sayfası için — filtre/şirket seçicileri hâlâ yukarıdaki
        // GetAccessibleCompaniesAsync'i kullanmalı.
        return await _db.Companies
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new CompanyDto { Id = c.Id, Name = c.Name })
            .ToListAsync(cancellationToken);
    }

    public async Task<CompanyDto> CreateCompanyAsync(
        string name,
        CancellationToken cancellationToken)
    {
        var entity = new CompanyEntity { Name = name };
        _db.Companies.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return new CompanyDto { Id = entity.Id, Name = entity.Name };
    }

    public async Task<CompanyDto?> UpdateCompanyAsync(
        int companyId,
        string name,
        CancellationToken cancellationToken)
    {
        var entity = await _db.Companies
            .FirstOrDefaultAsync(c => c.Id == companyId, cancellationToken);
        if (entity is null) return null;

        entity.Name = name;
        await _db.SaveChangesAsync(cancellationToken);
        return new CompanyDto { Id = entity.Id, Name = entity.Name };
    }

    public async Task<bool> DeleteCompanyAsync(
        int companyId,
        CancellationToken cancellationToken)
    {
        var entity = await _db.Companies
            .FirstOrDefaultAsync(c => c.Id == companyId, cancellationToken);
        if (entity is null) return false;

        // NOT: CallRecordEntity -> Company ilişkisi DeleteBehavior.Restrict
        // (bkz. AppDbContext.cs). Bu şirkete ait ses kaydı varsa
        // SaveChangesAsync bir DbUpdateException fırlatır — controller
        // bunu yakalayıp 409 Conflict'e çevirir. Burada BİLEREK
        // önceden bir "kaydı var mı" kontrolü yapmıyoruz; veritabanı
        // kısıtı zaten tek doğruluk kaynağı (race condition'a karşı
        // da daha güvenli).
        _db.Companies.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task<IReadOnlyList<UserCompanyAssignmentDto>> GetCompanyAssignmentsAsync(
        int companyId,
        CancellationToken cancellationToken)
    {
        return await _db.UserCompanyAssignments
            .AsNoTracking()
            .Where(a => a.CompanyId == companyId)
            .OrderBy(a => a.UserId)
            .Select(a => new UserCompanyAssignmentDto
            {
                Id = a.Id,
                UserId = a.UserId,
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<UserCompanyAssignmentDto?> AssignUserAsync(
        int companyId,
        string userId,
        CancellationToken cancellationToken)
    {
        var companyExists = await _db.Companies
            .AnyAsync(c => c.Id == companyId, cancellationToken);
        if (!companyExists) return null;

        var existing = await _db.UserCompanyAssignments.FirstOrDefaultAsync(
            a => a.CompanyId == companyId && a.UserId == userId,
            cancellationToken);

        // Zaten atanmışsa hata değil, idempotent davranış — aynı kaydı
        // döndürüyoruz (unique index [UserId, CompanyId] zaten bunu
        // veritabanı seviyesinde de garanti ediyor).
        if (existing is not null)
        {
            return new UserCompanyAssignmentDto { Id = existing.Id, UserId = existing.UserId };
        }

        var entity = new UserCompanyAssignmentEntity
        {
            CompanyId = companyId,
            UserId = userId,
        };
        _db.UserCompanyAssignments.Add(entity);
        await _db.SaveChangesAsync(cancellationToken);

        return new UserCompanyAssignmentDto { Id = entity.Id, UserId = entity.UserId };
    }

    public async Task<bool> UnassignUserAsync(
        int companyId,
        string userId,
        CancellationToken cancellationToken)
    {
        var entity = await _db.UserCompanyAssignments.FirstOrDefaultAsync(
            a => a.CompanyId == companyId && a.UserId == userId,
            cancellationToken);
        if (entity is null) return false;

        _db.UserCompanyAssignments.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);
        return true;
    }
}
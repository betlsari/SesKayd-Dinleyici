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
}
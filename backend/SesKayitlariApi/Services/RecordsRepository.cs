using Microsoft.EntityFrameworkCore;
using SesKayitlariApi.Controllers;
using SesKayitlariApi.Data;

namespace SesKayitlariApi.Services;

public class RecordsRepository : IRecordsRepository
{
    private readonly AppDbContext _db;

    public RecordsRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<PagedResult<CallRecordDto>> SearchAsync(
        RecordsSearchCriteria criteria,
        CancellationToken cancellationToken)
    {
        // GÜVENLİK: companyId filtresi burada, sorgunun EN BAŞINDA
        // uygulanıyor — controller zaten erişim kontrolü yapıyor
        // (ICompanyAccessService.UserHasAccessAsync), ama repository
        // katmanı da KENDİ İÇİNDE company scope'unu garanti eder.
        // Böylece controller'daki kontrol yanlışlıkla atlanırsa bile
        // (ör. ileride eklenecek başka bir endpoint) veri sızıntısı
        // olmaz.
        IQueryable<CallRecordEntity> query = _db.CallRecords
            .AsNoTracking()
            .Include(r => r.Company)
            .Where(r => r.CompanyId == criteria.CompanyId);

        // Frontend "yyyy-MM-dd" formatında gönderiyor (bkz.
        // RecordsFilterForm.tsx -> <input type="date">).
        if (!string.IsNullOrWhiteSpace(criteria.DateFrom) &&
            DateTime.TryParse(criteria.DateFrom, out var dateFrom))
        {
            query = query.Where(r => r.DateTime >= dateFrom.Date);
        }

        if (!string.IsNullOrWhiteSpace(criteria.DateTo) &&
            DateTime.TryParse(criteria.DateTo, out var dateTo))
        {
            // Bitiş gününü DAHİL etmek için bir sonraki günün
            // başlangıcından ÖNCESİ olarak filtreliyoruz — yoksa o
            // günün saat 00:00'dan sonraki kayıtları kaçırılır.
            var dateToExclusive = dateTo.Date.AddDays(1);
            query = query.Where(r => r.DateTime < dateToExclusive);
        }

        if (!string.IsNullOrWhiteSpace(criteria.CallerNumber))
        {
            query = query.Where(r => r.CallerNumber.Contains(criteria.CallerNumber));
        }

        if (!string.IsNullOrWhiteSpace(criteria.CalledNumber))
        {
            query = query.Where(r => r.CalledNumber.Contains(criteria.CalledNumber));
        }

        if (!string.IsNullOrWhiteSpace(criteria.Agent))
        {
            query = query.Where(r => r.AgentName.Contains(criteria.Agent));
        }

        if (!string.IsNullOrWhiteSpace(criteria.Username))
        {
            query = query.Where(r => r.Username.Contains(criteria.Username));
        }

        if (!string.IsNullOrWhiteSpace(criteria.CallId))
        {
            query = query.Where(r => r.CallId.Contains(criteria.CallId));
        }

        query = criteria.SortDirection == "asc"
            ? query.OrderBy(r => r.DateTime)
            : query.OrderByDescending(r => r.DateTime);

        // Sayfalamadan ÖNCE toplam sayıyı alıyoruz (Skip/Take'den önceki
        // filtrelenmiş query üzerinden) — Pagination.tsx bu sayıyı
        // "Sayfa X / Y" hesaplaması için kullanıyor.
        var totalCount = await query.CountAsync(cancellationToken);

        var entities = await query
            .Skip((criteria.Page - 1) * criteria.PageSize)
            .Take(criteria.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<CallRecordDto>
        {
            Items = entities.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            Page = criteria.Page,
            PageSize = criteria.PageSize,
        };
    }

    public async Task<CallRecordDto?> GetByIdAsync(string id, CancellationToken cancellationToken)
    {
        var entity = await _db.CallRecords
            .AsNoTracking()
            .Include(r => r.Company)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        return entity is null ? null : MapToDto(entity);
    }

    public async Task DeleteAsync(string id, CancellationToken cancellationToken)
    {
        var entity = await _db.CallRecords
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);

        if (entity is null)
        {
            // Controller zaten GetByIdAsync ile NotFound kontrolü yapıp
            // sonra DeleteAsync'i çağırıyor; burada tekrar bulunamazsa
            // (ör. eşzamanlı silme) sessizce çıkıyoruz — idempotent
            // davranış.
            return;
        }

        // NOT: Ses dosyasının kendisi (blob/obje depolamadaki fiziksel
        // dosya) bu metodun kapsamı DIŞINDA — sadece veritabanı kaydı
        // silinir. Dosya temizliği, depolama stratejisi netleştiğinde
        // ayrı bir arka plan işi/servis olarak eklenmeli (aksi halde
        // "yetim" dosyalar birikir).
        _db.CallRecords.Remove(entity);
        await _db.SaveChangesAsync(cancellationToken);
    }

    private static CallRecordDto MapToDto(CallRecordEntity r) => new()
    {
        Id = r.Id,
        // Frontend "dd.MM.yyyy HH:mm" formatını bekliyor (bkz.
        // RecordsPage.tsx -> parseDateTime / recordDateOnly).
        DateTime = r.DateTime.ToString("dd.MM.yyyy HH:mm"),
        CallerNumber = r.CallerNumber,
        CalledNumber = r.CalledNumber,
        AgentName = r.AgentName,
        AgentEmail = r.AgentEmail,
        Username = r.Username,
        DurationSeconds = r.DurationSeconds,
        CallId = r.CallId,
        Company = r.Company.Name,
        FileSizeKB = r.FileSizeKB,
        Format = r.Format,
        CompanyId = r.CompanyId,
    };
}
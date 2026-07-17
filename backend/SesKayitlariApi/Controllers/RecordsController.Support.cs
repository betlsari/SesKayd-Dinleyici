namespace SesKayitlariApi.Controllers;

// =====================================================================
// Bu dosya RecordsController'ın DERLENEBİLMESİ için gereken sözleşmeleri
// içerir. Gerçek implementasyonlar (EF Core repository, şirket-kullanıcı
// atama sorgusu) henüz YOK — TODO'lar aşağıda işaretli. Program.cs'e
// (veya bir DI extension'ına) şunlar eklenmeli:
//
//   builder.Services.AddScoped<IRecordsRepository, RecordsRepository>();
//   builder.Services.AddScoped<ICompanyAccessService, CompanyAccessService>();
// =====================================================================

// ---- Query model (GET /api/records) ----------------------------------
// [FromQuery] ile otomatik bind edilir; frontend RecordFilters
// (types/record.ts) alanlarıyla birebir eşleşir.
public class RecordsQuery
{
    public int CompanyId { get; set; }
    public string? DateFrom { get; set; } // "yyyy-MM-dd"
    public string? DateTo { get; set; }   // "yyyy-MM-dd"
    public string? CallerNumber { get; set; }
    public string? CalledNumber { get; set; }
    public string? Agent { get; set; }
    public string? Username { get; set; }
    public string? CallId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SortDirection { get; set; } // "asc" | "desc" | null
}

// ---- Repository'ye geçilen arama kriterleri ---------------------------
public class RecordsSearchCriteria
{
    public int CompanyId { get; set; }
    public string? DateFrom { get; set; }
    public string? DateTo { get; set; }
    public string? CallerNumber { get; set; }
    public string? CalledNumber { get; set; }
    public string? Agent { get; set; }
    public string? Username { get; set; }
    public string? CallId { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public string? SortDirection { get; set; }
}

// ---- Response DTO'ları -------------------------------------------------
// frontend/src/types/record.ts -> CallRecord ile birebir eşleşir.
public class CallRecordDto
{
    public string Id { get; set; } = default!;
    public string DateTime { get; set; } = default!;
    public string CallerNumber { get; set; } = default!;
    public string CalledNumber { get; set; } = default!;
    public string AgentName { get; set; } = default!;
    public string AgentEmail { get; set; } = default!;
    public string Username { get; set; } = default!;
    public int DurationSeconds { get; set; }
    public string CallId { get; set; } = default!;
    public string Company { get; set; } = default!;
    public int FileSizeKB { get; set; }
    public string Format { get; set; } = default!;

    // DTO'da frontend'e gitmiyor ama controller içinde şirket-scope
    // kontrolü için gerekli (bkz. RecordsController.GetRecordById/Delete).
    public int CompanyId { get; set; }
}

public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; set; } = Array.Empty<T>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}

// ---- Repository sözleşmesi ----------------------------------------------
public interface IRecordsRepository
{
    // TODO: EF Core ile implemente et. companyId ZATEN kriter içinde
    // olduğu için sorgu, veritabanı seviyesinde WHERE CompanyId = @companyId
    // ile filtrelenmeli — tüm tabloyu çekip bellekte filtrelemek YAPMA.
    Task<PagedResult<CallRecordDto>> SearchAsync(
        RecordsSearchCriteria criteria,
        CancellationToken cancellationToken);

    Task<CallRecordDto?> GetByIdAsync(string id, CancellationToken cancellationToken);

    Task DeleteAsync(string id, CancellationToken cancellationToken);
}

// ---- Şirket erişim kontrolü sözleşmesi -----------------------------------
public interface ICompanyAccessService
{
    // TODO: EF Core ile implemente et. Kullanıcı-şirket atama tablosundan
    // (Keycloak'ın BİLMEDİĞİ, .NET tarafında tutulan bir iş verisi —
    // bkz. App.tsx başındaki mockCompanies notu) userId'nin companyId'ye
    // yetkili olup olmadığını sorgular.
    Task<bool> UserHasAccessAsync(
        string userId,
        int companyId,
        CancellationToken cancellationToken);

    // TODO: EF Core ile implemente et. Kullanıcının yetkili olduğu TÜM
    // şirketlerin listesini döner — CompaniesController (GET /api/companies)
    // ve Topbar/RecordsFilterForm'daki şirket seçicisi bunu kullanır.
    // ÖNEMLİ: Boş liste dönebilir (henüz hiçbir şirkete atanmamış
    // kullanıcı) — çağıran taraf bunu "erişilebilir şirket yok" olarak
    // ele almalı, hata fırlatmamalı.
    Task<IReadOnlyList<CompanyDto>> GetAccessibleCompaniesAsync(
        string userId,
        CancellationToken cancellationToken);
}

// frontend/src/components/layout/Topbar.tsx -> Company ile birebir eşleşir.
public class CompanyDto
{
    public int Id { get; set; }
    public string Name { get; set; } = default!;
}
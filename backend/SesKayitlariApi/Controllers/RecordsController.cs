using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SesKayitlariApi.Controllers;

[ApiController]
[Route("api/records")]
[Authorize] // her endpoint en az geçerli bir token ister
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
public class RecordsController : ControllerBase
{
    private readonly IRecordsRepository _recordsRepository;
    private readonly ICompanyAccessService _companyAccessService;
    private readonly ILogger<RecordsController> _logger;

    public RecordsController(
        IRecordsRepository recordsRepository,
        ICompanyAccessService companyAccessService,
        ILogger<RecordsController> logger)
    {
        _recordsRepository = recordsRepository;
        _companyAccessService = companyAccessService;
        _logger = logger;
    }

    // GET /api/records?companyId=1&dateFrom=2026-07-01&dateTo=2026-07-17
    //     &callerNumber=...&calledNumber=...&agent=...&username=...
    //     &callId=...&page=1&pageSize=10&sortDirection=desc
    //
    // Frontend tarafı: RecordsFilterForm.tsx içindeki RecordFilters
    // alanlarıyla birebir eşleşir (bkz. types/record.ts).
    [HttpGet]
    [ProducesResponseType(typeof(PagedResult<CallRecordDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetRecords(
        [FromQuery] RecordsQuery query,
        CancellationToken cancellationToken)
    {
        if (query.CompanyId <= 0)
        {
            return BadRequest(new { message = "companyId zorunludur." });
        }

        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        // GÜVENLİK: companyId query param'ı client'tan geliyor — buna
        // KÖRÜ KÖRÜNE güvenilmez. Kullanıcının bu şirkete GERÇEKTEN
        // yetkili olup olmadığı burada, sunucu tarafında (kullanıcı-
        // şirket atama tablosundan) doğrulanır. Frontend'deki
        // company-scope filtresi (RecordsPage.tsx -> companyScopedRecords)
        // sadece mock/UI aşaması içindi, güvenlik sınırı DEĞİLDİ —
        // gerçek sınır burasıdır.
        var hasAccess = await _companyAccessService.UserHasAccessAsync(
            userId, query.CompanyId, cancellationToken);
        if (!hasAccess)
        {
            _logger.LogWarning(
                "Yetkisiz şirket erişimi denemesi: userId={UserId}, companyId={CompanyId}",
                userId, query.CompanyId);
            return Forbid();
        }

        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize is < 1 or > 100 ? 10 : query.PageSize;

        var result = await _recordsRepository.SearchAsync(
            new RecordsSearchCriteria
            {
                CompanyId = query.CompanyId,
                DateFrom = query.DateFrom,
                DateTo = query.DateTo,
                CallerNumber = query.CallerNumber,
                CalledNumber = query.CalledNumber,
                Agent = query.Agent,
                Username = query.Username,
                CallId = query.CallId,
                Page = page,
                PageSize = pageSize,
                SortDirection = query.SortDirection,
            },
            cancellationToken);

        return Ok(result);
    }

    // GET /api/records/{id}
    // Kayıt Detayları sekmesi (RecordDetailPanel.tsx) bunu kullanır.
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(CallRecordDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetRecordById(string id, CancellationToken cancellationToken)
    {
        var record = await _recordsRepository.GetByIdAsync(id, cancellationToken);
        if (record is null)
        {
            return NotFound();
        }

        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        // Tekil kayıt endpoint'inde de AYNI şirket kontrolü — id
        // biliniyor diye kullanıcı başka şirketin kaydını göremez.
        var hasAccess = await _companyAccessService.UserHasAccessAsync(
            userId, record.CompanyId, cancellationToken);
        if (!hasAccess)
        {
            _logger.LogWarning(
                "Yetkisiz kayıt erişimi denemesi: userId={UserId}, recordId={RecordId}",
                userId, id);
            return Forbid();
        }

        return Ok(record);
    }

    // DELETE /api/records/{id}
    // Sadece Yönetici rolü silebilir — frontend'deki canDeleteRecords
    // (auth/permissions.ts) ile AYNI kural, ama gerçek yetki sınırı
    // burasıdır (frontend'deki kontrol sadece UI görünürlüğü). Policy
    // tanımı Program.cs -> AddAuthorization içinde ("Yonetici").
    [HttpDelete("{id}")]
    [Authorize(Policy = "Yonetici")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DeleteRecord(string id, CancellationToken cancellationToken)
    {
        var record = await _recordsRepository.GetByIdAsync(id, cancellationToken);
        if (record is null)
        {
            return NotFound();
        }

        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        // [Authorize(Policy = "Yonetici")] kullanıcının Yönetici
        // OLDUĞUNU garanti eder ama şirket scope'unu KONTROL ETMEZ —
        // bir Yönetici'nin bile sadece yetkili olduğu şirketin kaydını
        // silebilmesi gerekiyorsa bu kontrol burada kalmalı.
        var hasAccess = await _companyAccessService.UserHasAccessAsync(
            userId, record.CompanyId, cancellationToken);
        if (!hasAccess)
        {
            _logger.LogWarning(
                "Yetkisiz silme denemesi: userId={UserId}, recordId={RecordId}, companyId={CompanyId}",
                userId, id, record.CompanyId);
            return Forbid();
        }

        await _recordsRepository.DeleteAsync(id, cancellationToken);

        _logger.LogInformation(
            "Kayıt silindi: userId={UserId}, recordId={RecordId}",
            userId, id);

        return NoContent();
    }

    // Keycloak token'ındaki "sub" claim'i, kullanıcının değişmeyen
    // benzersiz kimliğidir (username/email değişebilir, sub değişmez)
    // — ICompanyAccessService bu değere göre sorgu yapmalı.
    private string? GetCurrentUserId()
    {
        return User.FindFirst("sub")?.Value;
    }
}
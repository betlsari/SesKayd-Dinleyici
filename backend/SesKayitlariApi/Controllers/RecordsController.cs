using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SesKayitlariApi.Storage;

namespace SesKayitlariApi.Controllers;

[ApiController]
[Route("api/records")]
[Authorize] // her endpoint en az geçerli bir token ister
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
public class RecordsController : ControllerBase
{
    private readonly IRecordsRepository _recordsRepository;
    private readonly ICompanyAccessService _companyAccessService;
    private readonly IAudioStorageService _audioStorageService;
    private readonly IListenLogRepository _listenLogRepository;
    private readonly ILogger<RecordsController> _logger;

    public RecordsController(
        IRecordsRepository recordsRepository,
        ICompanyAccessService companyAccessService,
        IAudioStorageService audioStorageService,
        IListenLogRepository listenLogRepository,
        ILogger<RecordsController> logger)
    {
        _recordsRepository = recordsRepository;
        _companyAccessService = companyAccessService;
        _audioStorageService = audioStorageService;
        _listenLogRepository = listenLogRepository;
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

    // GET /api/records/{id}/audio
    // AudioRecordingCard.tsx içindeki oynatıcı bu endpoint'i <audio>
    // veya fetch+stream ile çağıracak.
    //
    // TASARIM DOKÜMANI MADDE 3: "Ses kayıtlarının indirilmesine izin
    // verilmeyecektir. Yetki bazlı tutulmalıdır." — bu yüzden:
    //   1) Content-Disposition: inline (attachment DEĞİL) döndürülür,
    //      tarayıcının "farklı kaydet" davranışını tetiklemeyiz.
    //   2) enableRangeProcessing:true ile HTTP Range desteği açılır —
    //      bu, hem waveform üzerinde ileri/geri sarmayı (AudioRecordingCard
    //      seekBy) verimli kılar HEM DE dosyanın tamamını tek seferde
    //      indirmek yerine parça parça (streaming) sunulmasını sağlar.
    //   3) Aynı şirket-scope kontrolü BURADA DA tekrarlanır — id
    //      bilindiği için başka şirketin ses kaydına erişilmesin.
    [HttpGet("{id}/audio")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRecordAudio(
        string id,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var lookup = await _recordsRepository.GetAudioLookupAsync(id, cancellationToken);
        if (lookup is null)
        {
            return NotFound();
        }

        // AYNI şirket-scope kontrolü (RecordsController'daki diğer
        // endpoint'lerle BİREBİR aynı desen) — id biliniyor diye
        // kullanıcı başka şirketin ses kaydını dinleyemez.
        var hasAccess = await _companyAccessService.UserHasAccessAsync(
            userId, lookup.CompanyId, cancellationToken);
        if (!hasAccess)
        {
            _logger.LogWarning(
                "Yetkisiz ses kaydı erişim denemesi: userId={UserId}, recordId={RecordId}",
                userId, id);
            return Forbid();
        }

        if (string.IsNullOrWhiteSpace(lookup.AudioStoragePath))
        {
            // Kayıt var ama ses dosyası henüz depoya yüklenmemiş/
            // taşınmamış (bkz. Data/Entities.cs -> AudioStoragePath
            // alanındaki not).
            return NotFound(new { message = "Bu kayıt için ses dosyası bulunamadı." });
        }

        var audio = await _audioStorageService.OpenReadAsync(
            lookup.AudioStoragePath, cancellationToken);
        if (audio is null)
        {
            return NotFound(new { message = "Ses dosyası depoda bulunamadı." });
        }

        try
        {
            if (userId is not null)
            {
                var userDisplayName =
                    User.FindFirst("preferred_username")?.Value
                    ?? User.FindFirst(ClaimTypes.Name)?.Value
                    ?? userId;

                var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "Rol atanmamış";

                var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";

                await _listenLogRepository.AddAsync(
                    id,
                    userId,
                    userDisplayName,
                    role,
                    "Dinleme",
                    ipAddress,
                    cancellationToken);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(
                ex,
                "Dinleme olayı audit sistemine kaydedilemedi: recordId={RecordId}, userId={UserId}",
                id, userId);
        }

        Response.Headers.ContentDisposition = "inline";

        return File(
            audio.Stream,
            audio.ContentType,
            enableRangeProcessing: true);
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
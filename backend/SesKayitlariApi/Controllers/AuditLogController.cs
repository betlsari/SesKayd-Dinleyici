using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace SesKayitlariApi.Controllers;

[ApiController]
[Route("api/audit-log")]
[Authorize]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
public class AuditLogController : ControllerBase
{
    private static readonly HashSet<string> AllowedActions = new(StringComparer.Ordinal)
    {
        "Dinleme",
        "İndirme",
    };

    private readonly IListenLogRepository _listenLogRepository;
    private readonly IRecordsRepository _recordsRepository;
    private readonly ICompanyAccessService _companyAccessService;
    private readonly ILogger<AuditLogController> _logger;

    public AuditLogController(
        IListenLogRepository listenLogRepository,
        IRecordsRepository recordsRepository,
        ICompanyAccessService companyAccessService,
        ILogger<AuditLogController> logger)
    {
        _listenLogRepository = listenLogRepository;
        _recordsRepository = recordsRepository;
        _companyAccessService = companyAccessService;
        _logger = logger;
    }

    // GET /api/audit-log/records/{recordId}/listen-logs
    // ListenLogsTable.tsx bu endpoint'i kullanır. READ-ONLY — hiçbir yol
    // buradan log satırı oluşturmaz/değiştirmez/silmez (bkz.
    // auditLogService.ts).
    [HttpGet("records/{recordId}/listen-logs")]
    [ProducesResponseType(typeof(IReadOnlyList<ListenLogDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetListenLogs(
        string recordId,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var accessCheck = await CheckRecordAccessAsync(recordId, userId, cancellationToken);
        if (accessCheck is not null)
        {
            return accessCheck;
        }

        var logs = await _listenLogRepository.GetByRecordIdAsync(recordId, cancellationToken);
        return Ok(logs);
    }

    // POST /api/audit-log/records/{recordId}/events
    // AudioRecordingCard.tsx -> reportListenEvent bunu çağırır. Kullanıcı,
    // IP ve zaman damgası BURADA, kimliği doğrulanmış istek bağlamından
    // üretilir — client sadece "action" gönderir (bkz.
    // ReportListenEventRequest).
    [HttpPost("records/{recordId}/events")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReportEvent(
        string recordId,
        [FromBody] ReportListenEventRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request?.Action) || !AllowedActions.Contains(request.Action))
        {
            return BadRequest(new { message = "Geçersiz action. 'Dinleme' veya 'İndirme' olmalı." });
        }

        var userId = GetCurrentUserId();
        if (userId is null)
        {
            return Unauthorized();
        }

        var accessCheck = await CheckRecordAccessAsync(recordId, userId, cancellationToken);
        if (accessCheck is not null)
        {
            return accessCheck;
        }

        var userDisplayName =
            User.FindFirst("preferred_username")?.Value
            ?? User.FindFirst(ClaimTypes.Name)?.Value
            ?? userId;

        // Birden fazla rol claim'i olabilir (frontend/backend rol
        // eşlemesi ile tutarlı: ilk eşleşen kullanılır — bkz.
        // KeycloakRoleClaimsTransformer). Rol yoksa (bilinmeyen rol)
        // "Rol atanmamış" olarak kaydediyoruz; bu durum reddedilmez
        // çünkü audit kaydı "kim/ne zaman" bilgisini kaybetmemeli, bir
        // yetki kararı vermiyor.
        var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "Rol atanmamış";

        var ipAddress = GetClientIpAddress();

        await _listenLogRepository.AddAsync(
            recordId,
            userId,
            userDisplayName,
            role,
            request.Action,
            ipAddress,
            cancellationToken);

        _logger.LogInformation(
            "Audit olayı kaydedildi: action={Action}, recordId={RecordId}, userId={UserId}",
            request.Action, recordId, userId);

        return NoContent();
    }

    // RecordsController'daki İLE AYNI şirket-scope deseni: recordId
    // biliniyor diye kullanıcı başka şirketin audit geçmişini
    // göremesin/olay bildiremesin.
    private async Task<IActionResult?> CheckRecordAccessAsync(
        string recordId,
        string userId,
        CancellationToken cancellationToken)
    {
        var record = await _recordsRepository.GetByIdAsync(recordId, cancellationToken);
        if (record is null)
        {
            return NotFound();
        }

        var hasAccess = await _companyAccessService.UserHasAccessAsync(
            userId, record.CompanyId, cancellationToken);
        if (!hasAccess)
        {
            _logger.LogWarning(
                "Yetkisiz audit-log erişim denemesi: userId={UserId}, recordId={RecordId}",
                userId, recordId);
            return Forbid();
        }

        return null;
    }

    private string? GetCurrentUserId()
    {
        return User.FindFirst("sub")?.Value;
    }

    // NOT: Ters proxy (nginx/ingress) arkasında çalışılıyorsa gerçek
    // istemci IP'si X-Forwarded-For header'ında gelir; bu durumda
    // Forwarded Headers middleware (Program.cs) eklenmeli, aksi halde
    // burası hep proxy'nin IP'sini döner. Şimdilik doğrudan bağlantı
    // IP'si kullanılıyor.
    private string GetClientIpAddress()
    {
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}
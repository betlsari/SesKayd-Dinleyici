namespace SesKayitlariApi.Controllers;

// frontend/src/types/record.ts -> ListenLog ile birebir eşleşir.
public class ListenLogDto
{
    public string Id { get; set; } = default!;
    public string DateTime { get; set; } = default!; // "dd.MM.yyyy HH:mm:ss"
    public string User { get; set; } = default!;
    public string Role { get; set; } = default!;
    public string Action { get; set; } = default!; // "Dinleme" | "İndirme"
    public string IpAddress { get; set; } = default!;
}

// POST body — auditLogService.ts -> reportListenEvent'in gönderdiği tek alan.
// action zorunlu; diğer her şey (kullanıcı, IP, zaman) sunucu tarafında
// üretilir (bkz. Data/Entities.cs -> ListenLogEntity başındaki not).
public class ReportListenEventRequest
{
    public string Action { get; set; } = default!;
}

public interface IListenLogRepository
{
    Task<IReadOnlyList<ListenLogDto>> GetByRecordIdAsync(
        string recordId,
        CancellationToken cancellationToken);

    Task AddAsync(
        string recordId,
        string userId,
        string userDisplayName,
        string role,
        string action,
        string ipAddress,
        CancellationToken cancellationToken);
}
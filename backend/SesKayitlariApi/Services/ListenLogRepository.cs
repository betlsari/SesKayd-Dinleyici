using Microsoft.EntityFrameworkCore;
using SesKayitlariApi.Controllers;
using SesKayitlariApi.Data;

namespace SesKayitlariApi.Services;

public class ListenLogRepository : IListenLogRepository
{
    private readonly AppDbContext _db;

    public ListenLogRepository(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<ListenLogDto>> GetByRecordIdAsync(
        string recordId,
        CancellationToken cancellationToken)
    {
        return await _db.ListenLogs
            .AsNoTracking()
            .Where(l => l.CallRecordId == recordId)
            // En yeni olay en üstte — ListenLogsTable.tsx zaten kendi
            // tarafında da sıralama sunuyor, ama makul bir varsayılan
            // sırayla dönmek API tüketen başka istemciler için de iyi.
            .OrderByDescending(l => l.DateTime)
            .Select(l => new ListenLogDto
            {
                Id = l.Id.ToString(),
                DateTime = l.DateTime.ToString("dd.MM.yyyy HH:mm:ss"),
                User = l.UserDisplayName,
                Role = l.Role,
                Action = l.Action,
                IpAddress = l.IpAddress,
            })
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(
        string recordId,
        string userId,
        string userDisplayName,
        string role,
        string action,
        string ipAddress,
        CancellationToken cancellationToken)
    {
        _db.ListenLogs.Add(new ListenLogEntity
        {
            CallRecordId = recordId,
            UserId = userId,
            UserDisplayName = userDisplayName,
            Role = role,
            Action = action,
            IpAddress = ipAddress,
            // Sunucu saatinden — client'tan ASLA alınmaz (bkz.
            // auditLogService.ts başındaki not).
            DateTime = System.DateTime.UtcNow,
        });

        await _db.SaveChangesAsync(cancellationToken);
    }
}
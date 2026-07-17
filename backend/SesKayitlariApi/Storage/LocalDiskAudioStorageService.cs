using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.Options;

namespace SesKayitlariApi.Storage;

/// <summary>
/// IAudioStorageService'in yerel disk implementasyonu. Depolama kökü
/// (RootPath) appsettings.json -> AudioStorage:RootPath içinden gelir.
///
/// GÜVENLİK: storagePath, veritabanından (CallRecordEntity.AudioStoragePath)
/// geldiği için normalde kullanıcı girdisi DEĞİLDİR, ama yine de path
/// traversal'a (ör. "../../etc/passwd") karşı ResolveSafePath ile
/// savunma yapıyoruz — DB'ye kötü niyetli/bozuk bir değer yazılmış
/// olması ihtimaline karşı ikinci bir savunma katmanı.
/// </summary>
public class LocalDiskAudioStorageService : IAudioStorageService
{
    private readonly string _rootPath;
    private readonly ILogger<LocalDiskAudioStorageService> _logger;
    private static readonly FileExtensionContentTypeProvider ContentTypeProvider = new();

    public LocalDiskAudioStorageService(
        IOptions<AudioStorageOptions> options,
        ILogger<LocalDiskAudioStorageService> logger)
    {
        _rootPath = Path.GetFullPath(options.Value.RootPath);
        _logger = logger;
    }

    public Task<AudioStreamResult?> OpenReadAsync(
        string storagePath,
        CancellationToken cancellationToken)
    {
        var fullPath = ResolveSafePath(storagePath);
        if (fullPath is null || !File.Exists(fullPath))
        {
            _logger.LogWarning(
                "Ses dosyası bulunamadı: storagePath={StoragePath}",
                storagePath);
            return Task.FromResult<AudioStreamResult?>(null);
        }

        if (!ContentTypeProvider.TryGetContentType(fullPath, out var contentType))
        {
            // Tasarım dokümanındaki format alanı çoğunlukla WAV; bilinmeyen
            // uzantılarda güvenli bir varsayıma düşüyoruz.
            contentType = "application/octet-stream";
        }

        var fileInfo = new FileInfo(fullPath);
        // FileStream burada FileShare.Read ile açılıyor; aynı dosya
        // eş zamanlı birden fazla dinleyici tarafından okunabilsin.
        var stream = new FileStream(
            fullPath,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: 81920,
            useAsync: true);

        return Task.FromResult<AudioStreamResult?>(new AudioStreamResult
        {
            Stream = stream,
            ContentType = contentType,
            ContentLength = fileInfo.Length,
        });
    }

    /// <summary>
    /// storagePath'i RootPath altında çözer; sonuç RootPath'in DIŞINA
    /// çıkıyorsa (path traversal denemesi) null döner.
    /// </summary>
    private string? ResolveSafePath(string storagePath)
    {
        if (string.IsNullOrWhiteSpace(storagePath))
        {
            return null;
        }

        var combined = Path.GetFullPath(Path.Combine(_rootPath, storagePath));

        if (!combined.StartsWith(_rootPath, StringComparison.Ordinal))
        {
            _logger.LogWarning(
                "Path traversal denemesi engellendi: storagePath={StoragePath}",
                storagePath);
            return null;
        }

        return combined;
    }
}
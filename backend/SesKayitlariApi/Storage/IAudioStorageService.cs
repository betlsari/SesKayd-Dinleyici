namespace SesKayitlariApi.Storage;

public class AudioStreamResult
{
    public required Stream Stream { get; init; }
    public required string ContentType { get; init; }
    public long? ContentLength { get; init; }
}

/// <summary>
/// Ses kaydı dosyalarına erişimi soyutlar. Bu arayüz sayesinde depolama
/// stratejisi (yerel disk / S3 uyumlu / Azure Blob) DEĞİŞTİĞİNDE
/// RecordsController ve RecordsRepository'nin TEK SATIRI bile
/// değişmez — sadece yeni bir implementasyon yazılıp Program.cs'te
/// DI kaydı güncellenir.
///
/// ÖNEMLİ — İNDİRME DEĞİL, DİNLEME: Bu servis SADECE okuma (stream açma)
/// sağlar. Tasarım dokümanı gereği (madde 3: "Ses kayıtlarının
/// indirilmesine izin verilmeyecektir") burada bilerek bir "Download"
/// veya dosyayı geçici bir public URL'e çeviren metod YOKTUR — indirme
/// engeli, gerçek güvenlik sınırı olarak RecordsController'daki
/// Content-Disposition: inline + yetki kontrolü üzerinden sağlanır.
/// </summary>
public interface IAudioStorageService
{
    /// <summary>
    /// storagePath (CallRecordEntity.AudioStoragePath) için bir okuma
    /// stream'i açar. Dosya yoksa null döner (controller bunu 404'e
    /// çevirir).
    /// </summary>
    Task<AudioStreamResult?> OpenReadAsync(
        string storagePath,
        CancellationToken cancellationToken);
}
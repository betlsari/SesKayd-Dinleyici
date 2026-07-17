namespace SesKayitlariApi.Storage;

/// <summary>
/// appsettings.json içindeki "AudioStorage" bölümüne karşılık gelir.
/// Provider alanı şu an sadece bilgi amaçlıdır (DI kaydı Program.cs'te
/// elle yapılıyor) — ileride birden fazla implementasyon arasında
/// runtime'da seçim yapmak istenirse burada switch edilebilir.
/// </summary>
public class AudioStorageOptions
{
    public const string SectionName = "AudioStorage";

    public string Provider { get; set; } = "LocalDisk";

    /// <summary>
    /// LocalDisk için: ses dosyalarının bulunduğu kök klasör (mutlak yol).
    /// S3/Azure implementasyonu eklenirse bu alan yerine
    /// BucketName/ContainerName gibi alanlar kullanılacaktır — DTO'lar
    /// ve controller katmanı bundan ETKİLENMEZ, sadece bu options ve
    /// ilgili implementasyon değişir.
    /// </summary>
    public string RootPath { get; set; } = string.Empty;
}
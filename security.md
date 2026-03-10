# Güvenlik Politikası (Security Policy)

Ezan Vakti Plus ekibi olarak kullanıcılarımızın güvenliği ve gizliliği bizim için en öncelikli konudur. Bu belge, uygulamamızın güvenlik standartlarını ve olası güvenlik açıklarını raporlama prosedürlerini içerir.

## Desteklenen Sürümler

Şu anda sadece en güncel ana sürüm için güvenlik güncellemeleri sağlanmaktadır.

| Sürüm | Destek Durumu |
| :--- | :--- |
| 2.x.x | ✅ Destekleniyor |
| 1.x.x | ❌ Desteklenmiyor |

## Güvenlik Açıklarını Raporlama

Eğer uygulamamızda bir güvenlik açığı bulursanız, lütfen bunu kamuya açık bir şekilde paylaşmadan önce bize bildirin. 

Raporlarınızı aşağıdaki yöntemlerle iletebilirsiniz:
- **GitHub Issues:** Gizli bir "Security Advisory" oluşturarak.
- **E-posta:** [konyaspr.aep.fifth362@aleeas.com](mailto:konyaspr.aep.fifth362@aleeas.com)

Raporunuzda şunlara yer vermeniz süreci hızlandıracaktır:
- Açığın türü ve etkisi.
- Açığı tetiklemek için gereken adımlar (PoC).
- Etkilenen platform ve sürüm bilgisi.

## Veri Gizliliği ve Saklama

Ezan Vakti Plus, kullanıcı gizliliğini korumak için tasarlanmıştır:
- **Yerel Depolama:** Kullanıcı ayarları, kaza namazı verileri ve şehir seçimleri sadece kullanıcının bilgisayarında (`config.json`) saklanır.
- **Harici API'ler:** 
  - Namaz vakitleri için Habertürk/Diyanet servisleri kullanılır.
  - Hava durumu için Open-Meteo API kullanılır.
  - Uygulama güncellemeleri için GitHub API kullanılır.
- **Analiz ve Takip:** Uygulama, kullanıcının izni olmadan hiçbir kişisel veriyi veya kullanım istatistiğini sunucularımıza göndermez.

## Güvenli Kullanım Tavsiyeleri

- Uygulamayı her zaman resmi kanallardan (GitHub Releases) indirin.
- En son güvenlik yamalarını almak için uygulamayı güncel tutun.
- `config.json` dosyanızı üçüncü taraflarla paylaşırken dikkatli olun (özel ayarlar içerebilir).

---
*Son Güncelleme: 10 Mart 2026*

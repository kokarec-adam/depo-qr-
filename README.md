# DepoQR — QR Kodlu Depo ve Stok Yönetimi

Türkçe arayüzlü, mobil uyumlu depo envanter prototipi.

## Özellikler
- Malzeme kartları ve otomatik `MLZ-0001` kodlandırması
- Depo/raf/göz konumları; D01 Ara Depo, D02 Mekanik Atölye, D03 Oda Dolabı ve D99 Test Deposu
- Stok girişi, çıkışı, transfer ve hareket tarihçesi
- Arama, kategori/konum arama ve kritik stok uyarıları
- QR etiket üretme ve yazdırma
- JSON yedek dışa aktarma / içe aktarma
- Responsive mobil arayüz

## GitHub Pages
Bu repo, `.github/workflows/pages.yml` üzerinden `main` dalına her push olduğunda yayınlanacak şekilde hazırlanmıştır. Repo ayarlarında **Settings → Pages → Source → GitHub Actions** seçili olmalıdır.

Yayın adresi: https://kokarec-adam.github.io/depo-qr-/

## Test sürümü hakkında önemli not
Şu an veriler yalnızca kullanılan tarayıcının `localStorage` alanına kaydedilir. Başka bir telefon/bilgisayarla paylaşılan canlı stok değildir. İlk testlerde kullan; gerçek ortak kullanım için Supabase/Firebase gibi bir veritabanı ve kullanıcı yetkilendirmesi eklenmelidir. İlk açılıştaki örnek malzemeler demo verileridir, gerçek envanter değildir.

QR oluşturma ve kamera tarama kitaplıkları CDN üzerinden yüklenir; ilk kullanımda internet bağlantısı gerekir. Kameranın çalışması için site HTTPS üzerinden açılmalıdır.

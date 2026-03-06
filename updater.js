const https = require('https');
const fs = require('fs');
const path = require('path');
const { createWriteStream } = require('fs');
const { execSync, exec } = require('child_process');

const GITHUB_REPO = 'captainprice42/ezanvaktipluslast2';
const CURRENT_VERSION = '2.0.0';

/**
 * GitHub Releases'ten en son sürümü kontrol eder
 * @returns {Promise<{hasUpdate: boolean, currentVersion: string, latestVersion: string, downloadUrl: string, releaseNotes: string}>}
 */
function checkForUpdates() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: `/repos/${GITHUB_REPO}/releases/latest`,
            method: 'GET',
            headers: {
                'User-Agent': 'EzanVaktiPlus-Updater/2.0',
                'Accept': 'application/vnd.github.v3+json'
            },
            timeout: 10000
        };

        const req = https.get(options, (res) => {
            if (res.statusCode === 404) {
                resolve({ hasUpdate: false, currentVersion: CURRENT_VERSION, latestVersion: CURRENT_VERSION, downloadUrl: '', releaseNotes: '' });
                return;
            }

            if (res.statusCode !== 200) {
                resolve({ hasUpdate: false, currentVersion: CURRENT_VERSION, latestVersion: CURRENT_VERSION, downloadUrl: '', releaseNotes: '' });
                return;
            }

            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const release = JSON.parse(data);
                    const latestVersion = (release.tag_name || '').replace(/^v/i, '');
                    const hasUpdate = compareVersions(latestVersion, CURRENT_VERSION) > 0;

                    // .zip asset bul
                    let downloadUrl = '';
                    if (release.assets && release.assets.length > 0) {
                        const zipAsset = release.assets.find(a =>
                            a.name.endsWith('.zip') || a.name.endsWith('.rar')
                        );
                        if (zipAsset) {
                            downloadUrl = zipAsset.browser_download_url;
                        }
                    }

                    // Fallback: zipball URL
                    if (!downloadUrl && release.zipball_url) {
                        downloadUrl = release.zipball_url;
                    }

                    resolve({
                        hasUpdate,
                        currentVersion: CURRENT_VERSION,
                        latestVersion: latestVersion || CURRENT_VERSION,
                        downloadUrl,
                        releaseNotes: release.body || ''
                    });
                } catch (e) {
                    resolve({ hasUpdate: false, currentVersion: CURRENT_VERSION, latestVersion: CURRENT_VERSION, downloadUrl: '', releaseNotes: '' });
                }
            });
        });

        req.on('error', () => {
            resolve({ hasUpdate: false, currentVersion: CURRENT_VERSION, latestVersion: CURRENT_VERSION, downloadUrl: '', releaseNotes: '' });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ hasUpdate: false, currentVersion: CURRENT_VERSION, latestVersion: CURRENT_VERSION, downloadUrl: '', releaseNotes: '' });
        });
    });
}

/**
 * Güncelleme dosyasını indir
 * @param {string} url
 * @param {function} onProgress - (downloaded, total, speed) callback
 * @returns {Promise<string>} İndirilen dosya yolu
 */
function downloadUpdate(url, onProgress) {
    return new Promise((resolve, reject) => {
        const tempDir = path.join(require('os').tmpdir(), 'ezan-vakti-update');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const fileName = 'update.zip';
        const filePath = path.join(tempDir, fileName);
        const file = createWriteStream(filePath);

        const makeRequest = (requestUrl, redirects) => {
            if (redirects > 5) {
                reject(new Error('Çok fazla yönlendirme'));
                return;
            }

            const proto = requestUrl.startsWith('https') ? https : require('http');
            const req = proto.get(requestUrl, {
                headers: {
                    'User-Agent': 'EzanVaktiPlus-Updater/2.0'
                }
            }, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    makeRequest(res.headers.location, redirects + 1);
                    return;
                }

                if (res.statusCode !== 200) {
                    reject(new Error(`İndirme hatası: ${res.statusCode}`));
                    return;
                }

                const totalBytes = parseInt(res.headers['content-length'], 10) || 0;
                let downloadedBytes = 0;
                let lastTime = Date.now();
                let lastBytes = 0;

                res.on('data', (chunk) => {
                    downloadedBytes += chunk.length;
                    file.write(chunk);

                    const now = Date.now();
                    const elapsed = (now - lastTime) / 1000;
                    if (elapsed >= 0.5) {
                        const speed = (downloadedBytes - lastBytes) / elapsed;
                        lastTime = now;
                        lastBytes = downloadedBytes;
                        if (onProgress) {
                            onProgress(downloadedBytes, totalBytes, speed);
                        }
                    }
                });

                res.on('end', () => {
                    file.end();
                    if (onProgress) onProgress(downloadedBytes, totalBytes, 0);
                    resolve(filePath);
                });
            });

            req.on('error', reject);
        };

        makeRequest(url, 0);
    });
}

/**
 * İndirilen güncellemeyi kur
 * @param {string} zipPath
 * @param {string} appDir
 */
async function installUpdate(zipPath, appDir) {
    // config.json'u yedekle
    const configBackupPath = path.join(require('os').tmpdir(), 'ezan-vakti-config-backup.json');
    const configPath = path.join(appDir, 'config.json');

    if (fs.existsSync(configPath)) {
        fs.copyFileSync(configPath, configBackupPath);
    }

    // PowerShell ile zip çıkart
    try {
        const extractDir = path.join(require('os').tmpdir(), 'ezan-vakti-extract');
        if (fs.existsSync(extractDir)) {
            fs.rmSync(extractDir, { recursive: true, force: true });
        }

        execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractDir}' -Force"`, {
            timeout: 30000
        });

        // Çıkan dosyaları uygulama dizinine kopyala
        const items = fs.readdirSync(extractDir);
        let sourceDir = extractDir;

        // Eğer tek bir alt dizin varsa, onun içindeki dosyaları kullan
        if (items.length === 1) {
            const subPath = path.join(extractDir, items[0]);
            if (fs.statSync(subPath).isDirectory()) {
                sourceDir = subPath;
            }
        }

        copyDirSync(sourceDir, appDir, ['node_modules', '.git', 'config.json', 'sounds']);

        // Config'i geri yükle
        if (fs.existsSync(configBackupPath)) {
            fs.copyFileSync(configBackupPath, configPath);
        }

        // Temizle
        fs.rmSync(path.join(require('os').tmpdir(), 'ezan-vakti-update'), { recursive: true, force: true });
        fs.rmSync(extractDir, { recursive: true, force: true });

        return true;
    } catch (e) {
        // Config'i geri yükle
        if (fs.existsSync(configBackupPath)) {
            fs.copyFileSync(configBackupPath, configPath);
        }
        throw e;
    }
}

/**
 * Dizini kopyala (belirli klasörleri hariç tut)
 */
function copyDirSync(src, dest, excludeDirs) {
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        if (excludeDirs.includes(entry.name)) continue;

        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true });
            }
            copyDirSync(srcPath, destPath, excludeDirs);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * Semver karşılaştırma
 * @returns {number} 1: a > b, -1: a < b, 0: eşit
 */
function compareVersions(a, b) {
    if (!a || !b) return 0;
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const na = pa[i] || 0;
        const nb = pb[i] || 0;
        if (na > nb) return 1;
        if (na < nb) return -1;
    }
    return 0;
}

module.exports = { checkForUpdates, downloadUpdate, installUpdate };

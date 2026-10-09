import http from 'http';
import fs from 'fs';
import path from 'path';
import { runResponsiveAudit, DEFAULT_BREAKPOINTS } from './engine.js';
import { printCliSummary, generateHtmlReport } from './reporter.js';
import { Breakpoint } from './types.js';

/**
 * Spawns an ephemeral static HTTP server for local file testing.
 */
function createStaticFileServer(filePath: string): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve, reject) => {
    const fullPath = path.resolve(filePath);
    const baseDir = path.dirname(fullPath);

    const server = http.createServer((req, res) => {
      const requestedPath = req.url === '/' ? fullPath : path.join(baseDir, req.url || '');

      if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
        const ext = path.extname(requestedPath).toLowerCase();
        const mimeTypes: Record<string, string> = {
          '.html': 'text/html',
          '.css': 'text/css',
          '.js': 'text/javascript',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.svg': 'image/svg+xml',
        };

        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        fs.createReadStream(requestedPath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (address && typeof address === 'object') {
        const url = `http://127.0.0.1:${address.port}/`;
        resolve({
          url,
          close: () =>
            new Promise((res) => {
              server.close(() => res());
            }),
        });
      } else {
        reject(new Error('Gagal memulai local server'));
      }
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  let targetUrl = '';
  let localFile = '';
  let customBreakpoints: Breakpoint[] = DEFAULT_BREAKPOINTS;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) {
      targetUrl = args[i + 1];
      i++;
    } else if (args[i] === '--file' && args[i + 1]) {
      localFile = args[i + 1];
      i++;
    } else if (args[i] === '--breakpoints' && args[i + 1]) {
      customBreakpoints = args[i + 1].split(',').map((b) => parseInt(b.trim(), 10));
      i++;
    }
  }

  // Default fallback if no args provided
  if (!targetUrl && !localFile) {
    const defaultSample = path.join(process.cwd(), 'samples', 'demo-responsive-flaws.html');
    if (fs.existsSync(defaultSample)) {
      localFile = defaultSample;
    } else {
      console.log('Penggunaan:');
      console.log('  npm start -- --url https://contoh.com');
      console.log('  npm start -- --file path/to/index.html');
      console.log('  npm start -- --file path/to/index.html --breakpoints 320,768,1024,1440\n');
      return;
    }
  }

  let serverInstance: { url: string; close: () => Promise<void> } | null = null;

  try {
    if (localFile) {
      console.log(`[INFO] Membuka server lokal untuk berkas: ${localFile}...`);
      serverInstance = await createStaticFileServer(localFile);
      targetUrl = serverInstance.url;
    }

    console.log(`[INFO] Memulai audit multi-breakpoint pada: ${targetUrl}`);
    console.log(`[INFO] Breakpoint target: ${customBreakpoints.join(', ')} px...`);

    const report = await runResponsiveAudit(targetUrl, {
      breakpoints: customBreakpoints,
    });

    // Print summary to console
    printCliSummary(report);

    // Save JSON and HTML report
    const jsonPath = path.join(process.cwd(), 'report.json');
    const htmlPath = path.join(process.cwd(), 'report.html');

    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
    fs.writeFileSync(htmlPath, generateHtmlReport(report), 'utf-8');

    console.log(`[SUKSES] Laporan tersimpan di:`);
    console.log(`  • JSON : ${jsonPath}`);
    console.log(`  • HTML : ${htmlPath}\n`);
  } catch (error) {
    console.error('[ERROR] Terjadi kesalahan saat audit:', error);
  } finally {
    if (serverInstance) {
      await serverInstance.close();
    }
  }
}

main();

'use strict';

// BrowserSync integration for Hexo dev server
// Only activates during `hexo server`, has no effect on `hexo generate` (build)

let bs;
try {
  bs = require('browser-sync').create('hexo');
} catch {
  // browser-sync not installed (e.g. CI with --omit=dev), skip silently
}

if (bs) {
  let snippet = '';

  hexo.extend.filter.register('server_middleware', function (app) {
    // Middleware: inject BrowserSync client script into HTML responses
    app.use(function (req, res, next) {
      if (!snippet) return next();

      const origWrite = res.write;
      const origEnd = res.end;
      const chunks = [];
      let isHtml = null;

      res.write = function (chunk, encoding) {
        if (isHtml === null) {
          isHtml = (res.getHeader('content-type') || '').includes('text/html');
          if (isHtml) res.removeHeader('content-length');
        }
        if (isHtml) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
          return true;
        }
        return origWrite.apply(res, arguments);
      };

      res.end = function (chunk, encoding) {
        if (isHtml === null) {
          isHtml = (res.getHeader('content-type') || '').includes('text/html');
          if (isHtml) res.removeHeader('content-length');
        }
        if (isHtml) {
          if (chunk) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
          }
          let body = Buffer.concat(chunks).toString('utf8');
          body = body.replace('</body>', snippet + '\n</body>');
          origEnd.call(res, body, 'utf8');
        } else {
          origEnd.apply(res, arguments);
        }
      };

      next();
    });

    // Start BrowserSync in snippet mode (no proxy/server)
    bs.init({
      logSnippet: false,
      ui: false,
      open: false,
      notify: false
    }, function () {
      snippet = bs.getOption('snippet');
      hexo.log.info('BrowserSync started, live reload enabled');
    });

    // Reload browser when Hexo regenerates routes
    hexo.on('server', function () {
      hexo.route.on('update', function () {
        bs.reload();
      });
    });
  }, 1); // Priority 1: run before hexo-server's default middlewares
}

const http = require('http');

module.exports.send = (options, message, callback) => {
  const req = http.request({ hostname: options.uri, port: options.port, path: '/?message=' + JSON.stringify(message), timeout: 3000 }, res => {
    let output = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      output += chunk;
    });
    res.on('end', () => {
      try {
        callback(JSON.parse(output), undefined);
      } catch (error) {
        callback(undefined, error);
      }
    })
  });

  req.on('timeout', () => {
    req.abort();
    callback(undefined, `Request timeout to: ${options.uri}:${options.port}`);
  });

  req.on('error', (error) => {
    if (!req.aborted) {
      callback(undefined, error);
    }
  });

  req.end();
}

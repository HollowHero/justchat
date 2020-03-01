const http = require('http');

module.exports.send = (options, message, callback) => {
  http.request({ hostname: options.uri, port: options.port, path: '/?message=' + JSON.stringify(message) }, res => {
    let output = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
      output += chunk;
    });
    res.on('end', () => {
      try {
        callback(JSON.parse(output), undefined)
      } catch (error) {
        callback(undefined, error);
      }
    })
  }).on('error', (error) => {
    callback(undefined, error);
  }).end();
}

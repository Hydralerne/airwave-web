
const { URLSearchParams } = require('url');
let fetch;

(async () => {
    fetch = (await import('node-fetch')).default;
})();

// Helper function to append query params to the URL
const appendQueryParams = (url, query) => {
  const queryParams = new URLSearchParams(query).toString();
  return queryParams ? `${url}?${queryParams}` : url;
};

exports.request = async (url, options = {}) => {
  let { requestOptions,query } = options;

  let maxRetries = 3;
  let maxReconnects = 3;
  let backoff = { inc: 500, max: 10000 }
  const oldOptions = requestOptions;
  url = appendQueryParams(url,query)
  requestOptions = {
    headers: oldOptions.headers,
    method: oldOptions.method,
  }

  if(oldOptions.body){
    requestOptions.body = oldOptions.body
  }

  let retries = 0;
  let reconnects = 0;
  const finalUrl = appendQueryParams(url, query);
  const fetchWithRetries = async () => {
    try {
      const req = await fetch(finalUrl, requestOptions);
      const code = req.status.toString();

      if (code.startsWith('2')) {
        const contentType = req.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return req.json();
        }
        return req.text();
      }

      if (code.startsWith('3')) {
        const location = req.headers.get('location');
        if (location) {
          return exports.request(location, options); // Handle redirect
        }
      }

      const e = new Error(`Status code: ${code}`);
      e.statusCode = req.status;
      throw e;
    } catch (err) {
      if (retries < maxRetries) {
        retries++;
        const backoffDelay = Math.min(backoff.inc * retries, backoff.max);
        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
        return fetchWithRetries();
      } else if (reconnects < maxReconnects) {
        reconnects++;
        return fetchWithRetries();
      } else {
        throw err;
      }
    }
  };

  return fetchWithRetries();
};

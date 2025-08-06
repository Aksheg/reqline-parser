const HTTP_STATUSES = {
  HTTP_200_OK: 200,
  HTTP_201_CREATED: 201,
  HTTP_400_BAD_REQUEST: 400,
  HTTP_401_UNAUTHORIZED: 401,
  HTTP_403_FORBIDDEN: 403,
  HTTP_404_NOT_FOUND: 404,
  HTTP_500_INTERNAL_SERVER_ERROR: 500
};

function createHandler(config) {
  const handler = {
    path: config.path,
    method: (config.method || 'get').toLowerCase(),
    handler: config.handler,
    register: function(app) {
      const route = this.path;
      const method = this.method;
      const handlerFn = this.handler;

      app[method](route, async (req, res) => {
        try {
          const rc = {
            body: req.body,
            query: req.query,
            params: req.params,
            headers: req.headers,
            properties: {
              ip: req.ip,
              userAgent: req.get('User-Agent'),
              timestamp: Date.now()
            }
          };

          const helpers = {
            http_statuses: HTTP_STATUSES
          };

          const result = await handlerFn(rc, helpers);
          
          res.status(result.status || 200).json(result.data || {});
        } catch (error) {
          console.error('Handler error:', error);
          res.status(500).json({
            error: true,
            message: error.message || 'Internal server error'
          });
        }
      });
    }
  };

  return handler;
}

module.exports = {
  createHandler,
  HTTP_STATUSES
};
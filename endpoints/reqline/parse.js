const { createHandler } = require('../../core/server');
const parseReqlineService = require('../../services/reqline/parse-reqline');

module.exports = createHandler({
  path: '/',
  method: 'post',
  async handler(rc, helpers) {
    try {
      const payload = rc.body;
      
      if (!payload || !payload.reqline) {
        return {
          status: helpers.http_statuses.HTTP_400_BAD_REQUEST,
          data: {
            error: true,
            message: "Missing required reqline parameter"
          }
        };
      }

      const response = await parseReqlineService(payload.reqline);
      
      return {
        status: helpers.http_statuses.HTTP_200_OK,
        data: response,
      };
    } catch (error) {
      return {
        status: helpers.http_statuses.HTTP_400_BAD_REQUEST,
        data: {
          error: true,
          message: error.message
        }
      };
    }
  },
});
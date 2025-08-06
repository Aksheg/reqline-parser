const httpRequest = require('../../core/http-request');
const { throwAppError, ERROR_CODE } = require('../../core/errors');
const ReqlineMessages = require('../../messages/reqline');

class ReqlineParser {
  constructor() {
    this.VALID_HTTP_METHODS = ['GET', 'POST'];
    this.REQUIRED_KEYWORDS = ['HTTP', 'URL'];
    this.OPTIONAL_KEYWORDS = ['HEADERS', 'QUERY', 'BODY'];
    this.ALL_KEYWORDS = [...this.REQUIRED_KEYWORDS, ...this.OPTIONAL_KEYWORDS];
  }

  parse(reqlineStatement) {
    if (!reqlineStatement || typeof reqlineStatement !== 'string') {
      throwAppError(ReqlineMessages.INVALID_SYNTAX, ERROR_CODE.VALIDATION_ERROR);
    }

    const trimmed = reqlineStatement.trim();
    if (!trimmed) {
      throwAppError(ReqlineMessages.INVALID_SYNTAX, ERROR_CODE.VALIDATION_ERROR);
    }

    const segments = this.splitByPipe(trimmed);
    
    const parsed = this.parseSegments(segments);
    
    this.validateRequired(parsed);
    
    return parsed;
  }

  splitByPipe(statement) {
    if (!statement.includes('|')) {
      throwAppError('Missing required pipe delimiter', ERROR_CODE.VALIDATION_ERROR);
    }

    const segments = [];
    let current = '';
    let i = 0;
    
    while (i < statement.length) {
      if (statement[i] === '|') {
        if (i === 0 || statement[i-1] !== ' ') {
          throwAppError(ReqlineMessages.INVALID_SPACING, ERROR_CODE.VALIDATION_ERROR);
        }
        if (i === statement.length - 1 || statement[i+1] !== ' ') {
          throwAppError(ReqlineMessages.INVALID_SPACING, ERROR_CODE.VALIDATION_ERROR);
        }
        
        segments.push(current.trim());
        current = '';
        i += 2;
      } else {
        current += statement[i];
        i++;
      }
    }
    
    if (current.trim()) {
      segments.push(current.trim());
    }

    return segments;
  }

  parseSegments(segments) {
    const result = {
      method: null,
      url: null,
      headers: {},
      query: {},
      body: {}
    };

    let httpFound = false;
    let urlFound = false;

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const parts = this.parseSegment(segment);
      const keyword = parts.keyword;
      const value = parts.value;

      switch (keyword) {
        case 'HTTP':
          if (httpFound) {
            throwAppError('Duplicate HTTP keyword found', ERROR_CODE.VALIDATION_ERROR);
          }
          httpFound = true;
          this.validateHttpMethod(value);
          result.method = value;
          break;

        case 'URL':
          if (urlFound) {
            throwAppError('Duplicate URL keyword found', ERROR_CODE.VALIDATION_ERROR);
          }
          urlFound = true;
          if (!value || !value.trim()) {
            throwAppError('URL value cannot be empty', ERROR_CODE.VALIDATION_ERROR);
          }
          result.url = value.trim();
          break;

        case 'HEADERS':
          result.headers = this.parseJsonValue(value, 'HEADERS');
          break;

        case 'QUERY':
          result.query = this.parseJsonValue(value, 'QUERY');
          break;

        case 'BODY':
          result.body = this.parseJsonValue(value, 'BODY');
          break;

        default:
          throwAppError(`Unknown keyword: ${keyword}`, ERROR_CODE.VALIDATION_ERROR);
      }
    }

    if (segments.length > 0) {
      const firstKeyword = this.parseSegment(segments[0]).keyword;
      if (firstKeyword !== 'HTTP') {
        throwAppError(ReqlineMessages.MISSING_HTTP, ERROR_CODE.VALIDATION_ERROR);
      }
    }

    if (segments.length > 1) {
      const secondKeyword = this.parseSegment(segments[1]).keyword;
      if (secondKeyword !== 'URL') {
        throwAppError(ReqlineMessages.MISSING_URL, ERROR_CODE.VALIDATION_ERROR);
      }
    }

    return result;
  }

  parseSegment(segment) {
    if (!segment || !segment.trim()) {
      throwAppError('Empty segment found', ERROR_CODE.VALIDATION_ERROR);
    }

    const spaceIndex = segment.indexOf(' ');
    
    if (spaceIndex === -1) {
      throwAppError(ReqlineMessages.MISSING_SPACE_AFTER_KEYWORD, ERROR_CODE.VALIDATION_ERROR);
    }

    const keyword = segment.substring(0, spaceIndex);
    const value = segment.substring(spaceIndex + 1);

    this.validateKeyword(keyword);

    if (segment.includes('  ')) {
      throwAppError(ReqlineMessages.MULTIPLE_SPACES, ERROR_CODE.VALIDATION_ERROR);
    }

    return { keyword, value };
  }

  validateKeyword(keyword) {
    if (!this.ALL_KEYWORDS.includes(keyword)) {
      if (keyword.toLowerCase() === 'http' || 
          keyword.toLowerCase() === 'url' || 
          keyword.toLowerCase() === 'headers' ||
          keyword.toLowerCase() === 'query' ||
          keyword.toLowerCase() === 'body') {
        throwAppError(ReqlineMessages.KEYWORDS_UPPERCASE, ERROR_CODE.VALIDATION_ERROR);
      }
      throwAppError(`Unknown keyword: ${keyword}`, ERROR_CODE.VALIDATION_ERROR);
    }
  }

  validateHttpMethod(method) {
    if (!method || !method.trim()) {
      throwAppError('HTTP method cannot be empty', ERROR_CODE.VALIDATION_ERROR);
    }

    const trimmedMethod = method.trim();
    
    if (!this.VALID_HTTP_METHODS.includes(trimmedMethod)) {
      if (trimmedMethod.toLowerCase() === 'get' || trimmedMethod.toLowerCase() === 'post') {
        throwAppError(ReqlineMessages.HTTP_METHOD_UPPERCASE, ERROR_CODE.VALIDATION_ERROR);
      }
      throwAppError(ReqlineMessages.INVALID_HTTP_METHOD, ERROR_CODE.VALIDATION_ERROR);
    }
  }

  validateRequired(parsed) {
    if (!parsed.method) {
      throwAppError(ReqlineMessages.MISSING_HTTP, ERROR_CODE.VALIDATION_ERROR);
    }
    if (!parsed.url) {
      throwAppError(ReqlineMessages.MISSING_URL, ERROR_CODE.VALIDATION_ERROR);
    }
  }

  parseJsonValue(value, section) {
    if (!value || !value.trim()) {
      return {};
    }

    try {
      const parsed = JSON.parse(value.trim());
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throwAppError(ReqlineMessages[`INVALID_JSON_${section}`], ERROR_CODE.VALIDATION_ERROR);
      }
      return parsed;
    } catch (e) {
      throwAppError(ReqlineMessages[`INVALID_JSON_${section}`], ERROR_CODE.VALIDATION_ERROR);
    }
  }

  buildFullUrl(baseUrl, queryParams) {
    if (!queryParams || Object.keys(queryParams).length === 0) {
      return baseUrl;
    }

    const url = new URL(baseUrl);
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    return url.toString();
  }
}

async function parseReqlineService(reqlineStatement) {
  const parser = new ReqlineParser();
  
  try {
    const parsed = parser.parse(reqlineStatement);
    
    const fullUrl = parser.buildFullUrl(parsed.url, parsed.query);
    
    const requestConfig = {
      method: parsed.method,
      url: fullUrl,
      headers: {
        'Content-Type': 'application/json',
        ...parsed.headers
      }
    };

    if (parsed.method === 'POST' && Object.keys(parsed.body).length > 0) {
      requestConfig.data = parsed.body;
    }

    const startTime = Date.now();
    
    const response = await httpRequest(requestConfig);
    
    const endTime = Date.now();
    const duration = endTime - startTime;

    return {
      request: {
        query: parsed.query,
        body: parsed.body,
        headers: parsed.headers,
        full_url: fullUrl
      },
      response: {
        http_status: response.status,
        duration: duration,
        request_start_timestamp: startTime,
        request_stop_timestamp: endTime,
        response_data: response.data
      }
    };

  } catch (error) {
    throw error;
  }
}

module.exports = parseReqlineService;
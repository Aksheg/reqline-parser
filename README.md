# Reqline Parser

A curl-like HTTP request parser and executor that processes reqline statements and executes HTTP requests with proper syntax validation.

## Features

- **No Regex Parsing**: Uses character-by-character parsing for complete control
- **Strict Syntax Validation**: Enforces all specified reqline syntax rules
- **HTTP Request Execution**: Makes actual HTTP requests and returns formatted responses
- **Comprehensive Error Handling**: Provides specific error messages for syntax violations
- **Template Architecture**: Follows MVC pattern with clean separation of concerns

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd reqline-parser
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   # OR
   node app.js
   ```

4. **Server will start on port 8000** (or PORT from environment variables)

## API Usage

### Endpoint
- **URL:** `POST /`
- **Content-Type:** `application/json`

### Request Format
```json
{
  "reqline": "[REQLINE STATEMENT]"
}
```

### Success Response (HTTP 200)
```json
{
  "request": {
    "query": {"refid": 1920933},
    "body": {},
    "headers": {},
    "full_url": "https://dummyjson.com/quotes/3?refid=1920933"
  },
  "response": {
    "http_status": 200,
    "duration": 347,
    "request_start_timestamp": 1691234567890,
    "request_stop_timestamp": 1691234568237,
    "response_data": {
      "id": 3,
      "quote": "Thinking is the capital, Enterprise is the way, Hard Work is the solution.",
      "author": "Abdul Kalam"
    }
  }
}
```

### Error Response (HTTP 400)
```json
{
  "error": true,
  "message": "Missing required HTTP keyword"
}
```

## Reqline Syntax

### Syntax Rules
- **Keywords:** All keywords must be UPPERCASE (`HTTP`, `URL`, `HEADERS`, `QUERY`, `BODY`)
- **Delimiter:** Single pipe `|` with exactly one space on each side
- **HTTP Methods:** Only `GET` or `POST` (uppercase)
- **Required Order:** `HTTP` must be first, `URL` must be second
- **Optional Keywords:** `HEADERS`, `QUERY`, `BODY` can appear in any order after URL

### Basic Structure
```
HTTP [METHOD] | URL [URL_VALUE] | [OPTIONAL_SECTIONS]
```

## Valid Examples

### GET Requests
```bash
HTTP GET | URL https://dummyjson.com/quotes/3

HTTP GET | URL https://dummyjson.com/quotes/3 | QUERY {"refid": 1920933}

HTTP GET | URL https://dummyjson.com/quotes/3 | HEADERS {"Content-Type": "application/json"} | QUERY {"refid": 1920933}
```

### POST Requests
```bash
HTTP POST | URL https://jsonplaceholder.typicode.com/posts | BODY {"title": "Test Post", "userId": 1}

HTTP POST | URL https://dummyjson.com/posts/add | HEADERS {"Authorization": "Bearer token"} | BODY {"title": "My Post", "userId": 5}

HTTP POST | URL https://api.example.com/posts | HEADERS {"Content-Type": "application/json"} | QUERY {"debug": "true"} | BODY {"title": "Complete Example", "userId": 1}
```

## Testing

### Run Test Suite
```bash
npm test
# OR
node test/reqline-parser.test.js
```

### Manual Testing with curl

**Test valid GET request:**
```bash
curl -X POST http://localhost:8000/ \
  -H "Content-Type: application/json" \
  -d '{"reqline": "HTTP GET | URL https://dummyjson.com/quotes/3 | QUERY {\"refid\": 1920933}"}'
```

**Test valid POST request:**
```bash
curl -X POST http://localhost:8000/ \
  -H "Content-Type: application/json" \
  -d '{"reqline": "HTTP POST | URL https://jsonplaceholder.typicode.com/posts | BODY {\"title\": \"Test Post\", \"userId\": 1}"}'
```

**Test error case:**
```bash
curl -X POST http://localhost:8000/ \
  -H "Content-Type: application/json" \
  -d '{"reqline": "HTTP get | URL https://dummyjson.com/quotes/3"}'
```

## Configuration

### Environment Variables
```bash
PORT=8000 
NODE_ENV=development
```

### Dependencies
- **express**: Web framework
- **axios**: HTTP client for making requests
- **dotenv**: Environment variable management

## Architecture

### Parser Logic
- **Character-by-character parsing** (no regex)
- **Segment validation** with keyword recognition
- **JSON parsing** for HEADERS, QUERY, and BODY sections
- **URL building** with query parameter handling

### Request Flow
```
Client Request → Endpoint Handler → Parser Service → HTTP Request → Response Formatting
```

### Error Handling
- Centralized error messages in `/messages/reqline.js`
- Consistent error codes using `/core/errors/`
- Graceful error responses with specific validation messages

## Performance

- **Timing**: Millisecond precision for request duration
- **Memory**: Efficient character-by-character parsing
- **Validation**: Early error detection and fast failure

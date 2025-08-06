const parseReqlineService = require('../services/reqline/parse-reqline');

async function testReqlineParser() {
  console.log('Testing Reqline Parser...\n');

  const testCases = [
    {
      name: 'Valid GET with QUERY',
      input: 'HTTP GET | URL https://dummyjson.com/quotes/3 | QUERY {"refid": 1920933}',
      shouldSucceed: true
    },
    {
      name: 'Valid GET with HEADERS and QUERY',
      input: 'HTTP GET | URL https://dummyjson.com/quotes/3 | HEADERS {"Content-Type": "application/json"} | QUERY {"refid": 1920933}',
      shouldSucceed: true
    },
    {
      name: 'Valid POST with BODY',
      input: 'HTTP POST | URL https://jsonplaceholder.typicode.com/posts | BODY {"title": "Test", "userId": 1}',
      shouldSucceed: true
    },
    {
      name: 'Simple GET without optional params',
      input: 'HTTP GET | URL https://dummyjson.com/quotes/3',
      shouldSucceed: true
    },

    // Error cases
    {
      name: 'Missing HTTP keyword',
      input: 'URL https://dummyjson.com/quotes/3',
      shouldSucceed: false,
      expectedError: 'Missing required HTTP keyword'
    },
    {
      name: 'Missing URL keyword',
      input: 'HTTP GET',
      shouldSucceed: false,
      expectedError: 'Missing required URL keyword'
    },
    {
      name: 'Invalid HTTP method',
      input: 'HTTP DELETE | URL https://dummyjson.com/quotes/3',
      shouldSucceed: false,
      expectedError: 'Invalid HTTP method. Only GET and POST are supported'
    },
    {
      name: 'Lowercase HTTP method',
      input: 'HTTP get | URL https://dummyjson.com/quotes/3',
      shouldSucceed: false,
      expectedError: 'HTTP method must be uppercase'
    },
    {
      name: 'Lowercase keyword',
      input: 'http GET | URL https://dummyjson.com/quotes/3',
      shouldSucceed: false,
      expectedError: 'Keywords must be uppercase'
    },
    {
      name: 'Invalid JSON in QUERY',
      input: 'HTTP GET | URL https://dummyjson.com/quotes/3 | QUERY {invalid json}',
      shouldSucceed: false,
      expectedError: 'Invalid JSON format in QUERY section'
    },
    {
      name: 'Invalid spacing around pipe',
      input: 'HTTP GET| URL https://dummyjson.com/quotes/3',
      shouldSucceed: false,
      expectedError: 'Invalid spacing around pipe delimiter'
    },
    {
      name: 'Multiple spaces',
      input: 'HTTP  GET | URL https://dummyjson.com/quotes/3',
      shouldSucceed: false,
      expectedError: 'Multiple spaces found where single space expected'
    }
  ];

  let passCount = 0;
  let failCount = 0;

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      const result = await parseReqlineService(testCase.input);
      
      if (testCase.shouldSucceed) {
        console.log('PASS - Request succeeded as expected');
        console.log(`   Full URL: ${result.request.full_url}`);
        console.log(`   Status: ${result.response.http_status}`);
        passCount++;
      } else {
        console.log('FAIL - Expected error but got success');
        failCount++;
      }
    } catch (error) {
      if (!testCase.shouldSucceed) {
        console.log('PASS - Got expected error:', error.message);
        if (testCase.expectedError && !error.message.includes(testCase.expectedError)) {
          console.log('WARNING - Error message differs from expected');
        }
        passCount++;
      } else {
        console.log('FAIL - Unexpected error:', error.message);
        failCount++;
      }
    }
    console.log('');
  }

  console.log(`\n Test Results: ${passCount} passed, ${failCount} failed`);
  console.log(`Success rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);
}

if (require.main === module) {
  testReqlineParser().catch(console.error);
}

module.exports = testReqlineParser;
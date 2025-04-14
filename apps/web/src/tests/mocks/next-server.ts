// Mock global objects required by Next.js middleware

// Better implementation of the Request mock
global.Request = class MockRequest {
  #url: string;

  constructor(input: string | URL) {
    this.#url = input.toString();
  }

  get url() {
    return this.#url;
  }
} as any;

global.Response = class MockResponse {
  body: any;
  status: number;
  headers: Headers;

  constructor(body: any, init: any) {
    this.body = body;
    this.status = init?.status || 200;
    this.headers = new Headers(init?.headers);
  }
} as any;

global.Headers = class MockHeaders {
  private headers = new Map<string, string>();

  constructor(init?: Record<string, string>) {
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.set(key, value);
      });
    }
  }

  get(name: string) {
    return this.headers.get(name) || null;
  }

  set(name: string, value: string) {
    this.headers.set(name, value);
  }

  has(name: string) {
    return this.headers.has(name);
  }

  delete(name: string) {
    this.headers.delete(name);
  }

  append(name: string, value: string) {
    const existingValue = this.get(name);
    this.set(name, existingValue ? `${existingValue}, ${value}` : value);
  }
} as any;

// A simpler approach: clear the entire module cache for next/server
// This prevents issues with the actual Next.js implementation
jest.mock("next/server", () => {
  // Create a mock URL class if needed
  class MockURL {
    pathname: string;
    searchParams: URLSearchParams;

    constructor(input: string, base?: string) {
      const url = new URL(input, base || "https://example.com");
      this.pathname = url.pathname;
      this.searchParams = url.searchParams;
    }

    toString() {
      return `https://example.com${this.pathname}`;
    }
  }

  return {
    // Simplified implementations
    NextRequest: class MockNextRequest {
      url: string;
      nextUrl: MockURL;
      cookies: {
        getAll: () => Array<{ name: string; value: string }>;
        set: (name: string, value: string) => void;
      };
      headers: Headers;

      constructor(url: string | URL) {
        const urlString = url.toString();
        this.url = urlString;
        this.nextUrl = new MockURL(urlString);
        this.cookies = {
          getAll: jest.fn().mockReturnValue([]),
          set: jest.fn(),
        };
        this.headers = new Headers();
      }
    },

    NextResponse: {
      next: jest.fn().mockImplementation(() => ({
        cookies: {
          set: jest.fn(),
          setAll: jest.fn(),
          getAll: jest.fn().mockReturnValue([]),
        },
      })),
      redirect: jest.fn().mockImplementation((url) => ({
        status: 307,
        headers: new Headers({ location: url.toString() }),
      })),
      json: jest.fn().mockImplementation((data) => ({
        status: 200,
        headers: new Headers({ "content-type": "application/json" }),
        body: JSON.stringify(data),
      })),
    },
  };
});

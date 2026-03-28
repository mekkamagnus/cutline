## TypeScript Design Patterns — Functional Rules

### 1. Use Factory Functions with typed returns

Prefer typed factory functions over classes—functions return new objects, no `new` needed.

```typescript
// ❌ WRONG - Class-based constructors
class User {
  constructor(public name: string, public email: string) {}

  save(): void { /* ... */ }
}

// ✅ RIGHT - Typed factory functions
interface User {
  readonly name: string;
  readonly email: string;
  save: () => void;
}

const createUser = (name: string, email: string): User => ({
  name,
  email,
  save: (): void => { /* ... */ }
});

// Usage - no 'new' required
const user: User = createUser('Alice', 'alice@example.com');
```

---

### 2. Apply Module Pattern via closures for encapsulation

Use closures to create private state, exposing only pure public functions with types.

```typescript
// ❌ WRONG - Everything exposed globally
let count = 0;
function increment(): void { count++; }
function getCount(): number { return count; }

// ✅ RIGHT - Closure with private state
interface Counter {
  increment: () => number;
  decrement: () => number;
  getCount: () => number;
  reset: () => void;
}

const createCounter = (initial: number = 0): Counter => {
  let count: number = initial; // Private

  return {
    increment: (): number => ++count,
    decrement: (): number => --count,
    getCount: (): number => count,
    reset: (): void => { count = initial; }
  };
};

// Each counter has isolated state
const counter1: Counter = createCounter(0);
const counter2: Counter = createCounter(10);
```

---

### 3. Prefer singletons via module exports, not classes

Use ES6 modules or higher-order functions to create single shared instances.

```typescript
// ❌ WRONG - Class-based singleton pattern
class Logger {
  private static instance: Logger;
  private logs: string[] = [];

  constructor() {
    if (Logger.instance) return Logger.instance;
    this.logs = [];
    Logger.instance = this;
  }

  log(message: string): void { this.logs.push(message); }
}

// ✅ RIGHT - Module export singleton
// logger.ts
const logs: string[] = [];
export const log = (message: string): void => logs.push(message);
export const getLogs = (): string[] => [...logs]; // Return copy

// Or using closure with explicit type
interface Logger {
  log: (message: string) => void;
  getLogs: () => string[];
}

const createLogger = (): Logger => {
  const logs: string[] = [];

  return {
    log: (message: string): void => logs.push(message),
    getLogs: (): string[] => [...logs]
  };
};

export const logger: Logger = createLogger(); // Single instance
```

---

### 4. Use Observer Pattern via typed pub/sub functions

Implement event systems with pure functions and typed message queues.

```typescript
// ❌ WRONG - Class-based EventEmitter
class EventEmitter {
  private events: Record<string, Function[]> = {};

  on(event: string, callback: Function): void {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  emit(event: string, data: unknown): void {
    if (this.events[event]) {
      this.events[event].forEach(cb => cb(data));
    }
  }
}

// ✅ RIGHT - Functional pub/sub with types
type EventCallback<T = unknown> = (data: T) => void;

interface EventBus {
  subscribe: <T>(event: string, callback: EventCallback<T>) => () => void;
  publish: <T>(event: string, data: T) => void;
}

const createEventBus = (): EventBus => {
  const subscribers = new Map<string, Set<EventCallback>>();

  return {
    subscribe: <T>(event: string, callback: EventCallback<T>): (() => void) => {
      if (!subscribers.has(event)) {
        subscribers.set(event, new Set());
      }
      subscribers.get(event)!.add(callback as EventCallback);

      // Return unsubscribe function
      return () => subscribers.get(event)!.delete(callback as EventCallback);
    },

    publish: <T>(event: string, data: T): void => {
      const callbacks = subscribers.get(event);
      if (callbacks) {
        callbacks.forEach(cb => cb(data));
      }
    }
  };
};

// Typed events
interface UserDeletedEvent {
  id: number;
  email: string;
}

const events: EventBus = createEventBus();
const unsubscribe = events.subscribe<UserDeletedEvent>(
  'user:deleted',
  ({ id }) => console.log(`User ${id} deleted`)
);

events.publish('user:deleted', { id: 123, email: 'test@test.com' });
unsubscribe(); // Clean up
```

---

### 5. Apply Strategy Pattern via typed higher-order functions

Pass functions as strategies with proper types—no need for strategy classes.

```typescript
// ❌ WRONG - Class-based strategies
abstract class DiscountStrategy {
  abstract calculate(amount: number): number;
}

class VIPDiscount extends DiscountStrategy {
  calculate(amount: number): number { return amount * 0.8; }
}

// ✅ RIGHT - Typed functions as strategies
type DiscountStrategy = (amount: number, context?: Record<string, unknown>) => number;

interface Strategies {
  none: DiscountStrategy;
  vip: DiscountStrategy;
  seasonal: DiscountStrategy;
  bulk: DiscountStrategy;
}

const strategies: Strategies = {
  none: (amount: number) => amount,
  vip: (amount: number) => amount * 0.8,
  seasonal: (amount: number) => amount * 0.9,
  bulk: (amount: number, context?: Record<string, unknown>) =>
    (context?.quantity as number || 0) > 10 ? amount * 0.85 : amount
};

type StrategyName = keyof Strategies;

const calculateTotal = (
  amount: number,
  strategy: StrategyName = 'none',
  context?: Record<string, unknown>
): number => {
  const discountFn: DiscountStrategy = strategies[strategy] || strategies.none;
  return discountFn(amount, context);
};

// Usage
calculateTotal(100, 'vip'); // 80
calculateTotal(100, 'bulk', { quantity: 15 }); // 85
```

---

### 6. Use Command Pattern via typed function queues

Store typed functions as data for undo/redo—no command classes needed.

```typescript
// ❌ WRONG - Class-based commands
abstract class Command {
  abstract execute(): unknown;
  abstract undo(): unknown;
}

class CopyCommand extends Command {
  execute(): void { /* ... */ }
  undo(): void { /* ... */ }
}

// ✅ RIGHT - Typed functions as commands
interface Command {
  execute: () => unknown;
  undo: () => unknown;
}

interface CommandHistory {
  execute: (command: Command) => unknown;
  undo: () => unknown;
  redo: () => unknown;
}

const createCommandHistory = (): CommandHistory => {
  const history: Command[] = [];
  let currentIndex: number = -1;

  return {
    execute: (command: Command): unknown => {
      // Remove any redone commands
      history.splice(currentIndex + 1);
      // Add new command
      history.push(command);
      currentIndex++;
      return command.execute();
    },

    undo: (): unknown => {
      if (currentIndex < 0) return;
      const command = history[currentIndex];
      currentIndex--;
      return command.undo();
    },

    redo: (): unknown => {
      if (currentIndex >= history.length - 1) return;
      currentIndex++;
      return history[currentIndex].execute();
    }
  };
};

// Commands are plain objects with types
interface CopyCommandData {
  execute: () => void;
  undo: () => void;
}

const copyCommand: Command = {
  execute: (): void => { clipboard.set(selection); },
  undo: (): void => { selection.set(clipboard.get()); }
};

const history: CommandHistory = createCommandHistory();
history.execute(copyCommand);
history.undo();
```

---

### 7. Apply Decorator Pattern via typed function composition

Compose typed functions to add behavior—no decorator class hierarchy.

```typescript
// ❌ WRONG - Class-based decorators
class Coffee {
  cost(): number { return 10; }
}

class MilkDecorator extends Coffee {
  constructor(private coffee: Coffee) { super(); }
  cost(): number { return this.coffee.cost() + 2; }
}

// ✅ RIGHT - Typed function composition
interface Coffee {
  readonly cost: number;
  readonly description: string;
}

type CoffeeDecorator = (item: Coffee) => Coffee;

const coffee: Coffee = { cost: 10, description: 'Coffee' };

const withMilk: CoffeeDecorator = (item: Coffee): Coffee => ({
  ...item,
  cost: item.cost + 2,
  description: `${item.description}, Milk`
});

const withSugar: CoffeeDecorator = (item: Coffee): Coffee => ({
  ...item,
  cost: item.cost + 1,
  description: `${item.description}, Sugar`
});

const withWhippedCream: CoffeeDecorator = (item: Coffee): Coffee => ({
  ...item,
  cost: item.cost + 3,
  description: `${item.description}, Whipped Cream`
});

// Typed pipe
const pipe = <T>(fn: T, ...fns: Array<(arg: T) => T>) =>
  (arg: T): T => fns.reduce((acc, f) => f(acc), typeof arg === 'function' ? fn() : fn);

const fancyCoffee: Coffee = pipe(
  coffee,
  withMilk,
  withSugar,
  withWhippedCream
);

console.log(fancyCoffee.cost); // 16
console.log(fancyCoffee.description); // "Coffee, Milk, Sugar, Whipped Cream"
```

---

### 8. Use Factory Pattern via ADT discrimination

Create objects based on type discriminators—functional alternative to switch statements.

```typescript
// ❌ WRONG - Switch-based factory
class DatabaseFactory {
  static createConnection(config: unknown): Connection {
    switch ((config as Config).type) {
      case 'postgres':
        return new PostgresConnection(config);
      case 'mysql':
        return new MySQLConnection(config);
    }
  }
}

// ✅ RIGHT - ADT with discrimination
type ConnectionType = 'postgres' | 'mysql' | 'mongo';

interface BaseConfig {
  type: ConnectionType;
}

interface PostgresConfig extends BaseConfig {
  type: 'postgres';
  host: string;
  port: number;
}

interface MySQLConfig extends BaseConfig {
  type: 'mysql';
  host: string;
  port: number;
}

interface MongoConfig extends BaseConfig {
  type: 'mongo';
  url: string;
}

type ConnectionConfig = PostgresConfig | MySQLConfig | MongoConfig;

interface Connection {
  readonly type: ConnectionType;
  query: (sql: string) => string;
}

type ConnectionCreator<T extends BaseConfig> = (config: T) => Connection;

const createConnection = <T extends ConnectionConfig>(config: T): Connection => {
  const creators: Record<ConnectionType, ConnectionCreator<BaseConfig>> = {
    postgres: (cfg: PostgresConfig): Connection => ({
      type: 'postgres',
      host: cfg.host,
      port: cfg.port,
      query: (sql: string): string => `Postgres: ${sql}`
    }) as Connection,

    mysql: (cfg: MySQLConfig): Connection => ({
      type: 'mysql',
      host: cfg.host,
      port: cfg.port,
      query: (sql: string): string => `MySQL: ${sql}`
    }) as Connection,

    mongo: (cfg: MongoConfig): Connection => ({
      type: 'mongo',
      url: cfg.url,
      query: (filter: string): string => `Mongo: ${filter}`
    }) as Connection
  };

  const creator = creators[config.type];
  if (!creator) {
    throw new Error(`Unknown connection type: ${config.type}`);
  }

  return creator(config) as Connection;
};

// Usage - fully typed
const pgConn: Connection = createConnection({
  type: 'postgres',
  host: 'localhost',
  port: 5432
});
```

---

### 9. Apply Adapter Pattern via pure typed transformation functions

Transform typed data structures with pure functions—no adapter class wrapper.

```typescript
// ❌ WRONG - Class-based adapter
class PaymentGatewayAdapter {
  constructor(private gateway: LegacyGateway) {}

  process(details: PaymentDetails): PaymentResponse {
    return this.gateway.processPayment(
      details.amount,
      details.currency,
      details.card.number
    );
  }
}

// ✅ RIGHT - Pure typed adapter functions
interface PaymentDetails {
  amount: number;
  currency: string;
  card: {
    number: string;
    expiry: string;
    cvv: string;
  };
}

interface LegacyPaymentFormat {
  amount: number;
  currency: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

interface LegacyResponse {
  status: 'ok' | 'error';
  id: string;
  created_at: string;
}

interface PaymentResponse {
  success: boolean;
  transactionId: string;
  timestamp: string;
}

const toLegacyPaymentFormat = (details: PaymentDetails): LegacyPaymentFormat => ({
  amount: details.amount,
  currency: details.currency,
  cardNumber: details.card.number,
  expiry: details.card.expiry,
  cvv: details.card.cvv
});

const fromLegacyResponse = (response: LegacyResponse): PaymentResponse => ({
  success: response.status === 'ok',
  transactionId: response.id,
  timestamp: response.created_at
});

const processPayment = (
  gateway: { processPayment: (...args: unknown[]) => LegacyResponse },
  details: PaymentDetails
): PaymentResponse => {
  const legacy = toLegacyPaymentFormat(details);
  const response = gateway.processPayment(
    legacy.amount,
    legacy.currency,
    legacy.cardNumber
  );
  return fromLegacyResponse(response);
};

// Usage
const result: PaymentResponse = processPayment(legacyGateway, paymentDetails);
```

---

### 10. Use Proxy Pattern via typed higher-order functions

Wrap typed functions with cross-cutting concerns—caching, validation, logging.

```typescript
// ❌ WRONG - Class-based proxy
class CachedAPIProxy {
  private api: API;
  private cache: Map<string, unknown> = new Map();

  constructor(api: API) { this.api = api; }

  async fetchData(url: string): Promise<unknown> {
    if (this.cache.has(url)) {
      return this.cache.get(url);
    }
    const data = await this.api.fetchData(url);
    this.cache.set(url, data);
    return data;
  }
}

// ✅ RIGHT - Typed higher-order function wrappers
type AsyncFn<TArgs extends unknown[], TResult> = (...args: TArgs) => Promise<TResult>;

const withCache = <TArgs extends unknown[], TResult>(
  fn: AsyncFn<TArgs, TResult>,
  keyFn: (...args: TArgs) => string = JSON.stringify
): AsyncFn<TArgs, TResult> => {
  const cache = new Map<string, TResult>();

  return async (...args: TArgs): Promise<TResult> => {
    const key = keyFn(...args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = await fn(...args);
    cache.set(key, result);
    return result;
  };
};

const withValidation = <TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
  validator: (...args: TArgs) => boolean
): ((...args: TArgs) => TResult) => {
  return (...args: TArgs): TResult => {
    if (!validator(...args)) {
      throw new Error('Validation failed');
    }
    return fn(...args);
  };
};

const withLogging = <TArgs extends unknown[], TResult>(
  fn: AsyncFn<TArgs, TResult>,
  name: string = 'function'
): AsyncFn<TArgs, TResult> => {
  return async (...args: TArgs): Promise<TResult> => {
    console.log(`[TRACE] ${name} called with:`, args);
    const start = Date.now();
    try {
      const result = await fn(...args);
      console.log(`[TRACE] ${name} completed in ${Date.now() - start}ms`);
      return result;
    } catch (error) {
      console.log(`[ERROR] ${name} failed:`, error);
      throw error;
    }
  };
};

// Compose wrappers
interface User {
  id: number;
  name: string;
  email: string;
}

const fetchUser = async (id: number): Promise<User> => db.findUser(id);

const cachedFetchUser = withCache([fetchUser], (id) => `user:${id}`);
const validatedFetchUser = withValidation(
  cachedFetchUser,
  (id: number) => typeof id === 'number' && id > 0
);
const loggedFetchUser = withLogging(validatedFetchUser, 'fetchUser');
```

---

### 11. Apply Chain of Responsibility via typed function pipelines

Process data through a pipeline of typed pure functions.

```typescript
// ❌ WRONG - Class-based chain
abstract class Handler {
  setNext(handler: Handler): Handler { return handler; }
  abstract handle(request: Request): Response;
}

// ✅ RIGHT - Pipeline of typed functions
interface Request {
  headers?: { authorization?: string };
  body?: { email?: string };
  user?: unknown;
}

interface Response {
  status: 'success' | 'error';
  data?: unknown;
  error?: string;
}

type Middleware = (req: Request) => Promise<Request>;

const pipeAsync = <T>(...fns: Array<(arg: T) => Promise<T>>) =>
  (initial: T): Promise<T> =>
    fns.reduce((promise, fn) => promise.then(fn), Promise.resolve(initial));

// Typed middleware
const authenticate = async (request: Request): Promise<Request> => {
  const token = request.headers?.authorization;
  if (!token) {
    throw new Error('Unauthorized');
  }
  return { ...request, user: await verifyToken(token) };
};

const validate = async (request: Request): Promise<Request> => {
  if (!request.body?.email) {
    throw new Error('Email required');
  }
  return request;
};

const sanitize = async (request: Request): Promise<Request> => ({
  ...request,
  body: { ...request.body, email: request.body!.email!.trim().toLowerCase() }
});

const processRequest = async (request: Request): Promise<Response> => ({
  status: 'success',
  data: request.body
});

// Build pipeline
const handleRequest = pipeAsync(
  authenticate,
  validate,
  sanitize,
  processRequest
);

// Usage - fully typed
const result: Response = await handleRequest({
  headers: { authorization: 'Bearer token' },
  body: { email: '  TEST@test.com  ' }
});
```

---

### 12. Use Iterator Pattern via typed generator functions

Leverage typed ES6 generators for lazy iteration.

```typescript
// ❌ WRONG - Class-based iterator
class SongIterator {
  private position: number = 0;

  constructor(private songs: Song[]) {}

  hasNext(): boolean { return this.position < this.songs.length; }
  next(): Song { return this.songs[this.position++]; }
}

// ✅ RIGHT - Typed generator function
interface Song {
  title: string;
  duration: number;
  genre: string;
}

function* createIterator<T>(
  items: T[],
  filterFn?: (item: T) => boolean
): Generator<T> {
  for (const item of items) {
    if (!filterFn || filterFn(item)) {
      yield item;
    }
  }
}

// Composable typed generators
function* take<T>(iterable: Iterable<T>, n: number): Generator<T> {
  let count = 0;
  for (const item of iterable) {
    if (count >= n) break;
    yield item;
    count++;
  }
}

function* map<T, U>(iterable: Iterable<T>, fn: (item: T) => U): Generator<U> {
  for (const item of iterable) {
    yield fn(item);
  }
}

function* filter<T>(iterable: Iterable<T>, predicate: (item: T) => boolean): Generator<T> {
  for (const item of iterable) {
    if (predicate(item)) {
      yield item;
    }
  }
}

// Usage - lazy evaluation with types
const songs: Song[] = [
  { title: 'Song 1', duration: 180, genre: 'rock' },
  { title: 'Song 2', duration: 200, genre: 'pop' },
  { title: 'Song 3', duration: 160, genre: 'rock' }
];

const rockSongs = filter(songs, s => s.genre === 'rock');
const shortSongs = filter(rockSongs, s => s.duration < 170);
const titles = map(shortSongs, s => s.title);
const firstThree = take(titles, 3);

console.log([...firstThree]); // ['Song 3']
```

---

### 13. Apply Template Method via higher-order functions with types

Pass algorithm steps as typed functions—no inheritance needed.

```typescript
// ❌ WRONG - Class-based template method
abstract class ReportGenerator {
  generate(data: unknown[]): void {
    this.formatData(data);
    this.createReport(data);
    this.save(this.getFilename());
  }

  abstract createReport(data: unknown[]): void;
  abstract getFilename(): string;
}

class CSVReportGenerator extends ReportGenerator {
  createReport(data: unknown[]): void { this.generateCSV(data); }
  getFilename(): string { return 'report.csv'; }
}

// ✅ RIGHT - Higher-order template function with types
interface ReportOptions<T, R> {
  format: (data: T[]) => R;
  create: (formatted: R) => string;
  save: (content: string) => Promise<{ saved: boolean; location?: string }>;
}

const generateReport = async <T, R>(
  data: T[],
  options: ReportOptions<T, R>
): Promise<{ saved: boolean; location?: string }> => {
  const formatted = options.format(data);
  const report = options.create(formatted);
  return options.save(report);
};

// Typed format functions
const formatCSV = <T extends unknown[]>(data: T): string =>
  data.map(row => Array.isArray(row) ? row.join(',') : String(row)).join('\n');

const formatJSON = <T>(data: T[]): string => JSON.stringify(data, null, 2);

// Typed create functions
const createCSV = (formatted: string): string => formatted;
const createJSON = (formatted: string): string => formatted;

// Typed save functions
const saveToFile = (filename: string) =>
  async (content: string): Promise<{ saved: boolean; location?: string }> => {
    await fs.writeFile(filename, content);
    return { saved: true, location: filename };
  };

const saveToS3 = (bucket: string) =>
  async (content: string): Promise<{ saved: boolean; location?: string }> => {
    await s3.upload(bucket, content);
    return { saved: true, location: `${bucket}/report` };
  };

// Compose with full type safety
const generateCSVReport = <T,>(data: T[], filename: string) =>
  generateReport<T, string>(data, {
    format: formatCSV,
    create: createCSV,
    save: saveToFile(filename)
  });

const generateJSONReportToS3 = <T,>(data: T[], bucket: string) =>
  generateReport<T, string>(data, {
    format: formatJSON,
    create: createJSON,
    save: saveToS3(bucket)
  });
```

---

### 14. Use Repository Pattern via typed data access functions

Separate data access logic into composable typed functions.

```typescript
// ❌ WRONG - Class-based repository
abstract class BaseRepository<T> {
  constructor(protected tableName: string) {}
  findById(id: number): Promise<T> { return db.query(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]); }
}

class UserRepository extends BaseRepository<User> {
  constructor() { super('users'); }
  findByEmail(email: string): Promise<User> { return db.query('SELECT * FROM users WHERE email = ?', [email]); }
}

// ✅ RIGHT - Functional repository with types
interface Repository<T> {
  findById: (id: number) => Promise<T>;
  findAll: () => Promise<T[]>;
  save: (data: Partial<T>) => Promise<T>;
  update: (id: number, data: Partial<T>) => Promise<T>;
  delete: (id: number) => Promise<boolean>;
}

const createRepository = <T extends { id: number }>(tableName: string): Repository<T> => ({
  findById: (id: number): Promise<T> =>
    db.query(`SELECT * FROM ${tableName} WHERE id = ?`, [id]),
  findAll: (): Promise<T[]> =>
    db.query(`SELECT * FROM ${tableName}`),
  save: (data: Partial<T>): Promise<T> =>
    db.query(`INSERT INTO ${tableName} SET ?`, data),
  update: (id: number, data: Partial<T>): Promise<T> =>
    db.query(`UPDATE ${tableName} SET ? WHERE id = ?`, [data, id]),
  delete: (id: number): Promise<boolean> =>
    db.query(`DELETE FROM ${tableName} WHERE id = ?`, [id])
});

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
}

interface UserRepository extends Repository<User> {
  findByEmail: (email: string) => Promise<User>;
  findByUsername: (username: string) => Promise<User>;
  search: (query: string) => Promise<User[]>;
}

const userRepo: UserRepository = {
  ...createRepository<User>('users'),
  findByEmail: (email: string): Promise<User> =>
    db.query('SELECT * FROM users WHERE email = ?', [email]),
  findByUsername: (username: string): Promise<User> =>
    db.query('SELECT * FROM users WHERE username = ?', [username]),
  search: (query: string): Promise<User[]> =>
    db.query('SELECT * FROM users WHERE name LIKE ?', [`%${query}%`])
};

// Higher-level query builders
const where = <T,>(
  repo: Repository<T>,
  condition: (item: T) => boolean
): Repository<T> => ({
  ...repo,
  findAll: (): Promise<T[]> =>
    repo.findAll().then(rows => rows.filter(condition))
});

const orderBy = <T,>(
  repo: Repository<T>,
  fn: (a: T, b: T) => number
): Repository<T> => ({
  ...repo,
  findAll: (): Promise<T[]> =>
    repo.findAll().then(rows => [...rows].sort(fn))
});

// Compose
const activeUsers = where(userRepo, (user: User) => user.email.includes('@'));
const sortedUsers = orderBy(activeUsers, (a: User, b: User) =>
  a.name.localeCompare(b.name)
);
```

---

### 15. Apply Dependency Injection via typed partial application

Partially apply typed functions with dependencies.

```typescript
// ❌ WRONG - Class-based DI
class OrderService {
  constructor(
    private db: Database,
    private email: EmailService,
    private logger: Logger
  ) {}

  processOrder(order: Order): void {
    this.db.save(order);
    this.email.sendConfirmation(order);
    this.logger.info('Order processed');
  }
}

// ✅ RIGHT - Typed partial application
interface OrderProcessDeps {
  db: { save: (order: Order) => void };
  email: { sendConfirmation: (order: Order) => void };
  logger: { info: (msg: string, meta?: unknown) => void };
}

type ProcessOrder = (deps: OrderProcessDeps) => (order: Order) => Promise<void>;

const processOrder: ProcessOrder = (deps) => async (order) => {
  await deps.db.save(order);
  await deps.email.sendConfirmation(order);
  deps.logger.info('Order processed', { orderId: order.id });
};

// Inject dependencies once, reuse with type inference
const deps: OrderProcessDeps = {
  db: database,
  email: emailService,
  logger: logger
};

const processOrderWithDeps = processOrder(deps);

// Or using curried type
type CurriedProcessOrder =
  (db: Database) =>
  (email: EmailService) =>
  (logger: Logger) =>
  (order: Order) => void;

const curriedProcessOrder: CurriedProcessOrder =
  (db) => (email) => (logger) => (order) => {
    db.save(order);
    email.sendConfirmation(order);
    logger.info('Order processed', { orderId: order.id });
  };

// Testing - inject mocks with full type safety
const mockDeps: OrderProcessDeps = {
  db: mockDb,
  email: mockEmail,
  logger: mockLogger
};

const mockProcessOrder = processOrder(mockDeps);
```

---

### 16. Use Middleware Pattern via typed function composition

Compose request handlers through typed middleware pipeline.

```typescript
// ❌ WRONG - Class-based middleware stack
class App {
  private middleware: MiddlewareFn[] = [];
  use(fn: MiddlewareFn): this { this.middleware.push(fn); return this; }
  handle(req: Request): Response { /* complex index management */ }
}

// ✅ RIGHT - Functional middleware pipeline with types
interface Request {
  method: string;
  path: string;
  headers?: { authorization?: string };
  body?: unknown;
  user?: unknown;
}

interface Response {
  status: (code: number) => Response;
  json: (data: unknown) => void;
}

type Next = () => void | Promise<void>;
type MiddlewareFn = (req: Request, res: Response, next: Next) => void | Promise<void>;
type HandlerFn = (req: Request, res: Response) => void | Promise<void>;

const compose = (...middlewares: MiddlewareFn[]) =>
  (handle: HandlerFn): MiddlewareFn =>
    async (req: Request, res: Response): Promise<void> => {
      let index = -1;

      const dispatch = (i: number): Next => async (): Promise<void> => {
        if (i <= index) {
          throw new Error('next() called multiple times');
        }
        index = i;

        const fn = middlewares[i];
        if (!fn) {
          return handle(req, res);
        }

        await fn(req, res, dispatch(i + 1));
      };

      await dispatch(0)();
    };

// Typed middleware
const withLogging: MiddlewareFn = (req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  return next();
};

const withAuth: MiddlewareFn = (req, res, next) => {
  const token = req.headers?.authorization;
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = verifyToken(token);
  return next();
};

interface Schema {
  validate: (data: unknown) => { error?: Error; value: unknown };
}

const withValidation = (schema: Schema): MiddlewareFn =>
  (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    req.body = value;
    return next();
  };

// Typed handler
const handleRequest: HandlerFn = (req, res) => {
  res.json({ success: true, user: req.user });
};

// Build app with full type safety
const app = compose(
  withLogging,
  withAuth,
  withValidation(userSchema)
)(handleRequest);
```

---

### 17. Apply State Pattern via typed state machines

Represent state transitions as typed pure data.

```typescript
// ❌ WRONG - Class-based state pattern
class Order {
  private state: OrderState = new PendingState();
  setState(state: OrderState): void { this.state = state; }
  ship(): void { this.state.ship(this); }
}

// ✅ RIGHT - State machine as typed data
type OrderStateType = 'pending' | 'shipped' | 'delivered' | 'cancelled';

type OrderAction = 'ship' | 'deliver' | 'cancel';

interface TransitionResult {
  success: boolean;
  state: OrderStateType;
  error?: string;
}

// Type-safe state transitions
const OrderState: Record<string, OrderStateType> = {
  Pending: 'pending',
  Shipped: 'shipped',
  Delivered: 'delivered',
  Cancelled: 'cancelled'
};

const transitions: Record<OrderStateType, Partial<Record<OrderAction, OrderStateType>>> = {
  [OrderState.Pending]: {
    ship: OrderState.Shipped,
    cancel: OrderState.Cancelled
  },
  [OrderState.Shipped]: {
    deliver: OrderState.Delivered
  },
  [OrderState.Delivered]: {},
  [OrderState.Cancelled]: {}
};

const transition = (
  currentState: OrderStateType,
  action: OrderAction
): TransitionResult => {
  const validTransitions = transitions[currentState];
  if (!validTransitions) {
    return { success: false, error: 'Invalid state', state: currentState };
  }

  const nextState = validTransitions[action];
  if (!nextState) {
    return {
      success: false,
      error: `Cannot ${action} from ${currentState}`,
      state: currentState
    };
  }

  return { success: true, state: nextState };
};

// Type-safe state machine
interface StateMachine {
  state: OrderStateType;
  transition: (action: OrderAction) => TransitionResult;
}

const createStateMachine = (
  initialState: OrderStateType,
  transitionFn: (state: OrderStateType, action: OrderAction) => TransitionResult
): StateMachine => {
  return {
    state: initialState,
    transition: function(this: StateMachine, action: OrderAction): TransitionResult {
      const result = transitionFn(this.state, action);
      if (result.success) {
        this.state = result.state;
      }
      return result;
    }
  };
};

// Usage - fully typed
const order: StateMachine = createStateMachine(OrderState.Pending, transition);

console.log(order.transition('ship')); // { success: true, state: 'shipped' }
console.log(order.state); // 'shipped'
console.log(order.transition('deliver')); // { success: true, state: 'delivered' }
// order.transition('ship'); // Type error - can't ship from delivered
```

---

### 18. Use Builder Pattern via typed function chaining

Build complex objects through typed function chains.

```typescript
// ❌ WRONG - Class-based mutable builder
class QueryBuilder {
  private select: string = '*';
  private from: string = '';
  private where: string[] = [];

  select(columns: string): this { this.select = columns; return this; }
  from(table: string): this { this.from = table; return this; }
  build(): string { return `SELECT ${this.select} FROM ${this.from}`; }
}

// ✅ RIGHT - Immutable builder via typed functions
interface QueryState {
  select: string;
  from: string;
  where: string[];
  join: Array<{ table: string; on: string; type: string }>;
  orderBy: Array<{ column: string; direction: string }>;
  limit: number | null;
}

type QueryBuilder = {
  build: () => string;
  select: (columns: string | string[]) => QueryBuilder;
  from: (table: string) => QueryBuilder;
  where: (...conditions: string[]) => QueryBuilder;
  join: (table: string, on: string, type?: string) => QueryBuilder;
  orderBy: (column: string, direction?: string) => QueryBuilder;
  limit: (count: number) => QueryBuilder;
};

const createQueryBuilder = (): QueryBuilder => {
  const build = (state: QueryState): string => {
    let query = `SELECT ${state.select} FROM ${state.from}`;

    if (state.where.length > 0) {
      query += ` WHERE ${state.where.join(' AND ')}`;
    }

    if (state.join.length > 0) {
      query += ' ' + state.join.map(j =>
        `${j.type} JOIN ${j.table} ON ${j.on}`
      ).join(' ');
    }

    if (state.orderBy.length > 0) {
      query += ` ORDER BY ${state.orderBy.map(o => `${o.column} ${o.direction}`).join(', ')}`;
    }

    if (state.limit !== null) {
      query += ` LIMIT ${state.limit}`;
    }

    return query;
  };

  const initialState: QueryState = {
    select: '*',
    from: '',
    where: [],
    join: [],
    orderBy: [],
    limit: null
  };

  return {
    build: () => build(initialState),

    select: (columns: string | string[]): QueryBuilder => {
      const newState: QueryState = {
        ...initialState,
        select: Array.isArray(columns) ? columns.join(', ') : columns
      };
      return createQueryBuilderWithState(newState);
    },

    from: (table: string): QueryBuilder => {
      const newState: QueryState = { ...initialState, from: table };
      return createQueryBuilderWithState(newState);
    },

    where: (...conditions: string[]): QueryBuilder => {
      const newState: QueryState = {
        ...initialState,
        where: [...initialState.where, ...conditions]
      };
      return createQueryBuilderWithState(newState);
    },

    join: (table: string, on: string, type = 'INNER'): QueryBuilder => {
      const newState: QueryState = {
        ...initialState,
        join: [...initialState.join, { table, on, type }]
      };
      return createQueryBuilderWithState(newState);
    },

    orderBy: (column: string, direction = 'ASC'): QueryBuilder => {
      const newState: QueryState = {
        ...initialState,
        orderBy: [...initialState.orderBy, { column, direction }]
      };
      return createQueryBuilderWithState(newState);
    },

    limit: (count: number): QueryBuilder => {
      const newState: QueryState = { ...initialState, limit: count };
      return createQueryBuilderWithState(newState);
    }
  };
};

const createQueryBuilderWithState = (state: QueryState): QueryBuilder => {
  return {
    build: () => {
      let query = `SELECT ${state.select} FROM ${state.from}`;

      if (state.where.length > 0) {
        query += ` WHERE ${state.where.join(' AND ')}`;
      }

      if (state.join.length > 0) {
        query += ' ' + state.join.map(j =>
          `${j.type} JOIN ${j.table} ON ${j.on}`
        ).join(' ');
      }

      if (state.orderBy.length > 0) {
        query += ` ORDER BY ${state.orderBy.map(o => `${o.column} ${o.direction}`).join(', ')}`;
      }

      if (state.limit !== null) {
        query += ` LIMIT ${state.limit}`;
      }

      return query;
    },

    select: (columns: string | string[]): QueryBuilder => {
      const newState: QueryState = {
        ...state,
        select: Array.isArray(columns) ? columns.join(', ') : columns
      };
      return createQueryBuilderWithState(newState);
    },

    from: (table: string): QueryBuilder => {
      const newState: QueryState = { ...state, from: table };
      return createQueryBuilderWithState(newState);
    },

    where: (...conditions: string[]): QueryBuilder => {
      const newState: QueryState = {
        ...state,
        where: [...state.where, ...conditions]
      };
      return createQueryBuilderWithState(newState);
    },

    join: (table: string, on: string, type = 'INNER'): QueryBuilder => {
      const newState: QueryState = {
        ...state,
        join: [...state.join, { table, on, type }]
      };
      return createQueryBuilderWithState(newState);
    },

    orderBy: (column: string, direction = 'ASC'): QueryBuilder => {
      const newState: QueryState = {
        ...state,
        orderBy: [...state.orderBy, { column, direction }]
      };
      return createQueryBuilderWithState(newState);
    },

    limit: (count: number): QueryBuilder => {
      const newState: QueryState = { ...state, limit: count };
      return createQueryBuilderWithState(newState);
    }
  };
};

// Usage - fully typed chain
const query = createQueryBuilder()
  .from('users')
  .select(['name', 'email'])
  .where('age > 18')
  .where('status = "active"')
  .orderBy('name')
  .limit(10)
  .build();

console.log(query);
// SELECT name, email FROM users WHERE age > 18 AND status = "active" ORDER BY name ASC LIMIT 10
```

---

### 19. Apply Composite Pattern via typed recursive data structures

Use recursive typed functions to process tree structures.

```typescript
// ❌ WRONG - Class-based composite
abstract class EmployeeComponent {
  abstract getName(): string;
  abstract getSalary(): number;
}

class Employee extends EmployeeComponent {
  constructor(public name: string, public salary: number) { super(); }
  getName(): string { return this.name; }
  getSalary(): number { return this.salary; }
}

class Department extends EmployeeComponent {
  private components: EmployeeComponent[] = [];
  add(component: EmployeeComponent): void { this.components.push(component); }
  getSalary(): number { return this.components.reduce((sum, c) => sum + c.getSalary(), 0); }
}

// ✅ RIGHT - ADT with recursive functions
type OrgNode = EmployeeNode | DepartmentNode;

interface EmployeeNode {
  type: 'employee';
  name: string;
  salary: number;
}

interface DepartmentNode {
  type: 'department';
  name: string;
  components: OrgNode[];
}

const employee = (name: string, salary: number): EmployeeNode => ({
  type: 'employee',
  name,
  salary
});

const department = (name: string, ...components: OrgNode[]): DepartmentNode => ({
  type: 'department',
  name,
  components
});

// Type-safe recursive functions
const getName = (org: OrgNode): string => org.name;

const getSalary = (org: OrgNode): number => {
  if (org.type === 'employee') {
    return org.salary;
  }

  if (org.type === 'department') {
    return org.components.reduce((sum, child) => sum + getSalary(child), 0);
  }

  // Exhaustiveness check
  const _exhaustive: never = org;
  throw new Error(`Unknown type: ${_exhaustive}`);
};

const print = (org: OrgNode, indent: number = 0): void => {
  const prefix = '  '.repeat(indent);

  if (org.type === 'employee') {
    console.log(`${prefix}Employee: ${org.name}, Salary: $${org.salary}`);
  } else if (org.type === 'department') {
    console.log(`${prefix}Department: ${org.name}`);
    org.components.forEach(child => print(child, indent + 1));
  }
};

const filterEmployees = (
  org: OrgNode,
  predicate: (emp: EmployeeNode) => boolean
): EmployeeNode[] => {
  if (org.type === 'employee') {
    return predicate(org) ? [org] : [];
  }

  if (org.type === 'department') {
    return org.components.flatMap(child => filterEmployees(child, predicate));
  }

  const _exhaustive: never = org;
  return [];
};

// Build tree with type safety
const engineering: DepartmentNode = department(
  'Engineering',
  department('Frontend',
    employee('Alice', 100000),
    employee('Bob', 90000)
  ),
  department('Backend',
    employee('Charlie', 110000),
    employee('Diana', 105000)
  )
);

console.log(`Total Cost: $${getSalary(engineering)}`);
print(engineering);

const highEarners: EmployeeNode[] = filterEmployees(
  engineering,
  (emp): emp is EmployeeNode => emp.salary > 100000
);
console.log('High earners:', highEarners.map(e => e.name));
```

---

### 20. Use Facade Pattern via typed function composition

Simplify complex subsystems with composed pure functions.

```typescript
// ❌ WRONG - Class-based facade
class NotificationFacade {
  constructor(
    private config: Config,
    private providerFactory: ProviderFactory,
    private formatter: Formatter,
    private validator: Validator
  ) {}

  send(userId: string, message: string, channel = 'email'): void {
    const user = this.getUser(userId);
    const cfg = this.config.getForChannel(channel);
    const provider = this.providerFactory.getProvider(channel);
    const formatted = this.formatter.format(message, cfg.template);

    if (!this.validator.validate(user, channel)) {
      throw new Error(`Invalid ${channel} for user`);
    }

    provider.send(user, formatted);
  }
}

// ✅ RIGHT - Functional facade via composition with types
interface User {
  id: string;
  email?: string;
  phone?: string;
  slack?: string;
}

interface NotificationConfig {
  template: string;
}

interface Provider {
  send: (user: User, formatted: string) => Promise<void>;
}

interface NotificationDeps {
  getUser: (id: string) => Promise<User>;
  getConfig: (channel: string) => NotificationConfig;
  getProvider: (channel: string) => Provider;
  formatMessage: (message: string, template: string) => string;
}

type NotificationChannel = 'email' | 'phone' | 'slack';

const validateRecipient = (user: User, channel: NotificationChannel): boolean => {
  switch (channel) {
    case 'email':
      return !!user.email;
    case 'phone':
      return !!user.phone;
    case 'slack':
      return !!user.slack;
    default:
      const _exhaustive: never = channel;
      return false;
  }
};

const sendViaProvider = (provider: Provider) =>
  async (user: User, formatted: string): Promise<void> => {
    await provider.send(user, formatted);
  };

// Build typed facade via composition
const sendNotification = (deps: NotificationDeps) =>
  async (userId: string, message: string, channel: NotificationChannel = 'email'): Promise<void> => {
    const user = await deps.getUser(userId);

    if (!validateRecipient(user, channel)) {
      throw new Error(`Invalid ${channel} for user`);
    }

    const config = deps.getConfig(channel);
    const formatted = deps.formatMessage(message, config.template);
    const provider = deps.getProvider(channel);

    await sendViaProvider(provider)(user, formatted);
  };

// Dependencies as injectable object
const notificationDeps: NotificationDeps = {
  getUser: async (id: string): Promise<User> => db.findUser(id),
  getConfig: (channel: string): NotificationConfig => ({ /* fetch config */ template: '...' }),
  getProvider: (channel: string): Provider => ({ /* get provider */ send: async () => {} }),
  formatMessage: (message: string, template: string): string => `${message} - ${template}`
};

const notify = sendNotification(notificationDeps);

// Usage - fully typed
await notify('123', 'Welcome!', 'email');
// await notify('123', 'Welcome!', 'invalid'); // Type error
```

---

### 21. Apply Lazy Evaluation via typed thunks and generators

Defer computation with full type safety.

```typescript
// ❌ WRONG - Eager evaluation
const processData = <T,>(data: T[]): ProcessedData<T> => {
  const step1 = expensiveStep1(data);      // Runs immediately
  const step2 = expensiveStep2(step1);     // Runs immediately
  const step3 = expensiveStep3(step2);     // Runs immediately
  return step3;
};

// ✅ RIGHT - Lazy via typed thunks
type Thunk<T> = () => T;

interface LazyProcessData<T> {
  getStep1: Thunk<Step1Result>;
  getStep2: Thunk<Step2Result>;
  getStep3: Thunk<ProcessedData<T>>;
}

const lazyProcessData = <T,>(data: T[]): LazyProcessData<T> => {
  const step1 = (): Step1Result => expensiveStep1(data);
  const step2 = (): Step2Result => expensiveStep2(step1());
  const step3 = (): ProcessedData<T> => expensiveStep3(step2());

  return {
    getStep1: step1,
    getStep2: step2,
    getStep3: step3  // Only executes when called
  };
};

// Or using typed generators for true laziness
function* processLazy<T>(data: T[]): Generator<Thunk<unknown>, ProcessedData<T>> {
  console.log('Starting...');
  const s1 = yield () => expensiveStep1(data);
  console.log('Step 1 complete');
  const s2 = yield () => expensiveStep2(s1);
  console.log('Step 2 complete');
  const s3 = yield () => expensiveStep3(s2);
  console.log('Step 3 complete');
  return s3;
}

const runGenerator = <T, R>(
  generator: Generator<Thunk<unknown>, R, unknown>
): R => {
  const { value, done } = generator.next();
  if (done) return value as R;
  const result = value(); // Execute thunk
  return runGenerator(generator);
};

// Infinite typed sequences
function* naturalNumbers(): Generator<number, never, number> {
  let n: number = 1;
  while (true) {
    yield n++;
  }
}

function* takeWhile<T>(
  generator: Generator<T>,
  predicate: (value: T) => boolean
): Generator<T> {
  for (const value of generator) {
    if (!predicate(value)) break;
    yield value;
  }
}

function* map<T, U>(
  iterable: Iterable<T>,
  fn: (item: T) => U
): Generator<U> {
  for (const item of iterable) {
    yield fn(item);
  }
}

// Lazy infinite sequence with types
const numbers = naturalNumbers();
const smallNumbers = takeWhile(numbers, (n: number) => n < 10);
const squared = map(smallNumbers, (n: number) => n * n);

console.log([...squared]); // [1, 4, 9, 16, 25, 36, 49, 64, 81]
```

---

### 22. Use Memoization via typed higher-order functions

Cache function results with full type safety.

```typescript
// ❌ WRONG - Class-based memoization
class MemoizedFunction<TArgs extends unknown[], TResult> {
  private cache = new Map<string, TResult>();

  constructor(private fn: (...args: TArgs) => TResult) {}

  execute(...args: TArgs): TResult {
    const key = JSON.stringify(args);
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    const result = this.fn(...args);
    this.cache.set(key, result);
    return result;
  }
}

// ✅ RIGHT - Typed higher-order memoization
type AnyFn = (...args: unknown[]) => unknown;

const memoize = <
  TArgs extends unknown[],
  TResult
>(
  fn: (...args: TArgs) => TResult,
  keyFn: (...args: TArgs) => string = JSON.stringify
): ((...args: TArgs) => TResult) => {
  const cache = new Map<string, TResult>();

  return (...args: TArgs): TResult => {
    const key = keyFn(...args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

// Single-argument shortcut
const memoizeSingle = <T, TResult>(
  fn: (arg: T) => TResult
): ((arg: T) => TResult) => {
  const cache = new Map<T, TResult>();
  return (arg: T): TResult => {
    if (cache.has(arg)) {
      return cache.get(arg)!;
    }
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
};

// Fibonacci with recursive memoization - fully typed
const fib = memoize<number, number>((n: number): number => {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
});

console.log(fib(100)); // Fast!

// Async memoization with types
const memoizeAsync = <
  TArgs extends unknown[],
  TResult
>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyFn?: (...args: TArgs) => string
): ((...args: TArgs) => Promise<TResult>) => {
  const cache = new Map<string, Promise<TResult>>();

  return async (...args: TArgs): Promise<TResult> => {
    const key = keyFn ? keyFn(...args) : JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const promise = fn(...args);
    cache.set(key, promise);
    return promise;
  };
};

// LRU cache with types
const memoizeLRU = <
  TArgs extends unknown[],
  TResult
>(
  fn: (...args: TArgs) => TResult,
  maxSize = 100
): ((...args: TArgs) => TResult) => {
  const cache = new Map<string, TResult>();

  return (...args: TArgs): TResult => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      const value = cache.get(key)!;
      // Move to end (most recently used)
      cache.delete(key);
      cache.set(key, value);
      return value;
    }

    const result = fn(...args);
    cache.set(key, result);

    // Evict least recently used
    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  };
};

// WeakMap variant for garbage collection
const memoizeWeak = <T extends object, TResult>(
  fn: (arg: T) => TResult
): ((arg: T) => TResult) => {
  const cache = new WeakMap<T, TResult>();

  return (arg: T): TResult => {
    if (cache.has(arg)) {
      return cache.get(arg)!;
    }
    const result = fn(arg);
    cache.set(arg, result);
    return result;
  };
};
```

---

## Key TypeScript Advantages Over JavaScript

### 1. Discriminated Unions for ADTs
TypeScript's discriminated unions provide compile-time exhaustiveness checking:

```typescript
type Result<T, E> =
  | { tag: 'ok'; value: T }
  | { tag: 'error'; error: E };

const handleResult = <T, E>(result: Result<T, E>): string => {
  switch (result.tag) {
    case 'ok':
      return `Success: ${result.value}`;
    case 'error':
      return `Error: ${result.error}`;
    // No default needed - TypeScript ensures exhaustiveness
  }
};
```

### 2. Generic Higher-Order Functions
Type parameters preserve type information through function composition:

```typescript
const map = <T, U>(fn: (item: T) => U) =>
  (array: T[]): U[] =>
    array.map(fn);

const double = (n: number): number => n * 2;
const numbers: number[] = [1, 2, 3];
const doubled: number[] = map(double)(numbers); // Type: number[]
```

### 3. Readonly Interfaces
Immutable data structures enforced at compile time:

```typescript
interface ReadonlyUser {
  readonly id: number;
  readonly name: string;
  readonly email: string;
}

const updateUser = (user: ReadonlyUser): ReadonlyUser => ({
  ...user,
  name: 'New Name' // Spreading creates new object
});
```

### 4. Branded Types for Domain Primitives
Prevent primitive obsession with branded types:

```typescript
type UserId = string & { readonly __brand: unique symbol };
type Email = string & { readonly __brand: unique symbol };

const createUserId = (id: string): UserId => id as UserId;
const createEmail = (email: string): Email => email as Email;

const getUser = (id: UserId): User => { /* ... */ };

const email: Email = createEmail('test@test.com');
// getUser(email); // Type error - Email is not UserId
```

### 5. Template Literal Types for String Validation
Encode validation rules in the type system:

```typescript
type EmailAddress = `${string}@${string}.${string}`;

const validateEmail = (email: string): EmailAddress => {
  if (!email.includes('@')) throw new Error('Invalid email');
  return email as EmailAddress;
};

const sendEmail = (to: EmailAddress): void => { /* ... */ };
```

### 6. Utility Types for Immutable Updates
TypeScript's built-in utility types simplify functional patterns:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

// Update specific fields
type UserUpdate = Partial<Pick<User, 'name' | 'email'>>;

const updateUser = (id: number, updates: UserUpdate): User => ({
  ...existingUser,
  ...updates
});

// Readonly version
type ReadonlyUser = Readonly<User>;

// Make specific fields required
type RequiredUser = Required<Pick<User, 'id' | 'email'>> & Partial<Omit<User, 'id' | 'email'>>;
```

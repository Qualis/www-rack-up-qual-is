---
name: Self-Documenting Code Refactorer
description: This skill should be used when the user asks to "remove comments", "make code self-documenting", "refactor to eliminate comments", "improve code clarity", "make this clearer without comments", or mentions the no-comments rule. This skill helps refactor code to be self-explanatory through expressive naming instead of comments.
version: 1.0.0
---

# Self-Documenting Code Refactorer

## Overview

This project has a **strict NO COMMENTS policy**. All code must be self-documenting through expressive naming and clear structure. This skill guides you through identifying comments and refactoring code to eliminate the need for them.

## Core Principle

> "Code should be so clear that comments are unnecessary. If you need a comment, refactor the code to be clearer instead."

## When to Use This Skill

Use this skill when:
- You find comments in code that explain what or why
- Code needs clarification but you're tempted to add a comment
- Reviewing code for the no-comments policy
- Refactoring unclear code to be self-explanatory

## The NO COMMENTS Rule

### Absolutely Forbidden
- Implementation comments explaining what code does (`//` or `/* */`)
- TODO comments
- Inline explanations
- Block comments describing logic
- Commented-out code
- JSDoc comments (the project prefers self-documenting code)

### The Only Exception
- None. This project does not use JSDoc or any form of comments.

## Refactoring Strategies

### Strategy 1: Extract to Well-Named Function

**Before (with comment):**
```typescript
function processOrder(order: Order): number {
  // Calculate total with tax
  const subtotal = order.items.reduce((sum, item) => sum + item.price, 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax;
  return total;
}
```

**After (self-documenting):**
```typescript
function processOrder(order: Order): number {
  return calculateOrderTotalWithTax(order);
}

function calculateOrderTotalWithTax(order: Order): number {
  const subtotal = calculateSubtotal(order);
  const tax = calculateTax(subtotal);
  return subtotal + tax;
}

function calculateSubtotal(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.price, 0);
}

function calculateTax(subtotal: number): number {
  const TAX_RATE = 0.08;
  return subtotal * TAX_RATE;
}
```

**Key Insight:** The function name explains what the code does better than any comment.

### Strategy 2: Expressive Variable Names

**Before (with comment):**
```typescript
function getUsers(db: Database): User[] {
  // Only active users in last 30 days
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const users = db.query(User).filter(
    (user) => user.lastLogin > cutoff && user.active
  );
  return users;
}
```

**After (self-documenting):**
```typescript
function getRecentlyActiveUsers(db: Database): User[] {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const usersActiveInLastThirtyDays = db.query(User).filter(
    (user) => user.lastLogin > thirtyDaysAgo && user.active
  );
  return usersActiveInLastThirtyDays;
}
```

**Key Insight:** Variable names carry the information that was in the comment.

### Strategy 3: Boolean Variable for Complex Conditions

**Before (with comment):**
```typescript
function canProcess(order: Order): boolean {
  // Check if order is valid, paid, and in stock
  if (order.items.length > 0 && order.paymentStatus === "paid" && order.items.every((item) => item.inStock)) {
    return true;
  }
  return false;
}
```

**After (self-documenting):**
```typescript
function canProcess(order: Order): boolean {
  const orderHasItems = order.items.length > 0;
  const paymentIsComplete = order.paymentStatus === "paid";
  const allItemsInStock = order.items.every((item) => item.inStock);

  const orderIsReadyForProcessing =
    orderHasItems &&
    paymentIsComplete &&
    allItemsInStock;

  return orderIsReadyForProcessing;
}
```

**Key Insight:** Break complex conditions into named boolean variables.

### Strategy 4: Extract Magic Numbers to Named Constants

**Before (with comment):**
```typescript
function calculateDiscount(amount: number): number {
  // 15% discount for premium customers
  return amount * 0.85;
}
```

**After (self-documenting):**
```typescript
function calculatePremiumCustomerDiscount(amount: number): number {
  const PREMIUM_DISCOUNT_RATE = 0.15;
  const discountMultiplier = 1 - PREMIUM_DISCOUNT_RATE;
  return amount * discountMultiplier;
}
```

**Key Insight:** Named constants and descriptive function names replace comments.

### Strategy 5: Small, Single-Purpose Functions

**Before (with comment):**
```typescript
function handleUserRequest(user: User, request: Request): Result {
  // Validate user permissions
  if (!user.hasPermission("admin")) {
    throw new PermissionError();
  }

  // Log the request
  logger.info(`User ${user.id} made request`);

  // Process the request
  const result = process(request);

  // Update metrics
  metrics.increment("requests_processed");

  return result;
}
```

**After (self-documenting):**
```typescript
function handleUserRequest(user: User, request: Request): Result {
  ensureUserHasAdminPermission(user);
  logUserRequest(user);
  const result = process(request);
  incrementRequestMetrics();
  return result;
}

function ensureUserHasAdminPermission(user: User): void {
  if (!user.hasPermission("admin")) {
    throw new PermissionError("Admin permission required");
  }
}

function logUserRequest(user: User): void {
  logger.info(`User ${user.id} made request`);
}

function incrementRequestMetrics(): void {
  metrics.increment("requests_processed");
}
```

**Key Insight:** Each section becomes a well-named function that documents itself.

## Refactoring Process

### Step 1: Identify Comments

Scan code for:
- Lines starting with `//`
- Multi-line comments with `/* */`
- TODO, FIXME, HACK, NOTE markers
- Commented-out code blocks
- JSDoc comments (`/** */`)

### Step 2: Understand the Comment's Purpose

Ask yourself:
- **What does this comment explain?** (The behavior/logic)
- **Why does this code need explanation?** (Too complex? Unclear naming?)
- **What information does the comment provide?** (Business rule? Edge case? Calculation?)

### Step 3: Choose Refactoring Strategy

Based on the comment type:

| Comment Type | Refactoring Strategy |
|--------------|---------------------|
| Explains what code does | Extract to well-named function |
| Describes complex logic | Break into smaller functions with descriptive names |
| Clarifies variable purpose | Rename variable to be more descriptive |
| Explains magic number | Extract to named constant |
| Describes condition | Extract to boolean variable with descriptive name |
| Documents algorithm | Use algorithm name in function name |
| Explains business rule | Encode rule in function/variable names |

### Step 4: Refactor

Apply the chosen strategy:
1. Extract code to new function/variable/constant
2. Give it a descriptive, self-explanatory name
3. Remove the comment
4. Verify tests still pass

### Step 5: Verify Self-Documentation

Ask yourself:
- Can I understand what this code does without comments?
- Are function names action-oriented and specific?
- Are variable names descriptive enough?
- Are complex conditions broken down?
- Would a new developer understand this code?

If yes to all, the refactoring is complete.

## Naming Conventions

### Functions
- Use verb phrases: `calculateTotal`, `validateUser`, `sendEmail`
- Be specific: `getActiveUsersFromLastMonth` > `getUsers`
- Include business context: `applyPremiumDiscount` > `applyDiscount`

### Variables
- Use descriptive nouns: `activeUserCount` > `count`
- Include units: `timeoutInSeconds` > `timeout`
- Express purpose: `usersEligibleForDiscount` > `users`

### Constants
- Use UPPER_CASE: `MAX_RETRY_ATTEMPTS = 3`
- Be explicit: `DEFAULT_PAGE_SIZE = 20` > `DEFAULT = 20`
- Include context: `PREMIUM_DISCOUNT_PERCENTAGE = 15`

### Boolean Variables
- Use predicates: `isValid`, `hasPermission`, `canProcess`
- Be affirmative: `isActive` > `isNotInactive`
- Express state: `userIsAuthenticated` > `authenticated`

## Common Refactoring Patterns

### Pattern 1: Comment Explaining "Why"

**Before:**
```typescript
// We need to wait 5 seconds because the external API has rate limiting
await sleep(5000);
```

**After:**
```typescript
const EXTERNAL_API_RATE_LIMIT_DELAY_MS = 5000;

async function waitForApiRateLimit(): Promise<void> {
  await sleep(EXTERNAL_API_RATE_LIMIT_DELAY_MS);
}

await waitForApiRateLimit();
```

### Pattern 2: Comment Listing Steps

**Before:**
```typescript
async function checkout(cart: Cart): Promise<void> {
  // 1. Validate cart
  // 2. Calculate total
  // 3. Process payment
  // 4. Send confirmation
}
```

**After:**
```typescript
async function checkout(cart: Cart): Promise<void> {
  validateCart(cart);
  const total = calculateCartTotal(cart);
  await processPayment(total);
  await sendOrderConfirmation();
}
```

### Pattern 3: Comment for Complex Condition

**Before:**
```typescript
// User can edit if they're the owner or an admin and the document isn't locked
if ((user.id === doc.ownerId || user.role === "admin") && !doc.isLocked) {
  allowEdit();
}
```

**After:**
```typescript
const userIsOwner = user.id === doc.ownerId;
const userIsAdmin = user.role === "admin";
const documentIsUnlocked = !doc.isLocked;

const userCanEditDocument =
  (userIsOwner || userIsAdmin) &&
  documentIsUnlocked;

if (userCanEditDocument) {
  allowEdit();
}
```

### Pattern 4: Comment for Algorithm

**Before:**
```typescript
// Binary search implementation
function search(arr: number[], target: number): number {
  let left = 0;
  let right = arr.length - 1;
  // ... implementation
}
```

**After:**
```typescript
function binarySearch(sortedArray: number[], targetValue: number): number {
  let leftBoundary = 0;
  let rightBoundary = sortedArray.length - 1;
  return findTargetWithBinarySearch(sortedArray, targetValue, leftBoundary, rightBoundary);
}
```

## Warning Signs Code Needs Refactoring

If you find yourself wanting to add comments for these reasons, refactor instead:

1. **"This is a workaround for..."** -> Create `workaroundForX` function
2. **"This calculates..."** -> Function name should say what it calculates
3. **"Loop through and..."** -> Extract loop to `processEachX` function
4. **"Check if..."** -> Extract to `isX` or `hasY` function
5. **"Initialize..."** -> Use `createX` or `buildY` function
6. **"Clean up..."** -> Extract to `cleanupX` function
7. **"Handle edge case where..."** -> Extract to `handleEdgeCaseX` function

## Code Review Checklist

When reviewing code for the no-comments policy:

- [ ] Zero comments exist in code (no `//`, `/* */`, or `/** */`)
- [ ] Function names clearly describe what they do
- [ ] Variable names clearly describe what they contain
- [ ] Complex conditions are broken into named booleans
- [ ] Magic numbers are extracted to named constants
- [ ] Each function does one thing
- [ ] Business logic is encoded in names, not comments
- [ ] Code reads like well-written prose

## Examples from This Project

### Good: Repository Port Interface (No Comments Needed)

```typescript
export interface IPostRepository {
  getAllSlugs(): string[];
  getRawPostData(slug: string): RawPostData;
}
```

The code is self-explanatory. No comments needed.

### Good: Use Case (Clear Intent)

```typescript
export class GetPostNavigationUseCase {
  constructor(private readonly postRepository: IPostRepository) {}

  execute(slug: string): PostNavigation {
    const allPosts = this.postRepository.getAllSlugs();
    const currentIndex = allPosts.findIndex((post) => post === slug);
    return this.buildNavigation(allPosts, currentIndex);
  }
}
```

Function and class names make the purpose obvious.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Obvious Comments

```typescript
// Increment counter
counter += 1;

// Return the result
return result;
```

These comments state what the code obviously does. Just remove them.

### Anti-Pattern 2: Commented-Out Code

```typescript
function process(): void {
  doSomething();
  // oldMethod();
  // alternativeApproach();
}
```

Use version control (git) for code history. Delete commented code.

### Anti-Pattern 3: TODO Comments

```typescript
// TODO: Add error handling
function riskyOperation(): void {
  // ...
}
```

Either implement it immediately or create a proper issue/ticket. Don't leave TODOs.

## Dealing with Truly Complex Logic

If logic is genuinely complex (algorithms, mathematical formulas):

1. **Use descriptive function name**: `calculateCompoundInterestWithMonthlyContributions`
2. **Break into smaller functions**: Each step becomes a function
3. **Use domain language**: Name functions after business concepts
4. **Extract constants**: Make formulas clear through named values

**Example:**
```typescript
function calculateCompoundInterestWithMonthlyContributions(
  principalAmount: number,
  annualInterestRate: number,
  years: number,
  monthlyContribution: number
): number {
  const numberOfCompoundingPeriodsPerYear = 12;
  const totalNumberOfPeriods = years * numberOfCompoundingPeriodsPerYear;

  const futureValueOfPrincipal = calculateCompoundInterest(
    principalAmount,
    annualInterestRate,
    numberOfCompoundingPeriodsPerYear,
    totalNumberOfPeriods
  );

  const futureValueOfContributions = calculateFutureValueOfSeries(
    monthlyContribution,
    annualInterestRate,
    numberOfCompoundingPeriodsPerYear,
    totalNumberOfPeriods
  );

  return futureValueOfPrincipal + futureValueOfContributions;
}
```

The formulas are still complex, but each piece is named and understandable.

## Tools for Detection

Use these tools to find comments:

```bash
# Find TypeScript/TSX single-line comments in source
grep -rn "^\s*//" src/ --include="*.ts" --include="*.tsx"

# Find block comments in TypeScript/TSX files
grep -rn "/\*" src/ --include="*.ts" --include="*.tsx"

# Find TODO/FIXME markers
grep -rn "TODO\|FIXME\|HACK" src/ --include="*.ts" --include="*.tsx"

# Count comments
grep -rn "^\s*//" src/ --include="*.ts" --include="*.tsx" | wc -l
```

Expected output: **0 comments**

## Remember

> "Any fool can write code that a computer can understand. Good programmers write code that humans can understand."
> — Martin Fowler

In this project, we take it further: write code so clear that comments become redundant.

## References

See the `references/` directory for:
- Before/after refactoring examples
- Common naming patterns
- Project code examples without comments

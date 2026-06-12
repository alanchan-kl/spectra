import { faker } from '@faker-js/faker';
import type { Order, OrderItem, Post, User } from '../types/index';

/**
 * Build a realistic, typed {@link User}. Pass `overrides` to pin specific
 * fields (e.g. a known username for a login test).
 */
export function createUser(overrides: Partial<User> = {}): User {
  const firstName = overrides.firstName ?? faker.person.firstName();
  const lastName = overrides.lastName ?? faker.person.lastName();
  return {
    firstName,
    lastName,
    username: faker.internet.username({ firstName, lastName }).toLowerCase(),
    password: faker.internet.password({ length: 12, memorable: false }),
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    ...overrides,
  };
}

/** Build a single {@link OrderItem}. */
export function createOrderItem(overrides: Partial<OrderItem> = {}): OrderItem {
  const quantity = overrides.quantity ?? faker.number.int({ min: 1, max: 5 });
  const unitPrice =
    overrides.unitPrice ?? Number(faker.commerce.price({ min: 5, max: 200 }));
  return {
    sku: faker.string.alphanumeric(8).toUpperCase(),
    name: faker.commerce.productName(),
    quantity,
    unitPrice,
    ...overrides,
  };
}

/** Build an {@link Order} with a computed total. */
export function createOrder(overrides: Partial<Order> = {}): Order {
  const items =
    overrides.items ??
    Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () =>
      createOrderItem(),
    );
  const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  return {
    id: faker.string.uuid(),
    items,
    total: Number(total.toFixed(2)),
    currency: 'USD',
    ...overrides,
  };
}

/** Build a {@link Post} payload for the sample API tests. */
export function createPost(overrides: Partial<Post> = {}): Post {
  return {
    id: faker.number.int({ min: 1, max: 100 }),
    userId: faker.number.int({ min: 1, max: 10 }),
    title: faker.lorem.sentence(),
    body: faker.lorem.paragraph(),
    ...overrides,
  };
}

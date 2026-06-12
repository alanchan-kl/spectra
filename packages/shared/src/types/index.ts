/** A user account used across web, API, and mobile tests. */
export interface User {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
}

/** A line item within an order. */
export interface OrderItem {
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

/** An order, used by checkout/web and API tests. */
export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  currency: string;
}

/** Shape of a JSONPlaceholder post — used by the sample API tests. */
export interface Post {
  id: number;
  userId: number;
  title: string;
  body: string;
}

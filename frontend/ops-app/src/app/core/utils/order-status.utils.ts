import { OrderStatus } from '../models/restaurant.models';

const ORDER_STATUS_TO_VALUE: Record<OrderStatus, number> = {
  Pending: 0,
  Accepted: 1,
  Preparing: 2,
  ReadyForPickup: 3,
  Assigned: 4,
  PickedUp: 5,
  OnTheWay: 6,
  Delivered: 7,
  Cancelled: 8,
};

export function toOrderStatusValue(status: OrderStatus): number {
  return ORDER_STATUS_TO_VALUE[status];
}

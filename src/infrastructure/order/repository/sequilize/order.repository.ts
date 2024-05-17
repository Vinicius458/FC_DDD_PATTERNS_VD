import { where } from "sequelize";
import Order from "../../../../domain/checkout/entity/order";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import OrderRepositoryInterface from "../../../../domain/checkout/repository/order-repository.interface";

type ItemDB = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  product_id: string;
  order_id: string;
};

export default class OrderRepository implements OrderRepository {
  async create(entity: Order): Promise<void> {
    await OrderModel.create(
      {
        id: entity.id,
        customer_id: entity.customerId,
        total: entity.total,
        items: entity.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          product_id: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        include: [{ model: OrderItemModel }],
      }
    );
  }

  async findAll(): Promise<Order[]> {
    const orders = await OrderModel.findAll({
      include: [{ model: OrderItemModel }],
    });

    if (!orders || orders.length === 0) {
      throw new Error("Orders not found");
    }

    return orders.map(
      (order) =>
        new Order(
          order.id,
          order.customer_id,
          order.items.map(
            (item) =>
              new OrderItem(
                item.id,
                item.name,
                item.price,
                item.product_id,
                item.quantity
              )
          )
        )
    );
  }

  async find(id: string): Promise<Order> {
    const order = await OrderModel.findByPk(id, {
      include: [{ model: OrderItemModel }],
    });

    if (!order) {
      throw new Error("Order not found");
    }

    return new Order(
      order.id,
      order.customer_id,
      order.items.map(
        (item) =>
          new OrderItem(
            item.id,
            item.name,
            item.price,
            item.product_id,
            item.quantity
          )
      )
    );
  }

  async update(entity: Order): Promise<void> {
    await OrderModel.update(
      {
        customer_id: entity.customerId,
        total: entity.total,
      },
      { where: { id: entity.id } }
    );

    await this.updateOrderItems(entity);
  }

  async updateOrderItems(entity: Order): Promise<void> {
    const order = await OrderModel.findByPk(entity.id, {
      include: [{ model: OrderItemModel }],
    });

    const newItems = entity.items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      product_id: item.productId,
      order_id: entity.id,
    }));

    const oldItemsIds = order?.items
      .filter((item) => !newItems.find((newItem) => newItem.id === item.id))
      .map((item) => item.id);

    await this.removeItems(oldItemsIds);

    const newItemsIds = newItems.filter(
      (item) => !order?.items.find((oldItem) => oldItem.id === item.id)
    );
    await this.addItems(newItemsIds);

    const itemsToUpdate = newItems.filter((item) =>
      order?.items.find((oldItem) => oldItem.id === item.id)
    );

    await this.updateItems(itemsToUpdate);
  }

  async removeItems(ids: Array<string>): Promise<void> {
    await Promise.all(
      ids.map((id: string) =>
        OrderItemModel.destroy({
          where: { id: id },
        })
      )
    );
  }

  async addItems(items: ItemDB[]): Promise<void> {
    await Promise.all(items.map((item) => OrderItemModel.create(item)));
  }
  async updateItems(items: ItemDB[]): Promise<void> {
    await Promise.all(
      items.map((item) =>
        OrderItemModel.update(
          {
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            product_id: item.product_id,
            order_id: item.order_id,
          },
          {
            where: {
              id: item.id,
            },
          }
        )
      )
    );
  }
}

import { Sequelize } from "sequelize-typescript";
import Order from "../../../../domain/checkout/entity/order";
import OrderItem from "../../../../domain/checkout/entity/order_item";
import Customer from "../../../../domain/customer/entity/customer";
import Address from "../../../../domain/customer/value-object/address";
import Product from "../../../../domain/product/entity/product";
import CustomerModel from "../../../customer/repository/sequelize/customer.model";
import CustomerRepository from "../../../customer/repository/sequelize/customer.repository";
import ProductModel from "../../../product/repository/sequelize/product.model";
import ProductRepository from "../../../product/repository/sequelize/product.repository";
import OrderItemModel from "./order-item.model";
import OrderModel from "./order.model";
import OrderRepository from "./order.repository";

describe("Order repository test", () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({
      dialect: "sqlite",
      storage: ":memory:",
      logging: false,
      sync: { force: true },
    });

    await sequelize.addModels([
      CustomerModel,
      OrderModel,
      OrderItemModel,
      ProductModel,
    ]);
    await sequelize.sync();
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it("should create a new order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const order = new Order("123", "123", [orderItem]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total,
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
      ],
    });
  });

  it("Should update an order", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);

    const productRepository = new ProductRepository();
    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const product2 = new Product("133", "Product 2", 30);
    await productRepository.create(product2);
    const orderItem2 = new OrderItem(
      "2",
      product2.name,
      product2.price,
      product2.id,
      2
    );

    const order = new Order("123", "123", [orderItem, orderItem2]);

    const orderRepository = new OrderRepository();
    await orderRepository.create(order);

    const orderModel = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModel.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total,
      items: [
        {
          id: orderItem.id,
          name: orderItem.name,
          price: orderItem.price,
          quantity: orderItem.quantity,
          order_id: "123",
          product_id: "123",
        },
        {
          id: orderItem2.id,
          name: orderItem2.name,
          price: orderItem2.price,
          quantity: orderItem2.quantity,
          order_id: "123",
          product_id: "133",
        },
      ],
    });

    const product3 = new Product("143", "Product 3", 45);
    await productRepository.create(product3);
    const orderItem3 = new OrderItem(
      "3",
      product3.name,
      product3.price,
      product3.id,
      3
    );
    order.removeItem(orderItem.id);
    order.addItem(orderItem3);

    await orderRepository.update(order);

    const orderModelAfterUpdate = await OrderModel.findOne({
      where: { id: order.id },
      include: ["items"],
    });

    expect(orderModelAfterUpdate.toJSON()).toStrictEqual({
      id: "123",
      customer_id: "123",
      total: order.total,
      items: [
        {
          id: orderItem2.id,
          name: orderItem2.name,
          price: orderItem2.price,
          quantity: orderItem2.quantity,
          order_id: "123",
          product_id: "133",
        },
        {
          id: orderItem3.id,
          name: orderItem3.name,
          price: orderItem3.price,
          quantity: orderItem3.quantity,
          order_id: "123",
          product_id: "143",
        },
      ],
    });
  });

  it("Should find all orders", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);
    const productRepository = new ProductRepository();

    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const product2 = new Product("133", "Product 2", 30);
    await productRepository.create(product2);
    const orderItem2 = new OrderItem(
      "2",
      product2.name,
      product2.price,
      product2.id,
      2
    );

    const product3 = new Product("143", "Product 3", 45);
    await productRepository.create(product3);
    const orderItem3 = new OrderItem(
      "3",
      product3.name,
      product3.price,
      product3.id,
      3
    );

    const orderRepository = new OrderRepository();

    const order1 = new Order("123", "123", [orderItem, orderItem2]);
    await orderRepository.create(order1);

    const order2 = new Order("133", "123", [orderItem3]);
    await orderRepository.create(order2);

    const orders = await orderRepository.findAll();
    expect(orders).toHaveLength(2);
    expect(orders[0]).toStrictEqual(order1);
    expect(orders[1]).toStrictEqual(order2);
  });

  it("Should thrown an exception if not exists orders", async () => {
    const orderRepository = new OrderRepository();
    await expect(orderRepository.findAll()).rejects.toThrowError(
      "Orders not found"
    );
  });

  it("Should find an order by id", async () => {
    const customerRepository = new CustomerRepository();
    const customer = new Customer("123", "Customer 1");
    const address = new Address("Street 1", 1, "Zipcode 1", "City 1");
    customer.changeAddress(address);
    await customerRepository.create(customer);
    const productRepository = new ProductRepository();

    const product = new Product("123", "Product 1", 10);
    await productRepository.create(product);

    const orderItem = new OrderItem(
      "1",
      product.name,
      product.price,
      product.id,
      2
    );

    const product2 = new Product("133", "Product 2", 30);
    await productRepository.create(product2);
    const orderItem2 = new OrderItem(
      "2",
      product2.name,
      product2.price,
      product2.id,
      2
    );

    const product3 = new Product("143", "Product 3", 45);
    await productRepository.create(product3);
    const orderItem3 = new OrderItem(
      "3",
      product3.name,
      product3.price,
      product3.id,
      3
    );

    const orderRepository = new OrderRepository();

    const order1 = new Order("123", "123", [orderItem, orderItem2]);
    await orderRepository.create(order1);

    const order2 = new Order("133", "123", [orderItem3]);
    await orderRepository.create(order2);

    const order = await orderRepository.find(order2.id);
    expect(order).not.toBeNull();
    expect(order).toStrictEqual(order2);
  });
  it("should throw error when order not found", async () => {
    const orderRepository = new OrderRepository();
    await expect(orderRepository.find("123")).rejects.toThrowError(
      "Order not found"
    );
  });
});

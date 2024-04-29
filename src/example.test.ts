import { Collection, Entity, ManyToOne, MikroORM, OneToMany, PrimaryKey, Property, Ref, UuidType, types } from '@mikro-orm/sqlite';

abstract class BaseEntity {
  @PrimaryKey({
    type: types.uuid, // FAIL
    // type: UuidType - FAIL
    // type:'uuid' - PASS,
    onCreate: () => crypto.randomUUID()
  })
  id!: string
}

@Entity()
class Product extends BaseEntity {
  @Property()
  name!: string

  @Property()
  price!: number
}

@Entity()
class Order extends BaseEntity {
  @OneToMany(() => OrderItem, e => e.order)
  items!: Collection<OrderItem>
}


@Entity()
class OrderItem {
  @ManyToOne(() => Order, { primary: true, ref: true })
  order!: Ref<Order>

  @ManyToOne(() => Product, { primary: true, ref: true })
  product!: Ref<Product>

}

let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Product, Order, OrderItem],
    debug: ['query', 'query-params'],
    allowGlobalContext: true, // only for testing
  });
  await orm.schema.refreshDatabase();
});

afterAll(async () => {
  await orm.close(true);
});

test('basic CRUD example', async () => {
  const em = orm.em

  // Insert sample data
  const product = em.create(Product, { name: "Product 1", price: 100 })
  const order = em.create(Order, {});
  order.items.add(em.create(OrderItem, { order, product }))
  await em.flush();

  em.clear()

  // This fires 2 queries instead of one
  // First query fetches both OrderItem and Product via a join
  // So there's no need for an additional query to fetch products
  await em.find(OrderItem, {
    order: order.id
  }, {
    populate: ['product'],
  })
});

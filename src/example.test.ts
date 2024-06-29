import { Entity, MikroORM, PrimaryKey, Property, raw, sql } from '@mikro-orm/sqlite';

@Entity()
class Product {
  @PrimaryKey()
  id!: number

  @Property()
  name!: string

  @Property()
  price!: number
}


let orm: MikroORM;

beforeAll(async () => {
  orm = await MikroORM.init({
    dbName: ':memory:',
    entities: [Product],
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
  let product = em.create(Product, { name: "Product 1", price: 100 })

  await em.flush();

  em.clear()

  product = await em.findOne(Product, product.id);
  product.price = raw(`price + 1`);
  await em.flush();

  product = await em.fork().findOne(Product, product.id)

  expect(product.price).toBe(101);
});

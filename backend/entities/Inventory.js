const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Inventory',
  tableName: 'inventory',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
    },
    productId: {
      type: 'int',
      nullable: false,
    },
    storeId: {
      type: 'int',
      nullable: false,
    },
    quantity: {
      type: 'int',
      default: 0,
    },
    createdAt: {
      type: 'datetime',
      createDate: true,
    },
    updatedAt: {
      type: 'datetime',
      updateDate: true,
    },
  },
  relations: {
    product: {
      type: 'many-to-one',
      target: 'Product',
      joinColumn: { name: 'productId' },
    },
    store: {
      type: 'many-to-one',
      target: 'Store',
      joinColumn: { name: 'storeId' },
    },
  },
  indices: [
    {
      columns: ['productId'],
    },
    {
      columns: ['storeId'],
    },
    {
      columns: ['productId', 'storeId'],
      unique: true,
    },
  ],
});


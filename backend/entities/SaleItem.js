const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'SaleItem',
  tableName: 'sale_items',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
    },
    saleId: {
      type: 'int',
      nullable: false,
    },
    productId: {
      type: 'int',
      nullable: false,
    },
    name: {
      type: 'varchar',
      nullable: true,
    },
    sku: {
      type: 'varchar',
      nullable: true,
    },
    quantity: {
      type: 'int',
      nullable: false,
    },
    unitPrice: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      nullable: false,
    },
    discount: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      default: 0,
    },
    discountedPrice: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      nullable: false,
    },
    taxRate: {
      type: 'int',
      nullable: false,
    },
    taxAmount: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      nullable: false,
    },
    totalAmount: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      nullable: false,
    },
  },
  relations: {
    sale: {
      type: 'many-to-one',
      target: 'Sale',
      joinColumn: { name: 'saleId' },
    },
    product: {
      type: 'many-to-one',
      target: 'Product',
      joinColumn: { name: 'productId' },
    },
  },
});


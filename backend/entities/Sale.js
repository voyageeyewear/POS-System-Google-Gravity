const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Sale',
  tableName: 'sales',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
    },
    invoiceNumber: {
      type: 'varchar',
      unique: true,
      nullable: true, // Will be generated
    },
    storeId: {
      type: 'int',
      nullable: false,
    },
    cashierId: {
      type: 'int',
      nullable: false,
    },
    customerId: {
      type: 'int',
      nullable: false,
    },
    subtotal: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      nullable: false,
    },
    totalDiscount: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      default: 0,
    },
    totalTax: {
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
    paymentMethod: {
      type: 'enum',
      enum: ['cash', 'upi', 'card', 'other'],
      nullable: false,
    },
    saleDate: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
    notes: {
      type: 'text',
      default: '',
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
    updatedAt: {
      type: 'timestamp',
      updateDate: true,
    },
  },
  relations: {
    store: {
      type: 'many-to-one',
      target: 'Store',
      joinColumn: { name: 'storeId' },
    },
    cashier: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: { name: 'cashierId' },
    },
    customer: {
      type: 'many-to-one',
      target: 'Customer',
      joinColumn: { name: 'customerId' },
    },
    items: {
      type: 'one-to-many',
      target: 'SaleItem',
      inverseSide: 'sale',
    },
  },
  indices: [
    {
      columns: ['invoiceNumber'],
    },
    {
      columns: ['storeId', 'saleDate'],
    },
    {
      columns: ['cashierId'],
    },
    {
      columns: ['saleDate'],
    },
  ],
});


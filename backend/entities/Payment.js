const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Payment',
  tableName: 'payments',
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
    paymentMethod: {
      type: 'simple-enum',
      enum: ['cash', 'upi', 'card', 'other'],
      nullable: false,
    },
    amount: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      nullable: false,
    },
    createdAt: {
      type: 'timestamp',
      createDate: true,
    },
  },
  relations: {
    sale: {
      type: 'many-to-one',
      target: 'Sale',
      joinColumn: { name: 'saleId' },
      onDelete: 'CASCADE',
    },
  },
  indices: [
    {
      columns: ['saleId'],
    },
  ],
});


const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Customer',
  tableName: 'customers',
  columns: {
    id: {
      type: 'int',
      primary: true,
      generated: true,
    },
    name: {
      type: 'varchar',
      nullable: false,
    },
    phone: {
      type: 'varchar',
      nullable: false,
    },
    address: {
      type: 'text',
      nullable: false,
    },
    email: {
      type: 'varchar',
      default: '',
      transformer: {
        to: (value) => value?.toLowerCase() || '',
        from: (value) => value,
      },
    },
    gstNumber: {
      type: 'varchar',
      default: '',
      transformer: {
        to: (value) => value?.toUpperCase() || '',
        from: (value) => value,
      },
    },
    totalPurchases: {
      type: 'decimal',
      precision: 10,
      scale: 2,
      default: 0,
    },
    lastPurchaseDate: {
      type: 'datetime',
      nullable: true,
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
  indices: [
    {
      columns: ['phone'],
    },
    {
      columns: ['email'],
    },
  ],
});


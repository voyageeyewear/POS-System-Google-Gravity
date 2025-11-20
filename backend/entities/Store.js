const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Store',
  tableName: 'stores',
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
    location: {
      type: 'varchar',
      nullable: false,
    },
    address: {
      type: 'simple-json',
      nullable: true,
    },
    phone: {
      type: 'varchar',
      nullable: true,
    },
    email: {
      type: 'varchar',
      nullable: true,
      transformer: {
        to: (value) => value?.toLowerCase(),
        from: (value) => value,
      },
    },
    shopifyLocationId: {
      type: 'varchar',
      nullable: true,
    },
    isActive: {
      type: 'boolean',
      default: true,
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
});


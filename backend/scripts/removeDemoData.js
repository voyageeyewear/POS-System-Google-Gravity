const { AppDataSource } = require('../data-source');

async function removeDemoData() {
    try {
        console.log('🧹 Starting demo data removal...');

        await AppDataSource.initialize();
        console.log('✅ Database connected');

        const productRepo = AppDataSource.getRepository('Product');
        const storeRepo = AppDataSource.getRepository('Store');
        const inventoryRepo = AppDataSource.getRepository('Inventory');

        // Step 1: Find demo products (no Shopify ID)
        const demoProducts = await productRepo
            .createQueryBuilder('product')
            .where('product.shopifyProductId IS NULL')
            .getMany();

        console.log(`📦 Found ${demoProducts.length} demo products to delete`);

        // Step 2: Delete inventory for demo products
        let deletedInventory = 0;
        for (const product of demoProducts) {
            const inventory = await inventoryRepo.find({
                where: { productId: product.id }
            });

            if (inventory.length > 0) {
                await inventoryRepo.remove(inventory);
                deletedInventory += inventory.length;
            }
        }
        console.log(`✅ Deleted ${deletedInventory} demo inventory records`);

        // Step 3: Delete demo products
        await productRepo.remove(demoProducts);
        console.log(`✅ Deleted ${demoProducts.length} demo products`);

        // Step 4: Find demo stores (no Shopify Location ID)
        const demoStores = await storeRepo
            .createQueryBuilder('store')
            .where('store.shopifyLocationId IS NULL')
            .getMany();

        console.log(`🏪 Found ${demoStores.length} demo stores to delete`);

        // Step 5: Delete inventory for demo stores
        let deletedStoreInventory = 0;
        for (const store of demoStores) {
            const inventory = await inventoryRepo.find({
                where: { storeId: store.id }
            });

            if (inventory.length > 0) {
                await inventoryRepo.remove(inventory);
                deletedStoreInventory += inventory.length;
            }
        }
        console.log(`✅ Deleted ${deletedStoreInventory} demo store inventory records`);

        // Step 6: Delete demo stores
        await storeRepo.remove(demoStores);
        console.log(`✅ Deleted ${demoStores.length} demo stores`);

        console.log('🎉 Demo data removal completed successfully!');

        // Summary
        const remainingProducts = await productRepo.count();
        const remainingStores = await storeRepo.count();
        const remainingInventory = await inventoryRepo.count();

        console.log('\n📊 Final counts:');
        console.log(`   Products: ${remainingProducts}`);
        console.log(`   Stores: ${remainingStores}`);
        console.log(`   Inventory: ${remainingInventory}`);

        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error removing demo data:', error);
        process.exit(1);
    }
}

removeDemoData();

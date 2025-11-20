const { AppDataSource } = require('../data-source');

async function backfillInventory() {
    try {
        console.log('🔄 Starting inventory backfill...');

        await AppDataSource.initialize();
        console.log('✅ Database connected');

        const productRepo = AppDataSource.getRepository('Product');
        const storeRepo = AppDataSource.getRepository('Store');
        const inventoryRepo = AppDataSource.getRepository('Inventory');

        // Get all active products
        const products = await productRepo.find({
            where: { isActive: true }
        });
        console.log(`📦 Found ${products.length} active products`);

        // Get all active stores with Shopify IDs (real stores)
        const stores = await storeRepo.find({
            where: { isActive: true }
        });
        const realStores = stores.filter(s => s.shopifyLocationId);
        console.log(`🏪 Found ${realStores.length} real stores`);

        // Calculate total combinations
        const totalCombinations = products.length * realStores.length;
        console.log(`🎯 Need to ensure ${totalCombinations} inventory records exist`);

        let created = 0;
        let existing = 0;
        let processed = 0;

        // Process in batches to avoid memory issues
        const BATCH_SIZE = 100;

        for (let i = 0; i < products.length; i += BATCH_SIZE) {
            const productBatch = products.slice(i, i + BATCH_SIZE);

            for (const product of productBatch) {
                for (const store of realStores) {
                    // Check if inventory record exists
                    const existingInventory = await inventoryRepo.findOne({
                        where: {
                            productId: product.id,
                            storeId: store.id
                        }
                    });

                    if (!existingInventory) {
                        // Create inventory record with quantity 0
                        const inventory = inventoryRepo.create({
                            productId: product.id,
                            storeId: store.id,
                            quantity: 0
                        });
                        await inventoryRepo.save(inventory);
                        created++;
                    } else {
                        existing++;
                    }

                    processed++;

                    // Progress indicator every 1000 records
                    if (processed % 1000 === 0) {
                        console.log(`📊 Progress: ${processed}/${totalCombinations} (${Math.round(processed / totalCombinations * 100)}%) - Created: ${created}, Existing: ${existing}`);
                    }
                }
            }
        }

        console.log('\n🎉 Backfill completed!');
        console.log(`✅ Created: ${created} new inventory records`);
        console.log(`✅ Existing: ${existing} inventory records`);
        console.log(`✅ Total: ${processed} inventory records`);

        // Verify results
        console.log('\n📊 Verification:');
        for (const store of realStores) {
            const count = await inventoryRepo.count({
                where: { storeId: store.id }
            });
            const withStock = await inventoryRepo.count({
                where: { storeId: store.id }
            });
            console.log(`   ${store.name}: ${count} inventory records`);
        }

        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during backfill:', error);
        process.exit(1);
    }
}

backfillInventory();

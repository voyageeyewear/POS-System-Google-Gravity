const { AppDataSource } = require('../data-source');
const shopifyService = require('../utils/shopify');

async function aggressiveInventoryResync() {
    try {
        console.log('🔥 AGGRESSIVE INVENTORY RE-SYNC STARTING...');

        await AppDataSource.initialize();
        console.log('✅ Database connected');

        const productRepo = AppDataSource.getRepository('Product');
        const storeRepo = AppDataSource.getRepository('Store');
        const inventoryRepo = AppDataSource.getRepository('Inventory');

        // Step 1: DELETE ALL INVENTORY RECORDS
        console.log('🗑️  Step 1: Deleting ALL existing inventory records...');
        await inventoryRepo.clear();
        console.log('✅ All inventory records deleted');

        // Step 2: Get all stores and products
        const stores = await storeRepo.find({
            where: { isActive: true }
        });
        const realStores = stores.filter(s => s.shopifyLocationId);
        console.log(`🏪 Found ${realStores.length} stores`);

        const products = await productRepo.find({
            where: { isActive: true }
        });
        console.log(`📦 Found ${products.length} products`);

        // Step 3: Get inventory from Shopify
        console.log('🔄 Step 2: Fetching inventory from Shopify...');

        // Collect all inventory item IDs
        const inventoryItemIds = [];
        const productMap = new Map();

        for (const product of products) {
            if (product.inventoryItemId) {
                inventoryItemIds.push(product.inventoryItemId);
                productMap.set(product.inventoryItemId, product);
            }
        }

        console.log(`📊 Fetching inventory for ${inventoryItemIds.length} items...`);

        let shopifyInventoryLevels = [];
        if (inventoryItemIds.length > 0) {
            shopifyInventoryLevels = await shopifyService.getInventoryLevels(inventoryItemIds);
            console.log(`✅ Received ${shopifyInventoryLevels.length} inventory records from Shopify`);
        }

        // Step 4: Create inventory map from Shopify data
        const inventoryMap = new Map();

        for (const level of shopifyInventoryLevels) {
            const locationId = level.location_id.toString();
            const itemId = level.inventory_item_id.toString();

            if (!inventoryMap.has(locationId)) {
                inventoryMap.set(locationId, new Map());
            }
            inventoryMap.get(locationId).set(itemId, level.available || 0);
        }

        console.log(`📊 Organized inventory for ${inventoryMap.size} locations`);

        // Step 5: Create ALL inventory records (with Shopify quantities or 0)
        console.log('🔄 Step 3: Creating inventory records with correct quantities...');

        let created = 0;
        let withShopifyData = 0;
        let withZeroQuantity = 0;

        for (const product of products) {
            for (const store of realStores) {
                let quantity = 0;

                // Check if we have Shopify data for this product-store combination
                if (product.inventoryItemId) {
                    const locationInventory = inventoryMap.get(store.shopifyLocationId);
                    if (locationInventory && locationInventory.has(product.inventoryItemId)) {
                        quantity = locationInventory.get(product.inventoryItemId);
                        withShopifyData++;
                    } else {
                        withZeroQuantity++;
                    }
                } else {
                    withZeroQuantity++;
                }

                // Create inventory record
                const inventory = inventoryRepo.create({
                    productId: product.id,
                    storeId: store.id,
                    quantity: quantity
                });
                await inventoryRepo.save(inventory);
                created++;

                if (created % 1000 === 0) {
                    console.log(`📊 Progress: ${created} records created...`);
                }
            }
        }

        console.log('\n🎉 AGGRESSIVE RE-SYNC COMPLETED!');
        console.log(`✅ Total records created: ${created}`);
        console.log(`✅ With Shopify data: ${withShopifyData}`);
        console.log(`✅ With zero quantity: ${withZeroQuantity}`);

        // Verification
        console.log('\n📊 Verification by store:');
        for (const store of realStores) {
            const count = await inventoryRepo.count({
                where: { storeId: store.id }
            });
            const totalQty = await inventoryRepo
                .createQueryBuilder('inv')
                .select('SUM(inv.quantity)', 'total')
                .where('inv.storeId = :storeId', { storeId: store.id })
                .getRawOne();

            console.log(`   ${store.name}: ${count} records, ${totalQty.total || 0} total units`);
        }

        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during aggressive re-sync:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

aggressiveInventoryResync();

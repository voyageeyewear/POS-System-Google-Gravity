require('dotenv').config();
const axios = require('axios');

const SHOPIFY_SHOP_DOMAIN = process.env.SHOPIFY_SHOP_DOMAIN;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-01';

const inventoryItemId = '53091528573203'; // MG 5182

async function checkInventory() {
    try {
        console.log('🔍 Checking Shopify inventory for item:', inventoryItemId);
        console.log('Shop:', SHOPIFY_SHOP_DOMAIN);

        const client = axios.create({
            baseURL: `https://${SHOPIFY_SHOP_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}`,
            headers: {
                'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
                'Content-Type': 'application/json'
            }
        });

        // Get inventory levels for this item
        const response = await client.get(`/inventory_levels.json`, {
            params: {
                inventory_item_ids: inventoryItemId
            }
        });

        console.log('\n📊 Shopify Inventory Levels:');
        console.log(JSON.stringify(response.data.inventory_levels, null, 2));

        const total = response.data.inventory_levels.reduce((sum, level) => sum + (level.available || 0), 0);
        console.log(`\n✅ Total available across all locations: ${total} units`);

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

checkInventory();

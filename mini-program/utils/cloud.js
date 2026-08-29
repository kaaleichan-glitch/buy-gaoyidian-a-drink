// utils/cloud.js —— Supabase 云同步（原版 cloud.js 适配小程序）
const SUPABASE_URL = 'https://vftcjwgoyeqngcshnfyh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmdGNqd2dveWVxbmdzY2huZnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMDE3NzQsImV4cCI6MjA2NTc3Nzc3NH0.rP0kf8QqIqNkXKf0n5m6rDgFh1mGfIh7Qf8BcJ2Z9L4pE6lD3oR5aYwXsT4uV2wN0bC5dF8gH0jK';

const cloudState = {
    enabled: false,
    initDone: false
};

function initCloud() {
    if (cloudState.initDone) return cloudState.enabled;
    if (SUPABASE_URL && SUPABASE_ANON_KEY &&
        !SUPABASE_URL.includes('你的') && !SUPABASE_ANON_KEY.includes('你的')) {
        cloudState.enabled = true;
    } else {
        cloudState.enabled = false;
    }
    cloudState.initDone = true;
    return cloudState.enabled;
}

function cloudHeaders() {
    return {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
}

// fetch → wx.request Promise 包装
function wxRequest(opts) {
    return new Promise((resolve, reject) => {
        wx.request({
            url: opts.url,
            method: opts.method || 'GET',
            header: opts.headers,
            data: opts.body ? JSON.parse(opts.body) : undefined,
            success: (res) => resolve({ statusCode: res.statusCode, data: res.data, ok: res.statusCode >= 200 && res.statusCode < 300 }),
            fail: (err) => reject(err)
        });
    });
}

function cloudGet(tableName, params = {}) {
    if (!initCloud()) return null;
    try {
        let url = `${SUPABASE_URL}/rest/v1/${tableName}?select=*`;
        if (params.where) {
            for (const [key, value] of Object.entries(params.where)) {
                url += `&${key}=eq.${encodeURIComponent(value)}`;
            }
        }
        if (params.order) {
            const orderField = params.order.replace('-', '');
            const ascending = !params.order.startsWith('-');
            url += `&order=${orderField}.${ascending ? 'asc' : 'desc'}`;
        }
        if (params.limit) url += `&limit=${params.limit}`;

        return wxRequest({ url, method: 'GET', headers: cloudHeaders() })
            .then(res => res.ok ? res.data : null)
            .catch(() => null);
    } catch (err) {
        return Promise.resolve(null);
    }
}

function cloudCreate(tableName, data) {
    if (!initCloud()) return null;
    return wxRequest({
        url: `${SUPABASE_URL}/rest/v1/${tableName}`,
        method: 'POST',
        headers: cloudHeaders(),
        body: JSON.stringify(data)
    }).then(res => {
        if (res.ok) {
            const arr = Array.isArray(res.data) ? res.data : [];
            return arr[0] || data;
        }
        return null;
    }).catch(() => null);
}

// wx.storage 直接存取（与 home.js 保持一致，小程序 storage 支持直接存数组/对象）
function getLocalDrinks() {
    try {
        const v = wx.getStorageSync('gaoyidian_drinks');
        return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
}
function setLocalDrinks(drinks) {
    try { wx.setStorageSync('gaoyidian_drinks', drinks); } catch (e) {}
}

async function syncRecipesToCloud() {
    if (!initCloud()) return false;
    try {
        const existing = await cloudGet('drink_recipes', { limit: 1 });
        if (existing && existing.length > 0) return true;
        const DRINK_RECIPES = require('./data.js').DRINK_RECIPES;
        for (const recipe of DRINK_RECIPES) {
            await cloudCreate('drink_recipes', {
                recipe_id: recipe.id,
                drink_name: recipe.drink_name,
                english_name: recipe.english_name,
                drink_type: recipe.drink_type,
                image: recipe.image || '',
                story: recipe.story,
                tags: recipe.tags,
                ingredients: recipe.ingredients
            });
        }
        return true;
    } catch (err) { return false; }
}

async function getCloudRecipes() {
    if (!initCloud()) return null;
    const results = await cloudGet('drink_recipes', { limit: 100 });
    if (!results) return null;
    return results.map(r => ({
        id: r.recipe_id,
        drink_name: r.drink_name,
        english_name: r.english_name,
        drink_type: r.drink_type,
        image: r.image,
        story: r.story,
        tags: r.tags,
        ingredients: r.ingredients
    }));
}

async function saveDrinkToCloud(drink) {
    if (!initCloud()) return null;
    return await cloudCreate('drinks', {
        drink_id: drink.id,
        owner_token: drink.owner_token,
        recipe_id: drink.recipe_id,
        bartender_name: drink.bartender_name,
        answers: drink.answers,
        tags: drink.tags,
        created_at: drink.created_at
    });
}

async function getCloudDrinks(token) {
    if (!initCloud()) return null;
    const results = await cloudGet('drinks', {
        where: { owner_token: token },
        order: '-created_at',
        limit: 100
    });
    if (!results) return null;
    return results.map(r => ({
        id: r.drink_id,
        owner_token: r.owner_token,
        recipe_id: r.recipe_id,
        bartender_name: r.bartender_name,
        answers: r.answers,
        tags: r.tags,
        created_at: r.created_at
    }));
}

async function syncLocalDrinksToCloud(token) {
    if (!initCloud()) return false;
    const localDrinks = getLocalDrinks();
    const cloudDrinks = await getCloudDrinks(token);
    if (!cloudDrinks) return false;
    const cloudIds = new Set(cloudDrinks.map(d => d.id));
    for (const drink of localDrinks) {
        if (drink.owner_token === token && !cloudIds.has(drink.id)) {
            await saveDrinkToCloud(drink);
        }
    }
    return true;
}

async function mergeCloudDrinksToLocal(token) {
    if (!initCloud()) return false;
    const cloudDrinks = await getCloudDrinks(token);
    if (!cloudDrinks) return false;
    const localDrinks = getLocalDrinks();
    const localIds = new Set(localDrinks.map(d => d.id));
    let merged = 0;
    for (const drink of cloudDrinks) {
        if (!localIds.has(drink.id)) {
            localDrinks.push(drink);
            merged++;
        }
    }
    if (merged > 0) setLocalDrinks(localDrinks);
    return true;
}

module.exports = {
    initCloud,
    cloudGet,
    cloudCreate,
    syncRecipesToCloud,
    getCloudRecipes,
    saveDrinkToCloud,
    getCloudDrinks,
    syncLocalDrinksToCloud,
    mergeCloudDrinksToLocal,
    getLocalDrinks,
    setLocalDrinks
};

const SUPABASE_URL = 'https://vftcjwgoyeqngcshnfyh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oi-yBynNTC2ftg4dwyVC9w_CnubnWDz';

const cloudState = {
    enabled: false,
    initDone: false
};

function initCloud() {
    if (cloudState.initDone) return cloudState.enabled;
    
    if (SUPABASE_URL && 
        SUPABASE_ANON_KEY && 
        !SUPABASE_URL.includes('你的') && 
        !SUPABASE_ANON_KEY.includes('你的')) {
        cloudState.enabled = true;
        console.log('云端存储已启用（Supabase）');
    } else {
        cloudState.enabled = false;
        console.log('云端存储未配置，使用本地存储');
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

async function cloudGet(tableName, params = {}) {
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
        if (params.limit) {
            url += `&limit=${params.limit}`;
        }
        
        const res = await fetch(url, {
            method: 'GET',
            headers: cloudHeaders()
        });
        
        if (res.ok) {
            return await res.json();
        }
        console.warn('云端查询失败:', res.status, await res.text());
        return null;
    } catch (err) {
        console.warn('云端请求失败:', err);
        return null;
    }
}

async function cloudCreate(tableName, data) {
    if (!initCloud()) return null;
    
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}`, {
            method: 'POST',
            headers: cloudHeaders(),
            body: JSON.stringify(data)
        });
        
        if (res.ok) {
            const results = await res.json();
            return results[0] || data;
        }
        console.warn('云端创建失败:', res.status, await res.text());
        return null;
    } catch (err) {
        console.warn('云端创建失败:', err);
        return null;
    }
}

async function syncRecipesToCloud() {
    if (!initCloud()) return false;
    
    try {
        const existing = await cloudGet('drink_recipes', { limit: 1 });
        if (existing && existing.length > 0) {
            console.log('酒谱已存在于云端，跳过同步');
            return true;
        }
        
        console.log('同步酒谱到云端...');
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
        console.log('酒谱同步完成');
        return true;
    } catch (err) {
        console.warn('酒谱同步失败:', err);
        return false;
    }
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
    
    const localDrinks = JSON.parse(localStorage.getItem('gaoyidian_drinks') || '[]');
    const cloudDrinks = await getCloudDrinks(token);
    
    if (!cloudDrinks) return false;
    
    const cloudIds = new Set(cloudDrinks.map(d => d.id));
    let synced = 0;
    
    for (const drink of localDrinks) {
        if (drink.owner_token === token && !cloudIds.has(drink.id)) {
            await saveDrinkToCloud(drink);
            synced++;
        }
    }
    
    if (synced > 0) {
        console.log(`已同步 ${synced} 杯本地酒到云端`);
    }
    
    return true;
}

async function mergeCloudDrinksToLocal(token) {
    if (!initCloud()) return false;
    
    const cloudDrinks = await getCloudDrinks(token);
    if (!cloudDrinks) return false;
    
    const localDrinks = JSON.parse(localStorage.getItem('gaoyidian_drinks') || '[]');
    const localIds = new Set(localDrinks.map(d => d.id));
    let merged = 0;
    
    for (const drink of cloudDrinks) {
        if (!localIds.has(drink.id)) {
            localDrinks.push(drink);
            merged++;
        }
    }
    
    if (merged > 0) {
        localStorage.setItem('gaoyidian_drinks', JSON.stringify(localDrinks));
        console.log(`已从云端同步 ${merged} 杯酒到本地`);
    }
    
    return true;
}

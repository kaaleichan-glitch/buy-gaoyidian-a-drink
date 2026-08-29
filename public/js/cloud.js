const SUPABASE_URL = 'https://vftcjwgoyeqngcshnfyh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmdGNqd2dveWVxbmdzY2huZnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMDE3NzQsImV4cCI6MjA2NTc3Nzc3NH0.rP0kf8QqIqNkXKf0n5m6rDgFh1mGfIh7Qf8BcJ2Z9L4pE6lD3oR5aYwXsT4uV2wN0bC5dF8gH0jK';

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
    if (!initCloud()) {
        const e = new Error('云端未初始化');
        e.code = 'CLOUD_DISABLED';
        throw e;
    }
    
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
        const body = await res.text();
        console.warn('云端创建失败:', tableName, res.status, body);
        const err = new Error(`云端创建 ${tableName} 失败: ${res.status} ${body.slice(0, 200)}`);
        err.status = res.status;
        err.body = body;
        try { err.json = JSON.parse(body); } catch (_) {}
        throw err;
    } catch (err) {
        console.warn('云端创建失败:', tableName, err);
        if (err && err.code) throw err;
        const wrap = new Error(`云端创建 ${tableName} 失败: ${err && err.message ? err.message : err}`);
        wrap.cause = err;
        throw wrap;
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

async function saveDrinkToCloud(drink, opts = {}) {
    if (!initCloud()) {
        const e = new Error('云端未初始化，无法保存酒');
        e.code = 'CLOUD_DISABLED';
        throw e;
    }
    // 强制正确字段映射：
    //   drink.id（前端十六进制字符串）→ 数据库列 drinks.drink_id
    //   数据库列 drinks.id 是 BIGSERIAL 自增主键 → 不传
    //   必带 site_id，默认 'default'
    const payload = {
        drink_id: drink.drink_id || drink.id,
        owner_token: drink.owner_token,
        recipe_id: drink.recipe_id,
        bartender_name: (drink.bartender_name || '').toString().trim(),
        answers: drink.answers || [],
        tags: drink.tags || [],
        created_at: drink.created_at || new Date().toISOString(),
        site_id: opts.site_id || drink.site_id || 'default'
    };

    if (!payload.drink_id) {
        const e = new Error('缺少 drink_id，无法写入云端');
        e.code = 'MISSING_DRINK_ID';
        throw e;
    }
    if (!payload.owner_token || payload.recipe_id == null || !payload.bartender_name) {
        const e = new Error('写入云端缺少必要字段：owner_token / recipe_id / bartender_name');
        e.code = 'MISSING_REQUIRED';
        throw e;
    }

    return await cloudCreate('drinks', payload);
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

async function syncLocalDrinksToCloud(token, opts = {}) {
    if (!initCloud()) {
        if (opts.verbose) console.warn('syncLocalDrinksToCloud: 云端未初始化，跳过');
        return { ok: false, synced: 0, skipped: 0, failed: 0, errors: [], reason: 'CLOUD_DISABLED' };
    }
    
    const localDrinks = JSON.parse(localStorage.getItem('gaoyidian_drinks') || '[]');
    const cloudDrinks = await getCloudDrinks(token);
    
    const result = { ok: true, synced: 0, skipped: 0, failed: 0, errors: [] };
    if (!cloudDrinks) {
        result.ok = false;
        result.reason = 'GET_CLOUD_DRINKS_FAILED';
        if (opts.verbose) console.warn('syncLocalDrinksToCloud: 拉取云端失败，无法做去重，跳过直写补同步');
        return result;
    }
    
    const cloudIds = new Set(cloudDrinks.map(d => d.id));
    
    for (const drink of localDrinks) {
        try {
            if (drink.owner_token !== token) { result.skipped++; continue; }
            if (cloudIds.has(drink.id)) { result.skipped++; continue; }
            await saveDrinkToCloud(drink, { site_id: opts.site_id || 'default' });
            result.synced++;
        } catch (err) {
            result.failed++;
            result.errors.push({ drink_id: drink.id || drink.drink_id, message: err && err.message ? err.message : String(err) });
            if (opts.verbose) console.warn('补发本地酒失败:', drink.id || drink.drink_id, err);
        }
    }
    
    if (result.synced > 0 || opts.verbose) {
        console.log(`本地 → 云端补同步完成：成功 ${result.synced} 杯，跳过 ${result.skipped} 杯，失败 ${result.failed} 杯`);
    }
    
    return result;
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

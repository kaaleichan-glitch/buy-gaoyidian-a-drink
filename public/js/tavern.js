const tavernState = {
    token: null,
    drinks: [],
    currentDrink: null,
    useBackend: true,  // P0-2: 默认乐观 true，只有明确"非超时"错误才降级
    totalRecipes: 32,
    collectedCount: 0
};

/* ============================================================
 * P0-2 + P0-3 通用工具：超时 fetch + 乐观探活
 * ============================================================ */

/**
 * 带超时的 fetch 封装。5 秒内不响应即取消，避免冷启动/Supabase 墙让页面永远挂住。
 * @param {string} url
 * @param {RequestInit & { timeoutMs?: number }} opts
 * @returns {Promise<Response>}
 */
function fetchWithTimeout(url, opts = {}) {
    const timeoutMs = opts.timeoutMs || 5000;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    return fetch(url, { ...opts, signal: ctrl.signal })
        .finally(() => clearTimeout(timer));
}

/** 判断 AbortError 是否来自超时 */
function isAbortError(err) {
    return err && (err.name === 'AbortError' || (err.message && err.message.includes('abort')));
}

/** P1-6: 显示 / 隐藏加载骨架态（替换默认的 "0/32 假死"） */
function showLoading(message) {
    const countEl = document.getElementById('collected-count');
    const emptyEl = document.getElementById('empty-state');
    const carousel = document.getElementById('drink-carousel');
    const stats = document.getElementById('stats-board');
    if (countEl) countEl.textContent = '…';
    // 在 empty-state 区域显示加载提示
    if (emptyEl) {
        emptyEl.style.display = 'block';
        emptyEl.innerHTML = `
            <p>🍸 ${message || '正在加载酒馆数据…'}</p>
            <p style="margin-top:16px; color:#888; font-size:13px;">
                网络状况不好时会稍等一下，不用手动刷新～
            </p>
        `;
    }
    if (carousel) carousel.style.opacity = '0.35';
    if (stats) stats.style.opacity = '0.35';
}
function hideLoading() {
    const emptyEl = document.getElementById('empty-state');
    const carousel = document.getElementById('drink-carousel');
    const stats = document.getElementById('stats-board');
    if (emptyEl) {
        emptyEl.innerHTML = `
            <p>酒馆还空着...</p>
            <p style="margin-top:16px; color:#666;">
                把链接分享给朋友<br>
                让他们为你调一杯酒吧
            </p>
        `;
        emptyEl.style.display = 'none';
    }
    if (carousel) carousel.style.opacity = '';
    if (stats) stats.style.opacity = '';
}

/**
 * P0-2: 探活后端 —— 带 4 秒超时
 * - 4 秒内 2xx -> useBackend=true
 * - 4 秒超时 或 网络错误 -> **乐观保持 true**，让真正的业务接口去试，避免"探活误判→强制走被墙直连"
 * - 只有明确 4xx/5xx 返回（说明服务端真活着但就是错了）才降级
 */
async function checkBackend() {
    try {
        const res = await fetchWithTimeout('/api/questions', { method: 'HEAD', timeoutMs: 4000 });
        tavernState.useBackend = res.ok;
    } catch (err) {
        // 超时 / 网络未达：不清真 useBackend，让下一个真实业务 fetch 继续尝试后端
        if (isAbortError(err)) {
            console.warn('checkBackend 超时，仍乐观尝试真实业务接口（不降级直连）');
            tavernState.useBackend = true;
        } else {
            tavernState.useBackend = true; // 其他错误也乐观，因为有后端代理才过墙
        }
    }
}

function migrateLegacyData() {
    const oldToken = localStorage.getItem('gaoyidian_default_token');
    let currentToken = localStorage.getItem('gaoyidian_tavern_token');
    
    if (oldToken && !currentToken) {
        currentToken = oldToken;
        localStorage.setItem('gaoyidian_tavern_token', oldToken);
        localStorage.removeItem('gaoyidian_default_token');
        console.log('已迁移旧Token到新位置');
    }
    
    const allDrinks = JSON.parse(localStorage.getItem('gaoyidian_drinks') || '[]');
    if (allDrinks.length > 0 && currentToken) {
        let migrated = false;
        for (const drink of allDrinks) {
            if (drink.owner_token !== currentToken) {
                drink.owner_token = currentToken;
                migrated = true;
            }
        }
        if (migrated) {
            localStorage.setItem('gaoyidian_drinks', JSON.stringify(allDrinks));
            console.log('已将所有酒记录归并到当前Token');
        }
    }
}

function getToken() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    
    if (urlToken) {
        // 如果URL里带了token，自动缓存到localStorage，以便今后直接点击进入
        localStorage.setItem('gaoyidian_tavern_token', urlToken);
        return urlToken;
    }
    
    // 否则尝试从缓存中获取
    const savedToken = localStorage.getItem('gaoyidian_tavern_token');
    if (savedToken) {
        return savedToken;
    }
    
    return null; // 返回null，表明需要提示解锁密令
}

function showLockScreen() {
    const lockScreen = document.getElementById('tavern-lock-screen');
    if (lockScreen) {
        lockScreen.classList.add('active');
    }
}

function hideLockScreen() {
    const lockScreen = document.getElementById('tavern-lock-screen');
    if (lockScreen) {
        lockScreen.classList.remove('active');
    }
}

function unlockTavernWithInput() {
    const input = document.getElementById('lock-token-input');
    const val = input.value.trim();
    if (!val) {
        showToast('请输入有效的密令', '⚠️');
        return;
    }
    
    localStorage.setItem('gaoyidian_tavern_token', val);
    
    const lockScreen = document.getElementById('tavern-lock-screen');
    if (lockScreen) {
        lockScreen.classList.remove('active');
        setTimeout(() => {
            window.location.reload();
        }, 300);
    } else {
        window.location.reload();
    }
}

function setToken(token) {
    tavernState.token = token;
    const el = document.getElementById('token-display');
    if (el) el.textContent = token;
}

async function loadTavern() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('clear_cache') === 'true') {
        localStorage.clear();
        try {
            const baseUrl = window.location.origin + window.location.pathname;
            window.history.replaceState(null, '', baseUrl);
        } catch (e) {}
    }

    migrateLegacyData();

    // P1-6: 先显示加载态，避免 0/32 假死让用户以为坏了
    showLoading('正在唤醒小酒馆…');

    // P0-2: checkBackend 4s 超时 + 乐观策略；即使它"失败"也不拦真实业务接口
    await checkBackend();
    
    const token = getToken();
    if (!token) {
        const urlParams2 = new URLSearchParams(window.location.search);
        if (urlParams2.get('entry') === 'true') {
            hideLoading();
            showLockScreen();
        } else {
            window.location.href = 'index.html';
            return;
        }
        return;
    }
    
    hideLockScreen();
    setToken(token);

    // P0-1: 移除浏览器直连 Supabase 回退路径（那条路在中国被 DNS 墙 30s+）
    //      只保留"后端代理 → localStorage 兜底"两级。符合硬约束"Remove code that connects to Supabase 前端侧"
    let loaded = false;

    showLoading('正在拉取酒柜数据…');
    try {
        // 真实业务接口再给 10 秒（后端 Supabase 查询可能稍慢，但经过代理不经过墙）
        const res = await fetchWithTimeout(`/api/tavern/${tavernState.token}`, { timeoutMs: 10000 });
        const data = await res.json();
        
        if (data.success) {
            tavernState.drinks = data.data;
            tavernState.allDrinks = data.all_drinks || [];
            tavernState.totalRecipes = data.total || 32;
            tavernState.collectedCount = data.collected_count || 0;
            applyPreviewMode();
            hideLoading();
            renderTavern();
            loaded = true;
            return;
        } else {
            console.warn('后端返回 success=false:', data.error);
            showToast(`后端出了小状况：${data.error || '未知错误'}，正在用本地缓存`, '⚠️');
        }
    } catch (err) {
        if (isAbortError(err)) {
            console.warn('/api/tavern 超时（超过 10 秒），使用本地缓存');
            showToast('网络较慢，已切换显示本地缓存酒柜 🔁', '⏱️');
        } else {
            console.warn('后端接口异常，使用本地缓存:', err);
            showToast('无法连接到小酒馆服务器，显示本地数据 🔁', '⚠️');
        }
    }

    // P0-1: 不再 initCloud / syncLocalDrinksToCloud / getCloudDrinks（浏览器直连 Supabase）
    // 直接用 localStorage 兜底 —— 与项目记忆硬约束一致："Remove code that connects to Supabase 前端侧"
    const allDrinks = JSON.parse(localStorage.getItem('gaoyidian_drinks') || '[]');
    const userDrinks = allDrinks.filter(d => d.owner_token === tavernState.token);
    
    const collectedMap = {};
    userDrinks.forEach(d => {
        if (!collectedMap[d.recipe_id] || new Date(d.created_at) > new Date(collectedMap[d.recipe_id].created_at)) {
            collectedMap[d.recipe_id] = d;
        }
    });

    tavernState.drinks = DRINK_RECIPES.map(r => {
        const collected = collectedMap[r.id];
        if (collected) {
            return {
                recipe_id: r.id,
                drink_id: collected.drink_id || collected.id,
                bartender_name: collected.bartender_name,
                created_at: collected.created_at,
                drink_name: r.drink_name,
                english_name: r.english_name,
                drink_type: r.drink_type,
                image: r.image || '',
                collected: true
            };
        } else {
            return {
                recipe_id: r.id,
                drink_id: null,
                bartender_name: null,
                created_at: null,
                drink_name: r.drink_name,
                english_name: r.english_name,
                drink_type: r.drink_type,
                image: r.image || '',
                collected: false
            };
        }
    });

    tavernState.totalRecipes = DRINK_RECIPES.length;
    tavernState.collectedCount = Object.keys(collectedMap).length;
    tavernState.allDrinks = userDrinks;

    applyPreviewMode();
    hideLoading();
    renderTavern();

    if (!loaded && userDrinks.length === 0) {
        // 兜底也没数据的最后提示
        showToast('暂时没调出酒记录，先去找人调一杯吧 🍸', '💡');
    }
}

function applyPreviewMode() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('preview') !== 'all') return;

    const fakeBartenders = ['小A', '调酒师B', '深夜调饮', '月下独酌', '微醺客', '酒馆常客'];
    const now = new Date();

    tavernState.drinks = tavernState.drinks.map((drink, index) => {
        if (drink.collected) return drink;
        const fakeDate = new Date(now.getTime() - index * 86400000 * 2);
        return {
            ...drink,
            collected: true,
            drink_id: `preview_${drink.recipe_id}`,
            bartender_name: fakeBartenders[index % fakeBartenders.length],
            created_at: fakeDate.toISOString()
        };
    });

    tavernState.collectedCount = tavernState.drinks.length;

    // 同时为 allDrinks 填充预览数据
    tavernState.allDrinks = tavernState.drinks.map(d => ({
        id: d.drink_id,
        recipe_id: d.recipe_id,
        bartender_name: d.bartender_name,
        created_at: d.created_at,
        drink_name: d.drink_name
    }));
}

function renderTavern() {
    const drinks = tavernState.drinks;
    const empty = document.getElementById('empty-state');
    const statsBoard = document.getElementById('stats-board');

    const collectedCount = tavernState.collectedCount;
    const totalCount = tavernState.totalRecipes;

    document.getElementById('collected-count').textContent = collectedCount;

    document.getElementById('drink-carousel').style.display = 'flex';
    statsBoard.style.display = 'grid';
    
    const collectedDrinks = drinks.filter(d => d.collected);
    if (collectedDrinks.length === 0) {
        empty.style.display = 'block';
    } else {
        empty.style.display = 'none';
    }
    
    renderStats(collectedDrinks);
    renderCarousel();
}

function renderStats(drinks) {
    if (drinks.length === 0) {
        document.getElementById('top-bartender-name').textContent = '—';
        document.getElementById('top-bartender-count').textContent = '等待第一位调酒师';
        document.getElementById('top-drink-name').textContent = '—';
        document.getElementById('top-drink-percent').textContent = '等待第一杯酒';
        return;
    }

    const bartenderCount = {};
    const drinkCount = {};

    drinks.forEach(drink => {
        const name = drink.bartender_name || '匿名';
        bartenderCount[name] = (bartenderCount[name] || 0) + 1;

        const drinkName = drink.drink_name || '未知';
        drinkCount[drinkName] = (drinkCount[drinkName] || 0) + 1;
    });

    let topBartender = '';
    let topBartenderCount = 0;
    Object.entries(bartenderCount).forEach(([name, count]) => {
        if (count > topBartenderCount) {
            topBartender = name;
            topBartenderCount = count;
        }
    });

    let topDrink = '';
    let topDrinkCount = 0;
    Object.entries(drinkCount).forEach(([name, count]) => {
        if (count > topDrinkCount) {
            topDrink = name;
            topDrinkCount = count;
        }
    });

    const topDrinkPercent = Math.round((topDrinkCount / drinks.length) * 100);

    document.getElementById('top-bartender-name').textContent = topBartender;
    document.getElementById('top-bartender-count').textContent = `为你调制 ${topBartenderCount} 杯`;
    document.getElementById('top-drink-name').textContent = topDrink;
    document.getElementById('top-drink-percent').textContent = `占据酒柜 ${topDrinkPercent}%`;
}

function renderCarousel() {
    const track = document.getElementById('carousel-track');
    const dots = document.getElementById('carousel-dots');
    const drinks = tavernState.drinks;
    const activeIndex = tavernState.carouselIndex || 0;
    
    track.innerHTML = '';
    dots.innerHTML = '';
    
    drinks.forEach((drink, index) => {
        const card = document.createElement('div');
        let className = 'carousel-card';
        
        if (index === activeIndex) {
            className += ' active';
        } else if (index === activeIndex - 1) {
            className += ' prev';
        } else if (index === activeIndex + 1) {
            className += ' next';
        } else if (index < activeIndex - 1) {
            className += ' hidden-left';
        } else {
            className += ' hidden-right';
        }

        if (!drink.collected) {
            className += ' locked';
        }
        
        card.className = className;
        
        if (drink.collected) {
            const recipe = DRINK_RECIPES.find(r => r.id === drink.recipe_id);
            const animConfig = recipe && recipe.animation_config ? recipe.animation_config : null;
            
            card.innerHTML = `
                <div class="carousel-drink-preview">
                    ${animConfig ? generateDrinkSVG(animConfig) : '<div class="carousel-card-icon">🍸</div>'}
                </div>
                <div class="carousel-card-name-en">${drink.english_name}</div>
                <div class="carousel-card-name-cn">${drink.drink_name}</div>
                <div class="carousel-card-bartender">by ${drink.bartender_name}</div>
            `;
        } else {
            card.innerHTML = `
                <div class="carousel-drink-preview">
                    <div class="carousel-card-icon locked-icon">🔒</div>
                </div>
                <div class="carousel-card-name-en">???</div>
                <div class="carousel-card-name-cn">未解锁</div>
                <div class="carousel-card-bartender">&nbsp;</div>
            `;
        }
        
        card.onclick = () => {
            if (index === activeIndex) {
                if (drink.collected) {
                    openDrinkDetail(drink.drink_id);
                }
            } else {
                goToDrink(index);
            }
        };
        
        track.appendChild(card);
        
        const dot = document.createElement('div');
        dot.className = 'carousel-dot' + (index === activeIndex ? ' active' : '');
        dot.onclick = () => goToDrink(index);
        dots.appendChild(dot);
    });
    
    const prevBtn = document.querySelector('.carousel-btn.prev');
    const nextBtn = document.querySelector('.carousel-btn.next');
    prevBtn.style.display = drinks.length > 1 ? 'flex' : 'none';
    nextBtn.style.display = drinks.length > 1 ? 'flex' : 'none';
    dots.style.display = drinks.length > 1 ? 'flex' : 'none';
}

function generateDrinkSVG(animConfig) {
    const glassFillRatios = {
        wine: 0.85, coupe: 0.85, coupe_tall: 0.85,
        margarita: 0.85, cocktail: 0.85, cocktail_tall: 0.85, burgundy: 0.85
    };
    const fillRatio = glassFillRatios[animConfig.glass] || 1.0;
    const layers = animConfig.pencilLayers || [];
    const bottomOffset = 50;
    const sideOffset = 15;
    const topOffset = 10;
    const segments = 20;
    const segWidth = (200 + sideOffset * 2) / segments;

    let layersSVG = '';
    layers.forEach((layer, index) => {
        let layerTop, layerBottom;
        const layerHeight = (layer.height || 200) * fillRatio;
        layerTop = 300 - layerHeight - topOffset;
        layerBottom = 300 + bottomOffset;

        let basePathD = `M ${-sideOffset} ${layerBottom} L ${-sideOffset} ${layerTop}`;
        for (let i = 0; i <= segments; i++) {
            const x = -sideOffset + i * segWidth;
            const yVariation = (Math.sin(i * 0.8 + index * 2) + Math.sin(i * 1.3 + index)) * 8;
            const y = layerTop + yVariation;
            basePathD += ` L ${x} ${y}`;
        }
        basePathD += ` L ${200 + sideOffset} ${layerBottom} Z`;

        let textureTop, textureBottom;
        if (index === 0) {
            textureBottom = 300 + bottomOffset;
            textureTop = 300 - (layers[0].height || 80) * fillRatio - topOffset;
        } else {
            textureBottom = 300 - (layers[index - 1].height || 80) * fillRatio;
            textureTop = 300 - (layer.height || 200) * fillRatio - topOffset;
        }

        let texturePathD = `M ${-sideOffset} ${textureBottom} L ${-sideOffset} ${textureTop}`;
        for (let i = 0; i <= segments; i++) {
            const x = -sideOffset + i * segWidth;
            const yVariation = (Math.sin(i * 0.8 + index * 2) + Math.sin(i * 1.3 + index)) * 6;
            const y = textureTop + yVariation;
            texturePathD += ` L ${x} ${y}`;
        }
        texturePathD += ` L ${200 + sideOffset} ${textureBottom} Z`;

        layersSVG += `
            <g class="tavern-pencil-layer" data-layer="${index}" style="animation-delay: ${index * 0.3}s">
                <path d="${basePathD}" fill="${layer.color}" opacity="0.65"/>
                <path d="${texturePathD}" fill="url(#tavern-texture-${(index % 2) + 1})" opacity="0.6"/>
            </g>
        `;
    });

    const glassClass = `tavern-glass glass-${animConfig.glass}`;

    return `
        <div class="${glassClass}">
            <svg class="tavern-pencil-svg" viewBox="0 0 200 300" preserveAspectRatio="none">
                <defs>
                    <clipPath id="tavern-clip-${animConfig.glass}">
                        <rect x="0" y="0" width="200" height="300" rx="20" ry="20"/>
                    </clipPath>
                    <pattern id="tavern-texture-1" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(72)">
                        <rect width="8" height="8" fill="transparent"/>
                        <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255,255,255,0.2)" stroke-width="2" stroke-linecap="round"/>
                        <line x1="4" y1="0" x2="4" y2="8" stroke="rgba(0,0,0,0.12)" stroke-width="1.5" stroke-linecap="round"/>
                    </pattern>
                    <pattern id="tavern-texture-2" patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(-68)">
                        <rect width="10" height="10" fill="transparent"/>
                        <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(255,255,255,0.18)" stroke-width="2.5" stroke-linecap="round"/>
                        <line x1="5" y1="0" x2="5" y2="10" stroke="rgba(0,0,0,0.1)" stroke-width="2" stroke-linecap="round"/>
                    </pattern>
                </defs>
                <g>
                    ${layersSVG}
                </g>
            </svg>
            <div class="tavern-glass-shine"></div>
        </div>
    `;
}

function goToDrink(index) {
    const drinks = tavernState.drinks;
    if (index < 0) index = drinks.length - 1;
    if (index >= drinks.length) index = 0;
    tavernState.carouselIndex = index;
    renderCarousel();
}

function prevDrink() {
    goToDrink((tavernState.carouselIndex || 0) - 1);
}

function nextDrink() {
    goToDrink((tavernState.carouselIndex || 0) + 1);
}

function initTouchSupport() {
    const carousel = document.getElementById('drink-carousel');
    let startX = 0;
    let startY = 0;
    let isDragging = false;
    
    carousel.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = true;
    }, { passive: true });
    
    carousel.addEventListener('touchend', (e) => {
        if (!isDragging) return;
        isDragging = false;
        
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const diffX = endX - startX;
        const diffY = endY - startY;
        
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
            if (diffX > 0) {
                prevDrink();
            } else {
                nextDrink();
            }
        }
    }, { passive: true });
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}.${m}.${d}`;
}

async function openDrinkDetail(drinkId) {
    // P0-3: 详情请求带超时；不再依赖 useBackend 变量，直接走后端（超时/错误自动回本地）
    let needFallback = true;
    try {
        const res = await fetchWithTimeout(
            `/api/tavern/${tavernState.token}/detail/${encodeURIComponent(drinkId)}`,
            { timeoutMs: 8000 }
        );
        const data = await res.json();
        if (data.success) {
            tavernState.currentDrink = data.data;
            renderModal(data.data);
            document.getElementById('drink-modal').classList.add('active');
            needFallback = false;
            return;
        } else {
            console.warn('后端详情返回错误:', data.error);
            showToast(`加载酒详情失败：${data.error || '未知'}，正在重试`, '⚠️');
        }
    } catch (err) {
        if (isAbortError(err)) {
            console.warn('后端详情超时，回退本地');
        } else {
            console.warn('后端详情加载失败，回退本地:', err);
        }
    }

    // 本地兜底 1：按 id 精确匹配 localStorage（老数据存 id=hex，新数据存 drink_id=hex + id 自增数值主键）
    const allDrinks = JSON.parse(localStorage.getItem('gaoyidian_drinks') || '[]');
    const drink = allDrinks.find(d =>
        d.id === drinkId || d.drink_id === drinkId || String(d.id) === String(drinkId)
    );

    if (drink) {
        const recipe = DRINK_RECIPES.find(r => r.id === drink.recipe_id);
        const siblings = allDrinks
            .filter(d => d.recipe_id === drink.recipe_id)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const bartenders = siblings.map(s => ({
            drink_id: s.drink_id || s.id,
            drink_business_id: s.drink_id || String(s.id),
            bartender_name: s.bartender_name,
            created_at: s.created_at
        }));
        const drinkData = {
            drink_id: drink.drink_id || drink.id,
            drink_business_id: drink.drink_id || String(drink.id),
            bartender_name: drink.bartender_name,
            created_at: drink.created_at,
            answers: drink.answers,
            tags: drink.tags,
            bartenders: bartenders,
            recipe: recipe
        };
        tavernState.currentDrink = drinkData;
        renderModal(drinkData);
        document.getElementById('drink-modal').classList.add('active');
        needFallback = false;
        return;
    }

    // 本地兜底 2：在 tavernState.drinks（后端返回的聚合卡片）里找
    const tavernDrink = tavernState.drinks.find(d =>
        d.drink_id === drinkId || String(d.drink_id) === String(drinkId)
    );
    if (tavernDrink && tavernDrink.collected) {
        const recipe = DRINK_RECIPES.find(r => r.id === tavernDrink.recipe_id);
        if (recipe) {
            const siblings = (tavernState.allDrinks || [])
                .filter(d => d.recipe_id === tavernDrink.recipe_id)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            const bartenders = siblings.length
                ? siblings.map(s => ({
                    drink_id: s.drink_id || String(s.id),
                    drink_business_id: s.drink_id || String(s.id),
                    bartender_name: s.bartender_name,
                    created_at: s.created_at
                }))
                : [{
                    drink_id: tavernDrink.drink_id,
                    drink_business_id: tavernDrink.drink_id,
                    bartender_name: tavernDrink.bartender_name,
                    created_at: tavernDrink.created_at
                }];
            const drinkData = {
                drink_id: tavernDrink.drink_id,
                drink_business_id: tavernDrink.drink_id,
                bartender_name: tavernDrink.bartender_name,
                created_at: tavernDrink.created_at,
                answers: [],
                tags: [],
                bartenders: bartenders,
                recipe: recipe
            };
            tavernState.currentDrink = drinkData;
            renderModal(drinkData);
            document.getElementById('drink-modal').classList.add('active');
            needFallback = false;
        }
    }

    if (needFallback) {
        showToast('找不到这杯酒的详情，可能是旧本地缓存未同步 🙈', '🙈');
    }
}

function renderModal(drink) {
    const recipe = drink.recipe;
    document.getElementById('modal-name-en').textContent = recipe.english_name;
    document.getElementById('modal-name-cn').textContent = recipe.drink_name;
    document.getElementById('modal-type').textContent = recipe.drink_type;
    document.getElementById('modal-story').textContent = recipe.story;

    // 调酒师信息渲染：如果有 bartenders 数组就多行列出（按时间倒序），否则回退到单条显示
    const infoRoot = document.getElementById('modal-bartender-info');
    const bartenders = Array.isArray(drink.bartenders) && drink.bartenders.length
        ? drink.bartenders
        : [{ bartender_name: drink.bartender_name, created_at: drink.created_at }];

    if (bartenders.length <= 1) {
        // 只有 1 位的情形：保持原有单行样式，"Created by 名字 · 日期"
        const bt = bartenders[0] || {};
        infoRoot.innerHTML =
            `Created by <strong id="modal-bartender">${bt.bartender_name || '—'}</strong> · <span id="modal-date">${formatDate(bt.created_at) || '—'}</span>`;
    } else {
        // 多位的情形：改成多行卡片列表，每行一位调酒师 + 各自时间
        const rows = bartenders.map((bt, idx) => `
            <div class="bartender-row" style="
                display: flex;
                align-items: baseline;
                justify-content: space-between;
                gap: 12px;
                padding: 10px 14px;
                margin-top: ${idx === 0 ? '8px' : '6px'};
                border: 1px solid rgba(232, 184, 109, 0.18);
                background: rgba(255, 248, 235, 0.04);
                border-radius: 10px;
            ">
                <div style="display:flex;align-items:baseline;gap:8px;min-width:0;">
                    <span style="font-size:12px;color:#b8a486;letter-spacing:0.5px;white-space:nowrap;">
                        ${idx === 0 ? '最新 · Created by' : 'Created by'}
                    </span>
                    <strong style="color:var(--accent,#e8b86d);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                        ${bt.bartender_name || '—'}
                    </strong>
                </div>
                <span style="font-size:12px;color:#9a8a74;letter-spacing:0.5px;white-space:nowrap;">
                    ${formatDate(bt.created_at) || '—'}
                </span>
            </div>
        `).join('');
        infoRoot.innerHTML = `
            <div style="font-size:12px;color:#9a8a74;letter-spacing:1.5px;margin-bottom:2px;">
                共 ${bartenders.length} 位调酒师调出了这款酒
            </div>
            ${rows}
        `;
    }

    const previewEl = document.getElementById('modal-drink-preview');
    const animConfig = recipe.animation_config || null;
    if (animConfig) {
        previewEl.innerHTML = generateDrinkSVG(animConfig);
        previewEl.style.display = 'flex';
    } else {
        previewEl.innerHTML = '';
        previewEl.style.display = 'none';
    }

    const ingredientsList = document.getElementById('modal-ingredients');
    ingredientsList.innerHTML = '';

    recipe.ingredients.forEach(ing => {
        const item = document.createElement('div');
        item.className = 'ingredient-item';
        item.innerHTML = `
            <div class="ingredient-emoji">${ing.emoji}</div>
            <div class="ingredient-content">
                <div class="ingredient-name">${ing.name}</div>
                <div class="ingredient-meaning">${ing.meaning}</div>
            </div>
        `;
        ingredientsList.appendChild(item);
    });
}

function closeModal() {
    document.getElementById('drink-modal').classList.remove('active');
}

function closeStatsModal() {
    document.getElementById('stats-modal').classList.remove('active');
}

function closeStatsModalInstant() {
    const modal = document.getElementById('stats-modal');
    if (modal) {
        modal.classList.add('no-transition');
        modal.classList.remove('active');
        // Force reflow/repaint to ensure it disappears instantly
        modal.offsetHeight;
        modal.classList.remove('no-transition');
    }
}

document.getElementById('drink-modal').addEventListener('click', (e) => {
    if (e.target.id === 'drink-modal') {
        closeModal();
    }
});

document.getElementById('stats-modal').addEventListener('click', (e) => {
    if (e.target.id === 'stats-modal') {
        closeStatsModal();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeStatsModal();
    }
});

function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-99999px';
        textArea.style.top = '-99999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        return new Promise((resolve, reject) => {
            if (document.execCommand('copy')) {
                resolve();
            } else {
                reject();
            }
            textArea.remove();
        });
    }
}

function showToast(message, icon = '✨') {
    const existing = document.getElementById('custom-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'custom-toast';
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${icon}</span>
            <span class="toast-text">${message}</span>
        </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3800);
}

function showWeChatShareGuide(title, firstStepMessage) {
    let guide = document.getElementById('wechat-share-guide');
    if (!guide) {
        guide = document.createElement('div');
        guide.id = 'wechat-share-guide';
        guide.onclick = () => {
            guide.classList.remove('show');
            setTimeout(() => guide.remove(), 350);
        };
        document.body.appendChild(guide);
    }
    
    guide.innerHTML = `
        <div class="guide-container">
            <svg class="guide-arrow-svg" viewBox="0 0 100 100">
                <path d="M10 80 Q 45 45 75 15 M75 15 L55 15 M75 15 L75 35" fill="none" stroke="#e8b86d" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            <div class="guide-text-box" onclick="event.stopPropagation()">
                <div class="guide-title">${title}</div>
                <div class="guide-desc">1. ${firstStepMessage}</div>
                <div class="guide-desc">2. 点击右上角 <strong style="color: var(--accent); font-size:16px;">[…]</strong></div>
                <div class="guide-desc">3. 选择 <strong style="color: var(--accent);">「发送给朋友」</strong> 或 <strong>「分享到朋友圈」</strong></div>
                <div class="guide-footer">点击任意空白处关闭</div>
            </div>
        </div>
    `;
    
    guide.style.display = 'block';
    guide.offsetHeight;
    guide.classList.add('show');
}

function copyInviteLink() {
    let baseUrl = window.location.origin + window.location.pathname;
    if (baseUrl.includes('tavern')) {
        baseUrl = baseUrl.replace('tavern.html', '');
    }
    if (!baseUrl.endsWith('/')) {
        baseUrl += '/';
    }
    const link = baseUrl; // 纯净的首页网址：buy-gaoyidian-a-drink.vercel.app
    const text = `请高一点喝一杯！快来为她调制一杯专属鸡尾酒，解锁属于我们的浪漫配方吧！🍸`;

    // 动态修改浏览器地址栏为首页链接，确保微信右上角 [...] 菜单分享时分享的是纯净首页，而不是酒馆锁定页
    if (window.history && window.history.replaceState) {
        window.history.replaceState(null, '', '/');
    }

    const isWeChat = navigator.userAgent.toLowerCase().includes('micromessenger');

    if (isWeChat) {
        // 微信内置浏览器：静默复制首页链接 + 弹出微信右上角分享引导
        copyToClipboard(link).then(() => {
            showWeChatShareGuide('🥂 寻找我的调酒师 🥂', '小酒馆首页网址已<strong>自动复制</strong>！可以直接粘贴发送给好友');
        }).catch(() => {
            showWeChatShareGuide('🥂 寻找我的调酒师 🥂', '小酒馆分享通道已就绪！可以邀请好友来为您调酒啦');
        });
    } else if (navigator.share) {
        navigator.share({
            title: '请高一点喝一杯',
            text: text,
            url: link
        }).catch(() => {
            copyToClipboard(link).then(() => {
                showToast('已自动为您复制小酒馆首页链接！✨<br>快去粘贴发给朋友吧！', '✨');
            });
        });
    } else {
        copyToClipboard(link).then(() => {
            showToast('首页链接已成功复制到剪贴板！✨<br>快去粘贴发给朋友吧！', '✨');
        }).catch(() => {
            prompt('请复制以下首页链接分享：', link);
        });
    }
}

function refreshTavern() {
    tavernState.carouselIndex = 0;
    loadTavern();
}

function openBartendersModal() {
    const allDrinks = tavernState.allDrinks || [];
    const collectedDrinks = allDrinks.filter(d => d.bartender_name);

    document.getElementById('stats-modal-label').textContent = 'BARTENDER ARCHIVE';
    document.getElementById('stats-modal-title').textContent = '调酒师名录';
    document.getElementById('stats-modal-subtitle').textContent = '这些人都为你调过酒';

    const body = document.getElementById('stats-modal-body');
    body.innerHTML = '';

    if (collectedDrinks.length === 0) {
        body.innerHTML = `<div class="stats-empty">暂无调酒师历史记录</div>`;
        document.getElementById('stats-modal').classList.add('active');
        return;
    }

    // 1. Calculate Top 3 Bartenders
    const bartenderCounts = {};
    collectedDrinks.forEach(d => {
        const name = d.bartender_name.trim();
        bartenderCounts[name] = (bartenderCounts[name] || 0) + 1;
    });

    const sortedBartenders = Object.entries(bartenderCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);

    const container = document.createElement('div');
    container.className = 'flavor-profile-detail';

    // 第一部分：TOP 3 调酒师
    const topSection = document.createElement('div');
    topSection.className = 'flavor-section';
    topSection.innerHTML = `<div class="flavor-section-title">🏆 TOP 3 调酒师</div>`;

    const topList = document.createElement('div');
    topList.className = 'ranking-list';

    const maxCount = sortedBartenders[0] ? sortedBartenders[0].count : 1;
    sortedBartenders.slice(0, 3).forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'ranking-item';

        const widthPercent = (item.count / maxCount) * 100;

        row.innerHTML = `
            <div class="ranking-info">
                <span class="rank-num">${index + 1}</span>
                <span class="rank-name">${escapeHTML(item.name)}</span>
                <span class="rank-count">${item.count}杯</span>
            </div>
            <div class="rank-bar-bg">
                <div class="rank-bar-fill" style="width: ${widthPercent}%;"></div>
            </div>
        `;
        topList.appendChild(row);
    });
    topSection.appendChild(topList);
    container.appendChild(topSection);

    // 第二部分：所有调酒记录
    const historySection = document.createElement('div');
    historySection.className = 'flavor-section';
    historySection.innerHTML = `<div class="flavor-section-title">📅 所有调酒记录</div>`;

    const ledger = document.createElement('div');
    ledger.className = 'bartender-ledger';
    ledger.style.maxHeight = '32vh'; // 高度自适应，保证移动端可滚动

    const sortedRecords = [...collectedDrinks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    sortedRecords.forEach(d => {
        let drinkName = d.drink_name;
        if (!drinkName && d.recipe_id) {
            const recipe = DRINK_RECIPES.find(r => r.id === d.recipe_id);
            if (recipe) drinkName = recipe.drink_name;
        }
        if (!drinkName && d.drink_recipes) {
            drinkName = d.drink_recipes.drink_name;
        }
        drinkName = drinkName || '未知酒款';

        const item = document.createElement('div');
        item.className = 'ledger-item';
        
        if (d.id && !String(d.id).startsWith('preview_')) {
            item.classList.add('clickable');
            item.onclick = () => {
                closeStatsModalInstant();
                openDrinkDetail(d.id);
            };
        }
        
        item.innerHTML = `
            <div class="ledger-meta" style="font-size: 14px; width: 100%; display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                <span class="ledger-bartender" style="font-size: 14px; font-family: inherit; color: #eee; font-weight: normal; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex-grow: 1;">
                    🥂 <strong style="color: var(--accent); font-weight: 600;">${drinkName}</strong> by ${escapeHTML(d.bartender_name)}
                </span>
                <span class="ledger-date" style="font-size: 12px; color: #888; flex-shrink: 0; white-space: nowrap;">${formatDate(d.created_at)}</span>
            </div>
        `;
        ledger.appendChild(item);
    });
    
    historySection.appendChild(ledger);
    container.appendChild(historySection);

    body.appendChild(container);
    document.getElementById('stats-modal').classList.add('active');
}

function openFlavorModal() {
    const allDrinks = tavernState.allDrinks || [];
    
    document.getElementById('stats-modal-label').textContent = 'TAVERN FLAVOR PROFILE';
    document.getElementById('stats-modal-title').textContent = '本馆风味谱系';
    document.getElementById('stats-modal-subtitle').textContent = '基于所有已调制酒款的风味基因分析';

    const body = document.getElementById('stats-modal-body');
    body.innerHTML = '';

    if (allDrinks.length === 0) {
        body.innerHTML = `<div class="stats-empty">暂无风味分析记录</div>`;
        document.getElementById('stats-modal').classList.add('active');
        return;
    }

    const drinkStats = {};
    allDrinks.forEach(d => {
        let recipeId = d.recipe_id;
        if (!recipeId && d.recipe) recipeId = d.recipe.id;
        if (!recipeId) return;

        const recipe = DRINK_RECIPES.find(r => r.id === recipeId);
        if (!recipe) return;

        if (!drinkStats[recipeId]) {
            drinkStats[recipeId] = {
                recipe: recipe,
                count: 0
            };
        }
        drinkStats[recipeId].count++;
    });

    const sortedDrinks = Object.values(drinkStats).sort((a, b) => b.count - a.count);
    const topDrinkObj = sortedDrinks[0];
    
    const tagCounts = {};
    allDrinks.forEach(d => {
        let recipeId = d.recipe_id;
        if (!recipeId && d.recipe) recipeId = d.recipe.id;
        if (!recipeId) return;

        const recipe = DRINK_RECIPES.find(r => r.id === recipeId);
        if (!recipe) return;

        const tags = recipe.tags || [];
        tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
    });

    const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

    const container = document.createElement('div');
    container.className = 'flavor-profile-detail';

    if (topDrinkObj) {
        const percent = Math.round((topDrinkObj.count / allDrinks.length) * 100);
        const sigBox = document.createElement('div');
        sigBox.className = 'flavor-section';
        sigBox.innerHTML = `
            <div class="flavor-section-title">👑 本馆招牌饮品</div>
            <div class="signature-drink-box" onclick="closeStatsModalInstant(); openDrinkDetail('${allDrinks.find(d => d.recipe_id === topDrinkObj.recipe.id)?.id || ''}')" style="cursor:pointer;">
                <div class="sig-name">${topDrinkObj.recipe.drink_name}</div>
                <div class="sig-desc">占据了本馆酒柜的 ${percent}%（累计调制 ${topDrinkObj.count} 次）</div>
            </div>
        `;
        container.appendChild(sigBox);
    }

    const rankSection = document.createElement('div');
    rankSection.className = 'flavor-section';
    rankSection.innerHTML = `<div class="flavor-section-title">🏆 热门饮品排行</div>`;
    
    const rankList = document.createElement('div');
    rankList.className = 'ranking-list';

    const maxCount = sortedDrinks[0] ? sortedDrinks[0].count : 1;
    sortedDrinks.slice(0, 5).forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'ranking-item';
        
        const inst = allDrinks.find(d => d.recipe_id === item.recipe.id);
        if (inst && inst.id && !String(inst.id).startsWith('preview_')) {
            row.classList.add('clickable');
            row.onclick = () => {
                closeStatsModalInstant();
                openDrinkDetail(inst.id);
            };
        }

        const widthPercent = (item.count / maxCount) * 100;

        row.innerHTML = `
            <div class="ranking-info">
                <span class="rank-num">${index + 1}</span>
                <span class="rank-name">${item.recipe.drink_name}</span>
                <span class="rank-count">${item.count}次</span>
            </div>
            <div class="rank-bar-bg">
                <div class="rank-bar-fill" style="width: ${widthPercent}%;"></div>
            </div>
        `;
        rankList.appendChild(row);
    });
    rankSection.appendChild(rankList);
    container.appendChild(rankSection);

    if (sortedTags.length > 0) {
        const tagSection = document.createElement('div');
        tagSection.className = 'flavor-section';
        tagSection.innerHTML = `<div class="flavor-section-title">✨ 风味基因印记</div>`;

        const tagsGrid = document.createElement('div');
        tagsGrid.className = 'dna-tags-grid';

        sortedTags.forEach(([tag, count]) => {
            const pill = document.createElement('div');
            pill.className = 'dna-tag-pill';
            pill.innerHTML = `
                <span class="dna-tag-name">${tag}</span>
                <span class="dna-tag-count">${count}次</span>
            `;
            tagsGrid.appendChild(pill);
        });

        tagSection.appendChild(tagsGrid);
        container.appendChild(tagSection);
    }

    body.appendChild(container);
    document.getElementById('stats-modal').classList.add('active');
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
}

loadTavern();
initTouchSupport();

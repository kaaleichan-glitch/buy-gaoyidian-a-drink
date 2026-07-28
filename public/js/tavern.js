const tavernState = {
    token: null,
    drinks: [],
    currentDrink: null,
    useBackend: true,
    totalRecipes: 32,
    collectedCount: 0
};

async function checkBackend() {
    try {
        const res = await fetch('/api/questions', { method: 'HEAD' });
        tavernState.useBackend = res.ok;
    } catch (err) {
        tavernState.useBackend = false;
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
    await checkBackend();
    
    const token = getToken();
    if (!token) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('entry') === 'true') {
            showLockScreen();
        } else {
            window.location.href = 'index.html';
            return;
        }
        return;
    }
    
    hideLockScreen();
    setToken(token);

    if (tavernState.useBackend) {
        try {
            const res = await fetch(`/api/tavern/${tavernState.token}`);
            const data = await res.json();
            
            if (data.success) {
                tavernState.drinks = data.data;
                tavernState.allDrinks = data.all_drinks || [];
                tavernState.totalRecipes = data.total || 32;
                tavernState.collectedCount = data.collected_count || 0;
                applyPreviewMode();
                renderTavern();
                return;
            }
        } catch (err) {
            console.warn('后端不可用，使用云端/本地数据');
        }
    }

    if (initCloud()) {
        try {
            await syncLocalDrinksToCloud(tavernState.token);
            const cloudDrinks = await getCloudDrinks(tavernState.token);
            if (cloudDrinks) {
                const localDrinks = JSON.parse(localStorage.getItem('gaoyidian_drinks') || '[]');
                const localIds = new Set(localDrinks.map(d => d.id));
                for (const cd of cloudDrinks) {
                    if (!localIds.has(cd.id)) {
                        localDrinks.push(cd);
                    }
                }
                localStorage.setItem('gaoyidian_drinks', JSON.stringify(localDrinks));
            }
        } catch (err) {
            console.warn('云端同步失败，使用本地数据:', err);
        }
    }

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
                drink_id: collected.id,
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
    renderTavern();
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
    if (tavernState.useBackend) {
        try {
            const res = await fetch(`/api/tavern/${tavernState.token}/detail/${drinkId}`);
            const data = await res.json();
            
            if (data.success) {
                tavernState.currentDrink = data.data;
                renderModal(data.data);
                document.getElementById('drink-modal').classList.add('active');
                return;
            }
        } catch (err) {
            console.warn('后端加载失败，使用本地数据');
        }
    }

    const allDrinks = JSON.parse(localStorage.getItem('gaoyidian_drinks') || '[]');
    const drink = allDrinks.find(d => d.id === drinkId);
    
    if (drink) {
        const recipe = DRINK_RECIPES.find(r => r.id === drink.recipe_id);
        const drinkData = {
            drink_id: drink.id,
            bartender_name: drink.bartender_name,
            created_at: drink.created_at,
            answers: drink.answers,
            tags: drink.tags,
            recipe: recipe
        };
        tavernState.currentDrink = drinkData;
        renderModal(drinkData);
        document.getElementById('drink-modal').classList.add('active');
        return;
    }

    const tavernDrink = tavernState.drinks.find(d => d.drink_id === drinkId);
    if (tavernDrink && tavernDrink.collected) {
        const recipe = DRINK_RECIPES.find(r => r.id === tavernDrink.recipe_id);
        if (recipe) {
            const drinkData = {
                drink_id: tavernDrink.drink_id,
                bartender_name: tavernDrink.bartender_name,
                created_at: tavernDrink.created_at,
                answers: [],
                tags: [],
                recipe: recipe
            };
            tavernState.currentDrink = drinkData;
            renderModal(drinkData);
            document.getElementById('drink-modal').classList.add('active');
        }
    }
}

function renderModal(drink) {
    const recipe = drink.recipe;
    document.getElementById('modal-name-en').textContent = recipe.english_name;
    document.getElementById('modal-name-cn').textContent = recipe.drink_name;
    document.getElementById('modal-type').textContent = recipe.drink_type;
    document.getElementById('modal-bartender').textContent = drink.bartender_name;
    document.getElementById('modal-date').textContent = formatDate(drink.created_at);
    document.getElementById('modal-story').textContent = recipe.story;

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
        
        if (d.id && !d.id.startsWith('preview_')) {
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
        if (inst && inst.id && !inst.id.startsWith('preview_')) {
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

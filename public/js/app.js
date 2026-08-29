const state = {
    questions: [],
    currentQuestion: 0,
    answers: [],
    bartenderName: '',
    result: null,
    ownerToken: null,
    useBackend: true
};

let audioCtx = null;
let completeSound = null;
let mixingAnimationTimer = null;

function initSound() {
    if (!completeSound) {
        completeSound = new Audio('audio/quottadamquot-sound.mp3');
        completeSound.preload = 'auto';
    }
}

function playCompleteSound() {
    try {
        initSound();
        if (completeSound) {
            completeSound.currentTime = 0;
            completeSound.play().catch(e => console.log('音效播放失败:', e));
        }
    } catch (e) {
        console.log('音效播放失败:', e);
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    window.scrollTo(0, 0);
}

async function checkBackend() {
    try {
        const res = await fetch('/api/questions', { method: 'HEAD' });
        state.useBackend = res.ok;
    } catch (err) {
        state.useBackend = false;
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

function shuffleArray(arr) {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function questionHasGaoyidian(q) {
    const text = q.question_text;
    if (text.includes('高一点')) return true;
    for (const opt of q.options) {
        if (opt.text.includes('高一点')) return true;
    }
    return false;
}

function checkUrlShare() {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('recipe_id');
    const bartenderName = urlParams.get('bartender');
    
    if (recipeId && bartenderName) {
        const recipe = DRINK_RECIPES.find(r => String(r.id) === String(recipeId));
        if (recipe) {
            state.result = {
                drink_id: 'shared',
                bartender_name: decodeURIComponent(bartenderName),
                recipe: recipe
            };
            renderResult();
        }
    }
}

async function loadQuestions() {
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
    
    if (initCloud()) {
        const token = localStorage.getItem('gaoyidian_tavern_token');
        if (token) {
            mergeCloudDrinksToLocal(token);
        }
    }
    
    // 启动时：先尝试自动补发旧的本地酒（之前 saveDrinkToCloud 都因为字段错误失败了）
    // 走首选 /api/drinks（Netlify→Supabase 内网可通，比浏览器直连稳定得多）
    // 异步执行，不阻塞页面
    (async () => {
        try {
            const token = localStorage.getItem('gaoyidian_tavern_token');
            const oldQueue = JSON.parse(localStorage.getItem(FAILED_DRINKS_KEY) || '[]');

            // 1. 先尝试失败队列里积压的（如果有的话）
            if (oldQueue.length) {
                await retryFailedQueue();
            }

            // 2. 再做一次历史本地酒的补同步（只补 token 匹配的）
            if (token && state.useBackend) {
                const res = await syncLocalDrinksToCloud(token, { verbose: true, site_id: 'default' });
                if (res && (res.synced > 0 || res.failed > 0)) {
                    if (res.synced > 0 && res.failed === 0) {
                        showToast(`已把之前 ${res.synced} 杯酒补发进云端酒馆 ✅`, '🍸');
                    } else if (res.synced > 0 && res.failed > 0) {
                        showToast(`${res.synced} 杯补发成功，${res.failed} 杯失败，下次打开再试`, '⚠️');
                    }
                }
            }
        } catch (e) {
            console.warn('启动时自动补发失败：', e);
        }
    })();
    
    const flavorQ = QUESTIONS.filter(q => q.category === '风味');
    const timeQ = QUESTIONS.filter(q => q.category === '时间地点');
    const toastQ = QUESTIONS.filter(q => q.category === '祝酒词');
    
    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    
    let selected = [
        pickRandom(flavorQ),
        pickRandom(timeQ),
        pickRandom(toastQ)
    ];
    
    const hasGaoyidian = selected.some(q => questionHasGaoyidian(q));
    if (!hasGaoyidian) {
        const toastWithGyd = toastQ.filter(q => questionHasGaoyidian(q));
        if (toastWithGyd.length > 0) {
            selected[2] = pickRandom(toastWithGyd);
        }
    }
    
    state.questions = selected.map(q => ({
        ...q,
        options: shuffleArray(q.options)
    }));

    checkUrlShare();
}

function startQuiz() {
    const nameInput = document.getElementById('bartender-name');
    const name = nameInput.value.trim();
    
    if (!name) {
        nameInput.style.borderBottomColor = '#e63946';
        nameInput.focus();
        setTimeout(() => {
            nameInput.style.borderBottomColor = '';
        }, 1000);
        return;
    }

    state.bartenderName = name;
    state.currentQuestion = 0;
    state.answers = [];

    // 优先级：URL ?token=  >  酒馆密令（localStorage）  >  默认 '高一点'
    const urlParams = new URLSearchParams(window.location.search);
    const savedTavernToken = localStorage.getItem('gaoyidian_tavern_token');
    const urlToken = urlParams.get('token');
    state.ownerToken = urlToken || savedTavernToken || '高一点';

    // 同步写回 localStorage，保证之后进酒馆页和当前 token 一致
    if (!savedTavernToken) {
        localStorage.setItem('gaoyidian_tavern_token', state.ownerToken);
    } else if (urlToken && urlToken !== savedTavernToken) {
        // 如果 URL 带了新 token，以 URL 为准并覆盖
        localStorage.setItem('gaoyidian_tavern_token', urlToken);
    }

    renderQuestion();
    showScreen('quiz-screen');
}

function randomizeCurrentQuestion() {
    const currentCat = state.questions[state.currentQuestion].category;
    const allInCat = QUESTIONS.filter(q => q.category === currentCat);
    const usedIds = state.questions.map(q => q.id);
    
    let available = allInCat.filter(q => !usedIds.includes(q.id));
    
    if (available.length === 0) {
        available = allInCat.filter(q => q.id !== state.questions[state.currentQuestion].id);
    }
    
    if (available.length === 0) return;
    
    const newQ = available[Math.floor(Math.random() * available.length)];
    state.questions[state.currentQuestion] = {
        ...newQ,
        options: shuffleArray(newQ.options)
    };
    
    renderQuestion();
}

function renderQuestion() {
    const q = state.questions[state.currentQuestion];
    if (!q) return;

    const progress = ((state.currentQuestion) / state.questions.length) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
    document.getElementById('question-number').textContent = 
        `QUESTION ${state.currentQuestion + 1} / ${state.questions.length}`;
    document.getElementById('question-text').innerHTML = `💬 ${q.question_text}`;

    const optionsList = document.getElementById('options-list');
    optionsList.innerHTML = '';

    q.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt.text;
        btn.style.animation = 'none';
        btn.onclick = () => selectOption(index);
        optionsList.appendChild(btn);

        setTimeout(() => {
            btn.style.animation = `fadeInUp 0.5s ease ${index * 0.1}s both`;
        }, 10);
    });
}

function selectOption(optionIndex) {
    const q = state.questions[state.currentQuestion];
    const selected = q.options[optionIndex];

    // 立即为当前点击的选项添加 selected 类，展示选中效果
    const btns = document.querySelectorAll('#options-list .option-btn');
    if (btns[optionIndex]) {
        btns[optionIndex].classList.add('selected');
    }

    state.answers.push({
        question_id: q.id,
        question_text: q.question_text,
        answer_text: selected.text,
        tags: selected.tags
    });

    if (state.currentQuestion < state.questions.length - 1) {
        state.currentQuestion++;
        setTimeout(() => {
            renderQuestion();
        }, 300);
    } else {
        document.getElementById('progress-fill').style.width = '100%';
        setTimeout(() => {
            startMixing();
        }, 500);
    }
}

function playMixingAnimation(recipe) {
    if (mixingAnimationTimer) {
        clearTimeout(mixingAnimationTimer);
        mixingAnimationTimer = null;
    }

    const glass = document.getElementById('drink-glass');
    const liquid = document.getElementById('drink-liquid');
    const pencilSvg = document.getElementById('pencil-svg');
    const pencilLayersSvg = document.getElementById('pencil-layers-svg');
    const ingredientsLayer = document.getElementById('ingredients-layer');
    const stepEl = document.getElementById('mixing-step');
    const titleEl = document.getElementById('mixing-title');

    const animConfig = recipe.animation_config || {
        glass: 'rocks',
        liquidColor: 'linear-gradient(180deg, rgba(232, 184, 109, 0.6), rgba(201, 154, 79, 0.8))',
        pencilLayers: [],
        ritualAction: null,
        ingredients: []
    };

    // 立即赋予杯子选中款式的类名，避免初始闪现默认的巨型矩形杯子
    glass.className = `drink-glass glass-${animConfig.glass}`;
    
    liquid.style.height = '0';
    liquid.style.background = '';
    if (pencilLayersSvg) pencilLayersSvg.innerHTML = '';
    ingredientsLayer.innerHTML = '';
    
    const oldRitual = document.querySelector('.ritual-layer');
    if (oldRitual) oldRitual.remove();
    const oldFireworks = document.querySelector('.fireworks-container');
    if (oldFireworks) oldFireworks.remove();
    
    stepEl.textContent = '';
    titleEl.textContent = '选一个合适的杯子…';

    let lastLayerDelay = 2200;

    const glassFillRatios = {
        wine: 0.85,
        coupe: 0.85,
        coupe_tall: 0.85,
        margarita: 0.85,
        cocktail: 0.85,
        cocktail_tall: 0.85,
        burgundy: 0.85
    };
    const fillRatio = glassFillRatios[animConfig.glass] || 1.0;

    setTimeout(() => {
        titleEl.textContent = '选一个合适的杯子…';
        titleEl.style.animation = 'none';
        titleEl.offsetHeight;
        titleEl.style.animation = 'fadeIn 0.5s ease forwards';
    }, 100);

    const baseInterval = 800;
    const stirDelayAfterLayer2 = 600;
    const shakeDelayAfterLayer3 = 700;
    const shakeDuration = 1200;

    if (animConfig.pencilLayers && animConfig.pencilLayers.length > 0 && pencilLayersSvg) {
        const layers = animConfig.pencilLayers;
        
        const layerDelays = [
            0,
            baseInterval,
            baseInterval * 2 + stirDelayAfterLayer2
        ];
        
        layers.forEach((layer, index) => {
            const delay = 1200 + (layerDelays[index] !== undefined ? layerDelays[index] : index * baseInterval);
            
            setTimeout(() => {
                let layerTop, layerBottom;
                
                const bottomOffset = 50;
                const sideOffset = 15;
                const topOffset = 10;
                
                if (layer.top !== undefined && layer.bottom !== undefined) {
                    layerTop = layer.top - topOffset;
                    layerBottom = layer.bottom + bottomOffset;
                } else {
                    const layerHeight = (layer.height || 200) * fillRatio;
                    layerTop = 300 - layerHeight - topOffset;
                    layerBottom = 300 + bottomOffset;
                }
                
                let basePathD = `M ${-sideOffset} ${layerBottom} L ${-sideOffset} ${layerTop}`;
                const segments = 20;
                const segWidth = (200 + sideOffset * 2) / segments;
                
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
                
                const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                g.setAttribute('class', 'pencil-layer-svg');
                g.setAttribute('data-layer', index);
                g.setAttribute('filter', 'url(#pencil-noise)');
                
                const basePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                basePath.setAttribute('d', basePathD);
                basePath.setAttribute('fill', layer.color);
                basePath.setAttribute('opacity', '0.65');
                g.appendChild(basePath);
                
                const texturePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                texturePath.setAttribute('d', texturePathD);
                texturePath.setAttribute('fill', `url(#pencil-texture-${(index % 2) + 1})`);
                texturePath.setAttribute('opacity', '0.6');
                g.appendChild(texturePath);
                
                pencilLayersSvg.appendChild(g);
                
                setTimeout(() => {
                    g.classList.add('show');
                }, 50);

                const stepTexts = [
                    `第一味是 ${layer.emoji} ${layer.name}…`,
                    `再加一点 ${layer.emoji} ${layer.name}…`,
                    `最后点缀 ${layer.emoji} ${layer.name}…`
                ];
                titleEl.textContent = stepTexts[index] || '调制中…';
                titleEl.style.animation = 'none';
                titleEl.offsetHeight;
                titleEl.style.animation = 'fadeIn 0.5s ease forwards';
                
                if (index === 1) {
                    setTimeout(() => {
                        const layers = pencilLayersSvg.querySelectorAll('.pencil-layer-svg');
                        layers.forEach((layerEl, i) => {
                            setTimeout(() => {
                                layerEl.classList.add('stirring');
                            }, i * 150);
                        });
                    }, stirDelayAfterLayer2);
                }
                
                if (index === 2) {
                    setTimeout(() => {
                        glass.classList.add('shaking');
                    }, shakeDelayAfterLayer3);
                }
            }, delay);
        });
        
        const totalDelay = 1200 + layerDelays[2] + shakeDelayAfterLayer3 + shakeDuration;
        lastLayerDelay = totalDelay;
    } else {
        setTimeout(() => {
            liquid.style.background = animConfig.liquidColor;
            liquid.style.height = '65%';
            titleEl.textContent = '倒入基酒...';
            titleEl.style.animation = 'none';
            titleEl.offsetHeight;
            titleEl.style.animation = 'fadeIn 0.5s ease forwards';
        }, 1200);
        lastLayerDelay = 2200;
    }

    mixingAnimationTimer = setTimeout(() => {
        glass.classList.remove('shaking');
        if (pencilLayersSvg) {
            const layers = pencilLayersSvg.querySelectorAll('.pencil-layer-svg');
            layers.forEach(layer => layer.classList.remove('stirring'));
        }
        
        playCompleteSound();
        titleEl.textContent = '高一点即将品鉴 ✔';
        titleEl.style.display = '';
        titleEl.style.animation = 'none';
        titleEl.offsetHeight;
        titleEl.style.animation = 'fadeIn 0.5s ease forwards';
        
        stepEl.textContent = '';
        stepEl.style.animation = 'none';
        
        setTimeout(() => {
            renderDrinkCardToMixing(recipe);
            
            // 动态更新浏览器地址栏的 URL，确保微信、浏览器等各种原生分享和复制，能获取到正确的酒卡详情
            try {
                const baseUrl = window.location.origin + window.location.pathname;
                const bartenderName = state.result.bartender_name;
                const shareUrl = `${baseUrl}?recipe_id=${recipe.id}&bartender=${encodeURIComponent(bartenderName)}`;
                window.history.replaceState(null, '', shareUrl);
            } catch (e) {
                console.warn('更新地址栏 URL 失败:', e);
            }
            
            // 动画完成后，隐藏顶部的“高一点即将品鉴 ✔”标题，使酒卡顶部更加清爽高雅
            titleEl.style.display = 'none';
            
            const resultHeader = document.getElementById('mixing-result-header');
            if (resultHeader) {
                resultHeader.style.display = 'block';
            }
            
            const cardDetails = document.getElementById('mixing-card-details');
            if (cardDetails) {
                cardDetails.style.display = 'block';
            }
        }, 800);
    }, lastLayerDelay);

    const totalDuration = lastLayerDelay + 1000;
    return totalDuration;
}

function renderDrinkCardToMixing(recipe) {
    document.getElementById('result-name-en-mixing').textContent = recipe.english_name;
    document.getElementById('result-name-cn-mixing').textContent = recipe.drink_name;
    document.getElementById('result-type-mixing').textContent = recipe.drink_type;
    document.getElementById('result-bartender-mixing').textContent = state.bartenderName.trim();
    document.getElementById('story-text-mixing').textContent = recipe.story;

    const ingredientsList = document.getElementById('ingredients-list-mixing');
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

async function startMixing() {
    showScreen('mixing-screen');
    
    const mixingScreen = document.getElementById('mixing-screen');
    if (mixingScreen) {
        mixingScreen.scrollTop = 0;
    }
    
    const mixingTitle = document.getElementById('mixing-title');
    if (mixingTitle) {
        mixingTitle.style.display = 'block';
    }
    
    const resultHeader = document.getElementById('mixing-result-header');
    if (resultHeader) {
        resultHeader.style.display = 'none';
    }
    
    const cardDetails = document.getElementById('mixing-card-details');
    if (cardDetails) {
        cardDetails.style.display = 'none';
    }

    let resultData = null;

    const allTags = [];
    for (const answer of state.answers) {
        if (answer.tags && Array.isArray(answer.tags)) {
            allTags.push(...answer.tags);
        }
    }

    const matched = matchDrinkRecipe(allTags);
    const drinkId = generateId();
    const ownerToken = state.ownerToken || '高一点';

    const drinkRecord = {
        id: drinkId,
        owner_token: ownerToken,
        recipe_id: matched.id,
        bartender_name: state.bartenderName.trim(),
        answers: state.answers,
        tags: allTags,
        created_at: new Date().toISOString()
    };

    // 本地先保存一份（UI 无延迟、断网也不会丢），然后异步双路写入云端
    {
        const drinks = JSON.parse(localStorage.getItem('gaoyidian_drinks') || '[]');
        const idx = drinks.findIndex(d => (d.drink_id || d.id) === drinkId);
        if (idx === -1) drinks.unshift(drinkRecord);
        else drinks[idx] = drinkRecord;
        localStorage.setItem('gaoyidian_drinks', JSON.stringify(drinks));
    }

    // 首选走后端中转 /api/drinks（Netlify → Supabase 内网可通），失败再直连，两条都败则入失败队列
    if (state.useBackend || initCloud()) {
        saveDrinkWithRetry(drinkRecord)
            .then(sr => {
                if (sr.ok) {
                    if (sr.via === 'api') showToast('已存入云端酒馆 ✅<br>换设备登录也能看到啦', '🍸');
                    else showToast('已存入云端 ✅', '🍸');
                } else {
                    showToast('暂时存不到云端，已保留在本地<br>下次打开会自动重试', '⚠️');
                    // 手动触发一下横幅显示（队列里有东西了）
                    try {
                        const pending = JSON.parse(localStorage.getItem(FAILED_DRINKS_KEY) || '[]');
                        if (pending.length) showDrinkSyncBanner('failed', {
                            total: pending.length,
                            sample: (sr.error && sr.error.message) ? sr.error.message.slice(0, 16) : '网络'
                        });
                    } catch (_) {}
                }
            })
            .catch(e => console.warn('saveDrinkWithRetry unhandled:', e));
    }

    // 先按本地逻辑构造 resultData（保证动画立刻播放，不依赖网络返回）
    resultData = {
        drink_id: drinkId,
        owner_token: ownerToken,
        recipe: matched,
        bartender_name: state.bartenderName.trim(),
        match_score: matched.score
    };

    // 注：如果云端 /api/drinks 返回的 recipe 有细微差异，也不影响 UI，
    // 因为酒馆页 / 分享卡都会重新从后端或云端按 recipe_id 取配方。

    state.result = resultData;
    
    playMixingAnimation(resultData.recipe);
}

function renderResult() {
    const r = state.result;
    const recipe = r.recipe;

    document.getElementById('result-name-en').textContent = recipe.english_name;
    document.getElementById('result-name-cn').textContent = recipe.drink_name;
    document.getElementById('result-type').textContent = recipe.drink_type;
    document.getElementById('result-bartender').textContent = r.bartender_name;
    document.getElementById('story-text').textContent = recipe.story;

    // 绘制结果页的专属调制成品酒杯预览，注入高灵动性的手绘 SVG 外观
    const previewEl = document.getElementById('result-drink-preview');
    if (previewEl) {
        if (recipe.animation_config) {
            previewEl.innerHTML = generateDrinkSVG(recipe.animation_config);
        } else {
            previewEl.innerHTML = '';
        }
    }

    const ingredientsList = document.getElementById('ingredients-list');
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

    showScreen('result-screen');
}

// 矢量酒杯与动态液面生成算法（从 tavern.js 移植，以支持分享酒卡的完美视觉呈现）
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

/* ========================= 云端写入：失败队列 + 自动补发 ========================= */
const FAILED_DRINKS_KEY = 'gaoyidian_failed_drinks_queue';
const SYNC_BANNER_ID = 'drink-sync-banner';

function _safeLSGet(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch (_) { return fallback; }
}
function _safeLSSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (_) { return false; }
}

// 把一杯写入失败的酒加入失败队列（会被下次页面加载自动重试）
function enqueueFailedDrink(drinkRecord, errDetail) {
    const q = _safeLSGet(FAILED_DRINKS_KEY, []);
    const did = drinkRecord.drink_id || drinkRecord.id;
    // 同一杯酒只保留最新一份
    const filtered = q.filter(x => (x.drink && (x.drink.drink_id || x.drink.id)) !== did);
    filtered.push({
        drink: drinkRecord,
        error: errDetail ? (errDetail.message || String(errDetail)) : 'unknown',
        code: errDetail && errDetail.code ? errDetail.code : null,
        pg_code: errDetail && errDetail.pg_code ? errDetail.pg_code : null,
        first_failed_at: new Date().toISOString(),
        last_failed_at: new Date().toISOString(),
        attempts: 1
    });
    _safeLSSet(FAILED_DRINKS_KEY, filtered);
    console.warn('[写入失败队列] 入队:', did, '队列长度:', filtered.length);
}

// 从失败队列中移除某杯酒（补发成功后）
function dequeueSucceededDrink(drinkOrId) {
    const did = (typeof drinkOrId === 'string' || typeof drinkOrId === 'number')
        ? String(drinkOrId)
        : String(drinkOrId.drink_id || drinkOrId.id);
    const q = _safeLSGet(FAILED_DRINKS_KEY, []);
    const next = q.filter(x => String(x.drink && (x.drink.drink_id || x.drink.id) || '') !== did);
    if (next.length !== q.length) _safeLSSet(FAILED_DRINKS_KEY, next);
    return q.length - next.length;
}

// 展示顶部横幅：告知用户有 N 杯酒在排队同步 / 同步失败
function showDrinkSyncBanner(status, payload) {
    let banner = document.getElementById(SYNC_BANNER_ID);
    if (status === 'hidden') {
        if (banner) banner.remove();
        return;
    }
    if (!banner) {
        banner = document.createElement('div');
        banner.id = SYNC_BANNER_ID;
        banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;padding:10px 16px;text-align:center;font-size:13px;line-height:1.5;backdrop-filter:blur(8px);';
        document.body.appendChild(banner);
    }
    let bg = 'rgba(20,20,30,0.75)', color = '#fff', icon = '☁️', text = '';
    if (status === 'syncing') { bg = 'rgba(28,100,180,0.85)'; icon = '🔄'; text = `正在把 ${payload.total} 杯酒同步到云端酒馆… 换设备也能看到啦`; }
    else if (status === 'done')   { bg = 'rgba(30,130,80,0.85)';  icon = '✅'; text = `已成功同步 ${payload.ok} 杯酒到云端${payload.failed ? `（${payload.failed} 杯失败，点击横幅重试）` : ''}`; }
    else if (status === 'failed') { bg = 'rgba(180,40,50,0.88)'; icon = '⚠️'; text = `有 ${payload.total} 杯酒暂时无法写入云端（${payload.sample || '网络'}），已保存到本地，点击这里立即重试`; }
    
    banner.style.background = bg;
    banner.style.color = color;
    banner.innerHTML = `<span style="margin-right:6px">${icon}</span><span>${text}</span>`;
    banner.onclick = () => retryFailedQueue({ interactive: true });
}

// 尝试用 /api/drinks 写入（首选：Netlify 中转 → Supabase，避开手机到 supabase.co 的直连问题）
async function saveDrinkViaApi(drinkRecord) {
    const res = await fetch('/api/drinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            // 传 drink_id 也传 id（老字段名兼容），server.js 会按 drink_id 优先入库
            id: drinkRecord.id,
            drink_id: drinkRecord.id,
            owner_token: drinkRecord.owner_token,
            recipe_id: drinkRecord.recipe_id,
            bartender_name: drinkRecord.bartender_name,
            answers: drinkRecord.answers,
            tags: drinkRecord.tags,
            created_at: drinkRecord.created_at
        })
    });
    let payload = null;
    const text = await res.text();
    try { payload = JSON.parse(text); } catch (_) { payload = { raw: text }; }
    if (res.ok && payload && payload.success) return payload;
    const err = new Error(payload && payload.error ? payload.error : (text || 'POST /api/drinks failed'));
    err.status = res.status;
    err.code = payload && payload.code ? payload.code : 'API_ERROR';
    err.pg_code = payload && payload.pg_code ? payload.pg_code : null;
    throw err;
}

// 双路写入：先试 /api/drinks，失败立刻试 saveDrinkToCloud（直连），两条都败 → 入失败队列
async function saveDrinkWithRetry(drinkRecord) {
    let lastErr = null;
    try {
        const r = await saveDrinkViaApi(drinkRecord);
        return { via: 'api', ok: true, response: r };
    } catch (e) {
        lastErr = e;
        console.warn('首选写入失败（/api/drinks），回退到直连 Supabase：', e && e.message);
    }
    try {
        if (!initCloud()) throw Object.assign(new Error('云端未初始化'), { code: 'CLOUD_DISABLED' });
        const r = await saveDrinkToCloud(drinkRecord, { site_id: 'default' });
        return { via: 'direct', ok: true, response: r };
    } catch (e2) {
        lastErr = e2;
        console.warn('直连写入也失败：', e2 && e2.message);
    }
    // 两条都败：入队
    enqueueFailedDrink(drinkRecord, lastErr);
    return { via: 'queue', ok: false, error: lastErr };
}

// 后台自动重试失败队列
async function retryFailedQueue(opts = {}) {
    const q = _safeLSGet(FAILED_DRINKS_KEY, []);
    if (!q || !q.length) { showDrinkSyncBanner('hidden'); return { total: 0, ok: 0, failed: 0 }; }

    if (opts.interactive) showToast('开始重试同步酒记录…', '🔄');
    showDrinkSyncBanner('syncing', { total: q.length });

    let ok = 0, failed = 0, firstFailedMsg = '';
    const remaining = [];
    for (const item of q) {
        const d = item.drink;
        try {
            const r = await saveDrinkViaApi(d);
            // 成功则出队 + 同步到云端后，把本地 gaoyidian_drinks 与云端对齐（mergeCloudDrinksToLocal 会做）
            dequeueSucceededDrink(d);
            ok++;
        } catch (e) {
            failed++;
            item.attempts = (item.attempts || 0) + 1;
            item.last_failed_at = new Date().toISOString();
            item.error = e && e.message ? e.message : String(e);
            if (e && e.code) item.code = e.code;
            if (e && e.pg_code) item.pg_code = e.pg_code;
            remaining.push(item);
            if (!firstFailedMsg) firstFailedMsg = (e && e.message) ? e.message.slice(0, 16) : '错误';
        }
    }
    if (remaining.length) _safeLSSet(FAILED_DRINKS_KEY, remaining);

    if (ok > 0 && failed === 0) {
        showDrinkSyncBanner('done', { ok, failed: 0 });
        setTimeout(() => showDrinkSyncBanner('hidden'), 6000);
        showToast(`已同步 ${ok} 杯酒到云端酒馆 ✅`, '✅');
    } else if (failed > 0) {
        showDrinkSyncBanner('failed', { total: failed, sample: firstFailedMsg });
        if (opts.interactive || failed >= 1) {
            showToast(`${ok} 杯同步成功，${failed} 杯仍失败，已保留到本地，下次打开继续试`, '⚠️');
        }
    }
    return { total: q.length, ok, failed };
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

function shareDrink() {
    const baseUrl = window.location.origin + window.location.pathname;
    const recipeId = state.result.recipe.id;
    const bartenderName = state.result.bartender_name;
    const shareUrl = `${baseUrl}?recipe_id=${recipeId}&bartender=${encodeURIComponent(bartenderName)}`;
    const text = `我为高一点调了一杯「${state.result.recipe.drink_name}」，来看看吧！`;

    const isWeChat = navigator.userAgent.toLowerCase().includes('micromessenger');

    if (isWeChat) {
        // 微信内置浏览器：静默复制链接 + 弹出唯美微信右上角分享引导图层
        copyToClipboard(shareUrl).then(() => {
            showWeChatShareGuide('🌸 分享专属酒卡 🌸', '专属酒卡链接已<strong>自动复制</strong>！可以直接粘贴发送给高一点');
        }).catch(() => {
            showWeChatShareGuide('🌸 分享专属酒卡 🌸', '专属酒卡分享通道已就绪！可以直接分享给高一点');
        });
    } else if (navigator.share) {
        navigator.share({
            title: '请高一点喝一杯',
            text: text,
            url: shareUrl
        }).catch((err) => {
            // 用户取消或分享报错时（比如微信外直接跳转微信对话），自动静默复制链接并弹窗提示
            copyToClipboard(shareUrl).then(() => {
                showToast('已自动为您复制专属酒卡链接！✨<br>可以直接粘贴发送分享哦！', '✨');
            });
        });
    } else {
        // 桌面端或不支持 Share API 的普通浏览器
        copyToClipboard(shareUrl).then(() => {
            showToast('酒卡链接已成功复制到剪贴板！✨<br>快去粘贴发给高一点吧！', '✨');
        }).catch(() => {
            prompt('请复制以下链接分享：', shareUrl);
        });
    }
}

function restart() {
    state.currentQuestion = 0;
    state.answers = [];
    state.result = null;
    
    // 清除浏览器地址栏的参数，恢复干净的首页链接
    try {
        const baseUrl = window.location.origin + window.location.pathname;
        window.history.replaceState(null, '', baseUrl);
    } catch (e) {
        console.warn('清除地址栏参数失败:', e);
    }
    
    document.getElementById('bartender-name').value = '';
    showScreen('home-screen');
}

document.getElementById('bartender-name').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        startQuiz();
    }
});

// Soft keyboard adaptive handling for mobile viewports
const bartenderNameInput = document.getElementById('bartender-name');
if (bartenderNameInput) {
    bartenderNameInput.addEventListener('focus', () => {
        document.getElementById('home-screen').classList.add('keyboard-open');
        // Wait briefly for the virtual keyboard to fully animate open on iOS/Android, then center the input
        setTimeout(() => {
            bartenderNameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    });

    bartenderNameInput.addEventListener('blur', () => {
        document.getElementById('home-screen').classList.remove('keyboard-open');
    });
}

loadQuestions();

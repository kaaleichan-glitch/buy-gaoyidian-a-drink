// pages/tavern/tavern.js —— 原版 tavern.js 平移
const { DRINK_RECIPES } = require('../../utils/data.js');
const cloud = require('../../utils/cloud.js');

Page({
    data: {
        // 锁屏
        lockShown: true,
        tokenInput: '',
        // 酒馆数据
        token: null,
        drinks: [],           // 32 款配方，collected/locked 状态
        allDrinks: [],        // 用户的所有 drink record
        totalRecipes: 32,
        collectedCount: 0,
        carouselIndex: 0,
        emptyShown: true,
        // 统计卡片
        topBartenderName: '-',
        topBartenderCount: '-',
        topDrinkName: '-',
        topDrinkPercent: '-',
        // Drink Modal
        drinkModalShown: false,
        modalDrink: {},
        // Stats Modal
        statsModalShown: false,
        statsMode: 'bartender',  // bartender / flavor
        statsModalLabel: '',
        statsModalTitle: '',
        statsModalSubtitle: '',
        statsData: [],
        allRecords: [],
        flavorData: [],
        tagData: []
    },

    _initDone: false,

    onLoad(options) {
        this._migrateLegacyData();
        // 先尝试拿已缓存的 token
        let token = wx.getStorageSync('gaoyidian_tavern_token') || null;

        if (!token) {
            // 没有 token → 显示锁屏
            this.setData({ lockShown: true });
        } else {
            // 有 token → 直接加载酒馆
            this.setData({ lockShown: false, token });
            this._loadTavern();
        }
    },

    _migrateLegacyData() {
        let oldToken = wx.getStorageSync('gaoyidian_default_token');
        let currentToken = wx.getStorageSync('gaoyidian_tavern_token');
        if (oldToken && !currentToken) {
            wx.setStorageSync('gaoyidian_tavern_token', oldToken);
            wx.removeStorageSync('gaoyidian_default_token');
        }
        try {
            const all = wx.getStorageSync('gaoyidian_drinks') || [];
            if (Array.isArray(all) && all.length > 0 && currentToken) {
                let migrated = false;
                for (const d of all) {
                    if (d.owner_token !== currentToken) {
                        d.owner_token = currentToken;
                        migrated = true;
                    }
                }
                if (migrated) wx.setStorageSync('gaoyidian_drinks', all);
            }
        } catch (e) {}
    },

    // ========== 原版 loadTavern() 平移 ==========
    async _loadTavern() {
        const token = this.data.token;
        wx.showLoading({ title: '正在加载酒馆…', mask: true });

        // 云端同步
        if (cloud.initCloud()) {
            try {
                await cloud.syncLocalDrinksToCloud(token);
                const cloudDrinks = await cloud.getCloudDrinks(token);
                if (cloudDrinks) {
                    const localDrinks = wx.getStorageSync('gaoyidian_drinks') || [];
                    const localIds = new Set(localDrinks.map(d => d.id));
                    for (const cd of cloudDrinks) {
                        if (!localIds.has(cd.id)) localDrinks.push(cd);
                    }
                    wx.setStorageSync('gaoyidian_drinks', localDrinks);
                }
            } catch (err) {}
        }

        // 本地数据
        const allDrinks = wx.getStorageSync('gaoyidian_drinks') || [];
        const userDrinks = allDrinks.filter(d => d.owner_token === token);

        const collectedMap = {};
        userDrinks.forEach(d => {
            if (!collectedMap[d.recipe_id] || new Date(d.created_at) > new Date(collectedMap[d.recipe_id].created_at)) {
                collectedMap[d.recipe_id] = d;
            }
        });

        // 生成 32 款配方卡片
        const drinks = DRINK_RECIPES.map(r => {
            const collected = collectedMap[r.id];
            if (collected) {
                const animConfig = r.animation_config || { glass: 'rocks' };
                return {
                    recipe_id: r.id,
                    drink_id: collected.id,
                    bartender_name: collected.bartender_name,
                    created_at: collected.created_at,
                    drink_name: r.drink_name,
                    english_name: r.english_name,
                    drink_type: r.drink_type,
                    collected: true,
                    glassClass: 'glass-' + animConfig.glass,
                    animConfig
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
                    collected: false,
                    glassClass: 'glass-rocks',
                    animConfig: null
                };
            }
        });

        this.setData({
            drinks,
            allDrinks: userDrinks,
            totalRecipes: DRINK_RECIPES.length,
            collectedCount: Object.keys(collectedMap).length,
            emptyShown: drinks.filter(d => d.collected).length === 0
        });

        this._renderStats(userDrinks, drinks);
        wx.hideLoading();

        // 渲染已收集酒款的 canvas
        setTimeout(() => {
            drinks.forEach((d, idx) => {
                if (d.collected && d.animConfig) {
                    const query = wx.createSelectorQuery();
                    query.select('#tavern-canvas-' + idx)
                        .fields({ node: true, size: true })
                        .exec((res) => {
                            if (res && res[0]) this._drawDrinkSVG(res[0].node, res[0].width, res[0].height, d.animConfig);
                        });
                }
            });
        }, 300);
    },

    // ========== 原版 renderStats() 平移 ==========
    _renderStats(userDrinks, drinks) {
        const collectedDrinks = drinks.filter(d => d.collected);
        if (collectedDrinks.length === 0) {
            this.setData({ topBartenderName: '—', topBartenderCount: '等待第一位调酒师', topDrinkName: '—', topDrinkPercent: '等待第一杯酒' });
            return;
        }

        const bartenderCount = {};
        const drinkCount = {};
        collectedDrinks.forEach(d => {
            const name = d.bartender_name || '匿名';
            bartenderCount[name] = (bartenderCount[name] || 0) + 1;
            drinkCount[d.drink_name || '未知'] = (drinkCount[d.drink_name || '未知'] || 0) + 1;
        });

        let topBartender = '', topBartenderCount = 0;
        Object.entries(bartenderCount).forEach(([n, c]) => { if (c > topBartenderCount) { topBartender = n; topBartenderCount = c; } });

        let topDrink = '', topDrinkCount = 0;
        Object.entries(drinkCount).forEach(([n, c]) => { if (c > topDrinkCount) { topDrink = n; topDrinkCount = c; } });

        const topDrinkPercent = Math.round((topDrinkCount / collectedDrinks.length) * 100);

        this.setData({
            topBartenderName: topBartender,
            topBartenderCount: '为你调制 ' + topBartenderCount + ' 杯',
            topDrinkName: topDrink,
            topDrinkPercent: '占据酒柜 ' + topDrinkPercent + '%'
        });
    },

    // ========== 原版轮播 ==========
    onPrevDrink() {
        const next = (this.data.carouselIndex - 1 + this.data.drinks.length) % this.data.drinks.length;
        this.setData({ carouselIndex: next });
    },
    onNextDrink() {
        const next = (this.data.carouselIndex + 1) % this.data.drinks.length;
        this.setData({ carouselIndex: next });
    },
    onGoToDrink(e) {
        this.setData({ carouselIndex: Number(e.currentTarget.dataset.idx) });
    },
    onCardTap(e) {
        const idx = Number(e.currentTarget.dataset.idx);
        const item = this.data.drinks[idx];
        if (idx === this.data.carouselIndex) {
            // 点的是当前 active → 打开详情
            if (item.collected) this.openDrinkDetail(item.drink_id);
        } else {
            this.setData({ carouselIndex: idx });
        }
    },

    // ========== 原版 openDrinkDetail() 平移 ==========
    openDrinkDetail(drinkId) {
        const allDrinks = wx.getStorageSync('gaoyidian_drinks') || [];
        const drink = allDrinks.find(d => d.id === drinkId);

        let drinkData = null;
        if (drink) {
            const recipe = DRINK_RECIPES.find(r => r.id === drink.recipe_id);
            drinkData = {
                drink_id: drink.id,
                bartender_name: drink.bartender_name,
                created_at: drink.created_at,
                ingredients: recipe.ingredients,
                story: recipe.story,
                drink_name: recipe.drink_name,
                english_name: recipe.english_name,
                drink_type: recipe.drink_type,
                glassClass: 'glass-' + (recipe.animation_config?.glass || 'rocks'),
                animConfig: recipe.animation_config,
                createdLabel: this._formatDate(drink.created_at)
            };
        } else {
            const td = this.data.drinks.find(d => d.drink_id === drinkId);
            if (td && td.collected) {
                const recipe = DRINK_RECIPES.find(r => r.id === td.recipe_id);
                drinkData = {
                    drink_id: td.drink_id,
                    bartender_name: td.bartender_name,
                    created_at: td.created_at,
                    ingredients: recipe.ingredients,
                    story: recipe.story,
                    drink_name: td.drink_name,
                    english_name: td.english_name,
                    drink_type: td.drink_type,
                    glassClass: 'glass-' + (recipe.animation_config?.glass || 'rocks'),
                    animConfig: recipe.animation_config,
                    createdLabel: this._formatDate(td.created_at)
                };
            }
        }

        if (!drinkData) return;
        this.setData({ drinkModalShown: true, modalDrink: drinkData });
        setTimeout(() => {
            if (drinkData.animConfig) this._drawDrinkSVGFromModal(drinkData.animConfig);
        }, 100);
    },

    onCloseDrinkModal() { this.setData({ drinkModalShown: false }); },

    _drawDrinkSVGFromModal(animConfig) {
        const query = wx.createSelectorQuery();
        query.select('#modal-canvas').fields({ node: true, size: true }).exec((res) => {
            if (res && res[0]) this._drawDrinkSVG(res[0].node, res[0].width, res[0].height, animConfig);
        });
    },

    _drawDrinkSVG(canvas, w, h, animConfig) {
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);

        const layers = animConfig.pencilLayers || [];
        const fillRatio = { wine: 0.85, coupe: 0.85, coupe_tall: 0.85, margarita: 0.85, cocktail: 0.85, cocktail_tall: 0.85, burgundy: 0.85 }[animConfig.glass] || 1.0;
        const bottomOffset = 50, sideOffset = 15, topOffset = 10, segments = 20;
        const segWidth = (200 + sideOffset * 2) / segments;

        layers.forEach((layer, index) => {
            const layerHeight = (layer.height || 200) * fillRatio;
            const layerTop = 300 - layerHeight - topOffset;
            const layerBottom = 300 + bottomOffset;

            ctx.fillStyle = layer.color;
            ctx.globalAlpha = 0.65;
            ctx.beginPath();
            ctx.moveTo(-sideOffset, layerBottom);
            for (let i = 0; i <= segments; i++) {
                const x = -sideOffset + i * segWidth;
                const yv = (Math.sin(i * 0.8 + index * 2) + Math.sin(i * 1.3 + index)) * 8;
                ctx.lineTo(x, layerTop + yv);
            }
            ctx.lineTo(200 + sideOffset, layerBottom);
            ctx.closePath();
            ctx.fill();

            ctx.globalAlpha = 0.5;
            const rotated = ((index % 2) === 0) ? 72 : -68;
            ctx.save();
            ctx.translate(0, layerTop);
            ctx.rotate(rotated * Math.PI / 180);
            const pw = ((index % 2) === 0) ? 8 : 10;
            const texBtm = 300 + bottomOffset - layerTop;
            for (let yy = 0; yy < texBtm / Math.cos(rotated * Math.PI / 180) + pw; yy += pw) {
                for (let xx = -pw * 2; xx < 200 + pw * 2; xx += pw) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + pw); ctx.stroke();
                    ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(xx + pw / 2, yy); ctx.lineTo(xx + pw / 2, yy + pw); ctx.stroke();
                }
            }
            ctx.restore();
            ctx.globalAlpha = 1.0;
        });
    },

    _formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');
    },

    // ========== 原版 openBartendersModal() 平移 ==========
    onOpenBartendersModal() {
        const allDrinks = this.data.allDrinks || [];
        const collectedDrinks = allDrinks.filter(d => d.bartender_name);

        if (collectedDrinks.length === 0) {
            this.setData({
                statsModalShown: true,
                statsMode: 'bartender',
                statsModalLabel: 'BARTENDER ARCHIVE',
                statsModalTitle: '调酒师名录',
                statsModalSubtitle: '这些人都为你调过酒',
                statsData: [],
                allRecords: []
            });
            return;
        }

        // TOP 3
        const counts = {};
        collectedDrinks.forEach(d => { counts[d.bartender_name.trim()] = (counts[d.bartender_name.trim()] || 0) + 1; });
        const sorted = Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
        const maxCount = sorted[0].count;
        const statsData = sorted.slice(0, 3).map(item => ({ name: item.name, count: item.count, percent: Math.round((item.count / maxCount) * 100) }));

        // 所有记录
        const sortedRecords = [...collectedDrinks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const allRecords = sortedRecords.map(d => {
            let drinkName = d.drink_name;
            if (!drinkName && d.recipe_id) {
                const recipe = DRINK_RECIPES.find(r => r.id === d.recipe_id);
                if (recipe) drinkName = recipe.drink_name;
            }
            return {
                drink_id: d.id,
                drink_name: drinkName || '未知酒款',
                bartender_name: d.bartender_name,
                dateLabel: this._formatDate(d.created_at)
            };
        });

        this.setData({
            statsModalShown: true,
            statsMode: 'bartender',
            statsModalLabel: 'BARTENDER ARCHIVE',
            statsModalTitle: '调酒师名录',
            statsModalSubtitle: '这些人都为你调过酒',
            statsData,
            allRecords
        });
    },

    onOpenFlavorModal() {
        const allDrinks = this.data.allDrinks || [];
        if (allDrinks.length === 0) {
            this.setData({
                statsModalShown: true,
                statsMode: 'flavor',
                statsModalLabel: 'TAVERN FLAVOR PROFILE',
                statsModalTitle: '本馆风味谱系',
                statsModalSubtitle: '基于所有已调制酒款的风味基因分析',
                flavorData: [],
                tagData: []
            });
            return;
        }

        // 饮品排行
        const drinkStats = {};
        allDrinks.forEach(d => {
            const recipeId = d.recipe_id;
            if (!recipeId) return;
            const recipe = DRINK_RECIPES.find(r => r.id === recipeId);
            if (!recipe) return;
            if (!drinkStats[recipeId]) drinkStats[recipeId] = { recipe, count: 0 };
            drinkStats[recipeId].count++;
        });
        const sortedDrinks = Object.values(drinkStats).sort((a, b) => b.count - a.count);

        // 标签云
        const tagCounts = {};
        allDrinks.forEach(d => {
            const recipe = DRINK_RECIPES.find(r => r.id === d.recipe_id);
            if (recipe) (recipe.tags || []).forEach(tag => tagCounts[tag] = (tagCounts[tag] || 0) + 1);
        });
        const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([tag, count]) => ({ tag, count }));

        const maxCount = sortedDrinks[0].count;
        const totalDrinks = allDrinks.length;
        const flavorData = sortedDrinks.slice(0, 5).map((item, idx) => ({
            name: item.recipe.drink_name,
            count: item.count,
            percent: Math.round((item.count / maxCount) * 100),
            absolutePercent: Math.round((item.count / totalDrinks) * 100)
        }));

        this.setData({
            statsModalShown: true,
            statsMode: 'flavor',
            statsModalLabel: 'TAVERN FLAVOR PROFILE',
            statsModalTitle: '本馆风味谱系',
            statsModalSubtitle: '基于所有已调制酒款的风味基因分析',
            flavorData,
            tagData: sortedTags
        });
    },

    onCloseStatsModal() { this.setData({ statsModalShown: false }); },

    onOpenDrinkFromLedger(e) {
        const id = e.currentTarget.dataset.id;
        if (!id || id.startsWith('preview_')) return;
        this.setData({ statsModalShown: false });
        setTimeout(() => this.openDrinkDetail(id), 300);
    },

    noop() {},

    // ========== 操作按钮 ==========
    onCopyInviteLink() {
        // 小程序里直接分享
        wx.showToast({ title: '点击右上角「…」分享给朋友 🥂', icon: 'none', duration: 2500 });
    },

    onRefreshTavern() {
        this.setData({ carouselIndex: 0 });
        this._loadTavern();
    },

    // ========== 锁屏 ==========
    onTokenInput(e) { this.setData({ tokenInput: e.detail.value }); },
    onUnlock() {
        const val = this.data.tokenInput.trim();
        if (!val) { wx.showToast({ title: '请输入有效的密令', icon: 'none' }); return; }
        wx.setStorageSync('gaoyidian_tavern_token', val);
        this.setData({ lockShown: false, token: val });
        setTimeout(() => this._loadTavern(), 100);
    },

    // ========== 分享 ==========
    onShareAppMessage() {
        return {
            title: '请高一点喝一杯 — 来我的专属小酒馆',
            path: '/pages/tavern/tavern'
        };
    },

    onShareTimeline() {
        return { title: '请高一点喝一杯 — 来我的专属小酒馆' };
    }
});

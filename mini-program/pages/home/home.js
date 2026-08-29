// pages/home/home.js —— 原版 app.js 平移（除技术平台适配外零改动）
const { QUESTIONS, DRINK_RECIPES, matchDrinkRecipe, generateId } = require('../../utils/data.js');
const cloud = require('../../utils/cloud.js');

Page({
    data: {
        screen: 'home',           // home / quiz / mixing / result
        bartenderName: '',
        questionIndex: 0,
        totalQuestions: 3,
        progressPercent: 0,
        currentQuestion: {},
        selectedOptionIndex: -1,
        answers: [],
        ownerToken: '',
        // 调酒动画
        mixingTitle: '正在为你调制...',
        mixingStepText: '',
        glassClass: 'glass-rocks',
        shakingClass: '',
        decorations: [],
        mixingResultShown: false,
        recipe: {},
        resultId: ''
    },

    playCompleteSound() {
        try {
            const audio = wx.createInnerAudioContext();
            audio.src = '/audio/quottadamquot-sound.mp3';
            audio.play();
            audio.onError(() => {});
        } catch (e) {}
    },

    onLoad(options) {
        this.initData();
        // 处理分享 URL 参数
        if (options && options.recipe_id) {
            const recipe = DRINK_RECIPES.find(r => String(r.id) === String(options.recipe_id));
            if (recipe) {
                const bartenderName = decodeURIComponent(options.bartender || '匿名');
                const animConfig = recipe.animation_config || { glass: 'rocks', pencilLayers: [] };
                this.setData({
                    screen: 'result',
                    recipe: Object.assign({}, recipe, { glassClass: 'glass-' + animConfig.glass }),
                    bartenderName
                });
                setTimeout(() => this.renderResultCanvas(animConfig), 100);
            }
        }
    },

    onUnload() {
        if (this.data.mixingAnimationTimer) clearTimeout(this.data.mixingAnimationTimer);
    },

    // ========== 原版 loadQuestions() 平移 ==========
    initData() {
        // 抽 3 道题：风味 + 时间地点 + 祝酒词 各 1 道
        const flavorQ = QUESTIONS.filter(q => q.category === '风味');
        const timeQ = QUESTIONS.filter(q => q.category === '时间地点');
        const toastQ = QUESTIONS.filter(q => q.category === '祝酒词');
        const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

        let pickF = pickRandom(flavorQ);
        let pickT = pickRandom(timeQ);
        let pickT2 = pickRandom(toastQ);
        let questions = [
            Object.assign({}, pickF, { options: this._shuffle(pickF.options) }),
            Object.assign({}, pickT, { options: this._shuffle(pickT.options) }),
            Object.assign({}, pickT2, { options: this._shuffle(pickT2.options) })
        ];

        // 确保至少有一道 "高一点" 相关
        const hasGyd = questions.some(q =>
            q.question_text.includes('高一点') || q.options.some(o => o.text.includes('高一点')));
        if (!hasGyd) {
            const toastWithGyd = toastQ.filter(q =>
                q.question_text.includes('高一点') || q.options.some(o => o.text.includes('高一点')));
            if (toastWithGyd.length > 0) {
                const pick = pickRandom(toastWithGyd);
                questions[2] = Object.assign({}, pick, { options: this._shuffle(pick.options) });
            }
        }

        this._questions = questions;
        // owner_token 与酒馆密令保持一致：优先用户设置的密令，否则用默认 '高一点'
        const savedToken = wx.getStorageSync('gaoyidian_tavern_token') || '高一点';
        this.setData({ totalQuestions: 3, ownerToken: savedToken });
    },

    _shuffle(arr) {
        const r = [...arr];
        for (let i = r.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [r[i], r[j]] = [r[j], r[i]];
        }
        return r;
    },

    // ========== 原版 startQuiz() 平移 ==========
    onBartenderInput(e) {
        this.setData({ bartenderName: e.detail.value });
    },

    onStartQuiz() {
        const name = this.data.bartenderName.trim();
        if (!name) {
            wx.showToast({ title: '请先输入调酒师署名', icon: 'none' });
            return;
        }
        this.setData({
            bartenderName: name,
            questionIndex: 0,
            answers: []
        });
        this.renderQuestion();
        this.setData({ screen: 'quiz' });
    },

    // ========== 原版 renderQuestion() 平移 ==========
    renderQuestion() {
        const q = this._questions[this.data.questionIndex];
        if (!q) return;
        const progress = (this.data.questionIndex / this.data.totalQuestions) * 100;
        this.setData({
            currentQuestion: q,
            progressPercent: progress,
            selectedOptionIndex: -1
        });
    },

    // ========== 原版 selectOption() 平移 ==========
    onSelectOption(e) {
        const optIdx = Number(e.currentTarget.dataset.idx);
        const q = this._questions[this.data.questionIndex];
        const selected = q.options[optIdx];

        this.setData({ selectedOptionIndex: optIdx });

        const answers = [...this.data.answers, {
            question_id: q.id,
            question_text: q.question_text,
            answer_text: selected.text,
            tags: selected.tags
        }];

        if (this.data.questionIndex < this.data.totalQuestions - 1) {
            this.setData({ answers, questionIndex: this.data.questionIndex + 1 });
            setTimeout(() => this.renderQuestion(), 300);
        } else {
            this.setData({ answers, progressPercent: 100 });
            setTimeout(() => this.startMixing(), 500);
        }
    },

    // ========== 原版 randomizeCurrentQuestion() 平移 ==========
    onRandomizeQuestion() {
        const cat = this._questions[this.data.questionIndex].category;
        const allInCat = QUESTIONS.filter(q => q.category === cat);
        const usedIds = this._questions.map(q => q.id);
        let available = allInCat.filter(q => !usedIds.includes(q.id));
        if (available.length === 0) {
            available = allInCat.filter(q => q.id !== this._questions[this.data.questionIndex].id);
        }
        if (available.length === 0) return;
        const pick = available[Math.floor(Math.random() * available.length)];
        this._questions[this.data.questionIndex] = Object.assign({}, pick, {
            options: this._shuffle(pick.options)
        });
        this.renderQuestion();
    },

    // ========== 原版 startMixing() 平移 ==========
    async startMixing() {
        console.log("[DEBUG] startMixing called");
        this.setData({ screen: 'mixing', mixingResultShown: false });

        const allTags = [];
        for (const a of this.data.answers) {
            if (a.tags && Array.isArray(a.tags)) allTags.push(...a.tags);
        }

        const matched = matchDrinkRecipe(allTags);
        const drinkId = generateId();
        const ownerToken = this.data.ownerToken || '高一点';

        const drinkRecord = {
            id: drinkId,
            owner_token: ownerToken,
            recipe_id: matched.id,
            bartender_name: this.data.bartenderName.trim(),
            answers: this.data.answers,
            tags: allTags,
            created_at: new Date().toISOString()
        };

        // 本地存储 + 云端同步（和原版一致）
        try {
            const drinks = wx.getStorageSync('gaoyidian_drinks') || [];
            drinks.unshift(drinkRecord);
            wx.setStorageSync('gaoyidian_drinks', drinks);
            // 写入云端
            if (cloud.initCloud()) {
                cloud.saveDrinkToCloud(drinkRecord).then(saved => {
                    console.log('[DEBUG] saveDrinkToCloud result:', saved ? 'SUCCESS' : 'FAILED');
                });
            }
        } catch (e) { console.error('[DEBUG] save drink error:', e); }

        // 显示调酒动画
        const animConfig = matched.animation_config || { glass: 'rocks', pencilLayers: [], ingredients: [] };
        const glassClass = 'glass-' + animConfig.glass;

        this.setData({
            recipe: Object.assign({}, matched, { glassClass }),
            glassClass,
            mixingTitle: '选一个合适的杯子…',
            mixingStepText: ''
        });

        // Canvas 初始化
        setTimeout(() => {
            console.log("[DEBUG] setTimeout fired");
            this.playMixingAnimation(matched, animConfig);
        }, 800);
    },

    // ========== 原版 playMixingAnimation() 平移（SVG→Canvas） ==========
    async playMixingAnimation(recipe, animConfig) {
        try {
        console.log("[DEBUG] playMixingAnimation called");
        console.log("[DEBUG] glass:", animConfig && animConfig.glass, "layers:", animConfig && (animConfig.pencilLayers||[]).length);
        const query = wx.createSelectorQuery();
        query.select('#pencil-canvas')
            .fields({ node: true, size: true })
            .exec((res) => {
                console.log("[DEBUG] Canvas query result:", res && res[0] ? "OK w="+res[0].width+" h="+res[0].height : "EMPTY");
                if (!res || !res[0]) return;
                const canvas = res[0].node;
                const ctx = canvas.getContext('2d');
                const dpr = wx.getSystemInfoSync().pixelRatio;
                canvas.width = res[0].width * dpr;
                canvas.height = res[0].height * dpr;
                ctx.scale(dpr, dpr);

                this._pencilCtx = ctx;
                this._pencilCanvas = canvas;
                this._animConfig = animConfig;

                this._runMixingStages(animConfig, ctx, canvas, res[0].width, res[0].height);
            });
        } catch(e) { console.error("[DEBUG] ERROR:", e); }
    },

    _runMixingStages(animConfig, ctx, canvas, w, h) {
        const layers = animConfig.pencilLayers || [];
        console.log("[DEBUG] pencilLayers count:", layers.length);
        const fillRatio = { wine: 0.85, coupe: 0.85, coupe_tall: 0.85, margarita: 0.85, cocktail: 0.85, cocktail_tall: 0.85, burgundy: 0.85 }[animConfig.glass] || 1.0;
        const bottomOffset = 50, sideOffset = 15, topOffset = 10;

        // 阶段 1: 选杯子
        this._fadeTitle('选一个合适的杯子…');

        // 阶段 2: 逐层渲染 pencil layers
        if (layers.length > 0) {
            const baseInterval = 800;
            const stirDelayAfterLayer2 = 600;
            const shakeDelayAfterLayer3 = 700;
            const shakeDuration = 1200;
            const delays = [
                1200,
                1200 + baseInterval,
                1200 + baseInterval * 2 + stirDelayAfterLayer2
            ];

            // 清 canvas
            ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = '#ff0000'; ctx.globalAlpha = 1; ctx.fillRect(0, 0, w, h); console.log('[DEBUG] RED FILL'); ctx.globalAlpha = 0.65;

            let stageIdx = 0;
            const drawStage = () => {
                    console.log("[DEBUG] drawStage called, stageIdx=", stageIdx, "/", layers.length);
                if (stageIdx >= layers.length) {
                    // shaking
                    setTimeout(() => {
                        this.setData({ shakingClass: 'shaking' });
                    }, shakeDelayAfterLayer3);
                    // 完成
                    setTimeout(() => {
                        this.setData({ shakingClass: '' });
                        this.playCompleteSound();
                        this._fadeTitle('高一点即将品鉴 ✔');
                        setTimeout(() => {
                            this.setData({ mixingResultShown: true });
                            console.log("[DEBUG] Animation complete, showing result");
                            this.renderResultCanvas(animConfig);
                        }, 800);
                    }, shakeDelayAfterLayer3 + shakeDuration);
                    return;
                }

                const layer = layers[stageIdx];
                const seg = 20;
                const segWidth = (w + sideOffset * 2) / seg;

                // 画该层液体（波浪公式 y = (sin(i*0.8+idx*2) + sin(i*1.3+idx)) * 8）
                ctx.fillStyle = layer.color;
                ctx.globalAlpha = 0.65;
                ctx.beginPath();
                let layerTop, layerBottom;
                if (layer.top !== undefined) {
                    layerTop = layer.top - topOffset;
                    layerBottom = layer.bottom + bottomOffset;
                } else {
                    const layerHeight = (layer.height || 200) * fillRatio;
                    layerTop = h - layerHeight - topOffset;
                    layerBottom = h + bottomOffset;
                }
                ctx.moveTo(-sideOffset, layerBottom);
                for (let i = 0; i <= seg; i++) {
                    const x = -sideOffset + i * segWidth;
                    const yv = (Math.sin(i * 0.8 + stageIdx * 2) + Math.sin(i * 1.3 + stageIdx)) * 8;
                    const y = layerTop + yv;
                    ctx.lineTo(x, y);
                }
                ctx.lineTo(w + sideOffset, layerBottom);
                ctx.closePath();
                ctx.fill();

                // 手绘纹理（模拟 SVG pencil-noise filter：用小斜线 + 噪点 pattern）
                ctx.globalAlpha = 0.5;
                const rotated = (stageIdx % 2 === 0) ? 72 : -68;
                ctx.save();
                ctx.translate(0, layerTop);
                ctx.rotate(rotated * Math.PI / 180);
                const patternW = (stageIdx % 2 === 0) ? 8 : 10;
                for (let yy = 0; yy < (layerBottom - layerTop) / Math.cos(rotated * Math.PI / 180) + patternW; yy += patternW) {
                    for (let xx = -patternW * 2; xx < w + patternW * 2; xx += patternW) {
                        ctx.beginPath();
                        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
                        ctx.lineWidth = 1.5;
                        ctx.moveTo(xx, yy);
                        ctx.lineTo(xx, yy + patternW);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.strokeStyle = 'rgba(0,0,0,0.08)';
                        ctx.lineWidth = 1;
                        ctx.moveTo(xx + patternW / 2, yy);
                        ctx.lineTo(xx + patternW / 2, yy + patternW);
                        ctx.stroke();
                    }
                }
                ctx.restore();
                ctx.globalAlpha = 1.0;

                // 阶段文字
                const stepTexts = ['第一味是 ' + layer.emoji + ' ' + layer.name + '…', '再加一点 ' + layer.emoji + ' ' + layer.name + '…', '最后点缀 ' + layer.emoji + ' ' + layer.name + '…'];
                this._fadeTitle(stepTexts[stageIdx] || '调制中…');

                // 配料装饰 emoji
                const decorations = this.data.decorations.slice();
                const newDecos = (animConfig.ingredients || []).map((ing, i) => ({
                    key: 'deco_' + stageIdx + '_' + i,
                    emoji: ing.emoji || '🍸',
                    cls: 'drink-ingredient pencil-cherry',
                    top: 10 + Math.random() * 60,
                    left: 15 + Math.random() * 70
                }));
                decorations.push(...newDecos.slice(0, 1));
                this.setData({ decorations });

                // stirring 抖动
                if (stageIdx === 1) {
                    setTimeout(() => {
                        this.setData({ shakingClass: 'stirring' });
                    }, stirDelayAfterLayer2);
                    setTimeout(() => {
                        this.setData({ shakingClass: 'shaking' });
                    }, shakeDelayAfterLayer3);
                }

                stageIdx++;
                setTimeout(drawStage, baseInterval);
            };

            // 初始化：等 canvas 渲染完再画
            drawStage();

        } else {
            // 无 pencil layers 的简单液体
            setTimeout(() => {
                const gradient = ctx.createLinearGradient(0, 0, 0, h);
                gradient.addColorStop(0, 'rgba(232,184,109,0.6)');
                gradient.addColorStop(1, 'rgba(201,154,79,0.8)');
                ctx.fillStyle = gradient;
                ctx.globalAlpha = 0.65;
                ctx.fillRect(-sideOffset, h * 0.35, w + sideOffset * 2, h * 0.65);
                ctx.globalAlpha = 1.0;
                this._fadeTitle('倒入基酒...');
            }, 1200);

            // shaking → 完成
            setTimeout(() => {
                this.setData({ shakingClass: 'shaking' });
            }, 2200);
            setTimeout(() => {
                this.setData({ shakingClass: '' });
                this.playCompleteSound();
                this._fadeTitle('高一点即将品鉴 ✔');
                setTimeout(() => {
                    this.setData({ mixingResultShown: true });
                    this.renderResultCanvas(animConfig);
                }, 800);
            }, 2200 + 1200);
        }
    },

    _fadeTitle(text) {
        this.setData({ mixingTitle: text });
    },

    // ========== 原版 generateDrinkSVG() 平移 ==========
    renderResultCanvas(animConfig) {
        const query = wx.createSelectorQuery();
        query.select('#result-canvas')
            .fields({ node: true, size: true })
            .exec((res) => {
                if (!res || !res[0]) return;
                this._drawDrinkSVG(res[0].node, res[0].width, res[0].height, animConfig);
            });
    },

    drawTavernCanvas(idx, animConfig) {
        const query = wx.createSelectorQuery();
        query.select('#tavern-canvas-' + idx)
            .fields({ node: true, size: true })
            .exec((res) => {
                if (!res || !res[0]) return;
                this._drawDrinkSVG(res[0].node, res[0].width, res[0].height, animConfig);
            });
    },

    drawModalCanvas(animConfig) {
        const query = wx.createSelectorQuery();
        query.select('#modal-canvas')
            .fields({ node: true, size: true })
            .exec((res) => {
                if (!res || !res[0]) return;
                this._drawDrinkSVG(res[0].node, res[0].width, res[0].height, animConfig);
            });
    },

    _drawDrinkSVG(canvas, w, h, animConfig) {
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
        ctx.clearRect(0, 0, w, h);
            ctx.fillStyle = '#ff0000'; ctx.globalAlpha = 1; ctx.fillRect(0, 0, w, h); console.log('[DEBUG] RED FILL'); ctx.globalAlpha = 0.65;

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
                const y = layerTop + yv;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(200 + sideOffset, layerBottom);
            ctx.closePath();
            ctx.fill();

            // texture pattern
            ctx.globalAlpha = 0.6;
            const rotated = ((index % 2) === 0) ? 72 : -68;
            ctx.save();
            ctx.translate(0, layerTop);
            ctx.rotate(rotated * Math.PI / 180);
            const pw = ((index % 2) === 0) ? 8 : 10;
            const textureBottom = 300 + bottomOffset - layerTop;
            for (let yy = 0; yy < textureBottom / Math.cos(rotated * Math.PI / 180) + pw; yy += pw) {
                for (let xx = -pw * 2; xx < 200 + pw * 2; xx += pw) {
                    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + pw); ctx.stroke();
                    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
                    ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(xx + pw / 2, yy); ctx.lineTo(xx + pw / 2, yy + pw); ctx.stroke();
                }
            }
            ctx.restore();
            ctx.globalAlpha = 1.0;
        });
    },

    // ========== 原版 restart() 平移 ==========
    onRestart() {
        if (this.data.mixingAnimationTimer) clearTimeout(this.data.mixingAnimationTimer);
        this.setData({
            bartenderName: '',
            questionIndex: 0,
            answers: [],
            recipe: {},
            decorations: [],
            shakingClass: '',
            mixingResultShown: false,
            screen: 'home'
        });
    },

    // ========== 跳转酒馆 ==========
    onGoTavern() {
        wx.navigateTo({ url: '/pages/tavern/tavern' });
    },

    // ========== 分享 ==========
    onShareAppMessage() {
        const recipe = this.data.recipe;
        const title = recipe.drink_name
            ? this.data.bartenderName + ' 为你调制了一杯 ' + recipe.drink_name
            : '请高一点喝一杯 — 为她调制一杯专属的酒';
        return {
            title,
            path: '/pages/home/home?recipe_id=' + (recipe.id || '') + '&bartender=' + encodeURIComponent(this.data.bartenderName),
            imageUrl: ''
        };
    },

    onShareTimeline() {
        const recipe = this.data.recipe;
        return {
            title: recipe.drink_name
                ? this.data.bartenderName + ' 为你调制了一杯 ' + recipe.drink_name
                : '请高一点喝一杯 — 为她调制一杯专属的酒',
            query: 'recipe_id=' + (recipe.id || '') + '&bartender=' + encodeURIComponent(this.data.bartenderName)
        };
    }
});

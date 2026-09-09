/*:
 * @target MZ
 * @plugindesc v1.2.0 首領隨機掉落未鑑定物品＋保底機制＋限定掉落
 * @author Hope of Light
 *
 * @help
 * ============================================================================
 * RandomUnidentifiedDrop_MZ.js
 * ============================================================================
 *
 * 《希望之光》
 * 首領隨機掉落未鑑定物品系統
 *
 * v1.2.0
 *
 * ============================================================================
 * 【主要功能】
 * ============================================================================
 *
 * 1. 只有設定：
 *
 *    <UnidentifiedDropRate:10>
 *
 *    的敵人，才會進行未鑑定物品掉落判定。
 *
 *
 * 2. 自動從：
 *
 *    RPG Maker MZ → 資料庫 → 道具
 *
 *    尋找具有：
 *
 *    <IdentifyLevel:2>
 *
 *    或：
 *
 *    <IdentifyLevel:3>
 *
 *    的未鑑定物品。
 *
 *
 * 3. 支援：
 *
 *    <UnidentifiedDropLevel:2>
 *
 *    <UnidentifiedDropLevel:3>
 *
 *    <UnidentifiedDropLevel:2-3>
 *
 *
 * 4. 支援：
 *
 *    <UnidentifiedDropCount:2>
 *
 *    一次掉落多個未鑑定物品。
 *
 *
 * 5. 支援保底：
 *
 *    <UnidentifiedDropPity:10>
 *
 *    連續 10 隻符合條件的敵人沒有掉落時，
 *    第 10 隻強制掉落 1 個未鑑定物品。
 *
 *
 * 6. 保底計數會保存到存檔。
 *
 *
 * 7. 影蝕碎片每場戰鬥最多取得 1 個。
 *
 *
 * 8. 其他物品也可以使用：
 *
 *    <BattleDropLimit:1>
 *
 *    限制每場戰鬥最多 1 個。
 *
 *
 * ============================================================================
 * 【哥布林隊長設定】
 * ============================================================================
 *
 * <QuestEnemy:1>
 * <UnidentifiedDropRate:10>
 * <UnidentifiedDropLevel:2>
 * <UnidentifiedDropPity:10>
 *
 *
 * 意思：
 *
 * 10% 機率掉落 Lv.2 未鑑定物品。
 *
 * 如果連續 10 隻哥布林隊長都沒有掉落，
 * 第 10 隻一定掉落 1 個。
 *
 *
 * ============================================================================
 * 【測試用】
 * ============================================================================
 *
 * 如果要確認插件是否正常：
 *
 * <QuestEnemy:1>
 * <UnidentifiedDropRate:100>
 * <UnidentifiedDropLevel:2>
 *
 * 打 1 隻哥布林隊長。
 *
 * 應該一定會掉 1 個 Lv.2 未鑑定物品。
 *
 *
 * 測試完成後：
 *
 * <UnidentifiedDropRate:10>
 *
 *
 * ============================================================================
 * 【保底機制】
 * ============================================================================
 *
 * 例如：
 *
 * <UnidentifiedDropRate:10>
 * <UnidentifiedDropPity:10>
 *
 *
 * 第 1 隻 → 10% → 沒掉 → 1
 * 第 2 隻 → 10% → 沒掉 → 2
 * 第 3 隻 → 10% → 沒掉 → 3
 * 第 4 隻 → 10% → 沒掉 → 4
 * 第 5 隻 → 10% → 沒掉 → 5
 * 第 6 隻 → 10% → 沒掉 → 6
 * 第 7 隻 → 10% → 沒掉 → 7
 * 第 8 隻 → 10% → 沒掉 → 8
 * 第 9 隻 → 10% → 沒掉 → 9
 * 第10隻 → 10%失敗 → 強制掉落
 *
 * 掉落後：
 *
 * 保底計數重新變成 0。
 *
 *
 * ============================================================================
 * 【中途隨機掉落】
 * ============================================================================
 *
 * 例如：
 *
 * 第 1 隻 → 沒掉 → 1
 * 第 2 隻 → 沒掉 → 2
 * 第 3 隻 → 掉落 → 0
 *
 * 下一隻重新從 0 開始。
 *
 *
 * ============================================================================
 * 【重要】
 * ============================================================================
 *
 * 保底計數是「每一種敵人分開計算」。
 *
 * 例如：
 *
 * 哥布林隊長：
 * 連續 5 隻沒掉 → 5
 *
 * 另一種 Boss：
 * 自己另外計算。
 *
 *
 * ============================================================================
 */

(() => {

    "use strict";


    // =========================================================================
    // 插件名稱
    // =========================================================================

    const PLUGIN_NAME =
        "RandomUnidentifiedDrop_MZ";


    // =========================================================================
    // 防止重複載入
    // =========================================================================

    if (
        window.RandomUnidentifiedDropMZ
    ) {

        console.warn(
            "RandomUnidentifiedDrop_MZ：插件已經載入，略過重複載入。"
        );

        return;
    }


    // =========================================================================
    // 建立公開物件
    // =========================================================================

    window.RandomUnidentifiedDropMZ = {};


    // =========================================================================
    // 常數
    // =========================================================================

    const MAX_LEVEL = 3;


    // =========================================================================
    // 初始化 Game_System
    // =========================================================================
    //
    // 用來保存：
    //
    // 每一種 Boss 的保底計數。
    //
    // 存檔後會一起保存。
    //
    // =========================================================================

    const _Game_System_initialize =
        Game_System.prototype.initialize;


    Game_System.prototype.initialize =
        function() {

            _Game_System_initialize.call(
                this
            );


            this._unidentifiedDropPity =
                {};
        };


    // =========================================================================
    // 確保保底資料存在
    // =========================================================================

    function ensurePityData() {

        if (
            !$gameSystem
        ) {

            return;
        }


        if (
            !$gameSystem._unidentifiedDropPity
        ) {

            $gameSystem._unidentifiedDropPity =
                {};
        }
    }


    // =========================================================================
    // 敵人備註
    // =========================================================================

    function enemyNote(
        enemyData
    ) {

        if (!enemyData) {

            return "";
        }

        return String(
            enemyData.note || ""
        );
    }


    // =========================================================================
    // 取得掉落機率
    // =========================================================================

    function getDropRate(
        enemyData
    ) {

        const note =
            enemyNote(
                enemyData
            );


        const match =
            note.match(
                /<UnidentifiedDropRate\s*:\s*([0-9.]+)>/i
            );


        if (!match) {

            return 0;
        }


        let rate =
            Number(
                match[1]
            );


        if (
            !Number.isFinite(rate)
        ) {

            return 0;
        }


        rate =
            Math.max(
                0,
                Math.min(
                    100,
                    rate
                )
            );


        return rate;
    }


    // =========================================================================
    // 取得掉落等級
    // =========================================================================
    //
    // 支援：
    //
    // 2
    // 3
    // 2-3
    //
    // =========================================================================

    function getDropLevels(
        enemyData
    ) {

        const note =
            enemyNote(
                enemyData
            );


        const match =
            note.match(
                /<UnidentifiedDropLevel\s*:\s*([123])(?:\s*-\s*([123]))?>/i
            );


        if (!match) {

            return [];
        }


        const start =
            Number(
                match[1]
            );


        const end =
            match[2]
                ? Number(
                    match[2]
                )
                : start;


        if (
            start < 1 ||
            start > MAX_LEVEL
        ) {

            return [];
        }


        const min =
            Math.min(
                start,
                end
            );


        const max =
            Math.max(
                start,
                end
            );


        const levels = [];


        for (
            let level = min;
            level <= max;
            level++
        ) {

            if (
                level >= 1 &&
                level <= MAX_LEVEL
            ) {

                levels.push(
                    level
                );
            }
        }


        return levels;
    }


    // =========================================================================
    // 取得掉落數量
    // =========================================================================

    function getDropCount(
        enemyData
    ) {

        const note =
            enemyNote(
                enemyData
            );


        const match =
            note.match(
                /<UnidentifiedDropCount\s*:\s*(\d+)>/i
            );


        if (!match) {

            return 1;
        }


        const count =
            Number(
                match[1]
            );


        if (
            !Number.isFinite(count)
        ) {

            return 1;
        }


        return Math.max(
            1,
            Math.floor(
                count
            )
        );
    }


    // =========================================================================
    // 取得保底次數
    // =========================================================================

    function getPityLimit(
        enemyData
    ) {

        const note =
            enemyNote(
                enemyData
            );


        const match =
            note.match(
                /<UnidentifiedDropPity\s*:\s*(\d+)>/i
            );


        if (!match) {

            return 0;
        }


        const pity =
            Number(
                match[1]
            );


        if (
            !Number.isFinite(pity)
        ) {

            return 0;
        }


        return Math.max(
            0,
            Math.floor(
                pity
            )
        );
    }


    // =========================================================================
    // 取得敵人保底 ID
    // =========================================================================
    //
    // 使用敵人資料庫 ID。
    //
    // 每種敵人獨立計算。
    //
    // =========================================================================

    function getPityKey(
        enemyData
    ) {

        if (!enemyData) {

            return "";
        }


        return String(
            enemyData.id
        );
    }


    // =========================================================================
    // 取得目前保底計數
    // =========================================================================

    function getPityCount(
        enemyData
    ) {

        ensurePityData();


        if (
            !$gameSystem
        ) {

            return 0;
        }


        const key =
            getPityKey(
                enemyData
            );


        return Number(
            $gameSystem
                ._unidentifiedDropPity[key] || 0
        );
    }


    // =========================================================================
    // 設定保底計數
    // =========================================================================

    function setPityCount(
        enemyData,
        value
    ) {

        ensurePityData();


        if (
            !$gameSystem
        ) {

            return;
        }


        const key =
            getPityKey(
                enemyData
            );


        $gameSystem
            ._unidentifiedDropPity[key] =
                Math.max(
                    0,
                    Math.floor(
                        Number(value) || 0
                    )
                );
    }


    // =========================================================================
    // 重設保底
    // =========================================================================

    function resetPityCount(
        enemyData
    ) {

        setPityCount(
            enemyData,
            0
        );
    }


    // =========================================================================
    // 增加保底計數
    // =========================================================================

    function increasePityCount(
        enemyData
    ) {

        const current =
            getPityCount(
                enemyData
            );


        setPityCount(
            enemyData,
            current + 1
        );
    }


    // =========================================================================
    // 取得鑑定等級
    // =========================================================================

    function getIdentificationLevel(
        item
    ) {

        if (!item) {

            return 0;
        }


        const note =
            String(
                item.note || ""
            );


        const match =
            note.match(
                /<IdentifyLevel\s*:\s*(\d+)>/i
            );


        if (!match) {

            return 0;
        }


        const level =
            Number(
                match[1]
            );


        if (
            !Number.isFinite(level)
        ) {

            return 0;
        }


        if (
            level < 1 ||
            level > MAX_LEVEL
        ) {

            return 0;
        }


        return level;
    }


    // =========================================================================
    // 確認是否為有效未鑑定物品
    // =========================================================================

    function isValidIdentificationItem(
        item
    ) {

        if (!item) {

            return false;
        }


        const note =
            String(
                item.note || ""
            );


        // ---------------------------------------------------------
        // 必須有 IdentifyLevel
        // ---------------------------------------------------------

        if (
            !/<IdentifyLevel\s*:\s*\d+>/i.test(
                note
            )
        ) {

            return false;
        }


        // ---------------------------------------------------------
        // 必須有 IdentifyResult
        // ---------------------------------------------------------

        if (
            !/<IdentifyResult\s*:\s*(item|weapon|armor)\s*:\s*\d+>/i.test(
                note
            )
        ) {

            return false;
        }


        return true;
    }


    // =========================================================================
    // 建立未鑑定物品池
    // =========================================================================

    function makeUnidentifiedPool(
        levels
    ) {

        const pool = [];


        if (
            !Array.isArray(levels) ||
            !levels.length
        ) {

            return pool;
        }


        if (
            !Array.isArray($dataItems)
        ) {

            return pool;
        }


        for (
            let i = 1;
            i < $dataItems.length;
            i++
        ) {

            const item =
                $dataItems[i];


            if (!item) {

                continue;
            }


            if (
                !isValidIdentificationItem(
                    item
                )
            ) {

                continue;
            }


            const level =
                getIdentificationLevel(
                    item
                );


            if (
                levels.includes(
                    level
                )
            ) {

                pool.push(
                    item
                );
            }
        }


        return pool;
    }


    // =========================================================================
    // 隨機取得物品
    // =========================================================================

    function randomItem(
        pool
    ) {

        if (
            !pool ||
            !pool.length
        ) {

            return null;
        }


        const index =
            Math.floor(
                Math.random() *
                pool.length
            );


        return pool[index];
    }


    // =========================================================================
    // 機率判定
    // =========================================================================

    function rollDrop(
        rate
    ) {

        if (
            rate <= 0
        ) {

            return false;
        }


        if (
            rate >= 100
        ) {

            return true;
        }


        return (
            Math.random() *
            100
        ) < rate;
    }


    // =========================================================================
    // 建立單一敵人的未鑑定掉落
    // =========================================================================

    function makeEnemyUnidentifiedDrops(
        enemy
    ) {

        const result = [];


        if (!enemy) {

            return result;
        }


        const enemyData =
            enemy.enemy();


        if (!enemyData) {

            return result;
        }


        // ---------------------------------------------------------
        // 掉落機率
        // ---------------------------------------------------------

        const rate =
            getDropRate(
                enemyData
            );


        if (
            rate <= 0
        ) {

            return result;
        }


        // ---------------------------------------------------------
        // 掉落等級
        // ---------------------------------------------------------

        const levels =
            getDropLevels(
                enemyData
            );


        if (
            !levels.length
        ) {

            console.warn(
                "RandomUnidentifiedDrop_MZ：" +
                "敵人「" +
                enemyData.name +
                "」沒有有效的 UnidentifiedDropLevel。"
            );

            return result;
        }


        // ---------------------------------------------------------
        // 建立物品池
        // ---------------------------------------------------------

        const pool =
            makeUnidentifiedPool(
                levels
            );


        if (
            !pool.length
        ) {

            console.warn(
                "RandomUnidentifiedDrop_MZ：" +
                "找不到 Lv." +
                levels.join("、") +
                " 的未鑑定物品。"
            );

            return result;
        }


        // ---------------------------------------------------------
        // 保底設定
        // ---------------------------------------------------------

        const pityLimit =
            getPityLimit(
                enemyData
            );


        const currentPity =
            getPityCount(
                enemyData
            );


        // ---------------------------------------------------------
        // 正常機率判定
        // ---------------------------------------------------------

        let success =
            rollDrop(
                rate
            );


        // ---------------------------------------------------------
        // 保底判定
        // ---------------------------------------------------------
        //
        // 注意：
        //
        // currentPity 是「戰鬥前」的連續未掉落數。
        //
        // 如果目前已經達到：
        //
        // pityLimit - 1
        //
        // 本次再失敗就必須保底。
        //
        // 例如：
        //
        // Pity = 10
        //
        // 第 10 隻：
        //
        // currentPity = 9
        //
        // 本次失敗
        // → 強制掉落。
        //
        // ---------------------------------------------------------

        if (
            !success &&
            pityLimit > 0 &&
            currentPity + 1 >= pityLimit
        ) {

            success = true;

            console.log(
                "RandomUnidentifiedDrop_MZ：" +
                enemyData.name +
                " 觸發保底掉落。"
            );
        }


        // ---------------------------------------------------------
        // 沒有掉落
        // ---------------------------------------------------------

        if (!success) {

            increasePityCount(
                enemyData
            );

            return result;
        }


        // ---------------------------------------------------------
        // 成功掉落
        // ---------------------------------------------------------

        resetPityCount(
            enemyData
        );


        // ---------------------------------------------------------
        // 掉落數量
        // ---------------------------------------------------------

        const count =
            getDropCount(
                enemyData
            );


        // ---------------------------------------------------------
        // 隨機取得
        // ---------------------------------------------------------

        for (
            let i = 0;
            i < count;
            i++
        ) {

            const item =
                randomItem(
                    pool
                );


            if (item) {

                result.push(
                    item
                );
            }
        }


        return result;
    }


    // =========================================================================
    // 建立本場戰鬥所有未鑑定掉落
    // =========================================================================

    function makeBattleUnidentifiedDrops() {

        const result = [];


        if (
            !$gameTroop
        ) {

            return result;
        }


        const enemies =
            $gameTroop.members();


        for (
            const enemy of enemies
        ) {

            if (!enemy) {

                continue;
            }


            if (
                !enemy.isDead()
            ) {

                continue;
            }


            const drops =
                makeEnemyUnidentifiedDrops(
                    enemy
                );


            for (
                const item of drops
            ) {

                result.push(
                    item
                );
            }
        }


        return result;
    }


    // =========================================================================
    // 每場戰鬥限定掉落
    // =========================================================================

    function hasBattleDropLimit(
        item
    ) {

        if (!item) {

            return false;
        }


        // ---------------------------------------------------------
        // 影蝕碎片
        // ---------------------------------------------------------

        if (
            String(
                item.name || ""
            ).trim() ===
            "影蝕碎片"
        ) {

            return true;
        }


        // ---------------------------------------------------------
        // 自訂標籤
        // ---------------------------------------------------------

        const note =
            String(
                item.note || ""
            );


        return (
            /<BattleDropLimit\s*:\s*1>/i.test(
                note
            )
        );
    }


    // =========================================================================
    // 每場戰鬥限制
    // =========================================================================

    function limitBattleDrops(
        items
    ) {

        if (
            !Array.isArray(items)
        ) {

            return [];
        }


        const result = [];


        const limitedItems =
            new Set();


        for (
            const item of items
        ) {

            if (!item) {

                continue;
            }


            // -----------------------------------------------------
            // 不限制
            // -----------------------------------------------------

            if (
                !hasBattleDropLimit(
                    item
                )
            ) {

                result.push(
                    item
                );

                continue;
            }


            // -----------------------------------------------------
            // 取得物品 ID
            // -----------------------------------------------------

            const itemId =
                Number(
                    item.id
                );


            // -----------------------------------------------------
            // 本場已經出現過
            // -----------------------------------------------------

            if (
                limitedItems.has(
                    itemId
                )
            ) {

                continue;
            }


            // -----------------------------------------------------
            // 第一次出現
            // -----------------------------------------------------

            limitedItems.add(
                itemId
            );


            result.push(
                item
            );
        }


        return result;
    }


    // =========================================================================
    // BattleManager.makeRewards
    // =========================================================================
    //
    // 注意：
    //
    // 這裡只負責「新增未鑑定掉落」以及
    // 「限制特殊掉落數量」。
    //
    // 原本 RPG Maker MZ 的掉落仍然保留。
    //
    // =========================================================================

    const _BattleManager_makeRewards =
        BattleManager.makeRewards;


    BattleManager.makeRewards =
        function() {

            // ---------------------------------------------------------
            // 原本 MZ 戰鬥獎勵
            // ---------------------------------------------------------

            _BattleManager_makeRewards.call(
                this
            );


            // ---------------------------------------------------------
            // 確保 rewards
            // ---------------------------------------------------------

            if (
                !this._rewards
            ) {

                return;
            }


            if (
                !Array.isArray(
                    this._rewards.items
                )
            ) {

                this._rewards.items =
                    [];
            }


            // ---------------------------------------------------------
            // 未鑑定物品
            // ---------------------------------------------------------

            const unidentifiedDrops =
                makeBattleUnidentifiedDrops();


            for (
                const item of unidentifiedDrops
            ) {

                this._rewards.items.push(
                    item
                );
            }


            // ---------------------------------------------------------
            // 每場戰鬥限定
            // ---------------------------------------------------------

            this._rewards.items =
                limitBattleDrops(
                    this._rewards.items
                );


            // ---------------------------------------------------------
            // Console
            // ---------------------------------------------------------

            if (
                unidentifiedDrops.length
            ) {

                console.log(
                    "RandomUnidentifiedDrop_MZ：" +
                    "未鑑定掉落 →",
                    unidentifiedDrops.map(
                        item =>
                            item.name
                    )
                );
            }

        };


    // =========================================================================
    // 公開 API
    // =========================================================================

    window.RandomUnidentifiedDropMZ = {

        getDropRate,

        getDropLevels,

        getDropCount,

        getPityLimit,

        getPityCount,

        setPityCount,

        resetPityCount,

        increasePityCount,

        makeUnidentifiedPool,

        makeBattleUnidentifiedDrops,

        limitBattleDrops

    };


    // =========================================================================
    // 啟動訊息
    // =========================================================================

    console.log(
        "RandomUnidentifiedDrop_MZ v1.2.0 已啟用"
    );

})();
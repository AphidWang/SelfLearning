-- 個人 Retro 系統資料庫表結構
-- 包含問題庫、回答記錄和會話管理

-- 1. 回顧問題表
CREATE TABLE IF NOT EXISTS retro_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('reflection', 'growth', 'challenge', 'gratitude', 'planning')),
    age_group VARCHAR(20) NOT NULL CHECK (age_group IN ('all', 'elementary', 'middle', 'high', 'adult')) DEFAULT 'all',
    difficulty INTEGER NOT NULL CHECK (difficulty >= 1 AND difficulty <= 5) DEFAULT 3,
    tags TEXT[] DEFAULT '{}',
    hint TEXT,
    example TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 回顧回答表
CREATE TABLE IF NOT EXISTS retro_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    week_id VARCHAR(10) NOT NULL, -- 格式: YYYY-WW
    question JSONB NOT NULL, -- 儲存問題的完整資訊
    is_custom_question BOOLEAN DEFAULT false,
    custom_question TEXT,
    answer TEXT NOT NULL,
    mood VARCHAR(20) NOT NULL CHECK (mood IN ('excited', 'happy', 'okay', 'tired', 'stressed')),
    emoji VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 回顧會話表 (可選，用於追蹤完整的回顧流程)
CREATE TABLE IF NOT EXISTS retro_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_id VARCHAR(10) NOT NULL,
    weekly_stats JSONB, -- 儲存當週統計資料
    drawn_questions JSONB, -- 儲存抽到的問題
    answer_id UUID REFERENCES retro_answers(id),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 索引優化
CREATE INDEX IF NOT EXISTS idx_retro_questions_type ON retro_questions(type);
CREATE INDEX IF NOT EXISTS idx_retro_questions_active ON retro_questions(is_active);
CREATE INDEX IF NOT EXISTS idx_retro_answers_user_date ON retro_answers(user_id, date);
CREATE INDEX IF NOT EXISTS idx_retro_answers_week ON retro_answers(week_id);
CREATE INDEX IF NOT EXISTS idx_retro_sessions_user_week ON retro_sessions(user_id, week_id);

-- 5. RLS (Row Level Security) 設定
ALTER TABLE retro_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE retro_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE retro_sessions ENABLE ROW LEVEL SECURITY;

-- 問題庫讀取權限 (所有認證用戶)
CREATE POLICY "問題庫讀取權限" ON retro_questions
    FOR SELECT TO authenticated
    USING (is_active = true);

-- 問題庫寫入權限 (管理員和導師)
CREATE POLICY "問題庫寫入權限" ON retro_questions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND (
                auth.users.raw_user_meta_data->>'role' = 'admin' OR
                auth.users.raw_user_meta_data->>'role' = 'mentor'
            )
        )
    );

-- 回答記錄權限 (只能操作自己的記錄)
CREATE POLICY "回答記錄完全權限" ON retro_answers
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 回顧會話權限 (只能操作自己的會話)
CREATE POLICY "回顧會話完全權限" ON retro_sessions
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 6. 自動更新 updated_at 觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_retro_questions_updated_at 
    BEFORE UPDATE ON retro_questions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retro_answers_updated_at 
    BEFORE UPDATE ON retro_answers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retro_sessions_updated_at 
    BEFORE UPDATE ON retro_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. 插入預設問題
INSERT INTO retro_questions (question, type, age_group, difficulty, tags, hint, example) VALUES
-- 反思類問題
('這週學習時，什麼時候讓你覺得最有成就感？', 'reflection', 'all', 2, '{"成就感", "學習"}', '想想完成某個任務或理解某個概念的瞬間', '當我終於理解了數學題的解法，感覺很棒！'),
('遇到困難時，你用了什麼方法來解決？', 'reflection', 'all', 3, '{"解決問題", "困難"}', '可以是求助、查資料、換個角度思考等', '我先試著自己想，然後問了同學，最後上網查了資料'),
('這週的學習節奏如何？太快、太慢、還是剛好？', 'reflection', 'all', 2, '{"學習節奏", "自我認知"}', '想想自己的學習速度和理解程度', '有點太快了，有些地方還沒完全理解就進入下一個主題'),

-- 成長類問題
('這週你學到了什麼新技能或知識？', 'growth', 'all', 1, '{"新技能", "知識"}', '不管多小的進步都算！', '學會了用新的方法記憶英文單字'),
('比起上週，你在哪方面有進步？', 'growth', 'all', 2, '{"進步", "比較"}', '可以是學習方法、專注力、理解速度等', '專注力比上週好很多，可以連續讀書更長時間'),
('如果要教別人你這週學到的東西，你會怎麼教？', 'growth', 'all', 4, '{"教學", "理解"}', '用自己的話說出來，看看是否真的理解了', '我會用畫圖的方式解釋這個科學概念'),

-- 挑戰類問題
('這週最大的挑戰是什麼？你是如何面對的？', 'challenge', 'all', 3, '{"挑戰", "面對困難"}', '想想讓你感到困難或緊張的情況', '數學考試讓我很緊張，但我提前多做了練習題'),
('有沒有想要放棄的時候？後來怎麼繼續的？', 'challenge', 'all', 4, '{"堅持", "放棄"}', '想想是什麼讓你重新振作起來', '背英文單字很無聊，但想到能看懂更多英文書就繼續了'),

-- 感恩類問題
('這週有誰幫助了你的學習？想對他們說什麼？', 'gratitude', 'all', 1, '{"感謝", "幫助"}', '可以是老師、同學、家人或朋友', '謝謝媽媽耐心地陪我複習，還準備了好吃的點心'),
('這週學習過程中，什麼讓你感到開心或有趣？', 'gratitude', 'all', 2, '{"開心", "有趣"}', '可以是有趣的課程、好玩的實驗或愉快的討論', '科學實驗太有趣了，看到化學反應的瞬間很興奮'),

-- 計劃類問題
('下週你想重點加強哪個方面？', 'planning', 'all', 2, '{"計劃", "改進"}', '想想哪些地方還需要更多練習', '想要加強英文口語，多練習對話'),
('這週的經驗，對下週的學習有什麼啟發？', 'planning', 'all', 3, '{"啟發", "改進"}', '想想可以改進的學習方法或策略', '發現做筆記很有用，下週要養成邊聽邊記的習慣'),
('下週你想嘗試什麼新的學習方法？', 'planning', 'all', 2, '{"新方法", "嘗試"}', '可以是新的記憶技巧、學習工具或時間安排', '想試試番茄工作法，看看能不能提高專注力')

ON CONFLICT DO NOTHING;

-- 8. 有用的檢視 (Views)
CREATE OR REPLACE VIEW retro_weekly_summary AS
SELECT 
    user_id,
    week_id,
    COUNT(*) as answer_count,
    mode() WITHIN GROUP (ORDER BY mood) as common_mood,
    STRING_AGG(DISTINCT (question->>'type'), ', ') as question_types,
    MIN(created_at) as first_answer,
    MAX(created_at) as last_answer
FROM retro_answers
GROUP BY user_id, week_id;

-- 9. 有用的 RPC 函數
CREATE OR REPLACE FUNCTION get_completed_tasks_for_week(
    week_start DATE,
    week_end DATE,
    user_id UUID
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    topic_title TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    difficulty INTEGER
) LANGUAGE sql SECURITY DEFINER AS $$
    -- 這裡需要根據實際的任務表結構來實現
    -- 暫時返回空結果，實際實現時需要根據專案的任務表來調整
    SELECT 
        NULL::UUID as id,
        ''::TEXT as title, 
        ''::TEXT as topic_title,
        NOW()::TIMESTAMP WITH TIME ZONE as completed_at,
        3::INTEGER as difficulty
    WHERE FALSE;
$$; 
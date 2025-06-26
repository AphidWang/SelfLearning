-- 示例數據：學習主題
-- 這個文件包含了預設的學習主題數據
-- 用於初始化系統或測試使用

-- 清理現有數據
DELETE FROM topic_collaborators WHERE topic_id IN (SELECT id FROM topics WHERE owner_id = (SELECT id FROM auth.users WHERE email = 'admin@example.com'));
DELETE FROM topics WHERE owner_id = (SELECT id FROM auth.users WHERE email = 'admin@example.com');

-- 插入示例主題
WITH topic_data AS (
  SELECT 
    jsonb_build_array(
      -- 1. 探索唐詩之美
      jsonb_build_object(
        'title', '探索唐詩之美',
        'description', '透過詩歌感受唐代文人的情感與智慧',
        'status', 'in-progress',
        'subject', '國語',
        'bubbles', jsonb_build_array(
          jsonb_build_object(
            'id', 'bubble-1-1',
            'title', '詩歌欣賞',
            'parentId', '1',
            'bubbleType', 'background',
            'content', '在課堂上讀到李白的詩，被他的豪邁氣概所吸引'
          ),
          jsonb_build_object(
            'id', 'bubble-1-2',
            'title', '詩詞創作',
            'parentId', '1',
            'bubbleType', 'background',
            'content', '詩歌、韻律、意境、典故、創作'
          )
        ),
        'goals', jsonb_build_array(
          jsonb_build_object(
            'id', '1-1',
            'title', '認識詩的韻律',
            'status', 'todo',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '1-1-1', 'title', '詩韻優美', 'status', 'idea'),
              jsonb_build_object('id', '1-1-2', 'title', '押韻好記', 'status', 'idea')
            )
          ),
          jsonb_build_object(
            'id', '1-2',
            'title', '感受詩的意境',
            'status', 'focus',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '1-2-1', 'title', '畫出詩中的畫面', 'status', 'in_progress'),
              jsonb_build_object('id', '1-2-2', 'title', '分享詩中的情感', 'status', 'todo')
            )
          ),
          jsonb_build_object(
            'id', '1-3',
            'title', '探索詩的典故',
            'status', 'todo',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '1-3-1', 'title', '找出詩中的歷史故事', 'status', 'todo'),
              jsonb_build_object('id', '1-3-2', 'title', '創作自己的典故', 'status', 'todo')
            )
          ),
          jsonb_build_object(
            'id', '1-4',
            'title', '創作詩的想像',
            'status', 'todo',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '1-4-1', 'title', '用現代語言改寫古詩', 'status', 'todo'),
              jsonb_build_object('id', '1-4-2', 'title', '創作自己的詩句', 'status', 'todo')
            )
          )
        )
      ),
      -- 2. 探索分數的奧秘
      jsonb_build_object(
        'title', '探索分數的奧秘',
        'description', '透過生活情境理解分數的概念',
        'status', 'active',
        'subject', '數學',
        'is_collaborative', true,
        'show_avatars', true,
        'bubbles', jsonb_build_array(
          jsonb_build_object(
            'id', 'bubble-2-1',
            'title', '生活應用',
            'parentId', '2',
            'bubbleType', 'background',
            'content', '在切蛋糕時發現需要平均分配，這讓我對分數產生興趣'
          ),
          jsonb_build_object(
            'id', 'bubble-2-2',
            'title', '分數概念',
            'parentId', '2',
            'bubbleType', 'background',
            'content', '分數、比例、除法、比較'
          )
        ),
        'goals', jsonb_build_array(
          jsonb_build_object(
            'id', '2-1',
            'title', '生活中的分數',
            'status', 'complete',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '2-1-1', 'title', '平均分配', 'status', 'idea'),
              jsonb_build_object('id', '2-1-2', 'title', '公平分享', 'status', 'idea')
            )
          ),
          jsonb_build_object(
            'id', '2-2',
            'title', '分數的比較',
            'status', 'focus',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '2-2-1', 'title', '比較分數的大小', 'status', 'in_progress'),
              jsonb_build_object('id', '2-2-2', 'title', '排列分數的順序', 'status', 'todo')
            )
          )
        )
      ),
      -- 3. 探索植物生長
      jsonb_build_object(
        'title', '探索植物生長',
        'description', '透過觀察了解植物的生命週期',
        'status', 'active',
        'subject', '自然',
        'bubbles', jsonb_build_array(
          jsonb_build_object(
            'id', 'bubble-4-1',
            'title', '種子發芽',
            'parentId', '4',
            'bubbleType', 'background',
            'content', '看到種子發芽的過程，對植物的生長感到好奇'
          ),
          jsonb_build_object(
            'id', 'bubble-4-2',
            'title', '植物生長',
            'parentId', '4',
            'bubbleType', 'background',
            'content', '發芽、生長、開花、結果'
          )
        ),
        'goals', jsonb_build_array(
          jsonb_build_object(
            'id', '4-1',
            'title', '種子探索',
            'status', 'todo',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '4-1-1', 'title', '種子變化', 'status', 'idea'),
              jsonb_build_object('id', '4-1-2', 'title', '發芽過程', 'status', 'idea')
            )
          ),
          jsonb_build_object(
            'id', '4-2',
            'title', '發芽過程',
            'status', 'todo',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '4-2-1', 'title', '觀察種子發芽的變化', 'status', 'in_progress'),
              jsonb_build_object('id', '4-2-2', 'title', '測量幼苗的生長', 'status', 'todo')
            )
          ),
          jsonb_build_object(
            'id', '4-3',
            'title', '葉子研究',
            'status', 'todo',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '4-3-1', 'title', '觀察葉子的形狀和顏色', 'status', 'todo'),
              jsonb_build_object('id', '4-3-2', 'title', '研究葉子的功能', 'status', 'todo')
            )
          ),
          jsonb_build_object(
            'id', '4-4',
            'title', '開花結果',
            'status', 'todo',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '4-4-1', 'title', '觀察花朵的結構', 'status', 'todo'),
              jsonb_build_object('id', '4-4-2', 'title', '記錄果實的形成', 'status', 'todo')
            )
          )
        )
      ),
      -- 4. 探索色彩藝術
      jsonb_build_object(
        'title', '探索色彩藝術',
        'description', '透過色彩認識藝術表現',
        'status', 'active',
        'subject', '美術',
        'bubbles', jsonb_build_array(
          jsonb_build_object(
            'id', 'bubble-5-1',
            'title', '美術課',
            'parentId', '5',
            'bubbleType', 'background',
            'content', '在美術課上看到同學用不同顏色畫出漂亮的畫，讓我很好奇顏色是怎麼搭配的'
          ),
          jsonb_build_object(
            'id', 'bubble-5-2',
            'title', '色彩學',
            'parentId', '5',
            'bubbleType', 'background',
            'content', '色彩學、色輪、色彩心理學、繪畫技巧'
          )
        ),
        'goals', jsonb_build_array(
          jsonb_build_object(
            'id', '5-1',
            'title', '色彩探索',
            'status', 'todo',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '5-1-1', 'title', '不同的心情', 'status', 'idea'),
              jsonb_build_object('id', '5-1-2', 'title', '顏色混合', 'status', 'idea')
            )
          ),
          jsonb_build_object(
            'id', '5-2',
            'title', '色彩情感',
            'status', 'focus',
            'tasks', jsonb_build_array(
              jsonb_build_object(
                'id', '5-2-1',
                'title', '試著用溫暖的顏色畫出快樂的場景',
                'status', 'in_progress',
                'needHelp', true,
                'helpMessage', '我不知道什麼顏色算是溫暖的顏色，可以給我一些例子嗎？',
                'replyMessage', '溫暖的顏色包括紅色、橙色、黃色等，這些顏色會讓人感到溫馨和愉快。你可以試著用夕陽的顏色來畫一個開心的場景。',
                'replyAt', '2024-03-16'
              ),
              jsonb_build_object('id', '5-2-2', 'title', '用冷色調表現下雨天的感覺', 'status', 'todo')
            )
          ),
          jsonb_build_object(
            'id', '5-3',
            'title', '色彩構圖',
            'status', 'todo',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '5-3-1', 'title', '學習如何讓顏色和諧地搭配在一起', 'status', 'todo'),
              jsonb_build_object('id', '5-3-2', 'title', '練習用不同深淺的顏色創造層次感', 'status', 'todo')
            )
          ),
          jsonb_build_object(
            'id', '5-4',
            'title', '色彩故事',
            'status', 'todo',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '5-4-1', 'title', '用顏色來表達一個故事的情緒變化', 'status', 'todo'),
              jsonb_build_object('id', '5-4-2', 'title', '創作一幅用顏色說故事的畫', 'status', 'todo')
            )
          )
        )
      ),
      -- 5. 探索身體運動
      jsonb_build_object(
        'title', '探索身體運動',
        'description', '透過運動了解身體機能',
        'status', 'active',
        'subject', '體育',
        'bubbles', jsonb_build_array(
          jsonb_build_object(
            'id', 'bubble-6-1',
            'title', '體育課',
            'parentId', '6',
            'bubbleType', 'background',
            'content', '看到同學在體育課上玩得很開心，我也想學會這些運動'
          ),
          jsonb_build_object(
            'id', 'bubble-6-2',
            'title', '體能訓練',
            'parentId', '6',
            'bubbleType', 'background',
            'content', '體能訓練、運動技巧、健康生活、團隊合作'
          )
        ),
        'goals', jsonb_build_array(
          jsonb_build_object(
            'id', '6-1',
            'title', '身體探索',
            'status', 'todo',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '6-1-1', 'title', '心跳變化', 'status', 'idea'),
              jsonb_build_object('id', '6-1-2', 'title', '肌肉伸展', 'status', 'idea')
            )
          ),
          jsonb_build_object(
            'id', '6-2',
            'title', '基礎運動',
            'status', 'focus',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '6-2-1', 'title', '學習正確的跑步姿勢，避免受傷', 'status', 'in_progress'),
              jsonb_build_object('id', '6-2-2', 'title', '練習基本的跳躍和平衡動作', 'status', 'todo')
            )
          ),
          jsonb_build_object(
            'id', '6-3',
            'title', '運動技能',
            'status', 'focus',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '6-3-1', 'title', '學習投球和接球的技巧', 'status', 'todo'),
              jsonb_build_object('id', '6-3-2', 'title', '練習團隊運動中的傳球和配合', 'status', 'todo')
            )
          ),
          jsonb_build_object(
            'id', '6-4',
            'title', '運動應用',
            'status', 'todo',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '6-4-1', 'title', '設計一個有趣的運動遊戲，讓大家都能參與', 'status', 'todo'),
              jsonb_build_object('id', '6-4-2', 'title', '參加班際運動比賽，體驗團隊合作', 'status', 'todo')
            )
          )
        )
      ),
      -- 6. 為什麼要讀書
      jsonb_build_object(
        'title', '為什麼要讀書',
        'description', '探索讀書的意義與價值',
        'status', 'active',
        'subject', '社會',
        'bubbles', jsonb_build_array(
          jsonb_build_object(
            'id', 'bubble-7-1',
            'title', '爸媽建議',
            'parentId', '7',
            'bubbleType', 'background',
            'content', '爸媽常說讀書很重要，但我想知道為什麼'
          ),
          jsonb_build_object(
            'id', 'bubble-7-2',
            'title', '學習方法',
            'parentId', '7',
            'bubbleType', 'background',
            'content', '學習方法、知識獲取、思考能力、自我成長'
          )
        ),
        'goals', jsonb_build_array(
          jsonb_build_object(
            'id', '7-1',
            'title', '讀書的現況',
            'status', 'focus',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '7-1-1', 'title', '想像場景', 'status', 'idea'),
              jsonb_build_object('id', '7-1-2', 'title', '時間飛逝', 'status', 'idea'),
              jsonb_build_object('id', '7-1-3', 'title', '訪問同學', 'status', 'todo')
            )
          ),
          jsonb_build_object(
            'id', '7-2',
            'title', '體驗讀書',
            'status', 'focus',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '7-2-1', 'title', '試著讀一本故事書，記錄下自己的感受和想法', 'status', 'todo'),
              jsonb_build_object('id', '7-2-2', 'title', '讀一本科普書，看看能學到什麼新知識', 'status', 'todo')
            )
          ),
          jsonb_build_object(
            'id', '7-3',
            'title', '讀書的收穫',
            'status', 'focus',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '7-3-1', 'title', '整理讀書時學到的新詞彙和概念', 'status', 'todo'),
              jsonb_build_object('id', '7-3-2', 'title', '思考讀書如何幫助我解決生活中的問題', 'status', 'todo'),
              jsonb_build_object('id', '7-3-3', 'title', '記錄讀書後的想法和啟發', 'status', 'todo')
            )
          ),
          jsonb_build_object(
            'id', '7-4',
            'title', '讀書的價值',
            'status', 'focus',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '7-4-1', 'title', '製作一個讀書心得分享，說明讀書帶來的改變', 'status', 'todo'),
              jsonb_build_object('id', '7-4-2', 'title', '和同學討論讀書的樂趣和收穫', 'status', 'todo')
            )
          )
        )
      ),
      -- 7. 火箭能飛多高
      jsonb_build_object(
        'title', '火箭能飛多高',
        'description', '透過觀察、行動、學習和分享，探索火箭飛行的原理',
        'status', 'active',
        'subject', '自然',
        'bubbles', jsonb_build_array(
          jsonb_build_object(
            'id', 'bubble-8-1',
            'title', '可以去月球嗎',
            'parentId', '8',
            'bubbleType', 'background',
            'content', '看到火箭發射的影片，想知道為什麼火箭能飛得這麼高'
          ),
          jsonb_build_object(
            'id', 'bubble-8-2',
            'title', '想知道飛行原理',
            'parentId', '8',
            'bubbleType', 'background',
            'content', '火箭、推力、重力、空氣阻力、牛頓運動定律'
          )
        ),
        'goals', jsonb_build_array(
          jsonb_build_object(
            'id', '8-1',
            'title', '觀察火箭',
            'status', 'focus',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '8-1-1', 'title', '收集火箭發射的影片和圖片', 'status', 'idea'),
              jsonb_build_object('id', '8-1-2', 'title', '觀察火箭發射時的變化', 'status', 'idea')
            )
          ),
          jsonb_build_object(
            'id', '8-2',
            'title', '動手實驗',
            'status', 'focus',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '8-2-1', 'title', '製作簡單的水火箭', 'status', 'todo'),
              jsonb_build_object('id', '8-2-2', 'title', '測試不同水量對飛行高度的影響', 'status', 'todo')
            )
          ),
          jsonb_build_object(
            'id', '8-3',
            'title', '學習原理',
            'status', 'todo',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '8-3-1', 'title', '了解牛頓第三運動定律', 'status', 'todo'),
              jsonb_build_object('id', '8-3-2', 'title', '探索空氣阻力和重力的影響', 'status', 'todo')
            )
          ),
          jsonb_build_object(
            'id', '8-4',
            'title', '分享發現',
            'status', 'todo',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '8-4-1', 'title', '製作實驗報告，記錄觀察結果', 'status', 'todo'),
              jsonb_build_object('id', '8-4-2', 'title', '向同學展示水火箭實驗', 'status', 'todo')
            )
          )
        )
      ),
      -- 8. 火箭可以飛多高？
      jsonb_build_object(
        'title', '火箭可以飛多高？',
        'description', '探索火箭能飛多高與太空邊界',
        'status', 'active',
        'subject', '自然',
        'bubbles', jsonb_build_array(
          jsonb_build_object(
            'id', 'bubble-9-1',
            'title', '會離開地球嗎？',
            'parentId', '9',
            'bubbleType', 'background',
            'content', '我們知道火箭會飛上天，但它可以飛多高？會超過雲、飛機、太空站，還是可以飛到月球？'
          ),
          jsonb_build_object(
            'id', 'bubble-9-2',
            'title', '能飛到太陽嗎？',
            'parentId', '9',
            'bubbleType', 'background',
            'content', '地球外的大氣層有很多層，太空的起點是「卡門線」，大約在地面上方 100 公里。'
          )
        ),
        'goals', jsonb_build_array(
          jsonb_build_object(
            'id', '9-1',
            'title', '火箭飛到哪裡去？',
            'status', 'focus',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '9-1-1', 'title', '火箭怎麼起飛', 'status', 'done'),
              jsonb_build_object('id', '9-1-2', 'title', '查查太空從哪裡開始（卡門線）', 'status', 'done'),
              jsonb_build_object('id', '9-1-3', 'title', '找出真實火箭可飛多高', 'status', 'done')
            )
          ),
          jsonb_build_object(
            'id', '9-2',
            'title', '和其他飛行器比較',
            'status', 'focus',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '9-2-1', 'title', '查飛機、太空站的高度並畫圖比較', 'status', 'in_progress'),
              jsonb_build_object('id', '9-2-2', 'title', '整理你找到的高度資料做成表格', 'status', 'todo')
            )
          ),
          jsonb_build_object(
            'id', '9-3',
            'title', '創作與分享你的發現',
            'status', 'focus',
            'tasks', jsonb_build_array(
              jsonb_build_object('id', '9-3-1', 'title', '製作小報或簡報介紹火箭飛多高', 'status', 'todo'),
              jsonb_build_object('id', '9-3-2', 'title', '錄一段影片：我是火箭小主播', 'status', 'todo')
            )
          )
        )
      )
    ) as topics
)
INSERT INTO topics (
  id, title, description, subject, status, goals, bubbles, 
  owner_id, is_collaborative, show_avatars, progress, type,
  created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  t->>'title',
  t->>'description',
  t->>'subject',
  t->>'status',
  t->'goals',
  t->'bubbles',
  (SELECT id FROM auth.users WHERE email = 'admin@example.com'),
  COALESCE((t->>'is_collaborative')::boolean, false),
  COALESCE((t->>'show_avatars')::boolean, true),
  0,
  'learning',
  NOW(),
  NOW()
FROM topic_data,
jsonb_array_elements(topics) t;

-- 為協作主題添加協作者
WITH topic_data AS (
  SELECT id, owner_id 
  FROM topics 
  WHERE title = '探索分數的奧秘' AND owner_id = (SELECT id FROM auth.users WHERE email = 'admin@example.com')
),
collaborator_data AS (
  SELECT id FROM auth.users WHERE email IN ('student1@example.com', 'student2@example.com')
)
INSERT INTO topic_collaborators (
  id, topic_id, user_id, permission, invited_by, invited_at
)
SELECT 
  gen_random_uuid(),
  t.id,
  c.id,
  'edit',
  t.owner_id,
  NOW()
FROM topic_data t
CROSS JOIN collaborator_data c; 
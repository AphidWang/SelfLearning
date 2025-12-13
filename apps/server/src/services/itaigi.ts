/**
 * iTaigi 愛台語 資料解析服務
 * 
 * 功能：
 * - 查詢中文詞彙的台語翻譯
 * - 解析搜尋結果，取得台語詞彙、臺羅拼音、相關連結等
 */

import { load } from 'cheerio';

export interface ItaigiWord {
  /** 台語詞彙（國字） */
  hanzi: string;
  /** 臺羅拼音 */
  taiLo?: string;
  /** 相關的中文詞彙連結 */
  relatedWords?: string[];
  /** 投票數（按呢講好） */
  likeCount?: number;
  /** 投票數（按呢怪怪） */
  dislikeCount?: number;
  /** 是否有聲音 */
  hasAudio?: boolean;
}

export interface ItaigiSearchResult {
  /** 查詢的關鍵字 */
  query: string;
  /** 搜尋結果列表 */
  words: ItaigiWord[];
  /** 相關詞彙 */
  relatedQueries?: string[];
}

export class ItaigiService {
  private baseUrl = 'https://itaigi.tw';
  
  /**
   * 搜尋中文詞彙，返回台語翻譯結果
   */
  async search(query: string): Promise<ItaigiSearchResult> {
    try {
      // 先嘗試使用搜尋 API endpoint
      const searchUrl = `${this.baseUrl}/平臺項目列表/揣列表?關鍵字=${encodeURIComponent(query)}`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'application/json, text/html, */*',
          'Referer': `${this.baseUrl}/`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      let data: any;

      // 嘗試解析為 JSON
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        // 如果是 HTML，需要解析頁面
        const html = await response.text();
        return this.parseSearchPage(html, query);
      }

      // 解析 JSON 回應
      return this.parseJsonResponse(data, query);

    } catch (error: any) {
      console.error('Itaigi search error:', error);
      throw new Error(`搜尋失敗: ${error.message}`);
    }
  }

  /**
   * 直接查詢詞彙頁面（使用 /k/ 路徑）
   */
  async getWord(query: string): Promise<ItaigiSearchResult> {
    try {
      const wordUrl = `${this.baseUrl}/k/${encodeURIComponent(query)}/`;
      
      const response = await fetch(wordUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Referer': `${this.baseUrl}/`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      return this.parseWordPage(html, query);

    } catch (error: any) {
      console.error('Itaigi getWord error:', error);
      throw new Error(`查詢失敗: ${error.message}`);
    }
  }

  /**
   * 解析搜尋頁面的 HTML
   */
  private parseSearchPage(html: string, query: string): ItaigiSearchResult {
    const $ = load(html);
    const words: ItaigiWord[] = [];

    // 解析搜尋結果
    // 根據實際的 HTML 結構調整選擇器
    $('.item, .result-item, [data-word]').each((_, elem) => {
      const $elem = $(elem);
      
      // 提取詞彙
      const hanzi = $elem.find('.hanzi, .word, h3, h4, a').first().text().trim();
      if (!hanzi) return;

      // 提取臺羅拼音
      const taiLo = $elem.find('.tai-lo, .romanization, .phonetic').text().trim() || undefined;

      // 提取相關詞彙
      const relatedWords: string[] = [];
      $elem.find('.related-words a, .related a').each((_, link) => {
        const text = $(link).text().trim();
        if (text) relatedWords.push(text);
      });

      // 提取投票數
      const likeText = $elem.find('.like, .vote-up, [data-like]').text();
      const dislikeText = $elem.find('.dislike, .vote-down, [data-dislike]').text();
      const likeCount = this.extractNumber(likeText);
      const dislikeCount = this.extractNumber(dislikeText);

      // 檢查是否有聲音
      const hasAudio = $elem.find('.audio, .sound, [data-audio]').length > 0;

      words.push({
        hanzi,
        taiLo,
        relatedWords: relatedWords.length > 0 ? relatedWords : undefined,
        likeCount,
        dislikeCount,
        hasAudio,
      });
    });

    return {
      query,
      words,
    };
  }

  /**
   * 解析詞彙頁面的 HTML
   */
  private parseWordPage(html: string, query: string): ItaigiSearchResult {
    const $ = load(html);
    const words: ItaigiWord[] = [];

    // 嘗試多種可能的選擇器來找到結果
    const selectors = [
      '.word-item',
      '.result-item',
      '[class*="word"]',
      '[class*="result"]',
      '.item',
      'article',
      'section',
    ];

    let foundResults = false;

    for (const selector of selectors) {
      const items = $(selector);
      if (items.length > 0) {
        items.each((_, elem) => {
          const $elem = $(elem);
          
          // 提取詞彙（優先找包含台語文字的連結）
          const hanziLink = $elem.find('a[href*="/k/"]').first();
          const hanzi = hanziLink.length > 0 
            ? hanziLink.text().trim() 
            : $elem.find('h1, h2, h3, h4, .title, .word').first().text().trim();
          
          if (!hanzi || hanzi === query) return;

          // 提取臺羅拼音（可能在標籤、屬性或文字中）
          let taiLo = $elem.find('.tai-lo, .romanization, .phonetic, [class*="tai-lo"]').text().trim();
          if (!taiLo) {
            // 嘗試從 data 屬性或 aria-label 取得
            taiLo = $elem.attr('data-tai-lo') || 
                   $elem.find('[data-tai-lo]').attr('data-tai-lo') ||
                   $elem.attr('aria-label')?.match(/[\w\s-]+/)?.[0] ||
                   '';
          }

          // 提取相關詞彙
          const relatedWords: string[] = [];
          $elem.find('a[href*="/k/"]').each((_, link) => {
            const text = $(link).text().trim();
            if (text && text !== hanzi && text !== query) {
              relatedWords.push(text);
            }
          });

          // 提取投票數（找包含數字的文字）
          const likeText = $elem.text().match(/按呢講好\s*(\d+)/)?.[1] || 
                          $elem.find('[class*="like"], [class*="vote"]').text();
          const dislikeText = $elem.text().match(/按呢怪怪\s*(\d+)/)?.[1] ||
                             $elem.find('[class*="dislike"]').text();
          
          const likeCount = this.extractNumber(likeText);
          const dislikeCount = this.extractNumber(dislikeText);

          // 檢查是否有聲音（通常會有音訊按鈕或標記）
          const hasAudio = $elem.find('button, [class*="audio"], [class*="sound"], [class*="play"]').length > 0 &&
                          !$elem.text().includes('這條沒聲音');

          words.push({
            hanzi,
            taiLo: taiLo || undefined,
            relatedWords: relatedWords.length > 0 ? relatedWords : undefined,
            likeCount,
            dislikeCount,
            hasAudio,
          });

          foundResults = true;
        });

        if (foundResults) break;
      }
    }

    // 如果沒有找到結構化結果，嘗試直接從頁面文字提取
    if (words.length === 0) {
      // 找所有連結到其他詞彙的連結
      $('a[href*="/k/"]').each((_, link) => {
        const $link = $(link);
        const hanzi = $link.text().trim();
        const href = $link.attr('href');
        
        if (hanzi && hanzi !== query && href) {
          // 嘗試從附近的文字找到臺羅拼音
          const parent = $link.parent();
          const taiLo = parent.find('.tai-lo, .romanization').text().trim() ||
                       parent.text().match(/[a-záàâāéèêēíìîīóòôōúùûū]+[-\s][a-záàâāéèêēíìîīóòôōúùûū]+/i)?.[0];

          words.push({
            hanzi,
            taiLo: taiLo || undefined,
          });
        }
      });
    }

    return {
      query,
      words: words.length > 0 ? words : [],
    };
  }

  /**
   * 解析 JSON 回應
   */
  private parseJsonResponse(data: any, query: string): ItaigiSearchResult {
    const words: ItaigiWord[] = [];

    // 根據實際的 JSON 結構調整
    if (Array.isArray(data)) {
      data.forEach((item: any) => {
        words.push({
          hanzi: item.hanzi || item.word || item.title || '',
          taiLo: item.taiLo || item.romanization || item.phonetic,
          relatedWords: item.relatedWords || item.related,
          likeCount: item.likeCount || item.likes || item.upvotes,
          dislikeCount: item.dislikeCount || item.dislikes || item.downvotes,
          hasAudio: item.hasAudio || item.audio !== null,
        });
      });
    } else if (data.words || data.results || data.items) {
      const items = data.words || data.results || data.items || [];
      items.forEach((item: any) => {
        words.push({
          hanzi: item.hanzi || item.word || item.title || '',
          taiLo: item.taiLo || item.romanization || item.phonetic,
          relatedWords: item.relatedWords || item.related,
          likeCount: item.likeCount || item.likes || item.upvotes,
          dislikeCount: item.dislikeCount || item.dislikes || item.downvotes,
          hasAudio: item.hasAudio || item.audio !== null,
        });
      });
    }

    return {
      query,
      words,
      relatedQueries: data.relatedQueries || data.related,
    };
  }

  /**
   * 從文字中提取數字
   */
  private extractNumber(text: string | undefined): number | undefined {
    if (!text) return undefined;
    const match = text.match(/\d+/);
    return match ? parseInt(match[0], 10) : undefined;
  }

  /**
   * 取得語音檔 URL（如果有的話）
   * iTaigi 使用 hapsing.itaigi.tw 服務
   */
  getAudioUrl(taiLo: string): string {
    return `https://hapsing.itaigi.tw/bangtsam?taibun=${encodeURIComponent(taiLo)}`;
  }
}

export const itaigiService = new ItaigiService();

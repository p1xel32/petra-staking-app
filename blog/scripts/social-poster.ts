import 'dotenv/config';
import axios from 'axios';
import path from 'path';
import OpenAI from 'openai';
import { TwitterApi } from 'twitter-api-v2';
import { createClient } from '@supabase/supabase-js';

const POSTING_DELAY_DAYS = 2;
const BATCH_SIZE = 3;
const ALL_PLATFORMS = ['twitter'];

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const twitter = {
    client: new TwitterApi({
        appKey: process.env.TWITTER_API_KEY!,
        appSecret: process.env.TWITTER_API_SECRET!,
        accessToken: process.env.TWITTER_ACCESS_TOKEN!,
        accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!
    }),
    enabled: !!(
        process.env.TWITTER_API_KEY &&
        process.env.TWITTER_API_SECRET &&
        process.env.TWITTER_ACCESS_TOKEN &&
        process.env.TWITTER_ACCESS_TOKEN_SECRET
    )
};

interface Post { title: string; pubDate: string; description: string; link: string; heroImage: string; keywords: string[]; tags?: string[]; author: string; }

function getLanguageFromLink(link: string): string {
    try {
        const url = new URL(link);
        const pathParts = url.pathname.split('/').filter(Boolean);
        // Path is usually /blog/[locale]/slug or /blog/slug
        if (pathParts[0] === 'blog') {
            const potentialLocale = pathParts[1];
            const locales = ['es', 'ja', 'ko', 'ru', 'vi'];
            if (locales.includes(potentialLocale)) {
                return potentialLocale;
            }
        }
    } catch (e) {
        console.error(`  ❌ Error parsing link for language: ${link}`);
    }
    return 'en';
}

async function getProcessedPlatformsFromSupabase(link: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('distribution_log')
        .select('channels')
        .eq('article_url', link)
        .maybeSingle();

    if (error) {
        console.error(`  ❌ Supabase error fetching ${link}:`, error.message);
        return [];
    }

    if (!data || !data.channels) return [];
    
    // Convert channels object { twitter: 'published' } to array ['twitter']
    return Object.keys(data.channels).filter(key => data.channels[key] === 'published');
}

async function markAsPublishedInSupabase(link: string, platform: string) {
    // First get existing record
    const { data } = await supabase
        .from('distribution_log')
        .select('channels, id')
        .eq('article_url', link)
        .maybeSingle();

    const channels = data?.channels || {};
    channels[platform] = 'published';

    const lang = getLanguageFromLink(link);
    const filename = link.split('/').pop() || 'unknown';

    const { error } = await supabase
        .from('distribution_log')
        .upsert({
            article_url: link,
            filename,
            lang,
            channels,
            last_attempt: new Date().toISOString()
        }, { onConflict: 'article_url' });

    if (error) {
        console.error(`  ❌ Supabase error updating ${link}:`, error.message);
    }
}

async function rewriteForTwitter(post: Post): Promise<string> {
    const twitterLinkLength = 23;
    const accompanyingTextLength = "\n\nRead more: ".length;
    const totalReservedChars = twitterLinkLength + accompanyingTextLength;
    const maxCharsForAI = 280 - totalReservedChars;
    const keywordsText = post.keywords && post.keywords.length > 0 ? `Main keywords are: "${post.keywords.join(', ')}".` : '';
    
    const prompt = `Write a tweet in English for a tech blog post about the Aptos blockchain. Your response MUST be strictly under ${maxCharsForAI} characters. Frame it as sharing a helpful, informative article. Avoid overly promotional language. Use 2-3 relevant hashtags. ${keywordsText} Article Title: "${post.title}". Ensure the response is 100% in English.`;
    
    try {
        const response = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'You are an expert SMM manager for a blockchain tech project.' }, { role: 'user', content: prompt }], temperature: 0.7, max_tokens: 120 });
        let rewrittenText = response.choices[0]?.message?.content;
        if (!rewrittenText) throw new Error('ChatGPT returned an empty response.');
        if (rewrittenText.length > maxCharsForAI) { rewrittenText = rewrittenText.substring(0, maxCharsForAI - 3) + '...'; }
        return rewrittenText.trim();
    } catch (error) {
        console.error(`  ❌ Error rewriting for Twitter:`, error);
        return `${post.title} - read more on our blog! #Aptos`;
    }
}

async function postToTwitter(textToPost: string): Promise<boolean> {
    if (!twitter.enabled) return false;
    console.log(`  🐦 Posting to Twitter...`);
    try {
        await twitter.client.v2.tweet(textToPost);
        console.log(`  ✅ Success!`);
        return true;
    } catch (error) { console.error(`  ❌ Failed:`, error); return false; }
}

async function main() {
    console.log('🤖 Starting SMM Poster Bot (Twitter Only Mode)...');
    
    // Fetch articles from Supabase 'articles' table instead of external JSON
    console.log('📥 Fetching latest articles from Supabase...');
    const { data: articles, error: fetchError } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50); // Get recent 50 articles

    if (fetchError || !articles) {
        console.error(`❌ Could not fetch articles from Supabase:`, fetchError?.message);
        return;
    }

    const postsToProcess: Post[] = [];
    const now = new Date();
    
    console.log(`🔍 Checking ${articles.length} articles for new distribution...`);
    
    for (const article of articles) {
        const lang = article.lang || 'en';
        
        // Strict Filter: Only process English articles for Twitter
        if (lang !== 'en') {
            continue;
        }

        // Reconstruct post link: https://aptcore.one/blog/[lang/][filename]
        const langPath = ''; // Always empty for English
        const link = `https://aptcore.one/blog/${langPath}${article.filename}`;
        
        const postedPlatforms = await getProcessedPlatformsFromSupabase(link);
        
        // Check if Twitter is already done
        if (postedPlatforms.includes('twitter')) {
            continue; 
        }

        const articleDate = new Date(article.publish_date || article.created_at);
        const daysOld = (now.getTime() - articleDate.getTime()) / (1000 * 3600 * 24);

        if (daysOld >= POSTING_DELAY_DAYS) {
            console.log(`  [PENDING] "${article.title}" (${lang}) - Metadata: ${article.keywords ? '✅' : '❌'} Keywords, ${article.description ? '✅' : '❌'} Desc`);
            
            // Ensure keywords is an array (Supabase might return it as object or string)
            let keywords = [];
            if (Array.isArray(article.keywords)) {
                keywords = article.keywords;
            } else if (typeof article.keywords === 'string') {
                try { keywords = JSON.parse(article.keywords); } catch (e) { keywords = [article.keywords]; }
            }

            postsToProcess.push({
                title: article.title,
                pubDate: articleDate.toISOString(),
                description: article.description || article.title,
                link: link,
                heroImage: article.hero_image || '',
                keywords: keywords,
                tags: article.tags || keywords,
                author: article.author || 'The aptcore.one Team'
            });
        }
    }
    
    const batch = postsToProcess.slice(0, BATCH_SIZE);
    if (batch.length === 0) { console.log('✅ All published English posts are fully distributed or still maturing.'); return; }

    console.log(`\n🔥 Processing a batch of ${batch.length} article(s)...`);
    for (const post of batch) {
        console.log(`\n- - - - - \n- Processing: "${post.title}" [Lang: EN]`);
        const alreadyPostedTo = await getProcessedPlatformsFromSupabase(post.link);
        
        console.log(`  Current status: ${alreadyPostedTo.length > 0 ? alreadyPostedTo.join(', ') : 'No platforms yet'}`);

        if (alreadyPostedTo.includes('twitter')) {
             console.log(`  ⏭️ twitter : Already published.`);
             continue;
        }

        const twitterText = await rewriteForTwitter(post);

        console.log(`  🚀 twitter : Executing...`);
        if (await postToTwitter(`${twitterText}\n\nRead more: ${post.link}`)) {
            await markAsPublishedInSupabase(post.link, 'twitter');
            console.log(`  ✅ twitter : Successfully updated in database.`);
        } else {
            console.log(`  ❌ twitter : Task failed.`);
        }
    }

    console.log('\n🤖 SMM Bot finished processing the batch.');
}

main().catch(error => {
    console.error('❌ A critical error occurred in SMM Bot:', error);
});


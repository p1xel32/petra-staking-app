import 'dotenv/config';
import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { google } from 'googleapis';
import showdown from 'showdown';
import { TwitterApi } from 'twitter-api-v2';
import { createClient } from '@supabase/supabase-js';

const LIVE_POSTS_URL = process.env.POSTS_JSON_URL!;
const DB_FILE_PATH = path.join(process.cwd(), 'scripts', 'processed_social_posts.json');
const POSTING_DELAY_DAYS = 2;
const BATCH_SIZE = 3;
const ALL_PLATFORMS = ['twitter', 'blogger', 'hashnode'];

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

const hashnode = { 
    apiKey: process.env.HASHNODE_API_KEY, 
    publicationId: process.env.HASHNODE_PUBLICATION_ID, 
    enabled: !!(process.env.HASHNODE_API_KEY && process.env.HASHNODE_PUBLICATION_ID) 
};

const devto = { 
    apiKey: process.env.DEVTO_API_KEY, 
    enabled: !!process.env.DEVTO_API_KEY 
};

const blogger = {
    blogId: process.env.BLOGGER_BLOG_ID,
    auth: new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
    ),
    enabled: !!(
        process.env.GOOGLE_CLIENT_ID && 
        process.env.GOOGLE_CLIENT_SECRET && 
        process.env.GOOGLE_REFRESH_TOKEN && 
        process.env.BLOGGER_BLOG_ID
    ),
};
if(blogger.enabled) {
    blogger.auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
}

const sd = new showdown.Converter();

interface Post { title: string; pubDate: string; description: string; link: string; heroImage: string; keywords: string[]; tags?: string[]; author: string; }
type ProcessedDb = Record<string, string[]>;

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

async function rewriteForLongform(post: Post): Promise<{ title: string; content: string }> {
    const keywordsText = post.keywords && post.keywords.length > 0 ? `Main keywords to include: "${post.keywords.join(', ')}".` : '';
    const prompt = `You are a blog editor. Take the following article information and write a high-quality summary of about 300-400 words in English. This will be published on a satellite blog. Structure the text with paragraphs using Markdown. End with a strong call to action to read the full, original article. Original Title: "${post.title}". Original Description: "${post.description}". ${keywordsText} Ensure the response is 100% in English.`;
    try {
        const response = await openai.chat.completions.create({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], temperature: 0.7 });
        const content = response.choices[0]?.message?.content || post.description;
        return { title: `From the aptcore.one Blog: ${post.title}`, content };
    } catch (error) {
        console.error(`  ❌ Error rewriting for Longform:`, error);
        return { title: post.title, content: post.description };
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

async function postToBlogger(post: Post, rewrittenPost: { title: string; content: string }): Promise<boolean> {
    if (!blogger.enabled) return false;
    console.log(`  🔗 Posting to Blogger...`);
    try {
        const bloggerApi = google.blogger({ version: 'v3', auth: blogger.auth });
        const htmlContent = sd.makeHtml(`${rewrittenPost.content}\n\n<hr><p><i><a href="${post.link}">Read the full, original article on aptcore.one</a>.</i></p>`);
        await bloggerApi.posts.insert({
            blogId: blogger.blogId!,
            requestBody: { title: rewrittenPost.title, content: htmlContent, labels: post.tags },
        });
        console.log(`  ✅ Success!`);
        return true;
    } catch (error) { console.error(`  ❌ Failed:`, error); return false; }
}

async function postToDevTo(post: Post, rewrittenPost: { title: string; content: string }): Promise<boolean> {
    if (!devto.enabled) return false;
    console.log(`  🔗 Posting to Dev.to...`);
    const absoluteImageUrl = (post.heroImage && !post.heroImage.includes('placeholder')) ? `https://aptcore.one${post.heroImage}` : undefined;
    const body = { article: { title: rewrittenPost.title, body_markdown: `${rewrittenPost.content}\n\n---\n*Originally published at [aptcore.one](${post.link}).*`, published: true, main_image: absoluteImageUrl, tags: post.tags?.slice(0, 4).map(t => t.toLowerCase().replace(/\s+/g, '')), canonical_url: post.link } };
    try {
        await axios.post('https://dev.to/api/articles', body, { headers: { 'api-key': devto.apiKey!, 'Content-Type': 'application/json' } });
        console.log(`  ✅ Success!`);
        return true;
    } catch (error) { console.error(`  ❌ Failed:`, error.response?.data?.error); return false; }
}

async function postToHashnode(post: Post, rewrittenPost: { title: string; content: string }): Promise<boolean> {
    if (!hashnode.enabled) return false;
    console.log(`  🔗 Posting to Hashnode...`);
    
    const absoluteImageUrl = (post.heroImage && !post.heroImage.includes('placeholder')) ? `https://aptcore.one${post.heroImage}` : undefined;
    
    const tagsForApi = post.tags?.slice(0, 5).map(tag => ({
        name: tag,
        slug: tag.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
    })) || [];

    const postSlug = rewrittenPost.title
        .toLowerCase()
        .replace(/^from-the-aptcore-one-blog:/, '')
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 100);

    const mutation = `mutation publishPost($input: PublishPostInput!) { publishPost(input: $input) { post { url } } }`;
    
    const variables = { 
        input: { 
            title: rewrittenPost.title, 
            slug: postSlug,
            contentMarkdown: rewrittenPost.content,
            publicationId: hashnode.publicationId!, 
            tags: tagsForApi,
            coverImageOptions: absoluteImageUrl 
                ? { coverImageURL: absoluteImageUrl } 
                : undefined,
            originalArticleURL: post.link,
            publishedAt: new Date(post.pubDate).toISOString(),
            metaTags: {
                title: post.title,
                description: post.description.slice(0, 160),
                image: absoluteImageUrl
            }
        } 
    };

    try {
        const response = await axios.post('https://gql.hashnode.com/', { query: mutation, variables }, { headers: { 'Authorization': hashnode.apiKey! } });
        if (response.data.errors) { throw new Error(JSON.stringify(response.data.errors)); }
        console.log(`  ✅ Success!`);
        return true;
    } catch (error) { console.error(`  ❌ Failed:`, error.response?.data?.errors || error.message); return false; }
}

async function main() {
    console.log('🤖 Starting SMM Poster Bot (Supabase Mode)...');
    
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
        // Reconstruct post link: https://aptcore.one/blog/[lang/][filename]
        const langPath = article.lang === 'en' ? '' : `${article.lang}/`;
        const link = `https://aptcore.one/blog/${langPath}${article.filename}`;
        
        const lang = article.lang || 'en';
        const postedPlatforms = await getProcessedPlatformsFromSupabase(link);
        
        // Define which platforms are relevant for this post
        const relevantPlatforms = ALL_PLATFORMS.filter(p => {
            if (p === 'twitter' && lang !== 'en') return false;
            return true;
        });

        const remainingPlatforms = relevantPlatforms.filter(p => !postedPlatforms.includes(p));

        const articleDate = new Date(article.publish_date || article.created_at);
        const daysOld = (now.getTime() - articleDate.getTime()) / (1000 * 3600 * 24);

        if (daysOld >= POSTING_DELAY_DAYS && remainingPlatforms.length > 0) {
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
    if (batch.length === 0) { console.log('✅ All published posts are fully distributed or still maturing.'); return; }

    console.log(`\n🔥 Processing a batch of ${batch.length} article(s)...`);
    for (const post of batch) {
        const lang = getLanguageFromLink(post.link);
        console.log(`\n- - - - - \n- Processing: "${post.title}" [Lang: ${lang.toUpperCase()}]`);
        const alreadyPostedTo = await getProcessedPlatformsFromSupabase(post.link);
        
        console.log(`  Current status: ${alreadyPostedTo.length > 0 ? alreadyPostedTo.join(', ') : 'No platforms yet'}`);

        const [twitterText, longformPost] = await Promise.all([
            rewriteForTwitter(post),
            rewriteForLongform(post),
        ]);

        const postJobs = [
            { platform: 'twitter', enabled: lang === 'en', reason: lang !== 'en' ? 'Skipped (Twitter is English only)' : 'Eligible', task: () => postToTwitter(`${twitterText}\n\nRead more: ${post.link}`)},
            { platform: 'blogger', enabled: true, reason: 'Eligible', task: () => postToBlogger(post, longformPost)},
            { platform: 'hashnode', enabled: true, reason: 'Eligible', task: () => postToHashnode(post, longformPost)},
        ];

        for (const job of postJobs) {
            if (alreadyPostedTo.includes(job.platform)) {
                console.log(`  ⏭️ ${job.platform.padEnd(8)}: Already published.`);
                continue;
            }

            if (!job.enabled) {
                console.log(`  🚫 ${job.platform.padEnd(8)}: ${job.reason}`);
                continue;
            }

            console.log(`  🚀 ${job.platform.padEnd(8)}: Executing...`);
            if (await job.task()) {
                await markAsPublishedInSupabase(post.link, job.platform);
                console.log(`  ✅ ${job.platform.padEnd(8)}: Successfully updated in database.`);
            } else {
                console.log(`  ❌ ${job.platform.padEnd(8)}: Task failed.`);
            }
        }
    }

    console.log('\n🤖 SMM Bot finished processing the batch.');
}

main().catch(error => {
    console.error('❌ A critical error occurred in SMM Bot:', error);
});


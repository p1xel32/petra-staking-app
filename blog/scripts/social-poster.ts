import 'dotenv/config';
import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { google } from 'googleapis';
import showdown from 'showdown';
import { TwitterApi } from 'twitter-api-v2';

const LIVE_POSTS_URL = process.env.POSTS_JSON_URL!;
const DB_FILE_PATH = path.join(process.cwd(), 'scripts', 'processed_social_posts.json');
const POSTING_DELAY_DAYS = 2;
const BATCH_SIZE = 3;
const ALL_PLATFORMS = ['twitter', 'linkedin', 'facebook', 'blogger', 'medium', 'dev.to', 'hashnode', 'pinterest'];

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const twitter = { client: new TwitterApi({ appKey: process.env.TWITTER_API_KEY!, appSecret: process.env.TWITTER_API_SECRET!, accessToken: process.env.TWITTER_ACCESS_TOKEN!, accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET! }), enabled: !!process.env.TWITTER_API_KEY };
const linkedin = { accessToken: process.env.LINKEDIN_ACCESS_TOKEN, authorUrn: process.env.LINKEDIN_AUTHOR_URN, enabled: !!process.env.LINKEDIN_ACCESS_TOKEN };
const medium = { token: process.env.MEDIUM_INTEGRATION_TOKEN, authorId: '', enabled: !!process.env.MEDIUM_INTEGRATION_TOKEN };
const facebook = { accessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN, pageId: process.env.FACEBOOK_PAGE_ID, enabled: !!process.env.FACEBOOK_PAGE_ACCESS_TOKEN };
const pinterest = { accessToken: process.env.PINTEREST_ACCESS_TOKEN, boardId: process.env.PINTEREST_BOARD_ID, enabled: !!process.env.PINTEREST_ACCESS_TOKEN };
const hashnode = { apiKey: process.env.HASHNODE_API_KEY, publicationId: process.env.HASHNODE_PUBLICATION_ID, enabled: !!process.env.HASHNODE_API_KEY };
const devto = { apiKey: process.env.DEVTO_API_KEY, enabled: !!process.env.DEVTO_API_KEY };
const blogger = {
    blogId: process.env.BLOGGER_BLOG_ID,
    auth: new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
    ),
    enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN && process.env.BLOGGER_BLOG_ID),
};
if(blogger.enabled) {
    blogger.auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
}

const sd = new showdown.Converter();

interface Post { title: string; pubDate: string; description: string; link: string; heroImage: string; keywords: string[]; tags?: string[]; author: string; }
type ProcessedDb = Record<string, string[]>;

async function getProcessedDb(): Promise<ProcessedDb> {
    try {
        const data = await fs.readFile(DB_FILE_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return {};
        throw error;
    }
}

async function saveProcessedDb(db: ProcessedDb): Promise<void> {
    const data = JSON.stringify(db, null, 2);
    await fs.writeFile(DB_FILE_PATH, data, 'utf-8');
}

async function rewriteForTwitter(post: Post): Promise<string> {
    const twitterLinkLength = 23;
    const accompanyingTextLength = "\n\nRead more: ".length;
    const totalReservedChars = twitterLinkLength + accompanyingTextLength;
    const maxCharsForAI = 280 - totalReservedChars;
    const keywordsText = post.keywords && post.keywords.length > 0 ? `Main keywords are: "${post.keywords.join(', ')}".` : '';
    const prompt = `Write a promotional tweet for a tech blog post about the Aptos blockchain. Your response MUST be strictly under ${maxCharsForAI} characters. ${keywordsText} If possible, naturally weave one of these phrases into the tweet. Use 2-3 relevant hashtags. Article Title: "${post.title}".`;
    try {
        const response = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'system', content: 'You are an expert SMM manager for a blockchain tech project.' }, { role: 'user', content: prompt }], temperature: 0.7, max_tokens: 120 });
        let rewrittenText = response.choices[0]?.message?.content;
        if (!rewrittenText) throw new Error('ChatGPT returned an empty response.');
        if (rewrittenText.length > maxCharsForAI) { rewrittenText = rewrittenText.substring(0, maxCharsForAI - 3) + '...'; }
        return rewrittenText.trim();
    } catch (error) {
        console.error(`   ❌ Error rewriting for Twitter:`, error);
        return `${post.title} - read more on our blog! #Aptos`;
    }
}

async function rewriteForLinkedIn(post: Post): Promise<string> {
    const prompt = `You are a professional B2B content strategist. Rewrite the following blog post summary into an engaging LinkedIn post. The tone should be expert, insightful, and encourage discussion. Start with a strong hook. Use 3-5 relevant professional hashtags. Original Title: "${post.title}". Original Description: "${post.description}".`;
    try {
        const response = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.7 });
        return response.choices[0]?.message?.content || post.title;
    } catch (error) {
        console.error(`   ❌ Error rewriting for LinkedIn:`, error);
        return `${post.title}\n\nRead more about this on our blog.`;
    }
}

async function rewriteForFacebook(post: Post): Promise<string> {
    const prompt = `You are a social media manager. Rewrite the following blog post information into an engaging Facebook post. Use a friendly and accessible tone. Ask a question to encourage comments. Use 3-4 relevant hashtags. Original Title: "${post.title}". Original Description: "${post.description}".`;
    try {
        const response = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.8 });
        return response.choices[0]?.message?.content || post.title;
    } catch (error) {
        console.error(`   ❌ Error rewriting for Facebook:`, error);
        return `${post.title}\n\nFind out more on our blog!`;
    }
}

async function rewriteForLongform(post: Post): Promise<{ title: string; content: string }> {
    const keywordsText = post.keywords && post.keywords.length > 0 ? `Main keywords to include: "${post.keywords.join(', ')}".` : '';
    const prompt = `You are a blog editor. Take the following article information and write a high-quality summary of about 300-400 words. This will be published on a satellite blog. Structure the text with paragraphs using Markdown. End with a strong call to action to read the full, original article. Original Title: "${post.title}". Original Description: "${post.description}". ${keywordsText}`;
    try {
        const response = await openai.chat.completions.create({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], temperature: 0.7 });
        const content = response.choices[0]?.message?.content || post.description;
        return { title: `From the aptcore.one Blog: ${post.title}`, content };
    } catch (error) {
        console.error(`   ❌ Error rewriting for Longform:`, error);
        return { title: post.title, content: post.description };
    }
}

async function rewriteForPinterest(post: Post): Promise<{ title: string; description: string }> {
    const keywordsText = post.keywords && post.keywords.length > 0 ? `Keywords: "${post.keywords.join(', ')}".` : '';
    const prompt = `You are a Pinterest marketing expert. Write a compelling and keyword-rich Pin description for a tech blog post. The description should be 2-3 sentences long. Start with an engaging hook. Include 5-7 relevant keywords as part of the description or as hashtags. Original Title: "${post.title}". ${keywordsText}`;
    try {
        const response = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.7 });
        const description = response.choices[0]?.message?.content || post.description;
        return { title: post.title, description };
    } catch (error) {
        console.error(`   ❌ Error rewriting for Pinterest:`, error);
        return { title: post.title, description: post.description };
    }
}

async function postToTwitter(textToPost: string): Promise<boolean> {
    if (!twitter.enabled) return false;
    console.log(`   🐦 Posting to Twitter...`);
    try {
        await twitter.client.v2.tweet(textToPost);
        console.log(`   ✅ Success!`);
        return true;
    } catch (error) { console.error(`   ❌ Failed:`, error); return false; }
}

async function postToLinkedIn(post: Post, rewrittenText: string): Promise<boolean> {
    if (!linkedin.enabled) return false;
    console.log(`   🔗 Posting to LinkedIn...`);
    const url = 'https://api.linkedin.com/v2/ugcPosts';
    const body = { author: linkedin.authorUrn, lifecycleState: 'PUBLISHED', specificContent: { 'com.linkedin.ugc.ShareContent': { shareCommentary: { text: rewrittenText }, shareMediaCategory: 'ARTICLE', media: [{ status: 'READY', originalUrl: post.link, title: { text: post.title }, description: { text: post.description } }] } }, visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' } };
    try {
        await axios.post(url, body, { headers: { 'Authorization': `Bearer ${linkedin.accessToken}`, 'Content-Type': 'application/json' } });
        console.log(`   ✅ Success!`);
        return true;
    } catch (error) { console.error(`   ❌ Failed:`, error.response?.data); return false; }
}

async function postToFacebook(post: Post, rewrittenText: string): Promise<boolean> {
    if (!facebook.enabled) return false;
    console.log(`   🔗 Posting to Facebook Page...`);
    const url = `https://graph.facebook.com/${facebook.pageId}/feed?access_token=${facebook.accessToken}`;
    const body = { message: rewrittenText, link: post.link };
    try {
        await axios.post(url, body);
        console.log(`   ✅ Success!`);
        return true;
    } catch (error) { console.error(`   ❌ Failed:`, error.response?.data); return false; }
}

async function postToBlogger(post: Post, rewrittenPost: { title: string; content: string }): Promise<boolean> {
    if (!blogger.enabled) return false;
    console.log(`   🔗 Posting to Blogger...`);
    try {
        const bloggerApi = google.blogger({ version: 'v3', auth: blogger.auth });
        const htmlContent = sd.makeHtml(`${rewrittenPost.content}\n\n<hr><p><i><a href="${post.link}">Read the full, original article on aptcore.one</a>.</i></p>`);
        await bloggerApi.posts.insert({
            blogId: blogger.blogId!,
            requestBody: { title: rewrittenPost.title, content: htmlContent, labels: post.tags },
        });
        console.log(`   ✅ Success!`);
        return true;
    } catch (error) { console.error(`   ❌ Failed:`, error.message); return false; }
}

async function postToMedium(post: Post, rewrittenPost: { title: string; content: string }): Promise<boolean> {
    if (!medium.enabled) return false;
    console.log(`   🔗 Posting to Medium...`);
    try {
        if (!medium.authorId) {
            const meResponse = await axios.get('https://api.medium.com/v1/me', { headers: { 'Authorization': `Bearer ${medium.token}` } });
            medium.authorId = meResponse.data.data.id;
        }
        const url = `https://api.medium.com/v1/users/${medium.authorId}/posts`;
        const body = { title: rewrittenPost.title, contentFormat: 'markdown', content: `${rewrittenPost.content}\n\n---\n*Originally published at [${post.title}](${post.link}).*`, canonicalUrl: post.link, tags: post.tags?.slice(0, 5), publishStatus: 'public' };
        await axios.post(url, body, { headers: { 'Authorization': `Bearer ${medium.token}` } });
        console.log(`   ✅ Success!`);
        return true;
    } catch (error) { console.error(`   ❌ Failed:`, error.response?.data); return false; }
}

async function postToDevTo(post: Post, rewrittenPost: { title: string; content: string }): Promise<boolean> {
    if (!devto.enabled) return false;
    console.log(`   🔗 Posting to Dev.to...`);
    const absoluteImageUrl = (post.heroImage && !post.heroImage.includes('placeholder')) ? `https://aptcore.one${post.heroImage}` : undefined;
    const body = { article: { title: rewrittenPost.title, body_markdown: `${rewrittenPost.content}\n\n---\n*Originally published at [aptcore.one](${post.link}).*`, published: true, main_image: absoluteImageUrl, tags: post.tags?.slice(0, 4).map(t => t.toLowerCase().replace(/\s+/g, '')), canonical_url: post.link } };
    try {
        await axios.post('https://dev.to/api/articles', body, { headers: { 'api-key': devto.apiKey!, 'Content-Type': 'application/json' } });
        console.log(`   ✅ Success!`);
        return true;
    } catch (error) { console.error(`   ❌ Failed:`, error.response?.data?.error); return false; }
}

async function postToHashnode(post: Post, rewrittenPost: { title: string; content: string }): Promise<boolean> {
    if (!hashnode.enabled) return false;
    console.log(`   🔗 Posting to Hashnode...`);
    const absoluteImageUrl = (post.heroImage && !post.heroImage.includes('placeholder')) ? `https://aptcore.one${post.heroImage}` : undefined;
    const mutation = `mutation publishPost($input: PublishPostInput!) { publishPost(input: $input) { post { url } } }`;
    const variables = { input: { title: rewrittenPost.title, contentMarkdown: `${rewrittenPost.content}\n\n---\n*Originally published at [aptcore.one](${post.link}).*`, publicationId: hashnode.publicationId!, tags: post.tags?.slice(0, 5).map(tag => ({ id: tag.toLowerCase().replace(/\s+/g, '-').replace(/[?:]/g, ''), name: tag })), coverImageURL: absoluteImageUrl, settings: { isRepublished: { originalArticleURL: post.link } } } };
    try {
        const response = await axios.post('https://gql.hashnode.com/', { query: mutation, variables }, { headers: { 'Authorization': hashnode.apiKey! } });
        if (response.data.errors) { throw new Error(JSON.stringify(response.data.errors)); }
        console.log(`   ✅ Success!`);
        return true;
    } catch (error) { console.error(`   ❌ Failed:`, error.response?.data?.errors || error.message); return false; }
}

async function postToPinterest(post: Post, rewrittenPin: { title: string; description: string }): Promise<boolean> {
    if (!pinterest.enabled || !post.heroImage || post.heroImage.includes('placeholder')) { console.log(`   📌 Skipping Pinterest: No valid image or keys.`); return false; }
    console.log(`   📌 Posting to Pinterest...`);
    const imageUrl = `https://aptcore.one${post.heroImage}`;
    const body = { board_id: pinterest.boardId!, link: post.link, title: rewrittenPin.title, alt_text: post.description, note: rewrittenPin.description, media_source: { source_type: 'image_url', url: imageUrl } };
    try {
        await axios.post('https://api.pinterest.com/v5/pins', body, { headers: { 'Authorization': `Bearer ${pinterest.accessToken!}` } });
        console.log(`   ✅ Success!`);
        return true;
    } catch (error) { console.error(`   ❌ Failed:`, error.response?.data); return false; }
}


async function main() {
    console.log('🤖 Starting Ultimate SMM Poster Bot...');
    let allPosts: Post[];
    try {
        const response = await axios.get<Post[]>(LIVE_POSTS_URL);
        allPosts = response.data;
    } catch (error) {
        console.error(`❌ Could not fetch posts from ${LIVE_POSTS_URL}.`); return;
    }

    const processedDb = await getProcessedDb();
    
    const postsToProcess: Post[] = [];
    const now = new Date();
    for (const post of allPosts) {
        const postedPlatforms = processedDb[post.link] || [];
        if ( (now.getTime() - new Date(post.pubDate).getTime()) / (1000 * 3600 * 24) >= POSTING_DELAY_DAYS && postedPlatforms.length < ALL_PLATFORMS.length ) {
            postsToProcess.push(post);
        }
    }
    
    const batch = postsToProcess.slice(0, BATCH_SIZE);
    if (batch.length === 0) { console.log('✅ All published posts are fully distributed or still maturing.'); return; }

    console.log(`\n🔥 Processing a batch of ${batch.length} article(s)...`);
    for (const post of batch) {
        console.log(`\n- - - - - \n  - Processing: "${post.title}"`);
        const alreadyPostedTo = processedDb[post.link] || [];
        
        const [twitterText, linkedinText, facebookText, longformPost, pinterestPin] = await Promise.all([
            rewriteForTwitter(post),
            rewriteForLinkedIn(post),
            rewriteForFacebook(post),
            rewriteForLongform(post),
            rewriteForPinterest(post)
        ]);

        const postJobs = [
            { platform: 'twitter', task: () => postToTwitter(`${twitterText}\n\nRead more: ${post.link}`)},
            { platform: 'linkedin', task: () => postToLinkedIn(post, linkedinText)},
            { platform: 'facebook', task: () => postToFacebook(post, facebookText)},
            { platform: 'blogger', task: () => postToBlogger(post, longformPost)},
            { platform: 'medium', task: () => postToMedium(post, longformPost)},
            { platform: 'dev.to', task: () => postToDevTo(post, longformPost)},
            { platform: 'hashnode', task: () => postToHashnode(post, longformPost)},
            { platform: 'pinterest', task: () => postToPinterest(post, pinterestPin)},
        ];

        for (const job of postJobs) {
            if (!alreadyPostedTo.includes(job.platform)) {
                if (await job.task()) {
                    alreadyPostedTo.push(job.platform);
                }
            }
        }
        
        if (alreadyPostedTo.length > (processedDb[post.link]?.length || 0)) {
            processedDb[post.link] = alreadyPostedTo;
            console.log(`\n  - Marking "${post.title}" as partially/fully processed.`);
        }
    }

    await saveProcessedDb(processedDb);
    console.log('\n💾 SMM database has been updated.');
}

main().catch(error => {
    console.error('❌ A critical error occurred in SMM Bot:', error.message);
});
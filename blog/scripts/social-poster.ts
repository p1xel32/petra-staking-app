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

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const twitterClient = new TwitterApi({ appKey: process.env.TWITTER_API_KEY!, appSecret: process.env.TWITTER_API_SECRET!, accessToken: process.env.TWITTER_ACCESS_TOKEN!, accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET! });
const bloggerClient = { apiKey: process.env.G_SEARCH_KEY!, blogId: process.env.BLOGGER_BLOG_ID! };
const hashnodeClient = { apiKey: process.env.HASHNODE_API_KEY!, publicationId: process.env.HASHNODE_PUBLICATION_ID! };
const devtoClient = { apiKey: process.env.DEVTO_API_KEY! };

const sd = new showdown.Converter();

interface Post { title: string; pubDate: string; description: string; link: string; heroImage: string; keywords: string[]; tags?: string[]; author: string; }

async function getProcessedPosts(): Promise<Set<string>> {
  try {
    const data = await fs.readFile(DB_FILE_PATH, 'utf-8');
    return new Set(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') return new Set();
    throw error;
  }
}

async function saveProcessedPosts(processedLinks: Set<string>): Promise<void> {
  const data = JSON.stringify(Array.from(processedLinks));
  await fs.writeFile(DB_FILE_PATH, data, 'utf-8');
}

async function rewriteForTwitter(post: Post): Promise<string> {
    console.log(`   ✍️  Rewriting "${post.title}" for Twitter...`);
    const twitterLinkLength = 23;
    const accompanyingTextLength = "\n\nRead more: ".length;
    const totalReservedChars = twitterLinkLength + accompanyingTextLength;
    const maxCharsForAI = 280 - totalReservedChars;
    const prompt = `Write a promotional tweet for a tech blog post about the Aptos blockchain. Your response MUST be strictly under ${maxCharsForAI} characters. Main keywords are: "${post.keywords.join(', ')}". If possible, naturally weave one of these phrases into the tweet. Use 2-3 relevant hashtags. Article Title: "${post.title}".`;
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

async function rewriteForDevCommunity(post: Post): Promise<{ title: string; content: string }> {
    console.log(`   ✍️  Rewriting "${post.title}" for Dev Community (Hashnode/Dev.to)...`);
    const prompt = `You are a developer advocate. Take the following article information and write a high-quality summary of about 300-400 words to be cross-posted on a developer-focused platform like Dev.to or Hashnode. Structure the text with paragraphs using Markdown. End with a strong call to action to read the full, original article. Original Title: "${post.title}". Original Description: "${post.description}".`;
    try {
        const response = await openai.chat.completions.create({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], temperature: 0.7 });
        const content = response.choices[0]?.message?.content || post.description;
        return { title: post.title, content };
    } catch (error) {
        console.error(`   ❌ Error rewriting for Dev Community:`, error);
        return { title: post.title, content: post.description };
    }
}

async function rewriteForBlogger(post: Post): Promise<{ title: string; content: string }> {
    console.log(`   ✍️  Rewriting "${post.title}" for a Blogger cross-post...`);
    const prompt = `You are a blog editor. Take the following article information and write a high-quality summary of about 300-400 words. This will be published on a satellite blog. Structure the text with paragraphs. End with a strong call to action to read the full, original article. Original Title: "${post.title}". Original Description: "${post.description}". Main keywords to include: "${post.keywords.join(', ')}".`;
    try {
        const response = await openai.chat.completions.create({ model: 'gpt-4o', messages: [{ role: 'user', content: prompt }], temperature: 0.7 });
        const content = response.choices[0]?.message?.content || post.description;
        return { title: `From the aptcore.one Blog: ${post.title}`, content };
    } catch (error) {
        console.error(`   ❌ Error rewriting for Blogger:`, error);
        return { title: post.title, content: post.description };
    }
}

async function postToTwitter(textToPost: string): Promise<boolean> {
    console.log(`   🐦 Posting to Twitter...`);
    try {
        const { data: createdTweet } = await twitterClient.v2.tweet(textToPost);
        console.log(`   ✅ Successfully posted to Twitter! Tweet ID: ${createdTweet.id}`);
        return true;
    } catch (error) {
        console.error(`   ❌ Failed to post to Twitter:`, error);
        return false;
    }
}

async function postToBlogger(post: Post, rewrittenPost: { title: string; content: string }): Promise<boolean> {
    console.log(`   🔗 Posting to Blogger...`);
    try {
        const blogger = google.blogger({ version: 'v3', auth: bloggerClient.apiKey });
        const htmlContent = sd.makeHtml(`${rewrittenPost.content}\n\n<hr><p><i><a href="${post.link}">Read the full, original article on aptcore.one</a>.</i></p>`);
        await blogger.posts.insert({
            blogId: bloggerClient.blogId,
            requestBody: { title: rewrittenPost.title, content: htmlContent, labels: post.tags },
            isDraft: false,
        });
        console.log(`   ✅ Successfully posted to Blogger!`);
        return true;
    } catch (error) {
        console.error(`   ❌ Failed to post to Blogger:`, error.message);
        return false;
    }
}

async function postToDevTo(post: Post, rewrittenPost: { title: string; content: string }): Promise<boolean> {
    console.log(`   🔗 Posting to Dev.to...`);
    const fullMarkdown = `${rewrittenPost.content}\n\n---\n*Originally published at [aptcore.one](${post.link}).*`;
    const body = {
        article: {
            title: rewrittenPost.title,
            body_markdown: fullMarkdown,
            published: true,
            main_image: `https://aptcore.one${post.heroImage}`,
            tags: post.tags?.slice(0, 4).map(tag => tag.toLowerCase().replace(/\s+/g, '')),
            canonical_url: post.link,
        }
    };
    try {
        await axios.post('https://dev.to/api/articles', body, { headers: { 'api-key': devtoClient.apiKey, 'Content-Type': 'application/json' } });
        console.log(`   ✅ Successfully posted to Dev.to!`);
        return true;
    } catch (error) {
        console.error(`   ❌ Failed to post to Dev.to:`, error.response?.data?.error || error.message);
        return false;
    }
}

async function postToHashnode(post: Post, rewrittenPost: { title: string; content: string }): Promise<boolean> {
    console.log(`   🔗 Posting to Hashnode...`);
    const fullMarkdown = `${rewrittenPost.content}\n\n---\n*Originally published at [aptcore.one](${post.link}).*`;
    const mutation = `
        mutation publishPost($input: PublishPostInput!) {
            publishPost(input: $input) { post { slug url } }
        }`;
    const variables = {
        input: {
            title: rewrittenPost.title,
            contentMarkdown: fullMarkdown,
            publicationId: hashnodeClient.publicationId,
            tags: post.tags?.slice(0, 5).map(tag => ({ slug: tag.toLowerCase().replace(/\s+/g, '-'), name: tag })),
            isRepublished: { originalArticleURL: post.link }
        }
    };
    try {
        await axios.post('https://gql.hashnode.com/', { query: mutation, variables }, { headers: { 'Authorization': hashnodeClient.apiKey } });
        console.log(`   ✅ Successfully posted to Hashnode!`);
        return true;
    } catch (error) {
        console.error(`   ❌ Failed to post to Hashnode:`, error.response?.data?.errors || error.message);
        return false;
    }
}

async function main() {
    console.log('🤖 Starting SMM Poster Bot (Blogger, Twitter, Hashnode, Dev.to)...');
    
    let allPosts: Post[];
    try {
        const response = await axios.get<Post[]>(LIVE_POSTS_URL);
        allPosts = response.data;
    } catch (error) {
        console.error(`❌ Could not fetch posts from ${LIVE_POSTS_URL}. Is the site live and is posts.json available?`);
        return;
    }

    const processedLinks = await getProcessedPosts();
    const newPosts = allPosts.filter(post => !processedLinks.has(post.link));
    if (newPosts.length === 0) { console.log('✅ No new articles to post about.'); return; }

    const postsToProcess: Post[] = [];
    const now = new Date();
    for (const post of newPosts) {
        if ((now.getTime() - new Date(post.pubDate).getTime()) / (1000 * 3600 * 24) >= POSTING_DELAY_DAYS) {
            postsToProcess.push(post);
        }
    }
    if (postsToProcess.length === 0) { console.log('⏰ New posts found, but they are still "maturing" (under the delay).'); return; }

    console.log(`\n🔥 Processing ${postsToProcess.length} new article(s) for social media...`);
    for (const post of postsToProcess) {
        console.log(`\n  - Preparing posts for: "${post.title}"`);
        let successCount = 0;
        
        const [twitterText, bloggerPost, devCommunityPost] = await Promise.all([
            rewriteForTwitter(post),
            rewriteForBlogger(post),
            rewriteForDevCommunity(post)
        ]);

        const finalTweet = `${twitterText}\n\nRead more: ${post.link}`;
        if (await postToTwitter(finalTweet)) successCount++;
        if (await postToBlogger(post, bloggerPost)) successCount++;
        if (await postToDevTo(post, devCommunityPost)) successCount++;
        if (await postToHashnode(post, devCommunityPost)) successCount++;
        
        if (successCount > 0) {
            processedLinks.add(post.link);
        }
    }

    await saveProcessedPosts(processedLinks);
    console.log('\n💾 SMM database has been updated.');
}

main().catch(error => {
    console.error('❌ A critical error occurred in SMM Bot:', error.message);
});
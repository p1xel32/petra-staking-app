import 'dotenv/config';
import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import * as Shotstack from 'shotstack-sdk';
import { S3Client, PutObjectCommand, DeleteObjectsCommand, ObjectIdentifier } from '@aws-sdk/client-s3';
import { google } from 'googleapis';
import { Readable } from 'stream';
import getMp3Duration from 'get-mp3-duration';

const {
    POSTS_JSON_URL,
    OPENAI_API_KEY,
    SHOTSTACK_ENV = 'stage',
    SHOTSTACK_API_KEY_STAGE,
    SHOTSTACK_API_KEY_PROD,
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET_NAME,
    AWS_REGION,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN,
} = process.env;

const DB_VIDEO_PATH = path.join(process.cwd(), 'scripts', 'processed_videos.json');
const SHOTSTACK_API_KEY = SHOTSTACK_ENV === 'v1' ? SHOTSTACK_API_KEY_PROD : SHOTSTACK_API_KEY_STAGE;
const CONTENT_DIR = path.join(process.cwd(), 'src', 'content', 'blog');

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

interface Post { 
    title: string; 
    link: string; 
    description: string; 
    pubDate: string; 
    keywords: string[]; 
}

interface Scene { 
    scene_number: number; 
    text: string; 
    video_prompt: string;
}

interface VideoScript { 
    full_monologue: string; 
    scenes: Scene[]; 
}

async function getProcessedVideoLinks(): Promise<Set<string>> {
    try {
        const data = await fs.readFile(DB_VIDEO_PATH, 'utf-8');
        return new Set(JSON.parse(data));
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return new Set();
        throw error;
    }
}

async function saveProcessedVideoLinks(processedLinks: Set<string>): Promise<void> {
    const data = JSON.stringify(Array.from(processedLinks), null, 2);
    await fs.writeFile(DB_VIDEO_PATH, data, 'utf-8');
}

async function getArticleContent(post: Post): Promise<string> {
    const slug = post.link.split('/').filter(Boolean).pop();
    if (!slug) throw new Error(`Could not determine slug from post link: ${post.link}`);
    const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
    console.log(`   📖 Reading content from: ${filePath}`);
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return content.split('---')[2] || ''; // Берем только тело статьи после frontmatter
    } catch (error) {
        throw new Error(`Could not read file for slug ${slug}. Make sure it exists locally.`);
    }
}

async function generateShortsScript(articleContent: string, post: Post): Promise<VideoScript> {
    console.log(`✍️  Generating E-A-T infographic script and visual descriptions...`);
    
    const prompt = `
    ROLE: You are a Lead Motion Graphics Designer for a top financial news channel. Your task is to create a clear, trustworthy, and visually engaging animated infographic for a YouTube Short based on a technical article.

    CONTEXT: The main topic is **${post.title}**. The keywords are **${post.keywords.join(', ')}**. The audience consists of crypto investors who value clarity, data, and trustworthiness.

    VISUAL STYLE GUIDE (MANDATORY):
    - Aesthetic: Clean, minimalist, 2D/3D animated infographic. Think Bloomberg or The Wall Street Journal video explainers.
    - Elements: Use abstract shapes, data visualizations (charts, numbers), clean icons, and text overlays.
    - Palette: Adhere to a professional color scheme: dark background, with primary colors being purple and cyan for emphasis.
    - DO NOT generate photorealistic scenes, people, or random abstract art. Every visual element must serve to explain the monologue.

    TASK:
    1. Write a short, clear, and authoritative monologue script (120-150 words) based on the provided article content.
    2. Break the script into 4-5 logical scenes.
    3. For each scene, write a simple and direct "video_prompt" for the DALL-E 3 image generator. This prompt should describe a specific STATIC asset (icon, chart, or simple graphic) that visually represents the text for that scene.

    ARTICLE CONTENT: """${articleContent}"""

    OUTPUT FORMAT (MUST BE JSON):
    {
      "full_monologue": "...",
      "scenes": [
        {
          "scene_number": 1,
          "text": "When choosing an Aptos validator, commission rates are just the beginning.",
          "video_prompt": "A clean 3D icon of the Aptos logo is in the center. A title 'Validator Commission' appears next to it, with a number '5%' that then fades out."
        },
        {
          "scene_number": 2,
          "text": "You must also consider their uptime and historical performance.",
          "video_prompt": "An animated line graph appears, showing a stable, high percentage like '99.9% Uptime'. The line is colored cyan."
        }
      ]
    }`;
    
    const messages: ChatCompletionMessageParam[] = [{ role: 'user', content: prompt }];
    const response = await openai.chat.completions.create({ model: 'gpt-4o', messages, response_format: { type: "json_object" }, });
    
    const scriptJson = JSON.parse(response.choices[0]?.message?.content || '{}');
    console.log(`   ✅ E-A-T script and infographic scenes generated for ${scriptJson.scenes.length} scenes.`);
    return scriptJson;
}

async function generateVoiceover(text: string): Promise<Buffer | null> {
    if (!text) return null;
    console.log(`   🗣️  Generating voiceover for: "${text.substring(0, 40)}..."`);
    try {
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: text,
        });
        return Buffer.from(await mp3.arrayBuffer());
    } catch (error) {
        console.error("   ❌ Error during voiceover generation:", error);
        return null;
    }
}

async function generateDalleAsset(prompt: string, title: string): Promise<Buffer | null> {
    console.log(`   🎨 [DALL-E 3] Generating asset for prompt: "${prompt.substring(0, 50)}..."`);
    
    const brandPalette = { background: "#09090B", purple: "#A78BFA", cyan: "#22D3EE", textLight: "#E5E7EB" };

    const finalPrompt = `A single, clean, high-resolution 2D/3D infographic asset for a financial news video about "${title}". 
    The asset should be: ${prompt}.
    The style must be minimalist and professional.
    The background of the asset itself should be transparent to allow for composition.
    Strict color palette: Use only vibrant purple (${brandPalette.purple}), bright cyan (${brandPalette.cyan}), and light gray (${brandPalette.textLight}) for the elements.
    `;
    
    try {
        const response = await openai.images.generate({ 
            model: "dall-e-3", 
            prompt: finalPrompt, 
            n: 1, 
            size: "1024x1024",
            response_format: 'b64_json'
        });
        const b64_json = response.data[0]?.b64_json;
        if (b64_json) {
            return Buffer.from(b64_json, 'base64');
        }
        return null;
    } catch (error) {
        console.error("   ❌ Error during DALL-E 3 asset generation:", error);
        return null;
    }
}

async function main() {
    console.log('🤖 Starting Local E-A-T Asset Producer...');
    
    if (!POSTS_JSON_URL) {
        console.error('❌ POSTS_JSON_URL environment variable is not set.');
        return;
    }

    const { data: allPosts } = await axios.get<Post[]>(POSTS_JSON_URL);
    const processedLinks = await getProcessedVideoLinks();
    const postsToProcess = allPosts
        .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
        .filter(post => !processedLinks.has(post.link));
    
    if (postsToProcess.length === 0) {
        console.log('✅ All posts have been processed.');
        return;
    }

    const postToProcess = postsToProcess[0];
    console.log(`\n🚀 Processing article for video assets: "${postToProcess.title}"`);

    try {
        const articleContent = await getArticleContent(postToProcess);
        const script = await generateShortsScript(articleContent, postToProcess);

        const videoAssetDir = path.join(process.cwd(), 'video_assets', postToProcess.link.split('/').pop()!);
        await fs.mkdir(videoAssetDir, { recursive: true });
        
        await fs.writeFile(path.join(videoAssetDir, 'script.json'), JSON.stringify(script, null, 2));
        console.log(`   ✅ Script saved to ${videoAssetDir}`);

        console.log(`\n🎤🎬 Starting asset generation for ${script.scenes.length} scenes...`);
        let allAssetsGenerated = true;

        const voiceoverBuffer = await generateVoiceover(script.full_monologue);
        if (voiceoverBuffer) {
            await fs.writeFile(path.join(videoAssetDir, 'voiceover.mp3'), voiceoverBuffer);
            console.log(`   ✅ Voiceover saved.`);
        } else {
            console.log(`   ❌ Voiceover generation failed.`);
            allAssetsGenerated = false;
        }

        for (const scene of script.scenes) {
            const imageBuffer = await generateDalleAsset(scene.video_prompt, postToProcess.title);
            if (imageBuffer) {
                await fs.writeFile(path.join(videoAssetDir, `scene_${scene.scene_number}.png`), imageBuffer);
                 console.log(`   ✅ Asset for scene ${scene.scene_number} saved.`);
            } else {
                console.log(`   ❌ Asset generation failed for scene ${scene.scene_number}.`);
                allAssetsGenerated = false;
            }
        }

        if (allAssetsGenerated) {
            console.log(`\n✨✨✨\n✅ Success! All assets for "${postToProcess.title}" are generated in:\n${videoAssetDir}\n✨✨✨`);
            processedLinks.add(postToProcess.link);
            await saveProcessedVideoLinks(processedLinks);
        } else {
            console.log(`\n🛑 Could not generate all required assets. Halting. The post will be re-processed on the next run.`);
        }

    } catch (error) {
        console.error(`❌ A critical error occurred while processing "${postToProcess.title}":`, error);
    }
}

main().catch(error => {
    console.error('❌ A critical error occurred in the Video Producer Bot:', error);
    process.exit(1);
});
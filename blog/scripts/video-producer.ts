import 'dotenv/config';
import axios from 'axios';
import { promises as fs, existsSync } from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { S3Client, PutObjectCommand, DeleteObjectsCommand, ObjectIdentifier } from '@aws-sdk/client-s3';
import getMp3Duration from 'get-mp3-duration';
import { execa } from 'execa';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { OAuth2Client } from 'google-auth-library';
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

// =============================================================================
// --- 1. КОНФИГУРАЦИЯ ---
// =============================================================================
const config = {
    postsJsonUrl: process.env.POSTS_JSON_URL,
    openaiApiKey: process.env.OPENAI_API_KEY,
    shotstack: {
        env: process.env.SHOTSTACK_ENV || 'stage',
        apiKey: (process.env.SHOTSTACK_ENV || 'stage') === 'v1' 
            ? process.env.SHOTSTACK_API_KEY_PROD 
            : process.env.SHOTSTACK_API_KEY_STAGE,
    },
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        s3BucketName: process.env.AWS_S3_BUCKET_NAME,
        region: process.env.AWS_REGION,
    },
    youtube: {
        playlistId: process.env.YOUTUBE_PLAYLIST_ID,
        scopes: [
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/youtube'
        ],
        tokenPath: path.join(process.cwd(), 'scripts', 'token.json'),
        credentialsPath: path.join(process.cwd(), 'scripts', 'client_secret.json'),
    },
    paths: {
        processedVideosDb: path.join(process.cwd(), 'scripts', 'processed_videos.json'),
        publicVideosDb: path.join(process.cwd(), 'public', 'videos.json'),
        contentDir: path.join(process.cwd(), 'src', 'content', 'blog'),
    },
    elegantCss: `@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700&display=swap'); body, html { margin: 0; padding: 0; width: 100%; height: 100%; font-family: 'Montserrat', sans-serif; } .container { position: absolute; bottom: 22%; left: 50%; transform: translateX(-50%); width: 90vw; max-width: 680px; display: flex; justify-content: center; } .plate { background-color: rgba(0, 0, 0, 0.75); padding: 22px 30px; border-radius: 16px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3); width: 100%; box-sizing: border-box; } .text { color: white; font-weight: 700; font-size: 44px; line-height: 1.35; text-align: center; white-space: pre-wrap; word-break: break-word; } .highlight { color: #43D4E8; }`,
};

// Проверка наличия обязательных переменных
(() => {
    const requiredVars = ['postsJsonUrl', 'openaiApiKey', 'shotstack.apiKey', 'aws.accessKeyId', 'aws.secretAccessKey', 'aws.s3BucketName', 'aws.region'];
    for (const key of requiredVars) {
        const keys = key.split('.');
        let currentVal: any = config;
        for (const subKey of keys) {
            currentVal = currentVal?.[subKey];
        }
        if (!currentVal) {
            throw new Error(`FATAL: Missing required environment variable for config key: ${key}. Please check your .env file or GitHub Secrets.`);
        }
    }
})();


// =============================================================================
// --- 2. ИНТЕРФЕЙСЫ ---
// =============================================================================
interface Post { title: string; link: string; description: string; pubDate: string; keywords: string[]; }
interface Scene { scene_number: number; text: string; video_prompt: string; highlights?: string[]; }
interface VideoScript { full_monologue: string; scenes: Scene[]; }
interface YouTubeCreativeContent { title: string; hookParagraph: string; learningPoints: string[]; tags: string[]; }
interface FinalYouTubeMetadata { title: string; description: string; tags: string[]; }
interface VideoOutput { postTitle: string; postLink: string; processedDate: string; youtubeUrl: string; youtube: FinalYouTubeMetadata; }


// =============================================================================
// --- 3. ИНИЦИАЛИЗАЦИЯ СЕРВИСОВ ---
// =============================================================================
const openai = new OpenAI({ apiKey: config.openaiApiKey });
const s3 = new S3Client({ region: config.aws.region, credentials: { accessKeyId: config.aws.accessKeyId!, secretAccessKey: config.aws.secretAccessKey! } });


// =============================================================================
// --- 4. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
// =============================================================================
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const highlightKeywords = (text: string, keywords: string[] = []): string => {
    if (!keywords || !keywords.length) return text;
    const regex = new RegExp(`\\b(${keywords.map(escapeRegExp).join('|')})\\b`, 'gi');
    return text.replace(regex, `<span class="highlight">$1</span>`);
};
function splitTextIntoScenes(text: string, maxCharsPerLine: number, maxLinesPerScene: number): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = "";
    for (const word of words) {
        if ((currentLine + " " + word).length > maxCharsPerLine && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = currentLine ? currentLine + " " + word : word;
        }
    }
    lines.push(currentLine);
    const scenes: string[] = [];
    for (let i = 0; i < lines.length; i += maxLinesPerScene) {
        scenes.push(lines.slice(i, i + maxLinesPerScene).join('\n'));
    }
    return scenes;
}


// =============================================================================
// --- 5. ЛОГИКА РАБОТЫ С ДАННЫМИ (БД) ---
// =============================================================================
async function getProcessedVideoLinks(): Promise<Set<string>> {
    try {
        const data = await fs.readFile(config.paths.processedVideosDb, 'utf-8');
        return new Set(JSON.parse(data));
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return new Set();
        throw error;
    }
}
async function saveProcessedVideoLinks(processedLinks: Set<string>): Promise<void> {
    const data = JSON.stringify(Array.from(processedLinks), null, 2);
    await fs.writeFile(config.paths.processedVideosDb, data, 'utf-8');
}
async function saveVideoOutput(output: VideoOutput): Promise<void> {
    console.log(`   💾 Saving final video output to ${config.paths.publicVideosDb}...`);
    let outputs: VideoOutput[] = [];
    try {
        const data = await fs.readFile(config.paths.publicVideosDb, 'utf-8');
        outputs = JSON.parse(data);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    outputs.unshift(output);
    await fs.writeFile(config.paths.publicVideosDb, JSON.stringify(outputs, null, 2), 'utf-8');
}
async function getArticleContent(post: Post): Promise<string | null> {
    const slug = post.link.split('/').filter(Boolean).pop();
    if (!slug) return null;
    const filePath = path.join(config.paths.contentDir, `${slug}.mdx`);
    try {
        await fs.access(filePath);
        return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
        console.warn(`   ⚠️  Local file for article "${post.title}" not found.`);
        return null;
    }
}

// =============================================================================
// --- 6. ГЕНЕРАЦИЯ АССЕТОВ (OPENAI) ---
// =============================================================================
async function generateShortsScript(articleContent: string, post: Post): Promise<VideoScript> {
    console.log(`✍️  Generating script with conceptual metaphors for "${post.title}"...`);
    const prompt = `
    ROLE: You are a "Conceptual Translator" and Creative Director for a tech brand.
    TASK: Your job is to take a technical article, create a voiceover script, and for each part of the script, translate the core technical idea into a simple, universal visual metaphor that DALL-E can understand and render beautifully without making mistakes.
    YOUR THOUGHT PROCESS FOR EACH SCENE:
    1.  Read the text for the scene.
    2.  Identify the core technical concept (e.g., "staking lockup", "APY rewards", "network consensus").
    3.  Translate this concept into a simple, safe, universal metaphor. Examples: "lockup period" -> "a glass vault with a countdown timer"; "APY" -> "a tree growing glowing digital fruit"; "network" -> "an elegant web of interconnected light points".
    4.  Use ONLY this safe metaphor to write the final "video_prompt" for DALL-E.
    REQUIREMENTS:
    - Based on the ARTICLE, write a polished, expert voiceover monologue (120–150 words).
    - Split the monologue into exactly 5 scenes.
    - For each scene, provide the text, the translated "video_prompt", and "highlights" keywords from the text.
    ⚠️ CRITICAL RULES for "video_prompt":
    - The prompt MUST be based on your generated METAPHOR, not the original technical term.
    - NEVER use brand names or crypto "trigger words" like 'Aptos', 'blockchain', 'crypto', 'coin', 'node' in the prompt for DALL-E.
    - The visual style must be consistent with the brand's aesthetic: clean, minimalist, high-tech.
    ARTICLE: """${articleContent}"""
    OUTPUT FORMAT (VALID JSON): { "full_monologue": "...", "scenes": [ { "scene_number": 1, "text": "...", "video_prompt": "...", "highlights": ["keyword1"] } ] }`;
    const messages: ChatCompletionMessageParam[] = [{ role: 'user', content: prompt }];
    const response = await openai.chat.completions.create({ model: 'gpt-4o', messages, response_format: { type: "json_object" } });
    const scriptJson = JSON.parse(response.choices[0]?.message?.content || '{}');
    console.log(`   ✅ Script with conceptual metaphors generated for ${scriptJson.scenes?.length || 0} scenes.`);
    return scriptJson;
}
async function generateVoiceover(text: string): Promise<Buffer> {
    if (!text) throw new Error("Voiceover text cannot be empty.");
    console.log(`   🗣️  Generating voiceover...`);
    const mp3 = await openai.audio.speech.create({ model: "tts-1", voice: "alloy", input: text, speed: 1.0 });
    return Buffer.from(await mp3.arrayBuffer());
}
async function generateDalleAsset(prompt: string, retries = 3, delay = 5000): Promise<Buffer> {
    console.log(`   🎨 [DALL-E 3] Generating infographic asset for metaphor: "${prompt.substring(0, 50)}..."`);
    const finalPrompt = `
    A clean, modern, high-quality conceptual illustration for a tech presentation. Visually represent the following metaphor: "${prompt}".
    STYLE GUIDE: Minimalist infographic style, clean lines, isometric perspective, professional and clear. Use a limited, professional color palette of purple (#A78BFA) and cyan (#22D3EE) on a dark background.
    CRITICAL RULES: The image must be easy to understand and visually elegant. It must be on a transparent background. Absolutely NO real-world photos or distracting elements.`;
    for (let i = 1; i <= retries; i++) {
        try {
            const response = await openai.images.generate({ model: "dall-e-3", prompt: finalPrompt, n: 1, size: "1024x1024", response_format: 'b64_json', quality: 'hd', style: 'vivid' });
            const b64_json = response.data?.[0]?.b64_json;
            if (b64_json) {
                console.log(`      ✅ Asset generated on attempt ${i}.`);
                return Buffer.from(b64_json, 'base64');
            }
            throw new Error("API returned no image data.");
        } catch (error) {
            const err = error as any;
            console.warn(`      ⚠️ Attempt ${i} failed. Error: ${err.name} - ${err.message}`);
            if (i < retries) {
                console.log(`         Retrying in ${delay / 1000}s...`);
                await sleep(delay);
            }
        }
    }
    throw new Error("All DALL-E retries failed.");
}

// =============================================================================
// --- 7. РАБОТА С AWS S3 ---
// =============================================================================
async function uploadAssetToS3(buffer: Buffer, filename: string, contentType: string): Promise<{ url: string, key: string }> {
    console.log(`   ☁️  Uploading ${filename} to S3...`);
    const key = `video-assets/${Date.now()}-${filename}`;
    const command = new PutObjectCommand({ Bucket: config.aws.s3BucketName!, Key: key, Body: buffer, ContentType: contentType });
    await s3.send(command);
    const url = `https://${config.aws.s3BucketName}.s3.${config.aws.region}.amazonaws.com/${key}`;
    return { url, key };
}
async function cleanupS3Assets(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    console.log(`\n🧹 Cleaning up ${keys.length} S3 assets...`);
    const objects = keys.map(key => ({ Key: key })) as ObjectIdentifier[];
    const command = new DeleteObjectsCommand({ Bucket: config.aws.s3BucketName!, Delete: { Objects: objects }});
    await s3.send(command);
    console.log(`   ✅ S3 Cleanup complete.`);
}

// =============================================================================
// --- 8. СБОРКА ВИДЕО (SHOTSTACK) ---
// =============================================================================
async function assembleVideo(mainScenes: { text: string; imageUrl: string; highlights?: string[] }[], voiceoverUrl: string, totalVoiceoverDuration: number, fullMonologue: string): Promise<string> {
    const imageClips: any[] = [];
    const htmlClips: any[] = [];
    let globalCurrentTime = 0;
    const MAX_CHARS_PER_LINE = 35;
    const MAX_LINES_PER_SCENE = 3;
    const READING_BUFFER = 0.5;
    const MINIMUM_SCENE_DURATION = 1.5;
    mainScenes.forEach((scene) => {
        const sceneCharacterWeight = scene.text.length / fullMonologue.length;
        const sceneTimeBudget = sceneCharacterWeight * totalVoiceoverDuration;
        const subSceneTexts = splitTextIntoScenes(scene.text, MAX_CHARS_PER_LINE, MAX_LINES_PER_SCENE);
        if (subSceneTexts.length === 0) return;
        const totalSubSceneChars = subSceneTexts.reduce((sum, text) => sum + text.length, 0);
        if (totalSubSceneChars === 0) return;
        const rawDurations = subSceneTexts.map(text => (text.length / totalSubSceneChars) * sceneTimeBudget);
        const desiredDurations = rawDurations.map(d => Math.max(d + READING_BUFFER, MINIMUM_SCENE_DURATION));
        const totalDesiredDuration = desiredDurations.reduce((sum, d) => sum + d, 0);
        const normalizationFactor = sceneTimeBudget > 0 && totalDesiredDuration > 0 ? sceneTimeBudget / totalDesiredDuration : 1;
        const finalDurations = desiredDurations.map(d => d * normalizationFactor);
        let sceneLocalTime = 0;
        subSceneTexts.forEach((subSceneText, subIndex) => {
            const currentSubSceneDuration = finalDurations[subIndex];
            const highlightedText = highlightKeywords(subSceneText, scene.highlights);
            const finalHtml = `<html><head><style>${config.elegantCss}</style></head><body><div class="container"><div class="plate"><span class="text">${highlightedText}</span></div></div></body></html>`;
            htmlClips.push({ asset: { type: 'html', html: finalHtml }, start: globalCurrentTime + sceneLocalTime, length: currentSubSceneDuration, transition: { in: 'slideUp', out: 'slideDown' } });
            sceneLocalTime += currentSubSceneDuration;
        });
        imageClips.push({ asset: { type: 'image', src: scene.imageUrl }, start: globalCurrentTime, length: sceneLocalTime, effect: 'zoomIn' });
        globalCurrentTime += sceneLocalTime;
    });
    const finalVideoDuration = globalCurrentTime;
    const audioClip = { asset: { type: 'audio', src: voiceoverUrl, volume: 1 }, start: 0, length: finalVideoDuration };
    const edit = { timeline: { background: "#000000", tracks: [{ clips: [audioClip] }, { clips: htmlClips }, { clips: imageClips }] }, output: { format: "mp4", resolution: "1080", aspectRatio: "9:16" } };
    const apiUrl = `https://api.shotstack.io/${config.shotstack.env}`;
    const headers = { 'x-api-key': config.shotstack.apiKey!, 'Content-Type': 'application/json' };
    try {
        console.log(`    🎥 Assembling video... Total duration: ${finalVideoDuration.toFixed(2)}s.`);
        const { data } = await axios.post(`${apiUrl}/render`, JSON.stringify(edit), { headers });
        const renderId = data.response.id;
        console.log(`      ✅ Render job submitted. ID: ${renderId}`);
        let status = "submitted";
        while (["submitted", "queued", "rendering", "fetching", "saving"].includes(status)) {
            await sleep(10000);
            const statusResponse = await axios.get(`${apiUrl}/render/${renderId}`, { headers });
            status = statusResponse.data.response.status;
            console.log(`      ⏳ Render status: ${status}`);
        }
        const finalRender = await axios.get(`${apiUrl}/render/${renderId}`, { headers });
        if (finalRender.data.response.status === "done") {
            console.log(`      ✅ Render complete! URL: ${finalRender.data.response.url}`);
            return finalRender.data.response.url;
        } else {
            console.error("      ❌ Render did not complete successfully. Final status was not 'done'.");
            console.error("      Полный ответ от Shotstack:", JSON.stringify(finalRender.data.response, null, 2));
            throw new Error(`Shotstack render failed with status '${finalRender.data.response.status}'.`);
        }
    } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message;
        console.error(`   ❌ Error during video assembly with Shotstack: ${errorMessage}`);
        throw error;
    }
}


// =============================================================================
// --- 9. ЛОГИКА YOUTUBE ---
// =============================================================================
async function authenticateYouTube(): Promise<OAuth2Client> {
    if (process.env.OAUTH_CLIENT_SECRET_JSON && process.env.OAUTH_TOKEN_JSON) {
        console.log('   🤫  Authenticating YouTube via GitHub Secrets...');
        const credentials = JSON.parse(process.env.OAUTH_CLIENT_SECRET_JSON);
        const token = JSON.parse(process.env.OAUTH_TOKEN_JSON);
        const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
        oAuth2Client.setCredentials(token);
        console.log('   ✅  YouTube authenticated non-interactively.');
        return oAuth2Client;
    }
    console.log('   🏠  Authenticating YouTube locally...');
    if (!existsSync(config.youtube.credentialsPath)) {
        throw new Error(`[ERROR] YouTube credentials file not found at ${config.youtube.credentialsPath}.`);
    }
    const credentialsContent = await fs.readFile(config.youtube.credentialsPath, 'utf-8');
    const credentials = JSON.parse(credentialsContent);
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    try {
        const tokenContent = await fs.readFile(config.youtube.tokenPath, 'utf-8');
        oAuth2Client.setCredentials(JSON.parse(tokenContent));
        console.log('   ✅  YouTube authenticated using saved token file.');
        return oAuth2Client;
    } catch (err) {
        console.log('   ⚠️  No saved YouTube token file found. Starting new authorization flow...');
        return getNewYouTubeToken(oAuth2Client);
    }
}

async function getNewYouTubeToken(oAuth2Client: OAuth2Client): Promise<OAuth2Client> {
    const authUrl = oAuth2Client.generateAuthUrl({ access_type: 'offline', scope: config.youtube.scopes });
    console.log('\nAuthorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({ input, output });
    const code = await rl.question('Enter the code from that page here: ');
    rl.close();
    const { tokens } = await oAuth2Client.getToken({ code });
    oAuth2Client.setCredentials(tokens);
    await fs.writeFile(config.youtube.tokenPath, JSON.stringify(tokens));
    console.log('   ✅  Token stored to', config.youtube.tokenPath);
    return oAuth2Client;
}

async function generateYouTubeCreativeContent(postTitle: string, monologue: string): Promise<YouTubeCreativeContent> {
    console.log(`   📝 Generating YouTube metadata for "${postTitle}"...`);
    const prompt = `ROLE: You are an expert Social Media Manager for "aptcore.one", a brand providing advanced tools for Aptos staking. TASK: Create the core creative components for a YouTube Short description. CONTEXT: The video is based on an article titled "${postTitle}". The voiceover monologue is: """${monologue}""" REQUIREMENTS: 1.  **title:** Create a short, catchy, intriguing title (max 70 characters). It should create curiosity for Aptos users. 2.  **hookParagraph:** Write a 1-2 sentence engaging introduction that summarizes the video's value. 3.  **learningPoints:** Extract 3-4 key takeaways from the monologue. Phrase them as benefits. This will be used in a "In this guide, you will learn about:" section. Return as a string array. 4.  **tags:** Provide a list of 15-20 highly relevant tags as a string array. MUST include "Aptos", "APT", "Staking", "AptcoreOne", "DeFi", "Blockchain". OUTPUT FORMAT (VALID JSON ONLY): { "title": "...", "hookParagraph": "...", "learningPoints": ["Takeaway 1", "Takeaway 2"], "tags": ["tag1", "tag2"] }`;
    const messages: ChatCompletionMessageParam[] = [{ role: 'user', content: prompt }];
    const response = await openai.chat.completions.create({ model: 'gpt-4o', messages, response_format: { type: "json_object" } });
    return JSON.parse(response.choices[0]?.message?.content || '{}');
}

function assembleYouTubeDescription(creative: YouTubeCreativeContent, articleLink: string): string {
    const learningPointsList = creative.learningPoints.map(point => `✅ ${point}`).join('\n');
    return `${creative.hookParagraph}\n\nIn this guide, you will learn about:\n${learningPointsList}\n\n▶️ Explore our free Aptos staking tools:\nhttps://aptcore.one\n\n---\n\n🔗 **LINKS & RESOURCES MENTIONED:**\n* **Aptos Unstaking Visualizer:** https://aptcore.one/tools/aptos-staking-lockup-visualizer\n* **Aptos APY Calculator:** https://aptcore.one/tools/aptos-staking-apy-calculator\n* **Read the full article:** ${articleLink}\n* **Our Blog:** https://aptcore.one/blog\n\n---\n\n🔔 **SUBSCRIBE for more Aptos tools, tutorials, and crypto insights!**\n\n**CONNECT WITH APTCORE.ONE:** 🤝\n* 🌐 **Website:** https://aptcore.one\n* 🐦 **Twitter (X):** https://x.com/aptcoreone\n\n---\n\n**DISCLAIMER:**\nThis content is for informational and educational purposes only and is not financial advice. Always do your own research (DYOR).\n\n#Aptos #APT #Staking #Unstaking #CryptoTool #AptcoreOne #Blockchain #CryptoExplained #DeFi #AptosTutorial #CryptoNews`.trim();
}

async function uploadToYouTube(videoUrl: string, metadata: FinalYouTubeMetadata): Promise<string> {
    console.log(`\n▶️  Starting YouTube upload...`);
    const auth = await authenticateYouTube();
    google.options({ auth });
    console.log(`   📥 Downloading video from temporary URL...`);
    const videoResponse = await axios.get(videoUrl, { responseType: 'arraybuffer' });
    const videoBuffer = Buffer.from(videoResponse.data, 'binary');
    console.log(`   📤 Uploading video to YouTube...`);
    const youtube = google.youtube('v3');
    const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
            snippet: {
                title: metadata.title,
                description: metadata.description,
                tags: metadata.tags,
                categoryId: '28',
            },
            status: {
                privacyStatus: 'private',
                selfDeclaredMadeForKids: false,
            },
        },
        media: {
            body: Readable.from(videoBuffer),
        },
    });
    const videoId = response.data.id;
    if (!videoId) throw new Error("YouTube API did not return a video ID.");
    if (config.youtube.playlistId) {
        console.log(`   ➕ Adding video to playlist ID: ${config.youtube.playlistId}...`);
        await youtube.playlistItems.insert({
            part: ['snippet'],
            requestBody: {
                snippet: {
                    playlistId: config.youtube.playlistId,
                    resourceId: { kind: 'youtube#video', videoId: videoId },
                },
            },
        });
        console.log(`   ✅ Video added to playlist successfully.`);
    }
    const finalUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`   ✅ YouTube upload complete! Video is private at: ${finalUrl}`);
    return finalUrl;
}


// =============================================================================
// --- 10. GIT ОПЕРАЦИИ ---
// =============================================================================
async function commitAndPushChanges(postTitle: string): Promise<void> {
    console.log(`\n🔄 Committing and pushing changes to GitHub...`);
    const commitMessage = `feat: Generate video for article '${postTitle}'`;
    try {
        await execa('git', ['config', '--global', 'user.name', 'Video Producer Bot']);
        await execa('git', ['config', '--global', 'user.email', 'bot@example.com']);
        await execa('git', ['add', config.paths.processedVideosDb, config.paths.publicVideosDb]);
        await execa('git', ['commit', '-m', commitMessage]);
        await execa('git', ['push']);
        console.log(`   ✅ Successfully committed and pushed changes.`);
    } catch (error) {
        const execaError = error as any;
        if (execaError.stdout?.includes('nothing to commit')) {
            console.log('   ℹ️ No new changes to commit.');
            return;
        }
        console.error(`   ❌ Failed to commit and push changes:`, execaError);
    }
}

// =============================================================================
// --- 11. ГЛАВНЫЙ ОРКЕСТРАТОР ---
// =============================================================================
async function processVideoForPost(post: Post, articleContent: string, processedLinks: Set<string>) {
    const s3KeysToCleanup: string[] = [];
    try {
        console.log(`\n🚀 Processing article for video: "${post.title}"`);
        const script = await generateShortsScript(articleContent, post);
        if (!script?.scenes?.length) throw new Error("Script generation failed.");
        const voiceoverBuffer = await generateVoiceover(script.full_monologue);
        const { url: voiceoverUrl, key: voiceoverKey } = await uploadAssetToS3(voiceoverBuffer, 'voiceover.mp3', 'audio/mpeg');
        s3KeysToCleanup.push(voiceoverKey);
        const voiceoverDuration = getMp3Duration(voiceoverBuffer) / 1000;
        console.log(`   🎵 Voiceover duration: ${voiceoverDuration.toFixed(2)}s`);
        let sceneAssets: { text: string; imageUrl: string; highlights?: string[] }[] = [];
        for (const scene of script.scenes) {
            const imageBuffer = await generateDalleAsset(scene.video_prompt);
            const { url: imageUrl, key: imageKey } = await uploadAssetToS3(imageBuffer, `scene_${scene.scene_number}.png`, 'image/png');
            s3KeysToCleanup.push(imageKey);
            sceneAssets.push({ text: scene.text, imageUrl, highlights: scene.highlights || [] });
        }
        const shotstackVideoUrl = await assembleVideo(sceneAssets, voiceoverUrl, voiceoverDuration, script.full_monologue);
        console.log(`\n✅ Video rendering complete! URL: ${shotstackVideoUrl}`);
        const creativeContent = await generateYouTubeCreativeContent(post.title, script.full_monologue);
        if (!creativeContent) throw new Error("Failed to generate YouTube metadata.");
        const finalDescription = assembleYouTubeDescription(creativeContent, post.link);
        const baseTitle = creativeContent.title;
        const hashtags = " #staking #aptos #aptcoreone #shorts";
        const finalTitle = (baseTitle + hashtags).substring(0, 100);
        const finalMetadata: FinalYouTubeMetadata = { title: finalTitle, description: finalDescription, tags: creativeContent.tags };
        const finalYoutubeUrl = await uploadToYouTube(shotstackVideoUrl, finalMetadata);
        const videoOutput: VideoOutput = {
            postTitle: post.title,
            postLink: post.link,
            processedDate: new Date().toISOString(),
            youtubeUrl: finalYoutubeUrl,
            youtube: finalMetadata
        };
        await saveVideoOutput(videoOutput);
        processedLinks.add(post.link);
        await saveProcessedVideoLinks(processedLinks);
        await commitAndPushChanges(post.title);
        console.log(`\n✨✨✨\n✅ FULL CYCLE COMPLETE! Video is private on YouTube: ${finalYoutubeUrl}\n✨✨✨`);
    } catch (error: any) {
        console.error(`\n❌ A critical error occurred while processing "${post.title}":`);
        console.error(error.message || error);
        processedLinks.add(post.link);
        await saveProcessedVideoLinks(processedLinks);
        console.log(`   ℹ️ Post "${post.title}" marked as processed to avoid retrying.`);
    } finally {
        await cleanupS3Assets(s3KeysToCleanup);
    }
}

// =============================================================================
// --- 12. ТОЧКА ВХОДА ---
// =============================================================================
async function main() {
    console.log('🤖 Starting Video Producer Bot...');
    try {
        const { data: allPosts } = await axios.get<Post[]>(config.postsJsonUrl!);
        const processedLinks = await getProcessedVideoLinks();
        const postsToProcess = allPosts
            .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
            .filter(post => !processedLinks.has(post.link));
        if (postsToProcess.length === 0) {
            console.log('✅ All published posts have been processed.');
            return;
        }
        console.log(`📰 Found ${postsToProcess.length} new post(s) to process.`);
        let videoProcessed = false;
        for (const post of postsToProcess) {
            console.log(`\n🔍 Checking for article file: "${post.title}"...`);
            const articleContent = await getArticleContent(post);
            if (articleContent) {
                await processVideoForPost(post, articleContent, processedLinks);
                videoProcessed = true;
                break; 
            } else {
                console.log(`   ⏩ Skipping post, local file not found.`);
            }
        }
        if (!videoProcessed) {
            console.log('✅ No new articles found with corresponding local files to process.');
        }
    } catch (error: any) {
        console.error('\n❌ A fatal error occurred in the bot:');
        console.error(error.message || error);
        process.exit(1);
    }
}

main();

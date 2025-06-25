import 'dotenv/config';
import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const {
    POSTS_JSON_URL,
    OPENAI_API_KEY,
} = process.env;

const DB_VIDEO_PATH = path.join(process.cwd(), 'scripts', 'processed_videos.json');
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

async function getArticleContent(post: Post): Promise<string | null> {
    const slug = post.link.split('/').filter(Boolean).pop();
    if (!slug) {
        console.error(`   ❌ Could not determine slug from post link: ${post.link}`);
        return null;
    }
    const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
    console.log(`   📖 Checking for article content at: ${filePath}`);
    try {
        await fs.access(filePath);
        const content = await fs.readFile(filePath, 'utf-8');
        return content.split('---')[2] || '';
    } catch (error) {
        console.warn(`   ⚠️  Local file for article "${post.title}" not found. Please sync your local repository.`);
        return null;
    }
}

async function generateShortsScript(articleContent: string, post: Post): Promise<VideoScript> {
    console.log(`✍️  Generating E-A-T infographic script and visual concepts for "${post.title}"...`);

    const prompt = `
    ROLE: You are a Lead Motion Graphics Designer working for a premium crypto media outlet. 
    Your mission is to turn article insights into an engaging, structured animated short video.

    CONTEXT:
    - Topic: **${post.title}**
    - Audience: crypto investors, DeFi users, staking participants.
    - Tone: concise, trustworthy, informative.

    REQUIREMENTS:
    1. Write a polished voiceover monologue (120–150 words max).
    2. Split the monologue into 4–5 scenes.
    3. For each scene, generate a "video_prompt" to visualize the scene with a **static** 3D icon or abstract infographic.

    ⚠️ STRICT RULES for "video_prompt":
    - Absolutely NO text, letters, logos, or numbers.
    - Only describe visual shapes, compositions, materials, and layout.
    - The visual concept should be clear and metaphorical. For example, instead of "map with path", describe "A 3D abstract map platform with a highlighted path leading to a glowing node, suggesting a strategic start of a crypto journey."

    ARTICLE:
    """${articleContent}"""

    OUTPUT FORMAT (VALID JSON):
    {
      "full_monologue": "A short, compelling voiceover...",
      "scenes": [
        {
          "scene_number": 1,
          "text": "First sentence of the scene...",
          "video_prompt": "Visual description with NO TEXT, in a clean 3D style..."
        }
      ]
    }
    `;
    
    const messages: ChatCompletionMessageParam[] = [{ role: 'user', content: prompt }];
    const response = await openai.chat.completions.create({ model: 'gpt-4o', messages, response_format: { type: "json_object" }, });
    
    const scriptJson = JSON.parse(response.choices[0]?.message?.content || '{}');
    console.log(`   ✅ E-A-T script and visual concepts generated for ${scriptJson.scenes.length} scenes.`);
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
            speed: 1.0
        });
        return Buffer.from(await mp3.arrayBuffer());
    } catch (error) {
        console.error("   ❌ Error during voiceover generation:", error);
        return null;
    }
}

async function generateDalleAsset(prompt: string, title: string): Promise<Buffer | null> {
    console.log(`   🎨 [DALL-E 3] Generating asset with master brief for: "${prompt.substring(0, 50)}..."`);
    
    const brandPalette = {
        purple: "#A78BFA",
        cyan: "#22D3EE",
        textLight: "#E5E7EB"
    };

    const finalPrompt = `
    A clean, modern, high-quality 3D render illustrating a visual concept.

    VISUAL CONCEPT: "${prompt}"
    
    ---
    MANDATORY STYLE AND SAFETY GUIDE:
    
    1. STYLE & MATERIALS:
       - Render must be minimalist, soft 3D with smooth metallic or matte surfaces.
       - Lighting must be studio-grade with soft shadows and subtle reflections.
       - Color palette: use mainly vibrant purple (${brandPalette.purple}) and bright cyan (${brandPalette.cyan}), with light gray (${brandPalette.textLight}) for neutral accents.
    
    2. CRITICAL CONTENT RULES:
       - Asset must be isolated on a fully transparent background.
       - Absolutely NO text, numbers, letters, logos, or identifiable symbols.
       - DO NOT use any real-world cryptocurrency or brand logos (e.g., BTC, ETH).
       - All objects must be abstract, generic, or geometric in form — not specific coins.
    
    This asset will be used in a professional crypto/fintech explainer video about Aptos staking.
    `;
    
    try {
        const response = await openai.images.generate({ 
            model: "dall-e-3", 
            prompt: finalPrompt, 
            n: 1, 
            size: "1024x1024",
            response_format: 'b64_json',
            quality: 'hd',
            style: 'vivid' 
        });
        
        const b64_json = response.data?.[0]?.b64_json;

        if (b64_json) {
            return Buffer.from(b64_json, 'base64');
        }
        console.error("   ❌ DALL-E 3 API response did not contain b64_json data.");
        return null;
    } catch (error) {
        console.error("   ❌ Error during DALL-E 3 asset generation:", error);
        return null;
    }
}

async function main() {
    console.log('🤖 Starting E-A-T Asset Producer (Live Mode)...');

    if (!POSTS_JSON_URL) {
        console.error('❌ POSTS_JSON_URL environment variable is not set.');
        return;
    }

    console.log(`\n📚 Fetching live posts from ${POSTS_JSON_URL}...`);
    const { data: allPosts } = await axios.get<Post[]>(POSTS_JSON_URL);
    console.log(`   ✅ Found ${allPosts.length} published posts.`);

    const processedLinks = await getProcessedVideoLinks();
    const postsToProcess = allPosts
        .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
        .filter(post => !processedLinks.has(post.link));
    
    if (postsToProcess.length === 0) {
        console.log('✅ All published posts have been processed.');
        return;
    }

    const postToProcess = postsToProcess[0];
    console.log(`\n🚀 Processing article for video assets: "${postToProcess.title}"`);

    try {
        const articleContent = await getArticleContent(postToProcess);
        if (articleContent === null) {
            console.log(`   🛑 Halting because the local .mdx file for this article could not be found. Please ensure your branch is synced with main.`);
            return;
        }

        const script = await generateShortsScript(articleContent, postToProcess);

        const slug = postToProcess.link.split('/').filter(Boolean).pop()!;
        const videoAssetDir = path.join(process.cwd(), 'video_assets', slug);
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
import 'dotenv/config';
import { promises as fs } from 'fs';
import path from 'path';
import OpenAI from 'openai';
import { Octokit } from 'octokit';
import { Buffer } from 'buffer';
import axios from 'axios';
import sharp from 'sharp';

const GIST_ID = process.env.GIST_ID!;
const GH_TOKEN = process.env.GH_PAT_REPO!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const G_SEARCH_KEY = process.env.G_SEARCH_KEY!;
const SEARCH_ENGINE_ID = process.env.SEARCH_ENGINE_ID!;
const REPO_OWNER = 'p1xel32';
const REPO_NAME = 'petra-staking-app';
const REPO_BRANCH = 'main';
const GIST_FILENAME = 'topic_queue.json';
const LIVE_POSTS_URL = 'https://aptcore.one/blog/posts.json';

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const octokit = new Octokit({ auth: GH_TOKEN });

interface Topic {
  title: string;
  keywords: string[];
}

interface ExistingPost {
  title: string;
  link: string;
}

interface ContentPlan {
  detailedTitle: string;
  targetAudience: string;
  keyTakeaways: string[];
  articleOutline: {
    section: string;
    pointsToCover: string[];
    analogyOrExample?: string;
  }[];
  concludingThought: string;
}

async function researchAndCreateOutline(title: string, keywords: string[]): Promise<ContentPlan> {
  console.log(`  🔬 Conducting deep research for "${title}"...`);
  const prompt = `You are a world-class blockchain research analyst and content strategist specializing in Aptos.
Your task is to conduct in-depth research on the topic "${title}" and create a comprehensive content plan for a definitive blog post.
The keywords for this topic are: "${keywords.join(', ')}". These keywords represent SEO terms users search for. Make sure they are woven naturally into the outline.
The output MUST be a JSON object that adheres to the ContentPlan interface.

**Instructions for the plan:**
1.  **Analyze the Topic:** Break down the core components of the topic. What is the search intent behind it? What questions do users have?
2.  **Define Audience:** Specify the target audience (e.g., "Beginner crypto users", "Experienced Move developers").
3.  **Create Outline:** Design a logical flow for the article. For each section (H2, H3), list the specific points, arguments, and data that must be included.
4.  **Suggest Depth:** For complex parts, suggest a simple analogy or a practical example.
5.  **Key Takeaways:** List 3-4 main points the reader must remember after reading.

Generate the JSON content plan now.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: "json_object" },
  });

  const responseContent = response.choices[0]?.message?.content;

  if (!responseContent) {
    throw new Error('OpenAI returned an empty response content.');
  }

  try {
    const plan = JSON.parse(responseContent) as ContentPlan;
    console.log(`  ✅ Research complete. Content plan created.`);
    return plan;
  } catch (error) {
    console.error('   ❌ Invalid JSON from OpenAI. Could not parse content plan.');
    console.error('   Received content:', responseContent);
    throw new Error('Failed to parse content plan from OpenAI response.');
  }
}

async function generateArticleText(topic: Topic, plan: ContentPlan): Promise<string> {
    console.log(`  ✍️  Writing expert article for "${topic.title}" based on research...`);
    
    const planText = `
      **Title:** ${plan.detailedTitle}
      **Target Audience:** ${plan.targetAudience}
      **Key Takeaways to weave in:**
      ${plan.keyTakeaways.map(p => `- ${p}`).join('\n')}
  
      **Article Structure and Content to Follow Strictly:**
      ${plan.articleOutline.map(s => `
        ### Section: ${s.section}
        **Points to cover:**
        ${s.pointsToCover.map(p => `- ${p}`).join('\n')}
        ${s.analogyOrExample ? `**Analogy/Example to use:** ${s.analogyOrExample}` : ''}
      `).join('\n')}
  
      **Conclusion:** ${plan.concludingThought}
    `;
  
    const prompt = `You are a senior technical writer and an expert on the Aptos blockchain, known for your clear, engaging, and authoritative writing style.
  Your task is to write a high-quality, comprehensive blog post of about 800-1200 words. You have been provided with a detailed content plan from a research analyst. You MUST follow this plan strictly.
  
  **Content Plan to Execute:**
  ${planText}
  
  **Instructions:**
  - Write in a professional, clear, and trustworthy tone.
  - Flesh out each point from the plan into well-written paragraphs.
  - Use Markdown for structure (H2, H3, lists, bold text).
  - Seamlessly integrate the provided analogies and key takeaways into the narrative.
  - The final article should be a definitive resource on the topic.
  
  Begin writing the article now.`;
  
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
      });
      return response.choices[0]?.message?.content || 'Error: Could not generate article text.';
    } catch (error) {
      console.error(`  ❌ Error generating article text:`, error);
      return `Error occurred during article generation for title: ${topic.title}.`;
    }
}

async function generateFaqSection(articleTitle: string, articleBody: string): Promise<string> {
    console.log(`   ❓ Generating FAQ for "${articleTitle}"...`);
    const prompt = `Based on the following article about "${articleTitle}", generate a short FAQ section with 2-3 relevant questions and concise answers. The questions should be things a user might ask after reading the article. Format the output in Markdown with H3 headings for each question. Article text for context: "${articleBody.substring(0, 3000)}"`;
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
        });
        const faqContent = response.choices[0]?.message?.content || "";
        return `\n\n---\n## Frequently Asked Questions (FAQ)\n${faqContent}`;
    } catch (error) {
        console.error(`   ❌ Error generating FAQ section:`, error);
        return "";
    }
}

async function generateImageConcept(title: string, keywords: string[]): Promise<string> {
    console.log(`   🧠 Generating a visual concept for "${title}"...`);
    const prompt = `You are a creative art director. For a blog post titled "${title}" with keywords "${keywords.join(', ')}", describe a simple, minimalist, abstract visual metaphor in 5-10 words. Do not describe the style, only the core concept. Example: for 'Staking Security', suggest 'a glowing digital shield deflecting abstract arrows'.`;
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
      });
      return response.choices[0]?.message?.content || "abstract blockchain data visualization";
    } catch (error) {
      console.error(`   ❌ Error generating image concept:`, error);
      return "abstract blockchain data visualization";
    }
}

async function createImageWithDalle(articleTitle: string, visualConcept: string): Promise<string | null> {
    console.log(`   🎨 Generating image for concept: "${visualConcept}"...`);
    const brandPalette = { background: "#09090B", purple: "#A78BFA", cyan: "#22D3EE", textLight: "#E5E7EB" };
    const stylePrompt = `The image must be a clean, modern infographic diagram. Use simple, bold, 2D vector icons to represent concepts. The background must be a solid dark charcoal color (${brandPalette.background}). All elements must use the brand's official color palette: vibrant purple (${brandPalette.purple}) and bright cyan (${brandPalette.cyan}) for the main icons and connecting lines, with light gray (${brandPalette.textLight}) for secondary details. The composition should be clear, minimalist, and easy to understand. It must contain absolutely no realistic photos, complex textures, or text. The final image should look like a professional UI/UX diagram or a slide from a tech presentation. Aspect Ratio: 16:9. The image must completely fill the frame without any borders or empty areas.`;
    const finalPrompt = `A blog post cover image. The central theme is "${articleTitle}". The image should visually represent the concept: "${visualConcept}". The required style is: ${stylePrompt}`;
    try {
      const response = await openai.images.generate({ model: "dall-e-3", prompt: finalPrompt, n: 1, size: "1792x1024", quality: "standard", style: 'vivid' });
      const image = response.data?.[0];
      if (image && image.url) {
        console.log(`   ✅ Image generated successfully!`);
        return image.url;
      } else {
        throw new Error("DALL-E 3 API response did not contain an image URL.");
      }
    } catch (error) {
      console.error(`   ❌ Error generating image:`, error);
      return null;
    }
}

async function downloadAndOptimizeImage(url: string): Promise<Buffer> {
    console.log(`   🗜️ Downloading and optimizing image...`);
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return sharp(response.data)
      .resize(1600)
      .jpeg({ quality: 80 })
      .toBuffer();
}

async function addInternalLinks(articleBody: string, newArticleTitle: string): Promise<string> {
    console.log(`   🔗 Searching for internal linking opportunities...`);
    try {
        const { data: existingPosts } = await axios.get<ExistingPost[]>(LIVE_POSTS_URL);
        let linkedBody = articleBody;
        let linkCount = 0;
        for (const post of existingPosts) {
            if (post.title.toLowerCase() === newArticleTitle.toLowerCase()) continue;
            const regex = new RegExp(`\\b(${post.title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})\\b`, 'gi');
            if (linkedBody.search(regex) > -1 && !linkedBody.includes(`](${post.link})`)) {
                const markdownLink = `[${post.title}](${post.link})`
                linkedBody = linkedBody.replace(regex, markdownLink);
                console.log(`     ✅ Internally linked to: "${post.title}"`);
                linkCount++;
            }
        }
        console.log(`   🔗 Total internal links added: ${linkCount}`);
        return linkedBody;
    } catch (error: any) {
        console.error(`   ❌ Could not fetch existing posts for internal linking:`, error.message);
        return articleBody;
    }
}

async function addExternalLinks(articleBody: string): Promise<string> {
    console.log(`   🌍 Searching for external authoritative links...`);
    try {
        const conceptPrompt = `Analyze this article text. Identify 2-3 key technical Aptos-specific concepts, protocol names, or features (e.g., 'Block-STM', 'AptosBFT consensus', 'Move language'). Return ONLY a JSON object with a single key "phrases" which is an array of strings. Example: {"phrases": ["Aptos Block-STM", "Move programming language"]} Article text: "${articleBody.substring(0, 4000)}"`;
        const conceptResponse = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: conceptPrompt }], response_format: { type: "json_object" } });
        const concepts: string[] = JSON.parse(conceptResponse.choices[0]?.message?.content || '[]').phrases || [];
        let linkedBody = articleBody;
        let linkCount = 0;
        for (const concept of concepts) {
            console.log(`     🔎 Searching for: "${concept}" on official sites...`);
            const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${G_SEARCH_KEY}&cx=${SEARCH_ENGINE_ID}&q=${encodeURIComponent(concept)}`;
            const searchResponse = await axios.get(searchUrl);
            const bestUrl = searchResponse.data.items?.[0]?.link;
            if (bestUrl) {
                const regex = new RegExp(`\\b(${concept.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})\\b`, 'gi');
                if (regex.test(linkedBody) && !linkedBody.includes(`](${bestUrl})`)) {
                    linkedBody = linkedBody.replace(regex, `[${concept}](${bestUrl})`);
                    console.log(`     ✅ Externally linked to: ${bestUrl}`);
                    linkCount++;
                }
            }
        }
        console.log(`   🌍 Total external links added: ${linkCount}`);
        return linkedBody;
    } catch(error: any) {
        console.error(`   ❌ Error during external linking:`, error.message);
        return articleBody;
    }
}

async function generateMetaDescription(articleBody: string): Promise<string> {
    console.log('   ✍️  Generating meta description...');
    const prompt = `Based on the following article text, write a concise and compelling meta description of about 150-160 characters. It should be engaging for users on a search engine results page. Article text: "${articleBody.substring(0, 4000)}"`;
    try {
      const response = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }]});
      return response.choices[0]?.message?.content?.replace(/"/g, '\\"') || "A deep dive into Aptos blockchain topics.";
    } catch (error: any) {
      console.error(`   ❌ Error generating meta description:`, error);
      return "A deep dive into Aptos blockchain topics.";
    }
}

async function generateImageAltText(visualConcept: string): Promise<string> {
    console.log('   🖼️  Generating image alt text...');
    const prompt = `You are an accessibility expert. Write a concise, descriptive alt text for an image representing the concept: "${visualConcept}". The alt text should describe the image for visually impaired users.`;
    try {
      const response = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }]});
      return response.choices[0]?.message?.content?.replace(/"/g, '\\"') || "Abstract conceptual image for the article.";
    } catch (error: any) {
      console.error(`   ❌ Error generating alt text:`, error);
      return "Abstract conceptual image for the article.";
    }
}

function assembleMdxFile(topic: Topic, articleBody: string, generated: { imagePath: string | null; description: string; altText: string }): { filename: string, content: string } {
    const slug = topic.title.toLowerCase().replace(/\s+/g, '-').replace(/[?:]/g, '');
    const date = new Date();
    const pubDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const imageFilename = generated.imagePath ? `${slug}.jpg` : `placeholder.png`;
    const finalImagePath = generated.imagePath ? `/blog-assets/${imageFilename}` : `/blog-assets/placeholder.png`;

    const frontmatter = `---
title: "${topic.title.replace(/"/g, '\\"')}"
slug: "${slug}"
pubDate: "${pubDate}"
description: "${generated.description}"
author: "The aptcore.one Team"
keywords: [${topic.keywords.map(k => `"${k}"`).join(', ')}]
heroImage: "${finalImagePath}"
heroImageAlt: "${generated.altText}"
tags: [${topic.keywords.map(k => `"${k}"`).join(', ')}]
---\n\n`;

    const filename = `${slug}.mdx`;
    const content = frontmatter + articleBody; 
    
    return { filename, content };
}

async function createPullRequest(filesToCommit: { path: string, content: string, encoding?: 'base64' | 'utf-8' }[], topic: Topic): Promise<boolean> {
    console.log(`\n🤖 Creating Pull Request for "${topic.title}"...`);
    const slug = topic.title.toLowerCase().replace(/\s+/g, '-').replace(/[?:]/g, '');
    const newBranchName = `article/${slug}`;
    const ref = `refs/heads/${newBranchName}`;

    try {
        const { data: refData } = await octokit.rest.git.getRef({ owner: REPO_OWNER, repo: REPO_NAME, ref: `heads/${REPO_BRANCH}` });
        const mainBranchSha = refData.object.sha;

        try {
            await octokit.rest.git.createRef({ owner: REPO_OWNER, repo: REPO_NAME, ref, sha: mainBranchSha });
            console.log(`   ✅ Created new branch: ${newBranchName}`);
        } catch (error: any) {
            if (error.response?.data?.message === 'Reference already exists') {
                console.log(`   ⚠️ Branch ${newBranchName} already exists. Reusing it.`);
            } else { throw error; }
        }

        for (const file of filesToCommit) {
            await octokit.rest.repos.createOrUpdateFileContents({
                owner: REPO_OWNER,
                repo: REPO_NAME,
                path: file.path,
                message: `feat: Add ${path.basename(file.path)} for article '${topic.title}'`,
                content: file.content,
                branch: newBranchName,
            });
            console.log(`   ✅ Committed file: ${file.path}`);
        }

        const { data: prData } = await octokit.rest.pulls.create({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            title: `New Article: ${topic.title}`,
            head: newBranchName,
            base: REPO_BRANCH,
            body: `This PR was automatically generated by the Content Factory.\n\nPlease review the article content and the generated image before merging.\n\n**Keywords:** ${topic.keywords.join(', ')}`,
        });
        console.log(`   ✅ Successfully created Pull Request! View it here: ${prData.html_url}`);
        return true;
    } catch (error: any) {
        console.error('   ❌ Error creating Pull Request:', error);
        return false;
    }
}

async function main() {
    console.log('🤖 Starting Ultimate Content Generator...');
    if (!GIST_ID || !GH_TOKEN || !OPENAI_API_KEY || !G_SEARCH_KEY || !SEARCH_ENGINE_ID) {
        throw new Error('One or more required secrets are missing from .env file.');
    }

    const { data: gist } = await octokit.request('GET /gists/{gist_id}', { gist_id: GIST_ID });
    const queueFile = gist.files?.[GIST_FILENAME];
    if (!queueFile || !queueFile.content) { throw new Error(`File ${GIST_FILENAME} not found in Gist.`); }

    let topicQueue: Topic[] = JSON.parse(queueFile.content);
    if (topicQueue.length === 0) { console.log('✅ Topic queue is empty.'); return; }

    const topicToProcess = topicQueue.shift()!;
    console.log(`\n🚀 Processing topic: "${topicToProcess.title}"`);

    const contentPlan = await researchAndCreateOutline(topicToProcess.title, topicToProcess.keywords);
    let articleBody = await generateArticleText(topicToProcess, contentPlan);
    
    if (articleBody.startsWith('Error')) { console.log("🛑 Article generation failed."); return; }
    
    const faqSection = await generateFaqSection(topicToProcess.title, articleBody);
    articleBody += faqSection;
    
    articleBody = await addInternalLinks(articleBody, topicToProcess.title);
    articleBody = await addExternalLinks(articleBody);
    
    const visualConcept = await generateImageConcept(topicToProcess.title, topicToProcess.keywords);
    const altText = await generateImageAltText(visualConcept);
    const description = await generateMetaDescription(articleBody);
    
    const tempImageUrl = await createImageWithDalle(topicToProcess.title, visualConcept);

    const filesToCommit: { path: string, content: string }[] = [];
    let finalImagePathInMdx: string | null = null;
    const slug = topicToProcess.title.toLowerCase().replace(/\s+/g, '-').replace(/[?:]/g, '');

    if (tempImageUrl) {
        const imageBuffer = await downloadAndOptimizeImage(tempImageUrl);
        const imageFilename = `${slug}.jpg`;
        finalImagePathInMdx = `/blog-assets/${imageFilename}`;
        filesToCommit.push({ path: `blog/public/blog-assets/${imageFilename}`, content: imageBuffer.toString('base64') });
    }

    const { filename: mdxFilename, content: mdxContent } = assembleMdxFile(topicToProcess, articleBody, { imagePath: finalImagePathInMdx, description, altText });
    filesToCommit.push({ path: `blog/src/content/blog/${mdxFilename}`, content: Buffer.from(mdxContent).toString('base64') });

    const prCreated = await createPullRequest(filesToCommit, topicToProcess);
    
    if (prCreated) {
        console.log('\n💾 Updating topic queue in Gist...');
        await octokit.request('PATCH /gists/{gist_id}', {
            gist_id: GIST_ID,
            files: { [GIST_FILENAME]: { content: JSON.stringify(topicQueue, null, 2) } },
        });
        console.log('✅ Gist queue updated successfully!');
    } else {
        console.log('\n⚠️ Pull Request creation failed. Gist queue was not updated.');
    }
}

main().catch(error => {
    console.error('❌ A critical error occurred:', error);
    process.exit(1);
});

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
  title: string;
  keywords: string[];
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
Your task is to conduct in-depth research on the topic "${title}" and create a comprehensive, high-quality content plan.
The keywords for this topic are: "${keywords.join(', ')}". These keywords represent SEO terms users search for.

The output MUST be a single, valid JSON object. Do not include any text before or after the JSON object.

---
EXAMPLE OF A GOOD JSON OUTPUT:
{
  "detailedTitle": "A Deep Dive into Aptos Staking Rewards vs. Ethereum",
  "targetAudience": "Crypto investors familiar with PoS, looking to compare yields.",
  "keyTakeaways": [
    "Aptos offers competitive, real-time rewards.",
    "Ethereum's reward mechanism is more complex due to its validator queue.",
    "Validator choice heavily impacts net yield on both networks."
  ],
  "articleOutline": [
    {
      "section": "H2: Introduction to Staking Rewards",
      "pointsToCover": ["Define staking yield (APY/APR).", "Briefly introduce Aptos and Ethereum staking models."]
    },
    {
      "section": "H2: Aptos Staking Rewards: A Closer Look",
      "pointsToCover": ["How rewards are calculated on Aptos.", "The role of validators and commissions.", "Typical APY range for APT."],
      "analogyOrExample": "Compare Aptos rewards to a high-yield savings account with daily payouts."
    }
  ],
  "concludingThought": "While Ethereum is the market leader, Aptos presents a compelling, high-performance alternative for yield-focused stakers."
}
---

Now, generate a new, unique JSON object for the topic: "${title}". Ensure the "articleOutline" is detailed and contains multiple sections.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.4,
  });

  const responseContent = response.choices[0]?.message?.content;
  if (!responseContent) {
    throw new Error('OpenAI returned an empty response for the content plan.');
  }

  try {
    const partialPlan = JSON.parse(responseContent);
    const fullPlan: ContentPlan = {
        title,
        keywords,
        ...partialPlan
    };
    console.log(`  ✅ Research complete. Content plan created.`);
    return fullPlan;
  } catch (error) {
    console.error('   ❌ Invalid JSON from OpenAI. Could not parse content plan.');
    console.error('   Received content:', responseContent);
    throw new Error('Failed to parse content plan from OpenAI response.');
  }
}

function validatePlan(plan: ContentPlan): boolean {
    if (!plan.detailedTitle || typeof plan.detailedTitle !== 'string' || plan.detailedTitle.trim() === '') {
        console.error('   ❌ Validation Failed: Plan is missing or has empty "detailedTitle".');
        return false;
    }
    if (!plan.articleOutline || !Array.isArray(plan.articleOutline) || plan.articleOutline.length === 0) {
        console.error('   ❌ Validation Failed: Plan is missing or has an empty "articleOutline".');
        return false;
    }
    console.log('   ✅ Content plan passed validation.');
    return true;
}

async function generateHookingIntroduction(plan: ContentPlan): Promise<string> {
    console.log('   🎣 Generating a hooking introduction...');

    const prompt = `You are a master storyteller and copywriter. Your task is to write a powerful opening paragraph (a "hook") for a blog post titled "${plan.detailedTitle}".

The introduction should be 1-2 paragraphs long and achieve the following:
1.  **Grab Attention:** Start with a surprising fact, a relatable problem, or a question that resonates with the target audience: "${plan.targetAudience}".
2.  **Build Interest:** Briefly explain why this topic is critically important *right now*. Hint at the common mistakes or missed opportunities.
3.  **Create Desire:** Promise the reader a clear, valuable outcome. Tell them what they will be able to do or understand after reading.
4.  **Transition:** End with a sentence that smoothly transitions into the main body of the article.

Write the introduction now.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }]
      });
      return response.choices[0]?.message?.content || "";
    } catch (error: any) {
      console.error(`   ❌ Error generating hooking introduction:`, error);
      return "";
    }
}

async function generateArticleText(plan: ContentPlan): Promise<string> {
    console.log(`  ✍️  Writing article body for "${plan.title}"...`);
    
    const keyTakeawaysText = (plan.keyTakeaways ?? []).map(p => `- ${p}`).join('\n');
    const articleOutlineText = (plan.articleOutline ?? []).map(s => {
        const pointsToCoverText = (s.pointsToCover ?? []).map(p => `- ${p}`).join('\n');
        return `
        ### Section: ${s.section}
        **Points to cover:**
        ${pointsToCoverText}
        ${s.analogyOrExample ? `**Analogy/Example to use:** ${s.analogyOrExample}` : ''}
      `;
    }).join('\n');

    const planText = `
      **Key Takeaways to weave in:**
      ${keyTakeawaysText}
      **Article Structure and Content to Follow Strictly:**
      ${articleOutlineText}
      **Conclusion:** ${plan.concludingThought}
    `;
  
    const prompt = `You are a senior technical writer and an expert on the Aptos blockchain. Your task is to write the main body of a blog post based on the provided plan. Do NOT write an introduction; start directly with the first section from the outline.
  
  **Content Plan to Execute:**
  ${planText}
  
  **Instructions:**
  - Write in a professional, clear, and trustworthy tone.
  - Flesh out each point from the plan into well-written paragraphs.
  - Use Markdown for structure (H2, H3, lists, bold text).
  
  Begin writing the main content now, starting with the first H2 or H3 heading.`;
  
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
      });
      return response.choices[0]?.message?.content || 'Error: Could not generate article text.';
    } catch (error) {
      console.error(`  ❌ Error generating article text:`, error);
      return `Error occurred during article generation for title: ${plan.title}.`;
    }
}

async function generateFaqSection(articleTitle: string, articleBody: string): Promise<string> {
    console.log(`   ❓ Generating FAQ section for "${articleTitle}"...`);
    const prompt = `Based on the article text about "${articleTitle}", generate a JSON array of 2-3 frequently asked questions and their answers.
The output MUST be a single, valid JSON array of objects. Each object must have a "q" key for the question (string) and an "a" key for the answer (string, can contain Markdown).
Do not include any text before or after the JSON array.
Example: [{"q": "Is Aptos fast?", "a": "Yes, Aptos is known for its high transaction speed and low fees."}]

Article text for context: "${articleBody.substring(0, 3000)}"`;

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: "json_object" },
        });
        
        const responseContent = response.choices[0]?.message?.content;
        if (!responseContent) return "";

        const responseObject = JSON.parse(responseContent);
        const faqArray = Array.isArray(responseObject) 
            ? responseObject 
            : responseObject[Object.keys(responseObject)[0]] || [];

        if (!Array.isArray(faqArray) || faqArray.length === 0) {
            return "";
        }
        
        const mdxHeader = `\n\n---\n## Frequently Asked Questions (FAQ)\n`;
        const mdxImport = `import Accordion from '@components/Accordion.astro';\n\n`;

        const mdxComponents = faqArray.map((item: { q: string, a: string }) => {
            const answerContent = item.a.replace(/"/g, "'").replace(/\n/g, ' ');
            return `<Accordion summary="${item.q}">\n${answerContent}\n</Accordion>`;
        }).join('\n');

        return mdxHeader + mdxImport + mdxComponents;
    } catch (error) {
        console.error(`   ❌ Error generating FAQ section:`, error);
        return "";
    }
}

async function generateImageConcept(plan: ContentPlan, firstParagraph: string): Promise<string> {
    console.log(`   🧠 Generating a visual concept to enhance the introduction...`);
    const prompt = `You are a visual storyteller and marketing expert. Your task is to describe a compelling and relevant image concept for a blog post titled "${plan.title}". The image should work in tandem with the following introductory paragraph to immediately grab the reader's attention and illustrate the core theme:

"${firstParagraph.substring(0, 300)}"

The image concept should be:
1. **Intriguing:** Spark curiosity and make the reader want to learn more.
2. **Thematically Relevant:** Clearly connect to the topic of "${plan.title}".
3. **Visually Simple:** Easy to understand at a glance.
4. **Suitable for a minimalist, flat 2D vector UI/UX style.**

Describe the core visual concept in 5-10 words. Focus on the central elements and their interaction. Do not describe the color palette or detailed style, as those are handled separately.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      });
      return response.choices[0]?.message?.content || "Abstract representation of the article's core idea.";
    } catch (error) {
      console.error(`   ❌ Error generating image concept for the hook:`, error);
      return "Abstract representation of the article's core idea.";
    }
}

async function createImageWithDalle(articleTitle: string, visualConcept: string): Promise<string | null> {
    console.log(`   🎨 Generating image for concept: "${visualConcept}"...`);

    // Новый, более гибкий и креативный промт
    const finalPrompt = `
Create a visually stunning, abstract blog post cover image for an article titled "${articleTitle}".

The core visual theme to represent is: "${visualConcept}".

**Artistic Style:**
A beautiful and abstract 3D render. It should have a sophisticated, professional aesthetic with cinematic lighting, a sense of depth, and high detail. Think of a modern, high-end technology visual, not a simple icon.

**Color and Mood:**
Use a dark, moody background. Key elements should be illuminated with vibrant, glowing accents of purple and cyan. The overall feeling should be futuristic, innovative, and intriguing.

**Crucial Rules:**
1.  **Absolutely NO text, letters, or numbers.** The image must be purely visual.
2.  **DO NOT include any recognizable cryptocurrency logos or brand symbols (including Aptos).** The goal is an abstract representation of the *concept*, not a branding image.
3.  The composition should be clean, captivating, and fill the entire 16:9 frame.

The final result must be an artistic and abstract image that sparks curiosity.
`;
    
    try {
      const response = await openai.images.generate({
        model: "dall-e-3",
        prompt: finalPrompt,
        n: 1,
        size: "1792x1024",
        quality: "hd", // Ставим 'hd' для лучшей детализации и освещения
        style: 'vivid'
      });

      const image = response.data?.[0];
      if (image && image.url) {
        console.log(`   ✅ Image generated successfully!`);
        return image.url;
      } else {
        throw new Error("DALL-E 3 API response did not contain an image URL.");
      }
    } catch (error) {
      console.error(`   ❌ Error generating image:`, error);
      return null;
    }
}

async function downloadAndOptimizeImage(url: string): Promise<Buffer> {
    console.log(`   🗜️ Downloading and optimizing image...`);
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return sharp(response.data).resize(1600).jpeg({ quality: 80 }).toBuffer();
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
        const conceptPrompt = `Analyze this article text. Identify 2-3 key technical Aptos-specific concepts, protocol names, or features. Return ONLY a JSON object with a single key "phrases" which is an array of strings. Example: {"phrases": ["Aptos Block-STM", "Move programming language"]} Article text: "${articleBody.substring(0, 4000)}"`;
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

async function generateMetaDescription(plan: ContentPlan): Promise<string> {
    console.log('   ✍️  Generating a high-click-through-rate meta description...');
    const prompt = `You are an expert direct response copywriter. Your goal is to write a meta description for a blog post that gets the highest possible click-through rate (CTR) on Google.

Topic: "${plan.title}"
Keywords: "${plan.keywords.join(', ')}"

Instructions:
1.  **Start with a Hook:** Ask a question or state a bold claim that addresses the user's pain point or curiosity.
2.  **Promise a Solution:** Clearly state what the user will learn or gain from reading the article.
3.  **Create Urgency/Intrigue:** Use powerful words to make the content seem unmissable.
4.  **Stay within 160 characters.** This is critical.

Write the meta description now.`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }]
      });
      return response.choices[0]?.message?.content?.replace(/"/g, '\\"') || `A deep dive into ${plan.title}.`;
    } catch (error: any) {
      console.error(`   ❌ Error generating meta description:`, error);
      return `Learn all about ${plan.title} and its impact on the Aptos ecosystem.`;
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

function assembleMdxFile(plan: ContentPlan, articleBody: string, generated: { imagePath: string | null; description: string; altText: string }): { filename: string, content: string } {
    const slug = plan.title.toLowerCase().replace(/\s+/g, '-').replace(/[?:]/g, '');
    const date = new Date();
    const pubDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const imageFilename = generated.imagePath ? `${slug}.jpg` : `placeholder.png`;
    const finalImagePath = generated.imagePath ? `/blog-assets/${imageFilename}` : `/blog-assets/placeholder.png`;

    const frontmatter = `---
title: "${plan.title.replace(/"/g, '\\"')}"
slug: "${slug}"
pubDate: "${pubDate}"
description: "${generated.description}"
author: "The aptcore.one Team"
keywords: [${plan.keywords.map(k => `"${k}"`).join(', ')}]
heroImage: "${finalImagePath}"
heroImageAlt: "${generated.altText}"
tags: [${plan.keywords.map(k => `"${k}"`).join(', ')}]
---\n\n`;

    const filename = `${slug}.mdx`;
    const content = frontmatter + articleBody; 
    
    return { filename, content };
}

async function createPullRequest(filesToCommit: { path: string, content: string, encoding?: 'base64' | 'utf-8' }[], plan: ContentPlan): Promise<boolean> {
    console.log(`\n🤖 Creating Pull Request for "${plan.title}"...`);
    const slug = plan.title.toLowerCase().replace(/\s+/g, '-').replace(/[?:]/g, '');
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
                message: `feat: Add ${path.basename(file.path)} for article '${plan.title}'`,
                content: file.content,
                branch: newBranchName,
            });
            console.log(`   ✅ Committed file: ${file.path}`);
        }

        const { data: prData } = await octokit.rest.pulls.create({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            title: `New Article: ${plan.title}`,
            head: newBranchName,
            base: REPO_BRANCH,
            body: `This PR was automatically generated by the Content Factory.\n\nPlease review the article content and the generated image before merging.\n\n**Keywords:** ${plan.keywords.join(', ')}`,
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

    const topic = topicQueue.shift()!;
    console.log(`\n🚀 Processing topic: "${topic.title}"`);

    const fullPlan = await researchAndCreateOutline(topic.title, topic.keywords);

    if (!validatePlan(fullPlan)) {
      throw new Error(`Invalid or incomplete ContentPlan received from OpenAI for topic: "${topic.title}". Halting process.`);
    }
    
    let articleBody = await generateArticleText(fullPlan);
    if (articleBody.startsWith('Error')) {
        console.log("🛑 Article generation failed.");
        return; 
    }

    const introductionHook = await generateHookingIntroduction(fullPlan);
    
    let finalArticleBody = introductionHook + '\n\n' + articleBody;
    
    const faqSection = await generateFaqSection(fullPlan.title, finalArticleBody);
    finalArticleBody += faqSection;

    const articleBodyWithInternalLinks = await addInternalLinks(finalArticleBody, fullPlan.title);
    const finalArticleBodyWithAllLinks = await addExternalLinks(articleBodyWithInternalLinks);
    
    const description = await generateMetaDescription(fullPlan);
    const visualConcept = await generateImageConcept(fullPlan, introductionHook);
    const altText = await generateImageAltText(visualConcept);
    
    const tempImageUrl = await createImageWithDalle(fullPlan.title, visualConcept);

    const filesToCommit: { path: string, content: string }[] = [];
    let finalImagePathInMdx: string | null = null;
    const slug = fullPlan.title.toLowerCase().replace(/\s+/g, '-').replace(/[?:]/g, '');

    if (tempImageUrl) {
        const imageBuffer = await downloadAndOptimizeImage(tempImageUrl);
        const imageFilename = `${slug}.jpg`;
        finalImagePathInMdx = `/blog-assets/${imageFilename}`;
        filesToCommit.push({ path: `blog/public/blog-assets/${imageFilename}`, content: imageBuffer.toString('base64') });
    }

    const { filename: mdxFilename, content: mdxContent } = assembleMdxFile(fullPlan, finalArticleBodyWithAllLinks, { imagePath: finalImagePathInMdx, description, altText });
    filesToCommit.push({ path: `blog/src/content/blog/${mdxFilename}`, content: Buffer.from(mdxContent).toString('base64') });

    const prCreated = await createPullRequest(filesToCommit, fullPlan);
    
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

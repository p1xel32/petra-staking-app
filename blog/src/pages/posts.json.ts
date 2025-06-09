import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export async function GET() {
  const posts: CollectionEntry<'blog'>[] = await getCollection('blog');

  const formattedPosts = posts.map(post => {
    const path = `${import.meta.env.BASE_URL}/${post.slug}`;

    return {
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: new URL(path, import.meta.env.SITE).href,
      author: post.data.author,
      keywords: post.data.keywords,
    };
  });

  return new Response(JSON.stringify(formattedPosts), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
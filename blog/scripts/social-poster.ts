// Файл: blog/scripts/social-poster.ts (ВРЕМЕННАЯ ВЕРСИЯ ДЛЯ ОТЛАДКИ)
import 'dotenv/config';

console.log('--- SMM POSTER ENVIRONMENT DIAGNOSTIC ---');
console.log('Starting check of all required environment variables...\n');

// Вспомогательная функция для проверки и вывода статуса
const checkVar = (name: string): boolean => {
    const value = process.env[name];
    const isSet = !!value; // true, если переменная существует и не пустая
    console.log(`[VAR] ${name.padEnd(35, ' ')}: ${isSet ? '✅ SET' : '❌ NOT SET or empty'}`);
    return isSet;
};

// --- OpenAI ---
console.log('--- OpenAI ---');
checkVar('OPENAI_API_KEY');

// --- Twitter ---
console.log('\n--- Twitter ---');
const twitterOk = [
    checkVar('TWITTER_API_KEY'),
    checkVar('TWITTER_API_SECRET'),
    checkVar('TWITTER_ACCESS_TOKEN'),
    checkVar('TWITTER_ACCESS_TOKEN_SECRET')
].every(v => v);
console.log(`Twitter configured correctly: ${twitterOk ? '✅ Yes' : '❌ No'}`);

// --- LinkedIn ---
console.log('\n--- LinkedIn ---');
const linkedinOk = [
    checkVar('LINKEDIN_ACCESS_TOKEN'),
    checkVar('LINKEDIN_AUTHOR_URN')
].every(v => v);
console.log(`LinkedIn configured correctly: ${linkedinOk ? '✅ Yes' : '❌ No'}`);

// --- Blogger / Google ---
console.log('\n--- Blogger / Google ---');
const bloggerOk = [
    checkVar('GOOGLE_CLIENT_ID'),
    checkVar('GOOGLE_CLIENT_SECRET'),
    checkVar('GOOGLE_REFRESH_TOKEN'),
    checkVar('BLOGGER_BLOG_ID')
].every(v => v);
console.log(`Blogger configured correctly: ${bloggerOk ? '✅ Yes' : '❌ No'}`);

// --- Другие платформы ---
console.log('\n--- Other Platforms ---');
checkVar('DEVTO_API_KEY');
checkVar('HASHNODE_API_KEY');
checkVar('HASHNODE_PUBLICATION_ID');
checkVar('FACEBOOK_PAGE_ACCESS_TOKEN');
checkVar('FACEBOOK_PAGE_ID');
checkVar('PINTEREST_ACCESS_TOKEN');
checkVar('PINTEREST_BOARD_ID');
checkVar('MEDIUM_INTEGRATION_TOKEN');

console.log('\n--- DIAGNOSTIC COMPLETE ---');
console.log('This script did not attempt to post. It only checked variables.');
